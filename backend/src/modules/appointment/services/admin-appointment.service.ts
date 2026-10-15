import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';
import { Paginated, paginated } from '../../../common/dto/paginated';
import type { AuthActor } from '../../../common/types/auth-actor';
import { addDays, isValidDate, todayDhaka } from '../../../common/utils/date';
import { escapeLike } from '../../../common/utils/like';
import { tryNormalizeMobile } from '../../../common/utils/mobile';
import { DatabaseService } from '../../../database/database.service';
import { Appointment } from '../../../database/entities';
import { ActorType, AppointmentStatus } from '../../../database/enums';
import {
  AppointmentListQueryDto,
  AvailabilityQueryDto,
  SlotsQueryDto,
} from '../dtos/appointment-query.dto';
import {
  BookAppointmentDto,
  CancelAppointmentDto,
  UpdateAppointmentStatusDto,
} from '../dtos/appointment-body.dto';
import {
  AppointmentDetailDto,
  AppointmentListItemDto,
  AppointmentSummaryDto,
  AvailabilityDto,
  SlotsDto,
} from '../dtos/appointment-response.dto';
import {
  AppointmentAvailabilityService,
  normTime,
} from './appointment-availability.service';
import {
  AppointmentBookingService,
  BookingActor,
} from './appointment-booking.service';

const toActor = (actor: AuthActor): BookingActor => ({
  type: ActorType.ADMIN,
  id: actor.profileId,
});

@Injectable()
export class AdminAppointmentService {
  constructor(
    private readonly db: DatabaseService,
    private readonly availability: AppointmentAvailabilityService,
    private readonly booking: AppointmentBookingService,
  ) {}

