import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Brackets, In } from 'typeorm';
import { AuditService } from '../../../common/audit/audit.service';
import type { AuthActor } from '../../../common/types/auth-actor';
import { isValidDate, todayDhaka, weekdayOf } from '../../../common/utils/date';
import { escapeLike } from '../../../common/utils/like';
import { DatabaseService } from '../../../database/database.service';
import {
  Appointment,
  AppointmentStatusLog,
  DoctorOffDate,
} from '../../../database/entities';
import { ActorType, AppointmentStatus } from '../../../database/enums';
import { ChamberScheduleService } from '../../chamber/services/chamber-schedule.service';
import { CreateOffDateDto } from '../dtos/create-off-date.dto';
import {
  CreatedOffDateDto,
  DailyChamberDto,
  DailyDoctorDto,
  DailyScheduleDto,
  DoctorScheduleOverviewDto,
  OffDateDto,
} from '../dtos/schedule-response.dto';
import {
  DailyScheduleQueryDto,
  OffDateQueryDto,
} from '../dtos/schedule-query.dto';
import { slotCapacity } from '../utils/slots';

const CANCEL_REASON = 'Doctor unavailable';

const toOffDate = (o: DoctorOffDate): OffDateDto => ({
  id: o.id,
  date: o.date,
  reason: o.reason,
  reasonBN: o.reasonBN,
});

@Injectable()
export class AdminScheduleService {
  constructor(
    private readonly db: DatabaseService,
    private readonly audit: AuditService,
    private readonly chambers: ChamberScheduleService,
  ) {}

