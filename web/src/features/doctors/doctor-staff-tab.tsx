"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { ActiveBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, errorMessage } from "@/lib/api";
import { bilingual } from "@/lib/format";
import type { DoctorStaff, Paginated } from "@/lib/types";

const columns: Column<DoctorStaff>[] = [
  { header: "Name", cell: (s) => bilingual(s.name, s.nameBN) },
  { header: "Mobile", cell: (s) => s.mobile },
  { header: "Email", cell: (s) => s.email ?? "" },
  { header: "Status", cell: (s) => <ActiveBadge active={s.isActive} /> },
];

export function DoctorStaffTab({ doctorId }: { doctorId: number }) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const params = { page, limit: 10, doctorId };
  const { data, error, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["doctor-staff", params],
    queryFn: () =>
      api<Paginated<DoctorStaff>>("admin/doctor-staff", { query: params }),
    placeholderData: (prev) => prev,
  });

  return (
    <Card>
      <CardHeader
        title="Staff"
        actions={
          <Link href={`/admin/staff/new?doctorId=${doctorId}`}>
            <Button size="sm">Add staff</Button>
          </Link>
        }
      />
      <DataTable
        columns={columns}
        rows={data?.items}
        rowKey={(s) => s.id}
        loading={isLoading || isFetching}
        error={error ? errorMessage(error) : null}
        onRetry={() => refetch()}
        onRowClick={(s) => router.push(`/admin/staff/${s.id}/edit`)}
        empty={{ title: "No staff for this doctor" }}
      />
      {data && <Pagination meta={data.meta} onPage={setPage} />}
    </Card>
  );
}
