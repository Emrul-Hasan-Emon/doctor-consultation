"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { ActiveBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/input";
import { AsyncSelect } from "@/components/forms/async-select";
import { useDistricts, useDivisions } from "@/components/forms/select-options";
import { api, errorMessage } from "@/lib/api";
import { bilingual } from "@/lib/format";
import { useListParams } from "@/lib/use-list-params";
import type { Paginated, Patient } from "@/lib/types";
import { fetchDoctorOptions } from "./doctor-options";

type Row = Omit<Patient, "doctors"> & { doctors?: Patient["doctors"] };

const columns: Column<Row>[] = [
  {
    header: "Name",
    cell: (p) => (
      <Link
        href={`/admin/patients/${p.id}`}
        className="font-medium text-teal-700 hover:underline"
      >
        {bilingual(p.name, p.nameBN)}
      </Link>
    ),
  },
  { header: "Mobile", cell: (p) => p.mobile },
  {
    header: "Location",
    cell: (p) =>
      [p.district?.name, p.division?.name].filter(Boolean).join(", "),
  },
  {
    header: "Doctors",
    cell: (p) => {
      const docs = p.doctors ?? [];
      if (!docs.length) return <span className="text-zinc-400">-</span>;
      const shown = docs
        .slice(0, 2)
        .map((d) => d.name)
        .join(", ");
      const more = docs.length - 2;
      return more > 0 ? `${shown} +${more}` : shown;
    },
  },
  { header: "Status", cell: (p) => <ActiveBadge active={p.isActive} /> },
];

export function PatientsView() {
  const router = useRouter();
  const lp = useListParams();
  const search = lp.get("search");
  const divisionId = lp.get("divisionId");
  const districtId = lp.get("districtId");
  const doctorId = lp.get("doctorId");
  const doctorLabel = lp.get("doctorName");
  const isActive = lp.get("isActive");

  const divisions = useDivisions();
  const districts = useDistricts(divisionId ? Number(divisionId) : null);

  const params = {
    page: lp.page,
    limit: 20,
    search,
    divisionId,
    districtId,
    doctorId,
    isActive,
  };
  const { data, error, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["patients", params],
    queryFn: () => api<Paginated<Row>>("admin/patient", { query: params }),
    placeholderData: (prev) => prev,
  });

  return (
    <>
      <PageHeader
        title="Patients"
        description="Manage patients and their doctors"
        actions={
          <Link href="/admin/patients/new">
            <Button>Add patient</Button>
          </Link>
        }
      />
      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-zinc-200 p-4">
          <SearchInput
            value={search}
            onChange={(v) => lp.set({ search: v })}
            placeholder="Search name or mobile"
          />
          <Select
            aria-label="Division"
            className="w-44"
            value={divisionId}
            onChange={(e) =>
              lp.set({ divisionId: e.target.value, districtId: null })
            }
          >
            <option value="">All divisions</option>
            {divisions.data?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
          <Select
            aria-label="District"
            className="w-44"
            value={districtId}
            disabled={!divisionId}
            onChange={(e) => lp.set({ districtId: e.target.value })}
          >
            <option value="">All districts</option>
            {districts.data?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
          <div className="w-56">
            <AsyncSelect
              cacheKey="patients-filter-doctor"
              fetchOptions={fetchDoctorOptions}
              placeholder="All doctors"
              clearable
              value={
                doctorId
                  ? {
                      id: Number(doctorId),
                      label: doctorLabel || `#${doctorId}`,
                    }
                  : null
              }
              onChange={(o) =>
                lp.set({
                  doctorId: o?.id ?? null,
                  doctorName: o?.label ?? null,
                })
              }
            />
          </div>
          <Select
            aria-label="Status"
            className="w-36"
            value={isActive}
            onChange={(e) => lp.set({ isActive: e.target.value })}
          >
            <option value="">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </Select>
        </div>
        <DataTable
          columns={columns}
          rows={data?.items}
          rowKey={(p) => p.id}
          loading={isLoading || isFetching}
          error={error ? errorMessage(error) : null}
          onRetry={() => refetch()}
          onRowClick={(p) => router.push(`/admin/patients/${p.id}`)}
          empty={{
            title: "No patients found",
            description: "Try different filters or add a patient.",
          }}
        />
        {data && (
          <Pagination meta={data.meta} onPage={(page) => lp.set({ page })} />
        )}
      </Card>
    </>
  );
}
