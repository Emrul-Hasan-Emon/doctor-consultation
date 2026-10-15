import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Between, Not } from 'typeorm';
import {
  addDays,
  isValidDate,
  nowMinutesDhaka,
  todayDhaka,
  weekdayOf,
} from '../../../common/utils/date';
import { DatabaseService } from '../../../database/database.service';
import { ChamberTurn } from '../../../database/entities';
import { AppointmentStatus } from '../../../database/enums';
import {
  buildSlots,
  slotCapacity,
  toTime,
  toMinutes,
  TurnInput,
} from '../../schedule/utils/slots';
import {
  AvailabilityDayDto,
  AvailabilityDto,
  AvailabilityTurnDto,
  SlotsDto,
} from '../dtos/appointment-response.dto';
import { buildSlotViews, resolveClosedReason } from '../utils/availability';

const MAX_RANGE_DAYS = 31;

export function turnToInput(
  t: Pick<
    ChamberTurn,
    'startTime' | 'endTime' | 'maxPatients' | 'fee' | 'slotDurationMinutes'
  >,
): TurnInput {
  return {
    startTime: t.startTime,
    endTime: t.endTime,
    maxPatients: t.maxPatients,
    fee: t.fee,
    slotDurationMinutes: t.slotDurationMinutes,
  };
}

/** Postgres returns HH:mm:ss; normalizes any HH:mm to HH:mm:ss. */
export function normTime(value: string): string {
  return toTime(toMinutes(value));
}

export interface AvailabilityInput {
  doctorId: number;
  chamberId: number;
  from: string;
  to: string;
}

@Injectable()
export class AppointmentAvailabilityService {
  constructor(private readonly db: DatabaseService) {}

