import { toInputTime, WEEKDAYS } from "@/lib/format";
import type { ChamberDay } from "@/lib/types";

/** Editable (string based) copy of a turn. `id` is kept for existing turns. */
export interface TurnDraft {
  key: string;
  id?: number;
  startTime: string;
  endTime: string;
  maxPatients: string;
  fee: string;
  /** Blank means "use the doctor's consultation duration". */
  slotDurationMinutes: string;
}

export interface DayDraft {
  weekday: number;
  isOff: boolean;
  turns: TurnDraft[];
}

let counter = 0;
export const newKey = () => `t${Date.now().toString(36)}${counter++}`;

export function emptyTurn(): TurnDraft {
  return {
    key: newKey(),
    startTime: "09:00",
    endTime: "12:00",
    maxPatients: "10",
    fee: "",
    slotDurationMinutes: "",
  };
}

export function emptyDays(): DayDraft[] {
  return WEEKDAYS.map((d) => ({ weekday: d.value, isOff: false, turns: [] }));
}

export function toDrafts(days: ChamberDay[]): DayDraft[] {
  return WEEKDAYS.map((d) => {
    const day = days.find((x) => x.weekday === d.value);
    return {
      weekday: d.value,
      isOff: day?.isOff ?? false,
      turns: (day?.turns ?? [])
        .filter((t) => t.isActive !== false)
        .map((t) => ({
          key: newKey(),
          id: t.id,
          startTime: toInputTime(t.startTime),
          endTime: toInputTime(t.endTime),
          maxPatients: String(t.maxPatients),
          fee: String(t.fee),
          slotDurationMinutes:
            t.slotDurationMinutes !== undefined
              ? String(t.slotDurationMinutes)
              : "",
        })),
    };
  });
}

/** 'HH:mm' or 'HH:mm:ss' -> minutes since midnight, null when invalid. */
export function toMinutes(time: string): number | null {
  const m = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(time);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

const toInt = (v: string): number | null => {
  if (v.trim() === "" || !/^\d+$/.test(v.trim())) return null;
  return Number(v);
};

/** Slots that fit in the window: floor((end - start) / slotDuration). */
export function slotsThatFit(
  startTime: string,
  endTime: string,
  slotMinutes: number | null,
): number | null {
  const s = toMinutes(startTime);
  const e = toMinutes(endTime);
  if (s === null || e === null || !slotMinutes || slotMinutes < 1) return null;
  if (e <= s) return 0;
  return Math.floor((e - s) / slotMinutes);
}

/** Bookable slots: slots that fit, capped by max patients. */
export function bookableSlots(
  fit: number | null,
  maxPatients: number | null,
): number | null {
  if (fit === null) return null;
  if (maxPatients === null) return fit;
  return Math.min(fit, maxPatients);
}

export function effectiveSlotMinutes(
  turn: TurnDraft,
  defaultSlot: number | null,
): number | null {
  return toInt(turn.slotDurationMinutes) ?? defaultSlot;
}

export function turnCapacity(turn: TurnDraft, defaultSlot: number | null) {
  const fit = slotsThatFit(
    turn.startTime,
    turn.endTime,
    effectiveSlotMinutes(turn, defaultSlot),
  );
  return { fit, bookable: bookableSlots(fit, toInt(turn.maxPatients)) };
}

export interface DayErrors {
  day: string[];
  turns: Record<string, string[]>;
}
export type ScheduleErrors = Record<number, DayErrors>;

export function validateSchedule(
  days: DayDraft[],
  defaultSlot: number | null,
): { errors: ScheduleErrors; valid: boolean } {
  const errors: ScheduleErrors = {};
  let valid = true;
  for (const day of days) {
    const de: DayErrors = { day: [], turns: {} };
    if (day.isOff && day.turns.length > 0) {
      de.day.push("A day that is off cannot have turns.");
    }
    const ranges: { key: string; s: number; e: number }[] = [];
    for (const t of day.turns) {
      const te: string[] = [];
      const s = toMinutes(t.startTime);
      const e = toMinutes(t.endTime);
      if (s === null) te.push("Start time is required.");
      if (e === null) te.push("End time is required.");
      if (s !== null && e !== null) {
        if (e <= s) te.push("End time must be after start time.");
        else ranges.push({ key: t.key, s, e });
      }
      const max = toInt(t.maxPatients);
      if (max === null || max < 1) te.push("Max patients must be at least 1.");
      const fee = t.fee.trim() === "" ? NaN : Number(t.fee);
      if (!Number.isFinite(fee) || fee < 0) te.push("Fee must be 0 or more.");
      if (t.slotDurationMinutes.trim() !== "") {
        const sl = toInt(t.slotDurationMinutes);
        if (sl === null || sl < 1)
          te.push("Slot duration must be at least 1 minute.");
      }
      const slot = effectiveSlotMinutes(t, defaultSlot);
      const fit = slotsThatFit(t.startTime, t.endTime, slot);
      if (fit !== null && e !== null && s !== null && e > s) {
        if (fit < 1) te.push("The time window is shorter than one slot.");
        else if (max !== null && max > fit)
          te.push(`Max patients cannot exceed the ${fit} slots that fit.`);
      }
      if (te.length) de.turns[t.key] = te;
    }
    ranges.sort((a, b) => a.s - b.s);
    for (let i = 1; i < ranges.length; i++) {
      if (ranges[i].s < ranges[i - 1].e) {
        const k = ranges[i].key;
        de.turns[k] = [...(de.turns[k] ?? []), "Overlaps another turn."];
      }
    }
    if (de.day.length || Object.keys(de.turns).length) {
      errors[day.weekday] = de;
      valid = false;
    }
  }
  return { errors, valid };
}

export function toPayloadDays(days: DayDraft[]) {
  return days.map((d) => ({
    weekday: d.weekday,
    isOff: d.isOff,
    turns: d.isOff
      ? []
      : d.turns.map((t) => ({
          ...(t.id !== undefined ? { id: t.id } : {}),
          startTime: t.startTime,
          endTime: t.endTime,
          maxPatients: Number(t.maxPatients),
          fee: Number(t.fee),
          ...(t.slotDurationMinutes.trim() !== ""
            ? { slotDurationMinutes: Number(t.slotDurationMinutes) }
            : {}),
        })),
  }));
}
