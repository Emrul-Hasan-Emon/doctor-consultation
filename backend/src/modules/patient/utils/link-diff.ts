export interface LinkState {
  doctorId: number;
  isActive: boolean;
}

export interface LinkDiff {
  toCreate: number[];
  toReactivate: number[];
  toDeactivate: number[];
}

/** Compares existing links with the wanted active doctor set. */
export function diffLinks(
  existing: readonly LinkState[],
  wanted: readonly number[],
): LinkDiff {
  const want = new Set(wanted);
  const byDoctor = new Map(existing.map((l) => [l.doctorId, l]));
  const toCreate: number[] = [];
  const toReactivate: number[] = [];
  for (const doctorId of want) {
    const link = byDoctor.get(doctorId);
    if (!link) toCreate.push(doctorId);
    else if (!link.isActive) toReactivate.push(doctorId);
  }
  const toDeactivate = existing
    .filter((l) => l.isActive && !want.has(l.doctorId))
    .map((l) => l.doctorId);
  return { toCreate, toReactivate, toDeactivate };
}
