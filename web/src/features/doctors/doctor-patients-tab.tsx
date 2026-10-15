"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { api, errorMessage } from "@/lib/api";
import { bilingual, formatDate } from "@/lib/format";
import type { DoctorPatientLink, Paginated } from "@/lib/types";

const columns: Column<DoctorPatientLink>[] = [
  {
    header: "Patient",
    cell: (p) => (
      <Link
        className="text-teal-700 hover:underline"
        href={`/admin/patients/${p.patientId}`}
      >
        {bilingual(p.name, p.nameBN)}
      </Link>
    ),
  },
  { header: "Mobile", cell: (p) => p.mobile },
  {
    header: "Location",
    cell: (p) => bilingual(p.district.name, p.district.nameBN),
  },
  { header: "Linked", cell: (p) => formatDate(p.linkedAt) },
];

export function DoctorPatientsTab({ doctorId }: { doctorId: number }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const params = { page, limit: 10, search };
  const { data, error, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["doctor-patients", doctorId, params],
    queryFn: () =>
      api<Paginated<DoctorPatientLink>>(`admin/doctor/${doctorId}/patients`, {
        query: params,
      }),
    placeholderData: (prev) => prev,
  });

  return (
    <Card>
      <div className="border-b border-zinc-200 p-4">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search patients"
        />
      </div>
      <DataTable
        columns={columns}
        rows={data?.items}
        rowKey={(p) => p.linkId}
        loading={isLoading || isFetching}
        error={error ? errorMessage(error) : null}
        onRetry={() => refetch()}
        empty={{ title: "No patients linked to this doctor" }}
      />
      {data && <Pagination meta={data.meta} onPage={setPage} />}
    </Card>
  );
}
