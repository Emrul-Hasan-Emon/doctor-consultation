import { BadRequestException } from '@nestjs/common';

const BD_MOBILE = /^01[3-9]\d{8}$/;

/** Accepts 01XXXXXXXXX, 8801XXXXXXXXX, +8801XXXXXXXXX. Returns 01XXXXXXXXX or null. */
export function tryNormalizeMobile(input: string): string | null {
  const digits = input.replace(/[\s-]/g, '').replace(/^\+/, '');
  const local = digits.startsWith('880') ? `0${digits.slice(3)}` : digits;
  return BD_MOBILE.test(local) ? local : null;
}

export function normalizeMobile(input: string): string {
  const value = tryNormalizeMobile(input);
  if (!value)
    throw new BadRequestException('Invalid Bangladeshi mobile number');
  return value;
}
