import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager, Not, QueryFailedError } from 'typeorm';
import { AuditService } from '../../../common/audit/audit.service';
import {
  isValidDate,
  nowMinutesDhaka,
  todayDhaka,
  weekdayOf,
} from '../../../common/utils/date';
import { DatabaseService } from '../../../database/database.service';
import {
  Appointment,
  AppointmentStatusLog,
  Chamber,
  ChamberDay,
  ChamberTurn,
  Doctor,
  DoctorOffDate,
  DoctorPatient,
  Patient,
} from '../../../database/entities';
import {
  ActorType,
  AppointmentCategory,
  AppointmentStatus,
  UserType,
} from '../../../database/enums';
import { buildSlots, toMinutes } from '../../schedule/utils/slots';
import {
  ClosedReason,
  lowestFreeSlot,
  resolveClosedReason,
} from '../utils/availability';
import { turnToInput } from './appointment-availability.service';

export interface BookingActor {
  type: ActorType;
  /** Row id in the actor's profile table. */
  id: number;
}

export interface BookInput {
  patientId: number;
  doctorId: number;
  chamberId: number;
  turnId: number;
  date: string;
  slotNumber?: number;
}

export interface BookingOptions {
  /** Doctor and patient actors pass the doctor they are allowed to touch. */
  restrictToDoctorId?: number;
  now?: Date;
}

const CLOSED_MESSAGES: Record<ClosedReason, (days: number) => string> = {
  PAST: () => 'Cannot book a date in the past',
  OUT_OF_WINDOW: (days) =>
    `Date is beyond the ${days} day advance booking window`,
  DOCTOR_OFF: () => 'Doctor is off on this date',
  CHAMBER_OFF: () => 'Chamber is closed on this day',
  NO_TURNS: () => 'No turns on this day',
};

function isUniqueViolation(e: unknown): boolean {
  return (
    e instanceof QueryFailedError &&
    (e.driverError as { code?: string } | undefined)?.code === '23505'
  );
}

@Injectable()
export class AppointmentBookingService {
  constructor(
    private readonly db: DatabaseService,
    private readonly audit: AuditService,
  ) {}

  /** Books one slot in a single transaction. Returns the new appointment id. */
  async book(
    actor: BookingActor,
    input: BookInput,
    opts: BookingOptions = {},
  ): Promise<number> {
    if (!isValidDate(input.date)) {
      throw new BadRequestException('Invalid date');
    }
    if (
      opts.restrictToDoctorId !== undefined &&
      opts.restrictToDoctorId !== input.doctorId
    ) {
      throw new ForbiddenException('Not allowed for this doctor');
    }
    try {
      return await this.db.transaction((m) =>
        this.bookInTransaction(m, actor, input, opts.now ?? new Date()),
      );
    } catch (e) {
      if (isUniqueViolation(e))
        throw new ConflictException('Slot already booked');
      throw e;
    }
  }

  cancel(
    actor: BookingActor,
    appointmentId: number,
    reason: string | null,
    opts: BookingOptions = {},
  ): Promise<void> {
    return this.transition(actor, appointmentId, opts, (a) => {
      if (a.status !== AppointmentStatus.SCHEDULED) {
        throw new ConflictException(
          'Only a scheduled appointment can be cancelled',
        );
      }
      a.status = AppointmentStatus.CANCELLED;
      a.cancelledAt = new Date();
      a.cancelledByType = actor.type;
      a.cancelledById = actor.id;
      a.cancelReason = reason;
      return reason;
    });
  }

  changeStatus(
    actor: BookingActor,
    appointmentId: number,
    status: AppointmentStatus.COMPLETED | AppointmentStatus.NO_SHOW,
    opts: BookingOptions = {},
  ): Promise<void> {
    return this.transition(actor, appointmentId, opts, (a) => {
      if (a.status !== AppointmentStatus.SCHEDULED) {
        throw new ConflictException(
          'Only a scheduled appointment can change status',
        );
      }
      a.status = status;
      if (status === AppointmentStatus.COMPLETED) a.completedAt = new Date();
      return null;
    });
  }

  private async transition(
    actor: BookingActor,
    appointmentId: number,
    opts: BookingOptions,
    apply: (a: Appointment) => string | null,
  ): Promise<void> {
    await this.db.transaction(async (m) => {
      const repo = m.getRepository(Appointment);
      const appointment = await repo
        .createQueryBuilder('a')
        .setLock('pessimistic_write')
        .where('a.id = :id', { id: appointmentId })
        .getOne();
      if (
        !appointment ||
        (opts.restrictToDoctorId !== undefined &&
          appointment.doctorId !== opts.restrictToDoctorId)
      ) {
        throw new NotFoundException('Appointment not found');
      }
      const fromStatus = appointment.status;
      const reason = apply(appointment);
      await repo.save(appointment);
      await this.writeLog(
        m,
        actor,
        appointment.id,
        fromStatus,
        appointment.status,
        reason,
      );
      await this.writeAudit(m, actor, appointment, 'appointment.status', {
        from: fromStatus,
        to: appointment.status,
        reason,
      });
    });
  }

