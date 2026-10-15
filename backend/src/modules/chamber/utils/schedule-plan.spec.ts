import {
  ExistingTurn,
  normalizeDays,
  planScheduleChange,
  PlanDay,
  TurnUsage,
} from './schedule-plan';

const existing = (over: Partial<ExistingTurn> = {}): ExistingTurn => ({
  id: 1,
  weekday: 2,
  startTime: '09:00:00',
  endTime: '12:00:00',
  slotDurationMinutes: 15,
  maxPatients: 10,
  fee: 500,
  isActive: true,
  ...over,
});

const day = (over: Partial<PlanDay> = {}): PlanDay => ({
  weekday: 2,
  isOff: false,
  turns: [
    {
      id: 1,
      startTime: '09:00:00',
      endTime: '12:00:00',
      maxPatients: 10,
      fee: 500,
      slotDurationMinutes: 15,
      isActive: true,
    },
  ],
  ...over,
});

const used = (over: Partial<TurnUsage> = {}): Map<number, TurnUsage> =>
  new Map([
    [
      1,
      {
        scheduledCount: 0,
        maxScheduledSlot: 0,
        hasAnyAppointment: false,
        ...over,
      },
    ],
  ]);

describe('normalizeDays', () => {
  it('defaults slot duration, normalizes times and keeps isActive true', () => {
    const { days, errors } = normalizeDays(
      [
        {
          weekday: 0,
          isOff: false,
          turns: [
            { startTime: '09:00', endTime: '10:00', maxPatients: 4, fee: 100 },
          ],
        },
      ],
      15,
    );
    expect(errors).toEqual([]);
    expect(days[0].turns[0]).toMatchObject({
      startTime: '09:00:00',
      endTime: '10:00:00',
      slotDurationMinutes: 15,
      isActive: true,
    });
  });

  it('rejects duplicate weekdays and turns on an off day', () => {
    const { errors } = normalizeDays(
      [
        { weekday: 1, isOff: false, turns: [] },
        {
          weekday: 1,
          isOff: true,
          turns: [
            { startTime: '09:00', endTime: '10:00', maxPatients: 1, fee: 0 },
          ],
        },
      ],
      15,
    );
    expect(errors.some((e) => e.includes('more than once'))).toBe(true);
    expect(errors.some((e) => e.includes('cannot have turns'))).toBe(true);
  });

  it('reports overlap and capacity that does not fit', () => {
    const { errors } = normalizeDays(
      [
        {
          weekday: 3,
          isOff: false,
          turns: [
            { startTime: '09:00', endTime: '10:00', maxPatients: 10, fee: 0 },
            { startTime: '09:30', endTime: '11:00', maxPatients: 2, fee: 0 },
          ],
        },
      ],
      15,
    );
    expect(errors.join('|')).toContain('do not fit');
    expect(errors.join('|')).toContain('Turns overlap');
  });

  it('ignores inactive turns when checking overlap', () => {
    const { errors } = normalizeDays(
      [
        {
          weekday: 3,
          isOff: false,
          turns: [
            { startTime: '09:00', endTime: '10:00', maxPatients: 2, fee: 0 },
            {
              startTime: '09:30',
              endTime: '11:00',
              maxPatients: 2,
              fee: 0,
              isActive: false,
            },
          ],
        },
      ],
      15,
    );
    expect(errors).toEqual([]);
  });
});

describe('planScheduleChange', () => {
  it('creates turns without id and updates turns with id', () => {
    const d = day();
    d.turns.push({
      startTime: '16:00:00',
      endTime: '18:00:00',
      maxPatients: 5,
      fee: 300,
      slotDurationMinutes: 15,
      isActive: true,
    });
    const plan = planScheduleChange([existing()], [2], [d], used());
    expect(plan.createTurns).toHaveLength(1);
    expect(plan.createTurns[0].sortOrder).toBe(1);
    expect(plan.updateTurns.map((t) => t.id)).toEqual([1]);
    expect(plan.conflicts).toEqual([]);
    expect(plan.invalid).toEqual([]);
  });

  it('flags unknown and duplicate turn ids as invalid', () => {
    const d = day();
    d.turns.push({ ...d.turns[0] }, { ...d.turns[0], id: 99 });
    const plan = planScheduleChange([existing()], [2], [d], used());
    expect(plan.invalid.some((m) => m.includes('99'))).toBe(true);
    expect(plan.invalid.some((m) => m.includes('more than once'))).toBe(true);
  });

  it('deletes a removed turn that never had an appointment', () => {
    const plan = planScheduleChange(
      [existing()],
      [2],
      [day({ turns: [] })],
      used(),
    );
    expect(plan.deleteTurnIds).toEqual([1]);
    expect(plan.deactivateTurnIds).toEqual([]);
  });

  it('deactivates a removed turn that has history', () => {
    const plan = planScheduleChange(
      [existing()],
      [2],
      [day({ turns: [] })],
      used({ hasAnyAppointment: true }),
    );
    expect(plan.deactivateTurnIds).toEqual([1]);
    expect(plan.deleteTurnIds).toEqual([]);
  });

  it('refuses to remove a turn with scheduled appointments', () => {
    const plan = planScheduleChange(
      [existing()],
      [2],
      [day({ turns: [] })],
      used({ scheduledCount: 2, hasAnyAppointment: true, maxScheduledSlot: 3 }),
    );
    expect(plan.conflicts).toHaveLength(1);
    expect(plan.conflicts[0]).toContain('cannot be removed');
  });

  it('refuses to mark a day off while appointments are scheduled', () => {
    const plan = planScheduleChange(
      [existing()],
      [2],
      [day({ isOff: true, turns: [] })],
      used({ scheduledCount: 1, hasAnyAppointment: true, maxScheduledSlot: 1 }),
    );
    expect(plan.conflicts[0]).toContain('marked off');
  });

  it('protects time, duration, active flag and capacity of a booked turn', () => {
    const d = day();
    d.turns[0] = {
      ...d.turns[0],
      startTime: '09:30:00',
      isActive: false,
      maxPatients: 2,
    };
    const plan = planScheduleChange(
      [existing()],
      [2],
      [d],
      used({ scheduledCount: 3, hasAnyAppointment: true, maxScheduledSlot: 5 }),
    );
    expect(plan.conflicts).toHaveLength(3);
  });

  it('allows fee changes and higher capacity on a booked turn', () => {
    const d = day();
    d.turns[0] = { ...d.turns[0], fee: 700, maxPatients: 12 };
    const plan = planScheduleChange(
      [existing()],
      [2],
      [d],
      used({ scheduledCount: 3, hasAnyAppointment: true, maxScheduledSlot: 5 }),
    );
    expect(plan.conflicts).toEqual([]);
  });

  it('treats time formats HH:mm and HH:mm:ss as equal', () => {
    const plan = planScheduleChange(
      [existing({ startTime: '09:00' })],
      [2],
      [day()],
      used({ scheduledCount: 1, hasAnyAppointment: true, maxScheduledSlot: 1 }),
    );
    expect(plan.conflicts).toEqual([]);
  });

  it('resets existing days missing from the payload to open', () => {
    const plan = planScheduleChange([], [4], [], new Map());
    expect(plan.dayStates).toEqual([{ weekday: 4, isOff: false }]);
  });

  it('only creates day rows for days that carry information', () => {
    const plan = planScheduleChange(
      [],
      [],
      [
        { weekday: 0, isOff: false, turns: [] },
        { weekday: 1, isOff: true, turns: [] },
      ],
      new Map(),
    );
    expect(plan.dayStates).toEqual([{ weekday: 1, isOff: true }]);
  });
});
