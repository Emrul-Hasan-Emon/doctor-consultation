import { addDays, isValidDate, weekdayOf } from './date';
import { normalizeMobile, tryNormalizeMobile } from './mobile';

describe('date utils', () => {
  it('maps weekdays with Saturday = 0', () => {
    expect(weekdayOf('2026-10-10')).toBe(0); // Saturday
    expect(weekdayOf('2026-10-11')).toBe(1); // Sunday
    expect(weekdayOf('2026-10-16')).toBe(6); // Friday
  });
  it('adds days across month ends', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
  });
  it('validates calendar dates', () => {
    expect(isValidDate('2026-02-30')).toBe(false);
    expect(isValidDate('2026-02-28')).toBe(true);
  });
});

describe('mobile', () => {
  it('normalizes the common formats', () => {
    expect(normalizeMobile('+8801712345678')).toBe('01712345678');
    expect(normalizeMobile('8801712345678')).toBe('01712345678');
    expect(normalizeMobile('017 1234-5678')).toBe('01712345678');
  });
  it('rejects non-mobile numbers', () => {
    expect(tryNormalizeMobile('0121234567')).toBeNull();
    expect(tryNormalizeMobile('abc')).toBeNull();
  });
});
