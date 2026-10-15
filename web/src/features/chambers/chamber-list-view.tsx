"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ActiveBadge, Badge } from "@/components/ui/badge";
import { AsyncSelect, type Option } from "@/components/forms/async-select";
import { useDivisions } from "@/components/forms/select-options";
import { api, errorMessage } from "@/lib/api";
import { bilingual, WEEKDAYS } from "@/lib/format";
import { useListParams } from "@/lib/use-list-params";
import type {
  ChamberListItem,
  DoctorOption,
  Paginated,
  Ref,
} from "@/lib/types";

const searchDoctors = async (search: string): Promise<Option[]> => {
  const list = await api<DoctorOption[]>("admin/doctor/options", {
    query: { search },
  });
  return list.map((d) => ({
    id: d.id,
    label: d.name,
    sublabel: d.specialityName,
  }));
};

const searchHospitals = async (search: string): Promise<Option[]> => {
  const list = await api<Ref[]>("admin/hospital/options", {
    query: { search },
  });
  const q = search.trim().toLowerCase();
  return list
    .filter((h) => !q || h.name.toLowerCase().includes(q))
    .map((h) => ({ id: h.id, label: h.name }));
};

const SHORT = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

const columns: Column<ChamberListItem>[] = [
  {
    header: "Chamber",
    cell: (c) => (
      <span className="font-medium">
        {c.name ? bilingual(c.name, c.nameBN) : "Unnamed chamber"}
      </span>
    ),
  },
  { header: "Doctor", cell: (c) => bilingual(c.doctor.name, c.doctor.nameBN) },
  {
    header: "Type",
    cell: (c) => (
      <div className="flex flex-col items-start gap-1">
        <Badge tone={c.chamberType === "SELF" ? "teal" : "blue"}>
          {c.chamberType}
        </Badge>
        {c.hospital && (
          <span className="text-xs text-zinc-600">{c.hospital.name}</span>
        )}
      </div>
    ),
  },
  {
    header: "Location",
    cell: (c) => (
      <div>
        <p>
          {c.district.name}, {c.division.name}
        </p>
        <p className="text-xs text-zinc-500">{c.address}</p>
      </div>
    ),
  },
  {
    header: "Open days",
    cell: (c) =>
      c.openDays.length ? (
        <div className="flex flex-wrap gap-1">
          {[...c.openDays]
            .sort((a, b) => a - b)
            .map((d) => (
              <span
                key={d}
                title={WEEKDAYS[d]?.en}
                className="rounded bg-teal-50 px-1.5 py-0.5 text-xs font-medium text-teal-800"
              >
                {SHORT[d]}
              </span>
            ))}
        </div>
      ) : (
        <span className="text-zinc-400">-</span>
      ),
  },
  { header: "Status", cell: (c) => <ActiveBadge active={c.isActive} /> },
];

export function ChamberListView() {
  const router = useRouter();
  const p = useListParams();
  const divisions = useDivisions();

  const params = {
    page: p.page,
    limit: 20,
    search: p.get("search"),
    doctorId: p.get("doctorId"),
    hospitalId: p.get("hospitalId"),
    chamberType: p.get("chamberType"),
    divisionId: p.get("divisionId"),
    isActive: p.get("isActive"),
  };
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["chambers", params],
    queryFn: () =>
      api<Paginated<ChamberListItem>>("admin/chamber", { query: params }),
    placeholderData: (prev) => prev,
  });

  const doctorId = p.get("doctorId");
  const hospitalId = p.get("hospitalId");

  return (
    <>
      <PageHeader
        title="Chambers"
        description="Doctor chambers and their weekly schedules"
        actions={
          <Link href="/admin/chambers/new">
            <Button>
              <Plus className="size-4" aria-hidden />
              Add chamber
            </Button>
          </Link>
        }
      />
      <Card>
        <div className="grid gap-3 border-b border-zinc-200 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <SearchInput
            value={p.get("search")}
            onChange={(v) => p.set({ search: v })}
            placeholder="Search chambers"
          />
          <AsyncSelect
            cacheKey="doctor-options"
            fetchOptions={searchDoctors}
            value={
              doctorId
                ? {
                    id: Number(doctorId),
                    label: p.get("doctorName") || `Doctor #${doctorId}`,
                  }
                : null
            }
            onChange={(o) => p.set({ doctorId: o?.id, doctorName: o?.label })}
            placeholder="All doctors"
            clearable
          />
          <AsyncSelect
            cacheKey="hospital-options"
            fetchOptions={searchHospitals}
            value={
              hospitalId
                ? {
                    id: Number(hospitalId),
                    label: p.get("hospitalName") || `Hospital #${hospitalId}`,
                  }
                : null
            }
            onChange={(o) =>
              p.set({ hospitalId: o?.id, hospitalName: o?.label })
            }
            placeholder="All hospitals"
            clearable
          />
          <Select
            aria-label="Chamber type"
            value={p.get("chamberType")}
            onChange={(e) => p.set({ chamberType: e.target.value })}
          >
            <option value="">All types</option>
            <option value="SELF">Self</option>
            <option value="HOSPITAL">Hospital</option>
          </Select>
          <Select
            aria-label="Division"
            value={p.get("divisionId")}
            onChange={(e) => p.set({ divisionId: e.target.value })}
          >
            <option value="">All divisions</option>
            {divisions.data?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Status"
            value={p.get("isActive")}
            onChange={(e) => p.set({ isActive: e.target.value })}
          >
            <option value="">Active and inactive</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </Select>
        </div>
        <DataTable
          columns={columns}
          rows={data?.items}
          rowKey={(c) => c.id}
          loading={isLoading}
          error={error ? errorMessage(error) : null}
          onRetry={() => refetch()}
          onRowClick={(c) => router.push(`/admin/chambers/${c.id}/edit`)}
          empty={{
            title: "No chambers found",
            description: "Adjust the filters or add a chamber.",
          }}
        />
        {data && (
          <Pagination meta={data.meta} onPage={(page) => p.set({ page })} />
        )}
      </Card>
    </>
  );
}
