import { toMinutes, toTime, validateTurns } from '../../schedule/utils/slots';

export interface InputTurn {
  id?: number;
  startTime: string;
  endTime: string;
  maxPatients: number;
  fee: number;
  slotDurationMinutes?: number;
  isActive?: boolean;
}

export interface InputDay {
  weekday: number;
  isOff: boolean;
  turns?: InputTurn[];
}

export interface PlanTurn {
  id?: number;
  startTime: string;
  endTime: string;
  maxPatients: number;
  fee: number;
  slotDurationMinutes: number;
  isActive: boolean;
}

export interface PlanDay {
  weekday: number;
  isOff: boolean;
  turns: PlanTurn[];
}

export interface ExistingTurn {
  id: number;
  weekday: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  maxPatients: number;
  fee: number;
  isActive: boolean;
}

export interface TurnUsage {
  /** SCHEDULED appointments dated today or later. */
  scheduledCount: number;
  /** Highest slot number among those. */
  maxScheduledSlot: number;
  /** Any appointment ever, whatever the status or date. */
  hasAnyAppointment: boolean;
}

export interface PlannedTurn {
  weekday: number;
  sortOrder: number;
  turn: PlanTurn;
}

export interface SchedulePlan {
  invalid: string[];
  conflicts: string[];
  dayStates: { weekday: number; isOff: boolean }[];
  createTurns: PlannedTurn[];
  updateTurns: (PlannedTurn & { id: number })[];
  deleteTurnIds: number[];
  deactivateTurnIds: number[];
}

const WEEKDAY_NAMES = [
  'Saturday',
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
];

const hhmm = (time: string) => time.slice(0, 5);

const norm = (time: string) => toTime(toMinutes(time));

function describe(weekday: number, t: { startTime: string; endTime: string }) {
  return `${WEEKDAY_NAMES[weekday]} ${hhmm(t.startTime)}-${hhmm(t.endTime)}`;
}

/** Validates the payload shape and fills defaults. Returns human-readable errors. */
export function normalizeDays(
  days: InputDay[],
  defaultSlotMinutes: number,
): { days: PlanDay[]; errors: string[] } {
  const errors: string[] = [];
  const seen = new Set<number>();
  const result: PlanDay[] = [];
  for (const day of days) {
    const name = WEEKDAY_NAMES[day.weekday] ?? `Weekday ${day.weekday}`;
    if (!Number.isInteger(day.weekday) || day.weekday < 0 || day.weekday > 6) {
      errors.push(`${name}: weekday must be between 0 and 6`);
      continue;
    }
    if (seen.has(day.weekday)) errors.push(`${name} appears more than once`);
    seen.add(day.weekday);
    const turns = day.turns ?? [];
    if (day.isOff && turns.length > 0) {
      errors.push(`${name}: a day marked off cannot have turns`);
      continue;
    }
    const planTurns: PlanTurn[] = turns.map((t) => ({
      id: t.id,
      startTime: t.startTime,
      endTime: t.endTime,
      maxPatients: t.maxPatients,
      fee: t.fee,
      slotDurationMinutes: t.slotDurationMinutes ?? defaultSlotMinutes,
      isActive: t.isActive ?? true,
    }));
    const active = planTurns.filter((t) => t.isActive);
    const inactive = planTurns.filter((t) => !t.isActive);
    const dayErrors = [
      ...validateTurns(active),
      ...inactive.flatMap((t) => validateTurns([t])),
    ];
    dayErrors.forEach((e) => errors.push(`${name}: ${e}`));
    if (dayErrors.length === 0) {
      planTurns.forEach((t) => {
        t.startTime = norm(t.startTime);
        t.endTime = norm(t.endTime);
      });
    }
    result.push({ weekday: day.weekday, isOff: day.isOff, turns: planTurns });
  }
  return { days: result, errors: [...new Set(errors)] };
}

/**
 * Diffs the stored schedule against the payload.
 * `invalid` is a bad request (unknown or duplicate ids), `conflicts` is a 409
 * (would break scheduled appointments).
 */
export function planScheduleChange(
  existing: ExistingTurn[],
  existingWeekdays: number[],
  days: PlanDay[],
  usage: Map<number, TurnUsage>,
): SchedulePlan {
  const plan: SchedulePlan = {
    invalid: [],
    conflicts: [],
    dayStates: [],
    createTurns: [],
    updateTurns: [],
    deleteTurnIds: [],
    deactivateTurnIds: [],
  };
  const byId = new Map(existing.map((t) => [t.id, t]));
  const kept = new Set<number>();
  const usageOf = (id: number): TurnUsage =>
    usage.get(id) ?? {
      scheduledCount: 0,
      maxScheduledSlot: 0,
      hasAnyAppointment: false,
    };

  for (const day of days) {
    const ordered = [...day.turns].sort(
      (a, b) => toMinutes(a.startTime) - toMinutes(b.startTime),
    );
    ordered.forEach((turn, sortOrder) => {
      if (turn.id === undefined) {
        plan.createTurns.push({ weekday: day.weekday, sortOrder, turn });
        return;
      }
      const old = byId.get(turn.id);
      if (!old) {
        plan.invalid.push(`Turn ${turn.id} does not belong to this chamber`);
        return;
      }
      if (kept.has(turn.id)) {
        plan.invalid.push(`Turn ${turn.id} appears more than once`);
        return;
      }
      kept.add(turn.id);
      const u = usageOf(turn.id);
      if (u.scheduledCount > 0) {
        const label = `${describe(old.weekday, old)} has ${u.scheduledCount} scheduled appointment(s)`;
        if (
          old.weekday !== day.weekday ||
          norm(old.startTime) !== turn.startTime ||
          norm(old.endTime) !== turn.endTime ||
          old.slotDurationMinutes !== turn.slotDurationMinutes
        ) {
          plan.conflicts.push(
            `Turn ${label}: day, start, end and slot duration cannot change`,
          );
        }
        if (!turn.isActive) {
          plan.conflicts.push(`Turn ${label}: it cannot be deactivated`);
        }
        if (turn.maxPatients < u.maxScheduledSlot) {
          plan.conflicts.push(
            `Turn ${label}: max patients cannot go below ${u.maxScheduledSlot}, the highest booked slot`,
          );
        }
      }
      plan.updateTurns.push({
        id: turn.id,
        weekday: day.weekday,
        sortOrder,
        turn,
      });
    });
  }

  const offDays = new Set(days.filter((d) => d.isOff).map((d) => d.weekday));
  for (const old of existing) {
    if (kept.has(old.id)) continue;
    const u = usageOf(old.id);
    if (u.scheduledCount > 0) {
      const why = offDays.has(old.weekday)
        ? 'the day cannot be marked off'
        : 'it cannot be removed';
      plan.conflicts.push(
        `Turn ${describe(old.weekday, old)} has ${u.scheduledCount} scheduled appointment(s): ${why}`,
      );
    } else if (u.hasAnyAppointment) {
      plan.deactivateTurnIds.push(old.id);
    } else {
      plan.deleteTurnIds.push(old.id);
    }
  }

  const payloadWeekdays = new Set(days.map((d) => d.weekday));
  for (const day of days) {
    if (
      day.isOff ||
      day.turns.length > 0 ||
      existingWeekdays.includes(day.weekday)
    ) {
      plan.dayStates.push({ weekday: day.weekday, isOff: day.isOff });
    }
  }
  for (const weekday of existingWeekdays) {
    if (!payloadWeekdays.has(weekday)) {
      plan.dayStates.push({ weekday, isOff: false });
    }
  }
  return plan;
}
