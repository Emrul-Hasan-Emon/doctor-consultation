"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, errorMessage } from "@/lib/api";
import { bilingual, formatDate, formatTime } from "@/lib/format";
import type { AppointmentListItem, DashboardSummary } from "@/lib/types";

function Stat({
  label,
  value,
  href,
}: {
  label: string;
  value: number | string;
  href?: string;
}) {
  const body = (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-zinc-900">{value}</p>
    </div>
  );
  return href ? (
    <Link href={href} className="block hover:opacity-90">
      {body}
    </Link>
  ) : (
    body
  );
}

const columns: Column<AppointmentListItem>[] = [
  {
    header: "Date",
    cell: (a) =>
      `${formatDate(a.appointmentDate)} ${formatTime(a.slotStartTime)}`,
  },
  {
    header: "Patient",
    cell: (a) => (
      <Link
        className="text-teal-700 hover:underline"
        href={`/admin/appointments/${a.id}`}
      >
        {a.patient.name}
      </Link>
    ),
  },
  { header: "Doctor", cell: (a) => bilingual(a.doctor.name, a.doctor.nameBN) },
  { header: "Status", cell: (a) => <StatusBadge status={a.status} /> },
];

export function DashboardView() {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api<DashboardSummary>("admin/appointment/summary"),
  });

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of the platform"
        actions={
          <Link href="/admin/appointments/new">
            <Button>Book appointment</Button>
          </Link>
        }
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label="Doctors"
          value={data?.doctors ?? "-"}
          href="/admin/doctors"
        />
        <Stat
          label="Patients"
          value={data?.patients ?? "-"}
          href="/admin/patients"
        />
        <Stat
          label="Hospitals"
          value={data?.hospitals ?? "-"}
          href="/admin/hospitals"
        />
        <Stat
          label="Active chambers"
          value={data?.activeChambers ?? "-"}
          href="/admin/chambers"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Today" />
          <CardBody className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-zinc-500">Total</p>
              <p className="text-xl font-semibold">
                {data?.today.total ?? "-"}
              </p>
            </div>
            <div>
              <p className="text-zinc-500">Scheduled</p>
              <p className="text-xl font-semibold">
                {data?.today.scheduled ?? "-"}
              </p>
            </div>
            <div>
              <p className="text-zinc-500">Completed</p>
              <p className="text-xl font-semibold">
                {data?.today.completed ?? "-"}
              </p>
            </div>
            <div>
              <p className="text-zinc-500">Cancelled / no show</p>
              <p className="text-xl font-semibold">
                {data ? data.today.cancelled + data.today.noShow : "-"}
              </p>
            </div>
            <div className="col-span-2 border-t border-zinc-100 pt-3">
              <p className="text-zinc-500">Next 7 days</p>
              <p className="text-xl font-semibold">{data?.next7Days ?? "-"}</p>
            </div>
          </CardBody>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader
            title="Latest bookings"
            actions={
              <Link
                href="/admin/appointments"
                className="text-sm text-teal-700 hover:underline"
              >
                View all
              </Link>
            }
          />
          <DataTable
            columns={columns}
            rows={data?.recent}
            rowKey={(a) => a.id}
            loading={isLoading}
            error={error ? errorMessage(error) : null}
            onRetry={() => refetch()}
            empty={{ title: "No appointments yet" }}
          />
        </Card>
      </div>
    </>
  );
}
