"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { ActiveBadge, Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, errorMessage } from "@/lib/api";
import { bilingual, weekdayName } from "@/lib/format";
import type { ChamberListItem, Paginated } from "@/lib/types";

const columns: Column<ChamberListItem>[] = [
  {
    header: "Chamber",
    cell: (c) => (
      <Link
        className="text-teal-700 hover:underline"
        href={`/admin/chambers/${c.id}`}
      >
        {bilingual(c.name, c.nameBN) || c.address}
      </Link>
    ),
  },
  {
    header: "Type",
    cell: (c) => (
      <Badge tone={c.chamberType === "HOSPITAL" ? "blue" : "teal"}>
        {c.chamberType === "HOSPITAL" ? "Hospital" : "Self"}
      </Badge>
    ),
  },
  {
    header: "Hospital",
    cell: (c) =>
      c.hospital ? bilingual(c.hospital.name, c.hospital.nameBN) : "",
  },
  {
    header: "Location",
    cell: (c) => bilingual(c.district.name, c.district.nameBN),
  },
  {
    header: "Open days",
    cell: (c) => c.openDays.map((d) => weekdayName(d).slice(0, 3)).join(", "),
  },
  { header: "Status", cell: (c) => <ActiveBadge active={c.isActive} /> },
];

export function DoctorChambersTab({ doctorId }: { doctorId: number }) {
  const [page, setPage] = useState(1);
  const params = { page, limit: 10, doctorId };
  const { data, error, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["doctor-chambers", params],
    queryFn: () =>
      api<Paginated<ChamberListItem>>("admin/chamber", { query: params }),
    placeholderData: (prev) => prev,
  });

  return (
    <Card>
      <CardHeader
        title="Chambers"
        actions={
          <Link href={`/admin/chambers/new?doctorId=${doctorId}`}>
            <Button size="sm">Add chamber</Button>
          </Link>
        }
      />
      <DataTable
        columns={columns}
        rows={data?.items}
        rowKey={(c) => c.id}
        loading={isLoading || isFetching}
        error={error ? errorMessage(error) : null}
        onRetry={() => refetch()}
        empty={{ title: "No chambers for this doctor" }}
      />
      {data && <Pagination meta={data.meta} onPage={setPage} />}
    </Card>
  );
}
