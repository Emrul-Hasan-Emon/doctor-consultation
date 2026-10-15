import { BadRequestException } from '@nestjs/common';

/** Copies only the listed keys whose value is not undefined (null is kept: it clears the field). */
export function pickDefined<T extends object, K extends keyof T>(
  src: T,
  keys: readonly K[],
): Pick<T, K> {
  const out = {} as Pick<T, K>;
  for (const key of keys) {
    if (src[key] !== undefined) out[key] = src[key];
  }
  return out;
}

/** Rejects `null` for fields that cannot be cleared. */
export function assertNotNull(src: object, keys: readonly string[]): void {
  const record = src as Record<string, unknown>;
  for (const key of keys) {
    if (record[key] === null) {
      throw new BadRequestException(`${key} cannot be null`);
    }
  }
}
