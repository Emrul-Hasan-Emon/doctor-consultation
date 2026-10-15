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
