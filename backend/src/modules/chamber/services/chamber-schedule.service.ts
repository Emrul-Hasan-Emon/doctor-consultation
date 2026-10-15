import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager, In, MoreThanOrEqual } from 'typeorm';
import { todayDhaka } from '../../../common/utils/date';
import { DatabaseService } from '../../../database/database.service';
import {
  Appointment,
  Chamber,
  ChamberDay,
  ChamberTurn,
  District,
  Doctor,
  Hospital,
} from '../../../database/entities';
import { AppointmentStatus, ChamberType } from '../../../database/enums';
import { slotCapacity } from '../../schedule/utils/slots';
import {
  ChamberDayDto,
  ChamberResourceDto,
} from '../dtos/chamber-response.dto';
import {
  ExistingTurn,
  InputDay,
  normalizeDays,
  planScheduleChange,
  TurnUsage,
} from '../utils/schedule-plan';

export interface ChamberInfo {
  chamberType: ChamberType;
  hospitalId: number | null;
  divisionId: number;
  districtId: number;
}

/** Chamber validation and schedule replacement, shared by every actor. */
@Injectable()
export class ChamberScheduleService {
  constructor(private readonly db: DatabaseService) {}

  async getActiveDoctor(
    manager: EntityManager,
    doctorId: number,
  ): Promise<Doctor> {
    const doctor = await manager.getRepository(Doctor).findOneBy({
      id: doctorId,
    });
    if (!doctor) throw new NotFoundException('Doctor not found');
    if (!doctor.isActive) {
      throw new BadRequestException('Doctor is not active');
    }
    return doctor;
  }

  /** Type/hospital pairing, active hospital, district inside division. */
  async assertChamberInfo(
    manager: EntityManager,
    info: ChamberInfo,
    checkHospitalActive = true,
  ): Promise<void> {
    if (info.chamberType === ChamberType.HOSPITAL) {
      if (info.hospitalId === null) {
        throw new BadRequestException(
          'hospitalId is required for a HOSPITAL chamber',
        );
      }
      if (checkHospitalActive) {
        const hospital = await manager
          .getRepository(Hospital)
          .findOneBy({ id: info.hospitalId });
        if (!hospital) throw new NotFoundException('Hospital not found');
        if (!hospital.status) {
          throw new BadRequestException('Hospital is not active');
        }
      }
    } else if (info.hospitalId !== null) {
      throw new BadRequestException(
        'hospitalId is not allowed for a SELF chamber',
      );
    }
    const district = await manager
      .getRepository(District)
      .findOneBy({ id: info.districtId });
    if (!district) throw new NotFoundException('District not found');
    if (district.divisionId !== info.divisionId) {
      throw new BadRequestException('District does not belong to the division');
    }
  }

  async lockChamber(manager: EntityManager, id: number): Promise<Chamber> {
    const chamber = await manager.getRepository(Chamber).findOne({
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });
    if (!chamber) throw new NotFoundException('Chamber not found');
    return chamber;
  }

  countFutureScheduled(
    manager: EntityManager,
    chamberId: number,
  ): Promise<number> {
    return manager.getRepository(Appointment).count({
      where: {
        chamberId,
        status: AppointmentStatus.SCHEDULED,
        appointmentDate: MoreThanOrEqual(todayDhaka()),
      },
    });
  }

  /**
   * Replaces the whole schedule of a chamber inside the caller's transaction.
   * Locks the chamber and its turns so concurrent edits and bookings serialize.
   */
  async replaceSchedule(
    manager: EntityManager,
    chamberId: number,
    days: InputDay[],
  ): Promise<void> {
    const chamber = await this.lockChamber(manager, chamberId);
    const doctor = await manager
      .getRepository(Doctor)
      .findOneByOrFail({ id: chamber.doctorId });

    const normalized = normalizeDays(days, doctor.consultationDurationMinutes);
    if (normalized.errors.length > 0) {
      throw new BadRequestException(normalized.errors);
    }

    const dayRepo = manager.getRepository(ChamberDay);
    const turnRepo = manager.getRepository(ChamberTurn);
    const dayRows = await dayRepo.find({ where: { chamberId } });
    const weekdayOfDay = new Map(dayRows.map((d) => [d.id, d.weekday]));
    const turnRows = dayRows.length
      ? await turnRepo.find({
          where: { chamberDayId: In(dayRows.map((d) => d.id)) },
          lock: { mode: 'pessimistic_write' },
        })
      : [];
    const existing: ExistingTurn[] = turnRows.map((t) => ({
      id: t.id,
      weekday: weekdayOfDay.get(t.chamberDayId) ?? 0,
      startTime: t.startTime,
      endTime: t.endTime,
      slotDurationMinutes: t.slotDurationMinutes,
      maxPatients: t.maxPatients,
      fee: t.fee,
      isActive: t.isActive,
    }));

    const usage = await this.loadUsage(manager, chamberId);
    const plan = planScheduleChange(
      existing,
      dayRows.map((d) => d.weekday),
      normalized.days,
      usage,
    );
    if (plan.invalid.length > 0) throw new BadRequestException(plan.invalid);
    if (plan.conflicts.length > 0) {
      throw new ConflictException(plan.conflicts.join('; '));
    }

    const dayIdByWeekday = new Map(dayRows.map((d) => [d.weekday, d.id]));
    for (const state of plan.dayStates) {
      const row = dayRows.find((d) => Number(d.weekday) === state.weekday);
      if (row) {
        if (row.isOff !== state.isOff) {
          await dayRepo.update(row.id, { isOff: state.isOff });
        }
      } else {
        const created = await dayRepo.save(
          dayRepo.create({
            chamberId,
            weekday: state.weekday,
            isOff: state.isOff,
          }),
        );
        dayIdByWeekday.set(state.weekday, created.id);
      }
    }

    if (plan.deleteTurnIds.length > 0) {
      await turnRepo.delete({ id: In(plan.deleteTurnIds) });
    }
    if (plan.deactivateTurnIds.length > 0) {
      await turnRepo.update(
        { id: In(plan.deactivateTurnIds) },
        { isActive: false },
      );
    }
    for (const u of plan.updateTurns) {
      await turnRepo.update(u.id, {
        chamberDayId: dayIdByWeekday.get(u.weekday),
        startTime: u.turn.startTime,
        endTime: u.turn.endTime,
        slotDurationMinutes: u.turn.slotDurationMinutes,
        maxPatients: u.turn.maxPatients,
        fee: u.turn.fee,
        isActive: u.turn.isActive,
        sortOrder: u.sortOrder,
      });
    }
    for (const c of plan.createTurns) {
      const chamberDayId = dayIdByWeekday.get(c.weekday);
      if (chamberDayId === undefined) continue;
      await turnRepo.save(
        turnRepo.create({
          chamberDayId,
          startTime: c.turn.startTime,
          endTime: c.turn.endTime,
          slotDurationMinutes: c.turn.slotDurationMinutes,
          maxPatients: c.turn.maxPatients,
          fee: c.turn.fee,
          isActive: c.turn.isActive,
          sortOrder: c.sortOrder,
        }),
      );
    }
  }

