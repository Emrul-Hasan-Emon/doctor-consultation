/**
 * Pure slot math. Slots are computed from a turn, never stored.
 * Slot N starts at startTime + (N - 1) * slotDurationMinutes.
 */

export interface TurnInput {
  /** HH:mm or HH:mm:ss, local Asia/Dhaka. */
  startTime: string;
  endTime: string;
  maxPatients: number;
  fee: number;
  slotDurationMinutes: number;
}

export interface Slot {
  slotNumber: number;
  startTime: string;
  endTime: string;
}

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;

export function isValidTime(value: string): boolean {
  return TIME_RE.test(value);
}

export function toMinutes(time: string): number {
  const m = TIME_RE.exec(time);
  if (!m) throw new Error(`Invalid time: ${time}`);
  return Number(m[1]) * 60 + Number(m[2]);
}

/** Minutes since midnight to HH:mm:ss. */
export function toTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

/** How many slots fit in the turn window. */
export function slotsThatFit(
  t: Pick<TurnInput, 'startTime' | 'endTime' | 'slotDurationMinutes'>,
): number {
  return Math.floor(
    (toMinutes(t.endTime) - toMinutes(t.startTime)) / t.slotDurationMinutes,
  );
}

/** Bookable slots: the lower of configured capacity and what fits. */
export function slotCapacity(t: TurnInput): number {
  return Math.max(0, Math.min(t.maxPatients, slotsThatFit(t)));
}

export function buildSlots(t: TurnInput): Slot[] {
  const start = toMinutes(t.startTime);
  return Array.from({ length: slotCapacity(t) }, (_, i) => ({
    slotNumber: i + 1,
    startTime: toTime(start + i * t.slotDurationMinutes),
    endTime: toTime(start + (i + 1) * t.slotDurationMinutes),
  }));
}

/** Returns human-readable errors. Empty means the turns of one day are valid. */
export function validateTurns(turns: TurnInput[]): string[] {
  const errors: string[] = [];
  turns.forEach((t, i) => {
    const label = `Turn ${i + 1}`;
    if (!isValidTime(t.startTime) || !isValidTime(t.endTime)) {
      errors.push(`${label}: start and end must be HH:mm`);
      return;
    }
    if (toMinutes(t.endTime) <= toMinutes(t.startTime)) {
      errors.push(`${label}: end time must be after start time`);
      return;
    }
    if (!Number.isInteger(t.slotDurationMinutes) || t.slotDurationMinutes < 1) {
      errors.push(`${label}: slot duration must be a whole number of minutes`);
      return;
    }
    if (!Number.isInteger(t.maxPatients) || t.maxPatients < 1) {
      errors.push(`${label}: max patients must be at least 1`);
    }
    if (!Number.isInteger(t.fee) || t.fee < 0) {
      errors.push(`${label}: fee cannot be negative`);
    }
    const fit = slotsThatFit(t);
    if (fit < 1) {
      errors.push(`${label}: window is shorter than one slot`);
    } else if (t.maxPatients > fit) {
      errors.push(
        `${label}: ${t.maxPatients} patients do not fit in ${fit} slots of ${t.slotDurationMinutes} min`,
      );
    }
  });
  const ok = turns
    .filter((t) => isValidTime(t.startTime) && isValidTime(t.endTime))
    .map((t) => [toMinutes(t.startTime), toMinutes(t.endTime)] as const)
    .sort((a, b) => a[0] - b[0]);
  for (let i = 1; i < ok.length; i++) {
    if (ok[i][0] < ok[i - 1][1]) errors.push('Turns overlap');
  }
  return [...new Set(errors)];
}
