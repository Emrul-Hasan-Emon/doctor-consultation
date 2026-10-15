import { api } from "@/lib/api";
import { bilingual } from "@/lib/format";
import type { Option } from "@/components/forms/async-select";
import type { DoctorOption } from "@/lib/types";

export async function fetchDoctorOptions(search: string): Promise<Option[]> {
  const rows = await api<DoctorOption[]>("admin/doctor/options", {
    query: { search },
  });
  return rows.map((d) => ({
    id: d.id,
    label: bilingual(d.name, d.nameBN),
    sublabel: d.specialityName,
  }));
}

export function chamberLabel(c: {
  name: string | null;
  nameBN: string | null;
  chamberType: "SELF" | "HOSPITAL";
  hospital: { name: string; nameBN: string | null } | null;
}): string {
  if (c.name) return bilingual(c.name, c.nameBN);
  if (c.hospital) return bilingual(c.hospital.name, c.hospital.nameBN);
  return c.chamberType === "SELF" ? "Own chamber" : "Hospital chamber";
}