  async daily(query: DailyScheduleQueryDto): Promise<DailyScheduleDto> {
    if (!isValidDate(query.date)) {
      throw new BadRequestException('date must be a valid YYYY-MM-DD date');
    }
    const weekday = weekdayOf(query.date);

    const dayQb = this.db.chamberDayRepository
      .createQueryBuilder('day')
      .innerJoinAndSelect('day.chamber', 'c')
      .innerJoinAndSelect('c.doctor', 'd')
      .leftJoinAndSelect('d.speciality', 'sp')
      .leftJoinAndSelect('c.hospital', 'h')
      .leftJoinAndSelect('day.turns', 't', 't.isActive = true')
      .where('day.weekday = :weekday', { weekday })
      .andWhere('c.isActive = true')
      .andWhere('d.isActive = true')
      .andWhere('(day.isOff = true OR t.id IS NOT NULL)');
    const offQb = this.db.doctorOffDateRepository
      .createQueryBuilder('o')
      .innerJoinAndSelect('o.doctor', 'd')
      .leftJoinAndSelect('d.speciality', 'sp')
      .where('o.date = :date', { date: query.date })
      .andWhere('d.isActive = true');
    for (const qb of [dayQb, offQb]) {
      if (query.doctorId) qb.andWhere('d.id = :doctorId', query);
      if (query.specialityId) {
        qb.andWhere('d.specialityId = :specialityId', query);
      }
      if (query.search) {
        qb.andWhere(
          new Brackets((w) =>
            w.where('d.name ILIKE :search').orWhere('d.nameBN ILIKE :search'),
          ),
        ).setParameter('search', `%${escapeLike(query.search)}%`);
      }
    }
    const [days, offDates] = await Promise.all([
      dayQb.orderBy('c.id', 'ASC').addOrderBy('t.startTime', 'ASC').getMany(),
      offQb.getMany(),
    ]);

    const turnIds = days.flatMap((d) => d.turns.map((t) => t.id));
    const bookedRows = turnIds.length
      ? await this.db.appointmentRepository
          .createQueryBuilder('a')
          .select('a.chamberTurnId', 'turnId')
          .addSelect('COUNT(*)', 'booked')
          .where('a.appointmentDate = :date', { date: query.date })
          .andWhere('a.status <> :cancelled', {
            cancelled: AppointmentStatus.CANCELLED,
          })
          .andWhere('a.chamberTurnId IN (:...turnIds)', { turnIds })
          .groupBy('a.chamberTurnId')
          .getRawMany<{ turnId: number; booked: string }>()
      : [];
    const booked = new Map(
      bookedRows.map((r) => [Number(r.turnId), Number(r.booked)]),
    );

    const doctors = new Map<number, DailyDoctorDto>();
    const ensure = (d: {
      id: number;
      name: string;
      nameBN: string | null;
      speciality: { id: number; name: string; nameBN: string | null } | null;
    }): DailyDoctorDto => {
      let entry = doctors.get(d.id);
      if (!entry) {
        entry = {
          doctor: {
            id: d.id,
            name: d.name,
            nameBN: d.nameBN,
            speciality: d.speciality
              ? {
                  id: d.speciality.id,
                  name: d.speciality.name,
                  nameBN: d.speciality.nameBN,
                }
              : null,
          },
          offDate: null,
          chambers: [],
        };
        doctors.set(d.id, entry);
      }
      return entry;
    };

    const withTurns = new Set<number>();
    for (const day of days) {
      const c = day.chamber;
      const turns = day.turns.map((t) => {
        const capacity = slotCapacity(t);
        const count = booked.get(t.id) ?? 0;
        return {
          turnId: t.id,
          startTime: t.startTime,
          endTime: t.endTime,
          fee: t.fee,
          slotDurationMinutes: t.slotDurationMinutes,
          capacity,
          booked: count,
          remaining: Math.max(0, capacity - count),
        };
      });
      if (turns.length > 0) withTurns.add(c.doctorId);
      const entry: DailyChamberDto = {
        chamber: {
          id: c.id,
          name: c.name,
          nameBN: c.nameBN,
          chamberType: c.chamberType,
          hospital: c.hospital
            ? {
                id: c.hospital.id,
                name: c.hospital.name,
                nameBN: c.hospital.nameBN,
              }
            : null,
          address: c.address,
        },
        isOff: day.isOff,
        turns,
      };
      ensure(c.doctor).chambers.push(entry);
    }
    for (const id of [...doctors.keys()]) {
      if (!withTurns.has(id)) doctors.delete(id);
    }
    for (const o of offDates) {
      ensure(o.doctor).offDate = {
        id: o.id,
        reason: o.reason,
        reasonBN: o.reasonBN,
      };
    }
    const sorted = [...doctors.values()].sort(
      (a, b) =>
        a.doctor.name.localeCompare(b.doctor.name) || a.doctor.id - b.doctor.id,
    );
    return { date: query.date, weekday, doctors: sorted };
  }

  async doctorOverview(doctorId: number): Promise<DoctorScheduleOverviewDto> {
    const doctor = await this.getDoctor(doctorId);
    const [chambers, offDates] = await Promise.all([
      this.chambers.getResources({ doctorId }),
      this.db.doctorOffDateRepository
        .createQueryBuilder('o')
        .where('o.doctorId = :doctorId', { doctorId })
        .andWhere('o.date >= :today', { today: todayDhaka() })
        .orderBy('o.date', 'ASC')
        .getMany(),
    ]);
    return {
      doctor: {
        id: doctor.id,
        name: doctor.name,
        nameBN: doctor.nameBN,
        consultationDurationMinutes: doctor.consultationDurationMinutes,
      },
      chambers,
      offDates: offDates.map(toOffDate),
    };
  }

  async listOffDates(
    doctorId: number,
    query: OffDateQueryDto,
  ): Promise<OffDateDto[]> {
    for (const [key, value] of [
      ['from', query.from],
      ['to', query.to],
    ] as const) {
      if (value && !isValidDate(value)) {
        throw new BadRequestException(`${key} must be a valid YYYY-MM-DD date`);
      }
    }
    await this.getDoctor(doctorId);
    const qb = this.db.doctorOffDateRepository
      .createQueryBuilder('o')
      .where('o.doctorId = :doctorId', { doctorId });
    if (query.from) qb.andWhere('o.date >= :from', { from: query.from });
    if (query.to) qb.andWhere('o.date <= :to', { to: query.to });
    const rows = await qb.orderBy('o.date', 'ASC').getMany();
    return rows.map(toOffDate);
  }

