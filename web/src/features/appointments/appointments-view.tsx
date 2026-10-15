"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { AsyncSelect } from "@/components/forms/async-select";
import { api, errorMessage } from "@/lib/api";
import { useListParams } from "@/lib/use-list-params";
import {
  STATUS_LABEL,
  bilingual,
  formatDate,
  formatMoney,
  formatTime,
  todayDhaka,
} from "@/lib/format";
import type {
  AppointmentListItem,
  AppointmentStatus,
  Paginated,
} from "@/lib/types";
import { chamberLabel, fetchDoctorOptions } from "./shared";

const LIMIT = 20;

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Week runs Saturday to Friday, matching the portal's weekday numbering. */
function weekRange(today: string): { from: string; to: string } {
  const dow = new Date(`${today}T00:00:00Z`).getUTCDay();
  const since = (dow + 1) % 7;
  const from = addDays(today, -since);
  return { from, to: addDays(from, 6) };
}

const columns: Column<AppointmentListItem>[] = [
  {
    header: "Date and time",
    cell: (a) => (
      <div>
        <p className="font-medium">{formatDate(a.appointmentDate)}</p>
        <p className="text-xs text-zinc-500">
          {formatTime(a.slotStartTime)} - {formatTime(a.slotEndTime)}
        </p>
      </div>
    ),
  },
  {
    header: "Patient",
    cell: (a) => (
      <div>
        <p>{bilingual(a.patient.name, a.patient.nameBN)}</p>
        <p className="text-xs text-zinc-500">{a.patient.mobile}</p>
      </div>
    ),
  },
  { header: "Doctor", cell: (a) => bilingual(a.doctor.name, a.doctor.nameBN) },
  {
    header: "Chamber",
    cell: (a) => (
      <div>
        <p>{chamberLabel(a.chamber)}</p>
        {a.chamber.hospital && a.chamber.name && (
          <p className="text-xs text-zinc-500">{a.chamber.hospital.name}</p>
        )}
      </div>
    ),
  },
  { header: "Fee", cell: (a) => formatMoney(a.fee) },
  {
    header: "Category",
    cell: (a) => (
      <Badge tone={a.category === "NEW" ? "teal" : "blue"}>
        {a.category === "NEW" ? "New" : "Follow-up"}
      </Badge>
    ),
  },
  { header: "Status", cell: (a) => <StatusBadge status={a.status} /> },
];

export function AppointmentsView() {
  const router = useRouter();
  const lp = useListParams();
  const from = lp.get("from");
  const to = lp.get("to");
  const doctorId = lp.get("doctorId");
  const doctorName = lp.get("doctorName");
  const search = lp.get("search");
  const status = lp.get("status");

  const today = todayDhaka();
  const tomorrow = addDays(today, 1);
  const week = weekRange(today);
  const chips = [
    { label: "Today", from: today, to: today },
    { label: "Tomorrow", from: tomorrow, to: tomorrow },
    { label: "This week", from: week.from, to: week.to },
  ];

  const query = {
    page: lp.page,
    limit: LIMIT,
    from,
    to,
    doctorId,
    search,
    status,
  };
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["appointments", query],
    queryFn: () =>
      api<Paginated<AppointmentListItem>>("admin/appointment", { query }),
    placeholderData: (prev) => prev,
  });

  const hasFilters = !!(from || to || doctorId || search || status);

  return (
    <>
      <PageHeader
        title="Appointments"
        description="All bookings, newest first"
        actions={
          <Link href="/admin/appointments/new">
            <Button>Book appointment</Button>
          </Link>
        }
      />
      <Card>
        <div className="space-y-3 border-b border-zinc-200 p-4">
          <div className="flex flex-wrap gap-2">
            {chips.map((c) => {
              const active = from === c.from && to === c.to;
              return (
                <Button
                  key={c.label}
                  size="sm"
                  variant={active ? "primary" : "secondary"}
                  aria-pressed={active}
                  onClick={() =>
                    lp.set(
                      active
                        ? { from: null, to: null }
                        : { from: c.from, to: c.to },
                    )
                  }
                >
                  {c.label}
                </Button>
              );
            })}
            {hasFilters && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  lp.set({
                    from: null,
                    to: null,
                    doctorId: null,
                    doctorName: null,
                    search: null,
                    status: null,
                  })
                }
              >
                Clear filters
              </Button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Field label="From">
              <Input
                type="date"
                value={from}
                max={to || undefined}
                onChange={(e) => lp.set({ from: e.target.value })}
              />
            </Field>
            <Field label="To">
              <Input
                type="date"
                value={to}
                min={from || undefined}
                onChange={(e) => lp.set({ to: e.target.value })}
              />
            </Field>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-zinc-700">Doctor</span>
              <AsyncSelect
                cacheKey="appointment-filter-doctor"
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
                onChange={(o) =>
                  lp.set({
                    doctorId: o?.id ?? null,
                    doctorName: o?.label ?? null,
                  })
                }
              />
            </div>
            <Field label="Status">
              <Select
                value={status}
                onChange={(e) => lp.set({ status: e.target.value })}
              >
                <option value="">All statuses</option>
                {(Object.keys(STATUS_LABEL) as AppointmentStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-zinc-700">Patient</span>
              <SearchInput
                value={search}
                onChange={(v) => lp.set({ search: v })}
                placeholder="Patient name or mobile"
              />
            </div>
          </div>
        </div>
        <DataTable
          columns={columns}
          rows={data?.items}
          rowKey={(a) => a.id}
          loading={isLoading}
          error={error ? errorMessage(error) : null}
          onRetry={() => refetch()}
          onRowClick={(a) => router.push(`/admin/appointments/${a.id}`)}
          empty={{
            title: hasFilters
              ? "No appointments match these filters"
              : "No appointments yet",
          }}
        />
        {data && (
          <Pagination meta={data.meta} onPage={(p) => lp.set({ page: p })} />
        )}
      </Card>
    </>
  );
}
