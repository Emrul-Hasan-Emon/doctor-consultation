"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/ui/empty-state";
import { api, errorMessage } from "@/lib/api";
import type { Hospital } from "@/lib/types";
import { HospitalForm } from "./hospital-form";

export function HospitalEditView({ id }: { id: string }) {
  const { data, error, refetch } = useQuery({
    queryKey: ["hospital", id],
    queryFn: () => api<Hospital>(`admin/hospital/${id}`),
  });

  return (
    <>
      <PageHeader
        title={data ? `Edit ${data.name}` : "Edit hospital"}
        back={{ href: "/admin/hospitals", label: "Hospitals" }}
      />
      {error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      ) : !data ? (
        <Spinner />
      ) : (
        <HospitalForm hospital={data} />
      )}
    </>
  );
}