  async createOffDate(
    actor: AuthActor,
    doctorId: number,
    dto: CreateOffDateDto,
  ): Promise<CreatedOffDateDto> {
    if (!isValidDate(dto.date)) {
      throw new BadRequestException('date must be a valid YYYY-MM-DD date');
    }
    if (dto.date < todayDhaka()) {
      throw new BadRequestException('date must be today or later');
    }
    await this.getDoctor(doctorId);

    return this.db.transaction(async (manager) => {
      const offRepo = manager.getRepository(DoctorOffDate);
      if (await offRepo.existsBy({ doctorId, date: dto.date })) {
        throw new ConflictException('Doctor is already off on this date');
      }
      const apptRepo = manager.getRepository(Appointment);
      const scheduled = await apptRepo.find({
        where: {
          doctorId,
          appointmentDate: dto.date,
          status: AppointmentStatus.SCHEDULED,
        },
        lock: { mode: 'pessimistic_write' },
      });
      if (scheduled.length > 0 && !dto.cancelAppointments) {
        throw new ConflictException(
          `${scheduled.length} scheduled appointment(s) exist on this date; set cancelAppointments to cancel them`,
        );
      }
      const off = await offRepo.save(
        offRepo.create({
          doctorId,
          date: dto.date,
          reason: dto.reason ?? null,
          reasonBN: dto.reasonBN ?? null,
        }),
      );
      if (scheduled.length > 0) {
        await apptRepo.update(
          { id: In(scheduled.map((a) => a.id)) },
          {
            status: AppointmentStatus.CANCELLED,
            cancelledAt: new Date(),
            cancelledByType: ActorType.ADMIN,
            cancelledById: actor.profileId,
            cancelReason: CANCEL_REASON,
          },
        );
        const logRepo = manager.getRepository(AppointmentStatusLog);
        await logRepo.insert(
          scheduled.map((a) => ({
            appointmentId: a.id,
            fromStatus: AppointmentStatus.SCHEDULED,
            toStatus: AppointmentStatus.CANCELLED,
            actorType: ActorType.ADMIN,
            actorId: actor.profileId,
            reason: CANCEL_REASON,
          })),
        );
      }
      await this.audit.log(
        actor,
        {
          action: 'DOCTOR_OFF_DATE_CREATE',
          entityType: 'DoctorOffDate',
          entityId: off.id,
          changes: {
            date: dto.date,
            reason: dto.reason ?? null,
            reasonBN: dto.reasonBN ?? null,
            cancelledAppointments: scheduled.length,
          },
          onBehalfOfDoctorId: doctorId,
        },
        manager,
      );
      return { ...toOffDate(off), cancelledAppointments: scheduled.length };
    });
  }

  async removeOffDate(
    actor: AuthActor,
    doctorId: number,
    id: number,
  ): Promise<void> {
    await this.db.transaction(async (manager) => {
      const repo = manager.getRepository(DoctorOffDate);
      const off = await repo.findOneBy({ id, doctorId });
      if (!off) throw new NotFoundException('Off date not found');
      await repo.delete(id);
      await this.audit.log(
        actor,
        {
          action: 'DOCTOR_OFF_DATE_DELETE',
          entityType: 'DoctorOffDate',
          entityId: id,
          changes: { date: off.date },
          onBehalfOfDoctorId: doctorId,
        },
        manager,
      );
    });
  }

  private async getDoctor(doctorId: number) {
    const doctor = await this.db.doctorRepository.findOneBy({ id: doctorId });
    if (!doctor) throw new NotFoundException('Doctor not found');
    return doctor;
  }
}
