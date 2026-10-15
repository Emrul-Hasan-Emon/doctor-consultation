import { createHash } from 'crypto';
import { medicineSourceKey, validateMedicineItem } from './medicine-import';

const valid = {
  manufacturer: 'Square',
  brandName: 'Napa',
  genericName: 'Paracetamol',
  strength: '500 mg',
  dosage: 'Tablet',
  dar: 'Oral',
};

describe('medicineSourceKey', () => {
  it('is sha1 of lowercase trimmed brand|strength|dosage|manufacturer', () => {
    const expected = createHash('sha1')
      .update('napa|500 mg|tablet|square')
      .digest('hex');
    expect(medicineSourceKey(valid)).toBe(expected);
  });

  it('ignores case and surrounding whitespace', () => {
    expect(
      medicineSourceKey({
        brandName: '  NAPA ',
        strength: '500 MG',
        dosage: 'tablet ',
        manufacturer: ' SQUARE',
      }),
    ).toBe(medicineSourceKey(valid));
  });

  it('treats null strength as empty', () => {
    const key = createHash('sha1').update('napa||tablet|square').digest('hex');
    expect(medicineSourceKey({ ...valid, strength: null })).toBe(key);
  });
});

describe('validateMedicineItem', () => {
  it('accepts a valid item and trims', () => {
    const r = validateMedicineItem({ ...valid, brandName: ' Napa ' });
    expect(r).toEqual({
      ok: true,
      value: { ...valid, brandName: 'Napa' },
    });
  });

  it('defaults missing strength to null and blank strength to null', () => {
    const { strength: _s, ...rest } = valid;
    void _s;
    expect(validateMedicineItem(rest)).toMatchObject({
      ok: true,
      value: { strength: null },
    });
    expect(validateMedicineItem({ ...valid, strength: '  ' })).toMatchObject({
      ok: true,
      value: { strength: null },
    });
  });

  it('reports every missing required field', () => {
    const r = validateMedicineItem({ brandName: 'X' });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.message).toContain('manufacturer is required');
      expect(r.message).toContain('genericName is required');
      expect(r.message).toContain('dosage is required');
      expect(r.message).toContain('dar is required');
    }
  });

  it('rejects non-objects, wrong types and overlong values', () => {
    expect(validateMedicineItem(null).ok).toBe(false);
    expect(validateMedicineItem('x').ok).toBe(false);
    expect(validateMedicineItem([]).ok).toBe(false);
    expect(validateMedicineItem({ ...valid, isChronic: 'yes' }).ok).toBe(false);
    expect(validateMedicineItem({ ...valid, strength: 5 }).ok).toBe(false);
    expect(validateMedicineItem({ ...valid, dosage: 'x'.repeat(101) }).ok).toBe(
      false,
    );
  });

  it('keeps boolean flags only when given', () => {
    const r = validateMedicineItem({ ...valid, isChronic: true });
    expect(r).toMatchObject({ ok: true, value: { isChronic: true } });
    if (r.ok) expect('isActive' in r.value).toBe(false);
  });
});
