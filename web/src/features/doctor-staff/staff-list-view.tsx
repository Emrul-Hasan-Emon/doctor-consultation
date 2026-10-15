"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { ActiveBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { AsyncSelect } from "@/components/forms/async-select";
import { api, errorMessage } from "@/lib/api";
import { bilingual } from "@/lib/format";
import { useListParams } from "@/lib/use-list-params";
import type { DoctorStaff, Paginated } from "@/lib/types";
import { fetchDoctorOptions } from "./doctor-options";

const columns: Column<DoctorStaff>[] = [
  {
    header: "Name",
    cell: (s) => (
      <div>
        <p className="font-medium text-zinc-900">{s.name}</p>
        {s.nameBN && <p className="text-xs text-zinc-500">{s.nameBN}</p>}
      </div>
    ),
  },
  { header: "Doctor", cell: (s) => bilingual(s.doctor.name, s.doctor.nameBN) },
  { header: "Mobile", cell: (s) => s.mobile },
  { header: "Email", cell: (s) => s.email ?? "" },
  { header: "Status", cell: (s) => <ActiveBadge active={s.isActive} /> },
];

export function StaffListView() {
  const router = useRouter();
  const p = useListParams();
  const search = p.get("search");
  const doctorId = p.get("doctorId");
  const doctorName = p.get("doctorName");
  const isActive = p.get("isActive");

  const params = { page: p.page, limit: 20, search, doctorId, isActive };
  const { data, error, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["staff", params],
    queryFn: () =>
      api<Paginated<DoctorStaff>>("admin/doctor-staff", { query: params }),
    placeholderData: (prev) => prev,
  });

  return (
    <>
      <PageHeader
        title="Doctor staff"
        description="Staff accounts working for doctors"
        actions={
          <Link href="/admin/staff/new">
            <Button>Add staff</Button>
          </Link>
        }
      />
      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-zinc-200 p-4">
          <SearchInput
            value={search}
            onChange={(v) => p.set({ search: v })}
            placeholder="Search staff"
          />
          <div className="w-64">
            <AsyncSelect
              cacheKey="doctor-options"
              fetchOptions={fetchDoctorOptions}
              placeholder="All doctors"
              clearable
              value={
                doctorId
                  ? {
                      id: Number(doctorId),
                      label: doctorName || `Doctor #${doctorId}`,
                    }
                  : null
              }
              onChange={(o) => p.set({ doctorId: o?.id, doctorName: o?.label })}
            />
          </div>
          <Select
            aria-label="Status"
            className="w-36"
            value={isActive}
            onChange={(e) => p.set({ isActive: e.target.value })}
          >
            <option value="">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </Select>
        </div>
        <DataTable
          columns={columns}
          rows={data?.items}
          rowKey={(s) => s.id}
          loading={isLoading || isFetching}
          error={error ? errorMessage(error) : null}
          onRetry={() => refetch()}
          onRowClick={(s) => router.push(`/admin/staff/${s.id}/edit`)}
          empty={{ title: "No staff found" }}
        />
        {data && (
          <Pagination meta={data.meta} onPage={(page) => p.set({ page })} />
        )}
      </Card>
    </>
  );
}