  async list(
    query: AppointmentListQueryDto,
  ): Promise<Paginated<AppointmentListItemDto>> {
    for (const d of [query.from, query.to, query.date]) {
      if (d !== undefined && !isValidDate(d)) {
        throw new BadRequestException('Invalid date filter');
      }
    }
    const qb = this.baseQuery();
    if (query.date)
      qb.andWhere('a.appointmentDate = :date', { date: query.date });
    if (query.from)
      qb.andWhere('a.appointmentDate >= :from', { from: query.from });
    if (query.to) qb.andWhere('a.appointmentDate <= :to', { to: query.to });
    if (query.doctorId)
      qb.andWhere('a.doctorId = :doctorId', { doctorId: query.doctorId });
    if (query.patientId)
      qb.andWhere('a.patientId = :patientId', { patientId: query.patientId });
    if (query.chamberId)
      qb.andWhere('a.chamberId = :chamberId', { chamberId: query.chamberId });
    if (query.status)
      qb.andWhere('a.status = :status', { status: query.status });
    const search = query.search?.trim();
    if (search) {
      const mobile = tryNormalizeMobile(search);
      qb.andWhere(
        `(p.name ILIKE :q OR p.nameBN ILIKE :q OR pa.mobile ILIKE :q${mobile ? ' OR pa.mobile = :mobile' : ''})`,
        { q: `%${escapeLike(search)}%`, mobile },
      );
    }
    const [rows, total] = await qb
      .orderBy('a.appointmentDate', 'DESC')
      .addOrderBy('a.slotStartTime', 'ASC')
      .addOrderBy('a.id', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    return paginated(rows.map(toListItem), total, query.page, query.limit);
  }

  async summary(): Promise<AppointmentSummaryDto> {
    const today = todayDhaka();
    const repo = this.db.appointmentRepository;
    const [
      doctors,
      patients,
      hospitals,
      activeChambers,
      todayRows,
      next7Days,
      recent,
    ] = await Promise.all([
      this.db.doctorRepository.count({ where: { isActive: true } }),
      this.db.patientRepository.count({ where: { isActive: true } }),
      this.db.hospitalRepository.count({ where: { status: true } }),
      this.db.chamberRepository.count({ where: { isActive: true } }),
      repo
        .createQueryBuilder('a')
        .select('a.status', 'status')
        .addSelect('COUNT(*)::int', 'count')
        .where('a.appointmentDate = :today', { today })
        .groupBy('a.status')
        .getRawMany<{ status: AppointmentStatus; count: number }>(),
      repo
        .createQueryBuilder('a')
        .where('a.appointmentDate > :today AND a.appointmentDate <= :end', {
          today,
          end: addDays(today, 7),
        })
        .andWhere('a.status = :status', { status: AppointmentStatus.SCHEDULED })
        .getCount(),
      this.baseQuery()
        .orderBy('a.createdAt', 'DESC')
        .addOrderBy('a.id', 'DESC')
        .take(10)
        .getMany(),
    ]);
    const by = (s: AppointmentStatus) =>
      Number(todayRows.find((r) => r.status === s)?.count ?? 0);
    const scheduled = by(AppointmentStatus.SCHEDULED);
    const completed = by(AppointmentStatus.COMPLETED);
    const cancelled = by(AppointmentStatus.CANCELLED);
    const noShow = by(AppointmentStatus.NO_SHOW);
    return {
      doctors,
      patients,
      hospitals,
      activeChambers,
      today: {
        total: scheduled + completed + cancelled + noShow,
        scheduled,
        completed,
        cancelled,
        noShow,
      },
      next7Days,
      recent: recent.map(toListItem),
    };
  }

  getAvailability(query: AvailabilityQueryDto): Promise<AvailabilityDto> {
    return this.availability.availability(query);
  }

  getSlots(query: SlotsQueryDto): Promise<SlotsDto> {
    return this.availability.slots(query.turnId, query.date);
  }

  async get(id: number): Promise<AppointmentDetailDto> {
    const a = await this.baseQuery().andWhere('a.id = :id', { id }).getOne();
    if (!a) throw new NotFoundException('Appointment not found');
    const [turn, logs] = await Promise.all([
      this.db.chamberTurnRepository.findOne({
        select: { id: true, startTime: true, endTime: true },
        where: { id: a.chamberTurnId },
      }),
      this.db.appointmentStatusLogRepository.find({
        where: { appointmentId: id },
        order: { createdAt: 'ASC', id: 'ASC' },
      }),
    ]);
    return {
      ...toListItem(a),
      patientDetails: a.patientDetails,
      durationMinutes: a.durationMinutes,
      chamberTurn: {
        id: a.chamberTurnId,
        startTime: normTime(turn?.startTime ?? a.slotStartTime),
        endTime: normTime(turn?.endTime ?? a.slotEndTime),
      },
      cancelledAt: a.cancelledAt,
      cancelReason: a.cancelReason,
      cancelledByType: a.cancelledByType,
      completedAt: a.completedAt,
      statusLog: logs.map((l) => ({
        fromStatus: l.fromStatus,
        toStatus: l.toStatus,
        actorType: l.actorType,
        actorId: l.actorId,
        reason: l.reason,
        createdAt: l.createdAt,
      })),
    };
  }

  async book(
    actor: AuthActor,
    dto: BookAppointmentDto,
  ): Promise<AppointmentDetailDto> {
    const id = await this.booking.book(toActor(actor), dto);
    return this.get(id);
  }

  async cancel(
    actor: AuthActor,
    id: number,
    dto: CancelAppointmentDto,
  ): Promise<AppointmentDetailDto> {
    await this.booking.cancel(toActor(actor), id, dto.reason ?? null);
    return this.get(id);
  }

  async changeStatus(
    actor: AuthActor,
    id: number,
    dto: UpdateAppointmentStatusDto,
  ): Promise<AppointmentDetailDto> {
    await this.booking.changeStatus(toActor(actor), id, dto.status);
    return this.get(id);
  }

  private baseQuery(): SelectQueryBuilder<Appointment> {
    return this.db.appointmentRepository
      .createQueryBuilder('a')
      .withDeleted()
      .innerJoin('a.patient', 'p')
      .innerJoin('p.account', 'pa')
      .innerJoin('a.doctor', 'd')
      .innerJoin('a.chamber', 'c')
      .leftJoin('c.hospital', 'h')
      .select([
        'a',
        'p.id',
        'p.name',
        'p.nameBN',
        'pa.id',
        'pa.mobile',
        'd.id',
        'd.name',
        'd.nameBN',
        'c.id',
        'c.name',
        'c.nameBN',
        'c.chamberType',
        'h.id',
        'h.name',
        'h.nameBN',
      ]);
  }
}

function toListItem(a: Appointment): AppointmentListItemDto {
  return {
    id: a.id,
    appointmentDate: a.appointmentDate,
    slotNumber: a.slotNumber,
    slotStartTime: normTime(a.slotStartTime),
    slotEndTime: normTime(a.slotEndTime),
    status: a.status,
    category: a.category,
    fee: a.fee,
    patient: {
      id: a.patient.id,
      name: a.patient.name,
      nameBN: a.patient.nameBN,
      mobile: a.patient.account.mobile,
    },
    doctor: {
      id: a.doctor.id,
      name: a.doctor.name,
      nameBN: a.doctor.nameBN,
    },
    chamber: {
      id: a.chamber.id,
      name: a.chamber.name ?? '',
      nameBN: a.chamber.nameBN,
      chamberType: a.chamber.chamberType,
      hospital: a.chamber.hospital
        ? {
            id: a.chamber.hospital.id,
            name: a.chamber.hospital.name,
            nameBN: a.chamber.hospital.nameBN,
          }
        : null,
    },
    bookedByType: a.bookedByType,
    createdAt: a.createdAt,
  };
}
