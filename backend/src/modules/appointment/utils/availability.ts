import { addDays } from '../../../common/utils/date';
import { Slot, toMinutes } from '../../schedule/utils/slots';

export type ClosedReason =
  'DOCTOR_OFF' | 'CHAMBER_OFF' | 'NO_TURNS' | 'PAST' | 'OUT_OF_WINDOW';

export type SlotStatus = 'FREE' | 'BOOKED' | 'PAST';

export interface DayFacts {
  date: string;
  today: string;
  advanceBookingDays: number;
  chamberActive: boolean;
  doctorOff: boolean;
  /** A chamber_day row exists for the weekday and is marked off. */
  dayIsOff: boolean;
  activeTurnCount: number;
}

/** First reason that closes a date for booking, or null when it is open. */
export function resolveClosedReason(f: DayFacts): ClosedReason | null {
  if (f.date < f.today) return 'PAST';
  if (f.date > addDays(f.today, f.advanceBookingDays)) return 'OUT_OF_WINDOW';
  if (f.doctorOff) return 'DOCTOR_OFF';
  if (!f.chamberActive || f.dayIsOff) return 'CHAMBER_OFF';
  if (f.activeTurnCount === 0) return 'NO_TURNS';
  return null;
}

/** True when the slot can no longer be booked because its start has passed. */
export function isSlotPast(
  date: string,
  today: string,
  slotStartTime: string,
  nowMinutes: number,
): boolean {
  if (date < today) return true;
  if (date > today) return false;
  return toMinutes(slotStartTime) <= nowMinutes;
}

export interface BookedSlotInfo<T> {
  slotNumber: number;
  appointment: T;
}

export interface SlotView<T> extends Slot {
  status: SlotStatus;
  appointment: T | null;
}

/**
 * Merges computed slots with live appointments. A booked slot stays BOOKED
 * even when its time has passed. Free slots are PAST when their start has
 * passed or when the date is closed for another reason (`closed`).
 */
export function buildSlotViews<T>(
  slots: Slot[],
  booked: BookedSlotInfo<T>[],
  ctx: { date: string; today: string; nowMinutes: number; closed: boolean },
): SlotView<T>[] {
  const bySlot = new Map(booked.map((b) => [b.slotNumber, b.appointment]));
  return slots.map((s) => {
    const appointment = bySlot.get(s.slotNumber) ?? null;
    if (appointment) return { ...s, status: 'BOOKED', appointment };
    const past =
      ctx.closed ||
      isSlotPast(ctx.date, ctx.today, s.startTime, ctx.nowMinutes);
    return { ...s, status: past ? 'PAST' : 'FREE', appointment: null };
  });
}

/** Lowest slot number not in `taken`, or null when full. */
export function lowestFreeSlot(
  slots: Slot[],
  taken: Iterable<number>,
): Slot | null {
  const used = new Set(taken);
  return slots.find((s) => !used.has(s.slotNumber)) ?? null;
}
