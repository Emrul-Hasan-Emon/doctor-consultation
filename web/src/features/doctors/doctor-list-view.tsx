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
import { api, errorMessage } from "@/lib/api";
import { bilingual } from "@/lib/format";
import { useListParams } from "@/lib/use-list-params";
import type { Doctor, Paginated, Ref } from "@/lib/types";

const columns: Column<Doctor>[] = [
  {
    header: "Name",
    cell: (d) => (
      <div>
        <p className="font-medium text-zinc-900">{d.name}</p>
        {d.nameBN && <p className="text-xs text-zinc-500">{d.nameBN}</p>}
      </div>
    ),
  },
  {
    header: "Speciality",
    cell: (d) => bilingual(d.speciality?.name, d.speciality?.nameBN),
  },
  { header: "Mobile", cell: (d) => d.mobile },
  { header: "Patients", cell: (d) => d.patientCount },
  { header: "Staff", cell: (d) => d.staffCount },
  { header: "Chambers", cell: (d) => d.chamberCount },
  { header: "Status", cell: (d) => <ActiveBadge active={d.isActive} /> },
];

export function DoctorListView() {
  const router = useRouter();
  const p = useListParams();
  const search = p.get("search");
  const specialityId = p.get("specialityId");
  const isActive = p.get("isActive");

  const specialities = useQuery({
    queryKey: ["speciality-options"],
    queryFn: () => api<Ref[]>("admin/speciality/options"),
    staleTime: 5 * 60_000,
  });

  const params = { page: p.page, limit: 20, search, specialityId, isActive };
  const { data, error, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["doctors", params],
    queryFn: () => api<Paginated<Doctor>>("admin/doctor", { query: params }),
    placeholderData: (prev) => prev,
  });

  return (
    <>
      <PageHeader
        title="Doctors"
        description="Manage doctor profiles and accounts"
        actions={
          <Link href="/admin/doctors/new">
            <Button>Add doctor</Button>
          </Link>
        }
      />
      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-zinc-200 p-4">
          <SearchInput
            value={search}
            onChange={(v) => p.set({ search: v })}
            placeholder="Search name, mobile, BMDC"
          />
          <Select
            aria-label="Speciality"
            className="w-48"
            value={specialityId}
            onChange={(e) => p.set({ specialityId: e.target.value })}
          >
            <option value="">All specialities</option>
            {specialities.data?.map((s) => (
              <option key={s.id} value={s.id}>
                {bilingual(s.name, s.nameBN)}
              </option>
            ))}
          </Select>
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
          rowKey={(d) => d.id}
          loading={isLoading || isFetching}
          error={error ? errorMessage(error) : null}
          onRetry={() => refetch()}
          onRowClick={(d) => router.push(`/admin/doctors/${d.id}`)}
          empty={{
            title: "No doctors found",
            description: "Try different filters or add a doctor.",
          }}
        />
        {data && (
          <Pagination meta={data.meta} onPage={(page) => p.set({ page })} />
        )}
      </Card>
    </>
  );
}