  async availability(
    input: AvailabilityInput,
    now: Date = new Date(),
  ): Promise<AvailabilityDto> {
    const { doctorId, chamberId, from, to } = input;
    if (!isValidDate(from) || !isValidDate(to)) {
      throw new BadRequestException('from and to must be valid dates');
    }
    if (to < from) {
      throw new BadRequestException('to must not be before from');
    }
    const dates: string[] = [];
    for (let d = from; d <= to; d = addDays(d, 1)) {
      dates.push(d);
      if (dates.length > MAX_RANGE_DAYS) {
        throw new BadRequestException(
          `Range cannot exceed ${MAX_RANGE_DAYS} days`,
        );
      }
    }

    const [doctor, chamber] = await Promise.all([
      this.db.doctorRepository.findOne({ where: { id: doctorId } }),
      this.db.chamberRepository.findOne({ where: { id: chamberId, doctorId } }),
    ]);
    if (!doctor) throw new NotFoundException('Doctor not found');
    if (!chamber) throw new NotFoundException('Chamber not found');

    const [chamberDays, offDates, bookedRows] = await Promise.all([
      this.db.chamberDayRepository.find({
        where: { chamberId },
        relations: { turns: true },
      }),
      this.db.doctorOffDateRepository.find({
        select: { date: true },
        where: { doctorId, date: Between(from, to) },
      }),
      this.db.appointmentRepository
        .createQueryBuilder('a')
        .select('a.chamberTurnId', 'turnId')
        .addSelect('CAST(a.appointmentDate AS text)', 'date')
        .addSelect('COUNT(*)::int', 'booked')
        .where('a.chamberId = :chamberId', { chamberId })
        .andWhere('a.appointmentDate BETWEEN :from AND :to', { from, to })
        .andWhere('a.status <> :cancelled', {
          cancelled: AppointmentStatus.CANCELLED,
        })
        .groupBy('a.chamberTurnId')
        .addGroupBy('a.appointmentDate')
        .getRawMany<{ turnId: number; date: string; booked: number }>(),
    ]);

    const daysByWeekday = new Map(chamberDays.map((d) => [d.weekday, d]));
    const offSet = new Set(offDates.map((o) => o.date));
    const booked = new Map(
      bookedRows.map((r) => [`${r.turnId}|${r.date}`, Number(r.booked)]),
    );
    const today = todayDhaka(now);

    const days: AvailabilityDayDto[] = dates.map((date) => {
      const weekday = weekdayOf(date);
      const day = daysByWeekday.get(weekday);
      const activeTurns = (day?.turns ?? [])
        .filter((t) => t.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
      const closedReason = resolveClosedReason({
        date,
        today,
        advanceBookingDays: chamber.advanceBookingDays,
        chamberActive: chamber.isActive,
        doctorOff: offSet.has(date) || !doctor.isActive,
        dayIsOff: day?.isOff ?? false,
        activeTurnCount: day?.isOff ? 0 : activeTurns.length,
      });
      const turns: AvailabilityTurnDto[] = day?.isOff
        ? []
        : activeTurns.map((t) => {
            const capacity = slotCapacity(turnToInput(t));
            const count = booked.get(`${t.id}|${date}`) ?? 0;
            return {
              turnId: t.id,
              startTime: normTime(t.startTime),
              endTime: normTime(t.endTime),
              fee: t.fee,
              slotDurationMinutes: t.slotDurationMinutes,
              capacity,
              booked: count,
              remaining: Math.max(0, capacity - count),
            };
          });
      return {
        date,
        weekday,
        isOpen: closedReason === null,
        closedReason,
        turns,
      };
    });
    return { days };
  }

  async slots(
    turnId: number,
    date: string,
    opts: { restrictToDoctorId?: number; now?: Date } = {},
  ): Promise<SlotsDto> {
    if (!isValidDate(date)) throw new BadRequestException('Invalid date');
    const now = opts.now ?? new Date();
    const turn = await this.db.chamberTurnRepository.findOne({
      where: { id: turnId },
      relations: { chamberDay: { chamber: true } },
    });
    const day = turn?.chamberDay;
    const chamber = day?.chamber;
    if (!turn || !day || !chamber)
      throw new NotFoundException('Turn not found');
    if (
      opts.restrictToDoctorId !== undefined &&
      chamber.doctorId !== opts.restrictToDoctorId
    ) {
      throw new NotFoundException('Turn not found');
    }
    if (Number(day.weekday) !== weekdayOf(date)) {
      throw new BadRequestException('Turn does not run on that weekday');
    }

    const [doctor, off, appointments] = await Promise.all([
      this.db.doctorRepository.findOne({
        select: { id: true, isActive: true },
        where: { id: chamber.doctorId },
      }),
      this.db.doctorOffDateRepository.exists({
        where: { doctorId: chamber.doctorId, date },
      }),
      this.db.appointmentRepository.find({
        select: {
          id: true,
          slotNumber: true,
          status: true,
          patientDetails: true,
        },
        where: {
          chamberTurnId: turnId,
          appointmentDate: date,
          status: Not(AppointmentStatus.CANCELLED),
        },
      }),
    ]);

    const today = todayDhaka(now);
    const reason = resolveClosedReason({
      date,
      today,
      advanceBookingDays: chamber.advanceBookingDays,
      chamberActive: chamber.isActive,
      doctorOff: off || !doctor?.isActive,
      dayIsOff: day.isOff,
      activeTurnCount: turn.isActive ? 1 : 0,
    });
    const views = buildSlotViews(
      buildSlots(turnToInput(turn)),
      appointments.map((a) => ({
        slotNumber: a.slotNumber,
        appointment: {
          id: a.id,
          status: a.status,
          patientName: a.patientDetails?.fullName ?? '',
          patientMobile: a.patientDetails?.mobile ?? null,
        },
      })),
      {
        date,
        today,
        nowMinutes: nowMinutesDhaka(now),
        // A past date is already covered per slot; other reasons close every free slot.
        closed: reason !== null && reason !== 'PAST',
      },
    );
    return { turnId, date, slots: views };
  }
}