  private async loadUsage(
    manager: EntityManager,
    chamberId: number,
  ): Promise<Map<number, TurnUsage>> {
    const rows = await manager
      .getRepository(Appointment)
      .createQueryBuilder('a')
      .select('a.chamberTurnId', 'turnId')
      .addSelect(
        `COUNT(*) FILTER (WHERE a.status = :scheduled AND a.appointmentDate >= :today)`,
        'scheduledCount',
      )
      .addSelect(
        `COALESCE(MAX(a.slotNumber) FILTER (WHERE a.status = :scheduled AND a.appointmentDate >= :today), 0)`,
        'maxSlot',
      )
      .where('a.chamberId = :chamberId', { chamberId })
      .setParameters({
        scheduled: AppointmentStatus.SCHEDULED,
        today: todayDhaka(),
      })
      .groupBy('a.chamberTurnId')
      .getRawMany<{
        turnId: number;
        scheduledCount: string;
        maxSlot: string;
      }>();
    return new Map(
      rows.map((r) => [
        Number(r.turnId),
        {
          scheduledCount: Number(r.scheduledCount),
          maxScheduledSlot: Number(r.maxSlot),
          hasAnyAppointment: true,
        },
      ]),
    );
  }

  async getResource(
    id: number,
    manager?: EntityManager,
  ): Promise<ChamberResourceDto> {
    const [resource] = await this.getResources({ id }, manager);
    if (!resource) throw new NotFoundException('Chamber not found');
    return resource;
  }

  async getResources(
    where: { id?: number; doctorId?: number },
    manager?: EntityManager,
  ): Promise<ChamberResourceDto[]> {
    const m = manager ?? this.db.manager;
    const chambers = await m.getRepository(Chamber).find({
      where,
      relations: {
        doctor: true,
        hospital: true,
        division: true,
        district: true,
      },
      order: { id: 'ASC' },
    });
    if (chambers.length === 0) return [];
    const dayRows = await m.getRepository(ChamberDay).find({
      where: { chamberId: In(chambers.map((c) => c.id)) },
    });
    const turnRows = dayRows.length
      ? await m.getRepository(ChamberTurn).find({
          where: { chamberDayId: In(dayRows.map((d) => d.id)) },
          order: { sortOrder: 'ASC', startTime: 'ASC', id: 'ASC' },
        })
      : [];
    return chambers.map((c) => {
      const days: ChamberDayDto[] = Array.from({ length: 7 }, (_, weekday) => {
        const row = dayRows.find(
          (d) => d.chamberId === c.id && Number(d.weekday) === weekday,
        );
        return {
          weekday,
          isOff: row?.isOff ?? false,
          turns: row
            ? turnRows
                .filter((t) => t.chamberDayId === row.id)
                .map((t) => ({
                  id: t.id,
                  startTime: t.startTime,
                  endTime: t.endTime,
                  maxPatients: t.maxPatients,
                  fee: t.fee,
                  slotDurationMinutes: t.slotDurationMinutes,
                  isActive: t.isActive,
                  sortOrder: t.sortOrder,
                  slotCapacity: slotCapacity(t),
                }))
            : [],
        };
      });
      return {
        id: c.id,
        doctorId: c.doctorId,
        doctor: {
          id: c.doctor.id,
          name: c.doctor.name,
          nameBN: c.doctor.nameBN,
        },
        name: c.name,
        nameBN: c.nameBN,
        chamberType: c.chamberType,
        hospitalId: c.hospitalId,
        hospital: c.hospital
          ? {
              id: c.hospital.id,
              name: c.hospital.name,
              nameBN: c.hospital.nameBN,
            }
          : null,
        divisionId: c.divisionId,
        districtId: c.districtId,
        division: {
          id: c.division.id,
          name: c.division.name,
          nameBN: c.division.nameBN,
        },
        district: {
          id: c.district.id,
          name: c.district.name,
          nameBN: c.district.nameBN,
        },
        address: c.address,
        addressBN: c.addressBN,
        description: c.description,
        descriptionBN: c.descriptionBN,
        advanceBookingDays: c.advanceBookingDays,
        isActive: c.isActive,
        days,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      };
    });
  }
}
