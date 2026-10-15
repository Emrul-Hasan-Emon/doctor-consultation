"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { ActiveBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { api, errorMessage } from "@/lib/api";
import { useListParams } from "@/lib/use-list-params";
import type { Paginated, Speciality } from "@/lib/types";
import { SpecialityForm } from "./speciality-form";

const columns: Column<Speciality>[] = [
  {
    header: "Name",
    cell: (s) => (
      <div>
        <p className="font-medium text-zinc-900">{s.name}</p>
        {s.nameBN && <p className="text-xs text-zinc-500">{s.nameBN}</p>}
      </div>
    ),
  },
  { header: "Value", cell: (s) => <code className="text-xs">{s.value}</code> },
  { header: "Prescription type", cell: (s) => s.prescriptionType },
  { header: "Status", cell: (s) => <ActiveBadge active={s.isActive} /> },
];

type Editing =
  { mode: "closed" } | { mode: "create" } | { mode: "edit"; item: Speciality };

export function SpecialityListView() {
  const p = useListParams();
  const search = p.get("search");
  const isActive = p.get("isActive");
  const [editing, setEditing] = useState<Editing>({ mode: "closed" });

  const params = { page: p.page, limit: 20, search, isActive };
  const { data, error, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["specialities", params],
    queryFn: () =>
      api<Paginated<Speciality>>("admin/speciality", { query: params }),
    placeholderData: (prev) => prev,
  });
  const close = () => setEditing({ mode: "closed" });

  return (
    <>
      <PageHeader
        title="Specialities"
        description="Medical specialities doctors can belong to"
        actions={
          <Button onClick={() => setEditing({ mode: "create" })}>
            <Plus className="size-4" aria-hidden />
            New speciality
          </Button>
        }
      />
      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-zinc-200 p-4">
          <SearchInput
            value={search}
            onChange={(v) => p.set({ search: v })}
            placeholder="Search specialities"
          />
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
          onRowClick={(item) => setEditing({ mode: "edit", item })}
          empty={{ title: "No specialities found" }}
        />
        {data && (
          <Pagination meta={data.meta} onPage={(page) => p.set({ page })} />
        )}
      </Card>
      <Modal
        open={editing.mode !== "closed"}
        title={editing.mode === "edit" ? "Edit speciality" : "New speciality"}
        onClose={close}
      >
        {editing.mode !== "closed" && (
          <SpecialityForm
            speciality={editing.mode === "edit" ? editing.item : null}
            onDone={close}
          />
        )}
      </Modal>
    </>
  );
}
