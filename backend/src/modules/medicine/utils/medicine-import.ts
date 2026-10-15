import { createHash } from 'crypto';

export interface MedicineFields {
  manufacturer: string;
  brandName: string;
  genericName: string;
  strength: string | null;
  dosage: string;
  dar: string;
  isChronic?: boolean;
  isActive?: boolean;
}

export type MedicineKeyInput = Pick<
  MedicineFields,
  'brandName' | 'strength' | 'dosage' | 'manufacturer'
>;

const norm = (value: string | null | undefined): string =>
  (value ?? '').trim().toLowerCase();

/** sha1 of lowercase trimmed `brandName|strength|dosage|manufacturer`. */
export function medicineSourceKey(input: MedicineKeyInput): string {
  const raw = [
    input.brandName,
    input.strength,
    input.dosage,
    input.manufacturer,
  ]
    .map(norm)
    .join('|');
  return createHash('sha1').update(raw).digest('hex');
}

const REQUIRED: {
  key: 'manufacturer' | 'brandName' | 'genericName' | 'dosage' | 'dar';
  max: number;
}[] = [
  { key: 'manufacturer', max: 255 },
  { key: 'brandName', max: 255 },
  { key: 'genericName', max: 1024 },
  { key: 'dosage', max: 100 },
  { key: 'dar', max: 100 },
];

export type MedicineValidation =
  { ok: true; value: MedicineFields } | { ok: false; message: string };

/** Validates and normalizes one raw import item. Never throws. */
export function validateMedicineItem(raw: unknown): MedicineValidation {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ok: false, message: 'Item must be an object' };
  }
  const item = raw as Record<string, unknown>;
  const errors: string[] = [];
  const value: Partial<MedicineFields> = {};

  for (const { key, max } of REQUIRED) {
    const v = item[key];
    if (typeof v !== 'string' || v.trim() === '') {
      errors.push(`${key} is required`);
    } else if (v.trim().length > max) {
      errors.push(`${key} must be at most ${max} characters`);
    } else {
      value[key] = v.trim();
    }
  }

  const strength = item.strength;
  if (strength === undefined || strength === null) {
    value.strength = null;
  } else if (typeof strength !== 'string') {
    errors.push('strength must be a string');
  } else if (strength.trim().length > 1024) {
    errors.push('strength must be at most 1024 characters');
  } else {
    value.strength = strength.trim() === '' ? null : strength.trim();
  }

  for (const key of ['isChronic', 'isActive'] as const) {
    const v = item[key];
    if (v === undefined || v === null) continue;
    if (typeof v !== 'boolean') errors.push(`${key} must be a boolean`);
    else value[key] = v;
  }

  if (errors.length) return { ok: false, message: errors.join('; ') };
  return { ok: true, value: value as MedicineFields };
}
