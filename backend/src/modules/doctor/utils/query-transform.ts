/** Query-string boolean: 'true'/'false' to boolean, anything else is left for the validator to reject. */
export function toBoolean({ value }: { value: unknown }): unknown {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return value;
}
