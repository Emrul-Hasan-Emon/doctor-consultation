import { buildSlots, slotCapacity, validateTurns, TurnInput } from './slots';

const turn = (over: Partial<TurnInput> = {}): TurnInput => ({
  startTime: '10:00',
  endTime: '12:00',
  maxPatients: 8,
  fee: 500,
  slotDurationMinutes: 15,
  ...over,
});

describe('slots', () => {
  it('builds sequential slots from the turn start', () => {
    const slots = buildSlots(turn({ maxPatients: 3 }));
    expect(slots).toEqual([
      { slotNumber: 1, startTime: '10:00:00', endTime: '10:15:00' },
      { slotNumber: 2, startTime: '10:15:00', endTime: '10:30:00' },
      { slotNumber: 3, startTime: '10:30:00', endTime: '10:45:00' },
    ]);
  });

  it('caps capacity by what fits in the window', () => {
    expect(slotCapacity(turn({ maxPatients: 50 }))).toBe(8);
    expect(slotCapacity(turn({ maxPatients: 4 }))).toBe(4);
  });

  it('changing slot duration only affects the turn that owns it', () => {
    expect(
      buildSlots(turn({ slotDurationMinutes: 30, maxPatients: 4 }))[2]
        .startTime,
    ).toBe('11:00:00');
    expect(
      buildSlots(turn({ slotDurationMinutes: 15, maxPatients: 8 }))[2]
        .startTime,
    ).toBe('10:30:00');
  });

  it('accepts a valid day with two turns', () => {
    expect(
      validateTurns([
        turn({ startTime: '10:00', endTime: '13:00', maxPatients: 12 }),
        turn({ startTime: '17:00', endTime: '20:00', maxPatients: 10 }),
      ]),
    ).toEqual([]);
  });

  it('rejects end before start', () => {
    expect(
      validateTurns([turn({ startTime: '12:00', endTime: '10:00' })]),
    ).toContain('Turn 1: end time must be after start time');
  });

  it('rejects overlapping turns', () => {
    expect(
      validateTurns([
        turn({ startTime: '10:00', endTime: '12:00', maxPatients: 4 }),
        turn({ startTime: '11:30', endTime: '13:00', maxPatients: 4 }),
      ]),
    ).toContain('Turns overlap');
  });

  it('allows back-to-back turns', () => {
    expect(
      validateTurns([
        turn({ startTime: '10:00', endTime: '12:00', maxPatients: 4 }),
        turn({ startTime: '12:00', endTime: '14:00', maxPatients: 4 }),
      ]),
    ).toEqual([]);
  });

  it('rejects capacity above the slots that fit', () => {
    expect(validateTurns([turn({ maxPatients: 9 })])[0]).toMatch(/do not fit/);
  });

  it('rejects bad numbers and bad times', () => {
    expect(validateTurns([turn({ maxPatients: 0 })])).toContain(
      'Turn 1: max patients must be at least 1',
    );
    expect(validateTurns([turn({ fee: -1 })])).toContain(
      'Turn 1: fee cannot be negative',
    );
    expect(validateTurns([turn({ startTime: '25:00' })])).toContain(
      'Turn 1: start and end must be HH:mm',
    );
  });
});
