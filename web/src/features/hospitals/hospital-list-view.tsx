"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useDistricts, useDivisions } from "@/components/forms/select-options";
import { api, errorMessage } from "@/lib/api";
import { bilingual } from "@/lib/format";
import { useListParams } from "@/lib/use-list-params";
import type { Hospital, Paginated } from "@/lib/types";

const columns: Column<Hospital>[] = [
  {
    header: "Name",
    cell: (h) => (
      <div>
        <p className="font-medium text-zinc-900">{h.name}</p>
        {h.nameBN && <p className="text-xs text-zinc-500">{h.nameBN}</p>}
      </div>
    ),
  },
  {
    header: "Location",
    cell: (h) => bilingual(h.district.name, h.division.name),
  },
  { header: "Phone", cell: (h) => h.phone ?? "" },
  {
    header: "Status",
    cell: (h) => (
      <Badge tone={h.status ? "green" : "gray"}>
        {h.status ? "Active" : "Inactive"}
      </Badge>
    ),
  },
];

export function HospitalListView() {
  const router = useRouter();
  const p = useListParams();
  const search = p.get("search");
  const status = p.get("status");
  const divisionId = p.get("divisionId");
  const districtId = p.get("districtId");

  const divisions = useDivisions();
  const districts = useDistricts(divisionId ? Number(divisionId) : null);

  const params = {
    page: p.page,
    limit: 20,
    search,
    status,
    divisionId,
    districtId,
  };
  const { data, error, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["hospitals", params],
    queryFn: () =>
      api<Paginated<Hospital>>("admin/hospital", { query: params }),
    placeholderData: (prev) => prev,
  });

  return (
    <>
      <PageHeader
        title="Hospitals"
        description="Hospitals where doctors hold chambers"
        actions={
          <Link href="/admin/hospitals/new">
            <Button>
              <Plus className="size-4" aria-hidden />
              New hospital
            </Button>
          </Link>
        }
      />
      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-zinc-200 p-4">
          <SearchInput
            value={search}
            onChange={(v) => p.set({ search: v })}
            placeholder="Search hospitals"
          />
          <Select
            aria-label="Division"
            className="w-44"
            value={divisionId}
            onChange={(e) =>
              p.set({ divisionId: e.target.value, districtId: null })
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
            onChange={(e) => p.set({ districtId: e.target.value })}
          >
            <option value="">All districts</option>
            {districts.data?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Status"
            className="w-36"
            value={status}
            onChange={(e) => p.set({ status: e.target.value })}
          >
            <option value="">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </Select>
        </div>
        <DataTable
          columns={columns}
          rows={data?.items}
          rowKey={(h) => h.id}
          loading={isLoading || isFetching}
          error={error ? errorMessage(error) : null}
          onRetry={() => refetch()}
          onRowClick={(h) => router.push(`/admin/hospitals/${h.id}/edit`)}
          empty={{
            title: "No hospitals found",
            description: "Try changing the filters or add a hospital.",
          }}
        />
        {data && (
          <Pagination meta={data.meta} onPage={(page) => p.set({ page })} />
        )}
      </Card>
    </>
  );
}
