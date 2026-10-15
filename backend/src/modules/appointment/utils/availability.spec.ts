import {
  buildSlotViews,
  DayFacts,
  isSlotPast,
  lowestFreeSlot,
  resolveClosedReason,
} from './availability';
import { buildSlots } from '../../schedule/utils/slots';

const base: DayFacts = {
  date: '2026-10-10',
  today: '2026-10-08',
  advanceBookingDays: 30,
  chamberActive: true,
  doctorOff: false,
  dayIsOff: false,
  activeTurnCount: 1,
};

describe('resolveClosedReason', () => {
  it('is open for a normal day', () => {
    expect(resolveClosedReason(base)).toBeNull();
  });
  it('today is open', () => {
    expect(resolveClosedReason({ ...base, date: base.today })).toBeNull();
  });
  it('past dates', () => {
    expect(resolveClosedReason({ ...base, date: '2026-10-07' })).toBe('PAST');
  });
  it('beyond the booking window, last day inclusive', () => {
    expect(resolveClosedReason({ ...base, date: '2026-11-07' })).toBeNull();
    expect(resolveClosedReason({ ...base, date: '2026-11-08' })).toBe(
      'OUT_OF_WINDOW',
    );
  });
  it('doctor off beats chamber off', () => {
    expect(
      resolveClosedReason({ ...base, doctorOff: true, dayIsOff: true }),
    ).toBe('DOCTOR_OFF');
  });
  it('chamber day off or inactive chamber', () => {
    expect(resolveClosedReason({ ...base, dayIsOff: true })).toBe(
      'CHAMBER_OFF',
    );
    expect(resolveClosedReason({ ...base, chamberActive: false })).toBe(
      'CHAMBER_OFF',
    );
  });
  it('no turns', () => {
    expect(resolveClosedReason({ ...base, activeTurnCount: 0 })).toBe(
      'NO_TURNS',
    );
  });
  it('past wins over everything else', () => {
    expect(
      resolveClosedReason({
        ...base,
        date: '2026-10-01',
        doctorOff: true,
        activeTurnCount: 0,
      }),
    ).toBe('PAST');
  });
});

describe('isSlotPast', () => {
  it('compares against now only for today', () => {
    expect(isSlotPast('2026-10-09', '2026-10-08', '00:00:00', 1000)).toBe(
      false,
    );
    expect(isSlotPast('2026-10-07', '2026-10-08', '23:00:00', 0)).toBe(true);
    expect(isSlotPast('2026-10-08', '2026-10-08', '10:00:00', 600)).toBe(true);
    expect(isSlotPast('2026-10-08', '2026-10-08', '10:15:00', 600)).toBe(false);
  });
});

describe('buildSlotViews', () => {
  const slots = buildSlots({
    startTime: '10:00',
    endTime: '11:00',
    maxPatients: 4,
    fee: 0,
    slotDurationMinutes: 15,
  });
  const ctx = {
    date: '2026-10-08',
    today: '2026-10-08',
    nowMinutes: 10 * 60 + 20,
    closed: false,
  };

  it('marks booked, past and free', () => {
    const v = buildSlotViews(slots, [{ slotNumber: 1, appointment: 'a' }], ctx);
    expect(v.map((s) => s.status)).toEqual(['BOOKED', 'PAST', 'FREE', 'FREE']);
    expect(v[0].appointment).toBe('a');
    expect(v[1].appointment).toBeNull();
  });
  it('closed dates have no free slot', () => {
    const v = buildSlotViews(slots, [], {
      ...ctx,
      date: '2026-10-20',
      closed: true,
    });
    expect(v.every((s) => s.status === 'PAST')).toBe(true);
  });
});

describe('lowestFreeSlot', () => {
  const slots = buildSlots({
    startTime: '10:00',
    endTime: '11:00',
    maxPatients: 3,
    fee: 0,
    slotDurationMinutes: 15,
  });
  it('picks the lowest gap', () => {
    expect(lowestFreeSlot(slots, [1, 3])?.slotNumber).toBe(2);
    expect(lowestFreeSlot(slots, [])?.slotNumber).toBe(1);
  });
  it('returns null when full', () => {
    expect(lowestFreeSlot(slots, [1, 2, 3])).toBeNull();
  });
});