  private async bookInTransaction(
    m: EntityManager,
    actor: BookingActor,
    input: BookInput,
    now: Date,
  ): Promise<number> {
    const { patientId, doctorId, chamberId, turnId, date } = input;

    // Serializes concurrent bookings of the same turn; everything below is
    // counted and written while holding this lock.
    const turn = await m
      .getRepository(ChamberTurn)
      .createQueryBuilder('t')
      .setLock('pessimistic_write')
      .where('t.id = :id', { id: turnId })
      .getOne();
    if (!turn) throw new NotFoundException('Turn not found');

    // Sequential on purpose: one transaction is one connection.
    const day = await m.findOne(ChamberDay, {
      where: { id: turn.chamberDayId },
    });
    const chamber = await m.findOne(Chamber, { where: { id: chamberId } });
    const doctor = await m.findOne(Doctor, { where: { id: doctorId } });
    const patient = await m.findOne(Patient, {
      where: { id: patientId },
      relations: { account: true },
    });
    if (!doctor) throw new NotFoundException('Doctor not found');
    if (!patient) throw new NotFoundException('Patient not found');
    if (!chamber || chamber.doctorId !== doctorId) {
      throw new NotFoundException('Chamber not found for this doctor');
    }
    if (!day || day.chamberId !== chamber.id) {
      throw new BadRequestException('Turn does not belong to this chamber');
    }
    if (!doctor.isActive) throw new BadRequestException('Doctor is not active');
    if (!patient.isActive) {
      throw new BadRequestException('Patient is not active');
    }
    if (!turn.isActive) throw new BadRequestException('Turn is not active');
    if (Number(day.weekday) !== weekdayOf(date)) {
      throw new BadRequestException('Turn does not run on that weekday');
    }

    const link = await m.exists(DoctorPatient, {
      where: { doctorId, patientId, isActive: true },
    });
    const off = await m.exists(DoctorOffDate, { where: { doctorId, date } });
    if (!link) {
      throw new BadRequestException('Patient is not linked to this doctor');
    }

    const today = todayDhaka(now);
    const reason = resolveClosedReason({
      date,
      today,
      advanceBookingDays: chamber.advanceBookingDays,
      chamberActive: chamber.isActive,
      doctorOff: off,
      dayIsOff: day.isOff,
      activeTurnCount: 1,
    });
    if (reason) {
      throw new BadRequestException(
        CLOSED_MESSAGES[reason](chamber.advanceBookingDays),
      );
    }

    const slots = buildSlots(turnToInput(turn));
    if (slots.length === 0) {
      throw new BadRequestException('Turn has no bookable slots');
    }
    const live = await m.find(Appointment, {
      select: { slotNumber: true, patientId: true },
      where: {
        chamberTurnId: turnId,
        appointmentDate: date,
        status: Not(AppointmentStatus.CANCELLED),
      },
    });
    if (live.some((a) => a.patientId === patientId)) {
      throw new ConflictException(
        'Patient already has an appointment in this turn on this date',
      );
    }

    const nowMinutes = nowMinutesDhaka(now);
    const started = (startTime: string) =>
      date === today && toMinutes(startTime) <= nowMinutes;
    const taken = live.map((a) => a.slotNumber);

    let slot;
    if (input.slotNumber !== undefined) {
      slot = slots.find((s) => s.slotNumber === input.slotNumber);
      if (!slot) {
        throw new BadRequestException(
          `Slot number must be between 1 and ${slots.length}`,
        );
      }
      if (taken.includes(slot.slotNumber)) {
        throw new ConflictException('Slot already booked');
      }
      if (started(slot.startTime)) {
        throw new BadRequestException('Slot has already started');
      }
    } else {
      const unusable = slots
        .filter((s) => started(s.startTime))
        .map((s) => s.slotNumber);
      if (!lowestFreeSlot(slots, taken)) {
        throw new ConflictException('No free slot left in this turn');
      }
      slot = lowestFreeSlot(slots, [...taken, ...unusable]);
      if (!slot) {
        throw new BadRequestException(
          'All free slots of this turn have already started',
        );
      }
    }

    const repo = m.getRepository(Appointment);
    const appointment = await repo.save(
      repo.create({
        patientId,
        doctorId,
        chamberId,
        chamberTurnId: turnId,
        appointmentDate: date,
        slotNumber: slot.slotNumber,
        slotStartTime: slot.startTime,
        slotEndTime: slot.endTime,
        durationMinutes: turn.slotDurationMinutes,
        fee: turn.fee,
        status: AppointmentStatus.SCHEDULED,
        category: AppointmentCategory.NEW,
        patientDetails: {
          fullName: patient.name,
          mobile: patient.account.mobile,
        },
        bookedByType: actor.type,
        bookedById: actor.id,
      }),
    );
    await this.writeLog(
      m,
      actor,
      appointment.id,
      null,
      AppointmentStatus.SCHEDULED,
      null,
    );
    await this.writeAudit(m, actor, appointment, 'appointment.create', {
      patientId,
      doctorId,
      chamberId,
      turnId,
      date,
      slotNumber: slot.slotNumber,
    });
    return appointment.id;
  }

  private async writeLog(
    m: EntityManager,
    actor: BookingActor,
    appointmentId: number,
    fromStatus: AppointmentStatus | null,
    toStatus: AppointmentStatus,
    reason: string | null,
  ): Promise<void> {
    const repo = m.getRepository(AppointmentStatusLog);
    await repo.save(
      repo.create({
        appointmentId,
        fromStatus,
        toStatus,
        actorType: actor.type,
        actorId: actor.id,
        reason,
      }),
    );
  }

  private writeAudit(
    m: EntityManager,
    actor: BookingActor,
    appointment: Appointment,
    action: string,
    changes: Record<string, unknown>,
  ): Promise<void> {
    const onBehalf =
      actor.type === ActorType.ADMIN || actor.type === ActorType.DOCTOR_STAFF;
    return this.audit.log(
      {
        accountId: 0,
        type: actor.type as unknown as UserType,
        profileId: actor.id,
        doctorId: null,
      },
      {
        action,
        entityType: 'Appointment',
        entityId: appointment.id,
        changes,
        onBehalfOfDoctorId: onBehalf ? appointment.doctorId : null,
      },
      m,
    );
  }
}
