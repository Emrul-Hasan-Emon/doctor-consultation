"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Upload } from "lucide-react";
import { ActiveBadge, Badge } from "@/components/ui/badge";
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
import type { Medicine, Paginated } from "@/lib/types";
import { MedicineForm } from "./medicine-form";
import { MedicineImport } from "./medicine-import";

const columns: Column<Medicine>[] = [
  {
    header: "Brand",
    cell: (m) => <span className="font-medium">{m.brandName}</span>,
  },
  { header: "Generic", cell: (m) => m.genericName },
  { header: "Strength", cell: (m) => m.strength ?? "" },
  { header: "Dosage form", cell: (m) => m.dosage },
  { header: "Manufacturer", cell: (m) => m.manufacturer },
  {
    header: "Chronic",
    cell: (m) => (m.isChronic ? <Badge tone="amber">Chronic</Badge> : ""),
  },
  { header: "Status", cell: (m) => <ActiveBadge active={m.isActive} /> },
];

type Dialog =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; item: Medicine }
  | { mode: "import" };

export function MedicineListView() {
  const p = useListParams();
  const search = p.get("search");
  const isActive = p.get("isActive");
  const isChronic = p.get("isChronic");
  const [dialog, setDialog] = useState<Dialog>({ mode: "closed" });

  const params = { page: p.page, limit: 20, search, isActive, isChronic };
  const { data, error, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["medicines", params],
    queryFn: () =>
      api<Paginated<Medicine>>("admin/medicine", { query: params }),
    placeholderData: (prev) => prev,
  });
  const close = () => setDialog({ mode: "closed" });
  const formOpen = dialog.mode === "create" || dialog.mode === "edit";

  return (
    <>
      <PageHeader
        title="Medicines"
        description="Medicine catalog used when writing prescriptions"
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => setDialog({ mode: "import" })}
            >
              <Upload className="size-4" aria-hidden />
              Import
            </Button>
            <Button onClick={() => setDialog({ mode: "create" })}>
              <Plus className="size-4" aria-hidden />
              New medicine
            </Button>
          </>
        }
      />
      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-zinc-200 p-4">
          <SearchInput
            value={search}
            onChange={(v) => p.set({ search: v })}
            placeholder="Search brand or generic"
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
          <Select
            aria-label="Chronic"
            className="w-40"
            value={isChronic}
            onChange={(e) => p.set({ isChronic: e.target.value })}
          >
            <option value="">Chronic: any</option>
            <option value="true">Chronic only</option>
            <option value="false">Not chronic</option>
          </Select>
        </div>
        <DataTable
          columns={columns}
          rows={data?.items}
          rowKey={(m) => m.id}
          loading={isLoading || isFetching}
          error={error ? errorMessage(error) : null}
          onRetry={() => refetch()}
          onRowClick={(item) => setDialog({ mode: "edit", item })}
          empty={{
            title: "No medicines found",
            description: "Add one or import a CSV.",
          }}
        />
        {data && (
          <Pagination meta={data.meta} onPage={(page) => p.set({ page })} />
        )}
      </Card>
      <Modal
        open={formOpen}
        title={dialog.mode === "edit" ? "Edit medicine" : "New medicine"}
        onClose={close}
      >
        {formOpen && (
          <MedicineForm
            medicine={dialog.mode === "edit" ? dialog.item : null}
            onDone={close}
          />
        )}
      </Modal>
      <Modal
        open={dialog.mode === "import"}
        title="Import medicines"
        size="lg"
        onClose={close}
      >
        {dialog.mode === "import" && <MedicineImport onClose={close} />}
      </Modal>
    </>
  );
}
