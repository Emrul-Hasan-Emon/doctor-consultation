"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { AsyncSelect, type Option } from "@/components/forms/async-select";
import { api, errorMessage } from "@/lib/api";
import {
  bilingual,
  formatDate,
  formatMoney,
  formatTime,
  todayDhaka,
  weekdayName,
} from "@/lib/format";
import { cn } from "@/lib/cn";
import { useListParams } from "@/lib/use-list-params";
import type {
  DailyDoctor,
  DailySchedule,
  DoctorOption,
  Ref,
  TurnAvailability,
} from "@/lib/types";
import { SlotsModal, type SlotTarget } from "./slots-modal";

const searchDoctors = async (search: string): Promise<Option[]> => {
  const list = await api<DoctorOption[]>("admin/doctor/options", {
    query: { search },
  });
  return list.map((d) => ({
    id: d.id,
    label: d.name,
    sublabel: d.specialityName,
  }));
};

/** Adds days to a YYYY-MM-DD string without time zone surprises. */
function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function Occupancy({ turn }: { turn: TurnAvailability }) {
  const pct =
    turn.capacity > 0 ? Math.round((turn.booked / turn.capacity) * 100) : 0;
  const full = turn.capacity > 0 && turn.remaining <= 0;
  const color = full
    ? "bg-red-500"
    : pct >= 70
      ? "bg-amber-500"
      : "bg-emerald-500";
  return (
    <div className="min-w-40">
      <div className="flex justify-between text-xs text-zinc-600">
        <span>
          {turn.booked}/{turn.capacity} booked
        </span>
        <span>{full ? "Full" : `${turn.remaining} left`}</span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={turn.capacity}
        aria-valuenow={turn.booked}
        aria-label="Booked slots"
        className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-200"
      >
        <div
          className={cn("h-full", color)}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}

export function DailyView() {
  const p = useListParams();
  const date = p.get("date") || todayDhaka();
  const today = todayDhaka();
  const doctorId = p.get("doctorId");
  const [target, setTarget] = useState<SlotTarget | null>(null);

  const specialities = useQuery({
    queryKey: ["speciality-options"],
    queryFn: () => api<Ref[]>("admin/speciality/options"),
    staleTime: 5 * 60_000,
  });

  const params = {
    date,
    doctorId,
    specialityId: p.get("specialityId"),
    search: p.get("search"),
  };
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["schedule", "daily", params],
    queryFn: () =>
      api<DailySchedule>("admin/schedule/daily", { query: params }),
    placeholderData: (prev) => prev,
  });

  const working = data?.doctors.filter((d) => !d.offDate) ?? [];
  const turns = working.flatMap((d) =>
    d.chambers.flatMap((c) => (c.isOff ? [] : c.turns)),
  );
  const totalCapacity = turns.reduce((s, t) => s + t.capacity, 0);
  const totalBooked = turns.reduce((s, t) => s + t.booked, 0);
  const doctorsWorking = working.filter((d) =>
    d.chambers.some((c) => !c.isOff && c.turns.length > 0),
  ).length;

  return (
    <>
      <PageHeader
        title="Daily schedule"
        description={`${weekdayName(data?.weekday ?? -1)} ${formatDate(date)}`.trim()}
      />

      <Card>
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-1 sm:col-span-2 lg:col-span-4">
            <Button
              variant="secondary"
              aria-label="Previous day"
              onClick={() => p.set({ date: shiftDate(date, -1) })}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Input
              type="date"
              aria-label="Date"
              className="w-44"
              value={date}
              onChange={(e) =>
                e.target.value && p.set({ date: e.target.value })
              }
            />
            <Button
              variant="secondary"
              aria-label="Next day"
              onClick={() => p.set({ date: shiftDate(date, 1) })}
            >
              <ChevronRight className="size-4" />
            </Button>
            <Button
              variant="secondary"
              disabled={date === today}
              onClick={() => p.set({ date: null })}
            >
              Today
            </Button>
          </div>
          <SearchInput
            value={p.get("search")}
            onChange={(v) => p.set({ search: v })}
            placeholder="Search doctors"
          />
          <AsyncSelect
            cacheKey="doctor-options"
            fetchOptions={searchDoctors}
            value={
              doctorId
                ? {
                    id: Number(doctorId),
                    label: p.get("doctorName") || `Doctor #${doctorId}`,
                  }
                : null
            }
            onChange={(o) => p.set({ doctorId: o?.id, doctorName: o?.label })}
            placeholder="All doctors"
            clearable
          />
          <Select
            aria-label="Speciality"
            value={p.get("specialityId")}
            onChange={(e) => p.set({ specialityId: e.target.value })}
          >
            <option value="">All specialities</option>
            {specialities.data?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <div className="my-4 grid grid-cols-3 gap-4">
        {[
          ["Doctors working", doctorsWorking],
          ["Total capacity", totalCapacity],
          ["Total booked", totalBooked],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
          >
            <p className="text-sm text-zinc-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">
              {data ? value : "-"}
            </p>
          </div>
        ))}
      </div>

      {error && (
        <Card>
          <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
        </Card>
      )}
      {isLoading && !data && <Spinner />}
      {data && data.doctors.length === 0 && (
        <Card>
          <EmptyState
            title="No doctors scheduled"
            description="No doctor has turns or an off date on this day."
          />
        </Card>
      )}

      <div className={cn("space-y-4", isLoading && "opacity-60")}>
        {data?.doctors.map((d) => (
          <DoctorCard
            key={d.doctor.id}
            entry={d}
            onSlots={(chamberId, turn, chamberName) =>
              setTarget({
                doctorId: d.doctor.id,
                chamberId,
                turnId: turn.turnId,
                date,
                title: `${chamberName} ${formatTime(turn.startTime)} - ${formatTime(turn.endTime)}`,
              })
            }
          />
        ))}
      </div>

      <SlotsModal target={target} onClose={() => setTarget(null)} />
    </>
  );
}

function DoctorCard({
  entry,
  onSlots,
}: {
  entry: DailyDoctor;
  onSlots: (
    chamberId: number,
    turn: TurnAvailability,
    chamberName: string,
  ) => void;
}) {
  const { doctor, offDate, chambers } = entry;
  return (
    <Card>
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-zinc-200 px-5 py-4">
        <h2 className="text-base font-semibold text-zinc-900">
          {bilingual(doctor.name, doctor.nameBN)}
        </h2>
        {doctor.speciality && (
          <span className="text-sm text-zinc-500">
            {bilingual(doctor.speciality.name, doctor.speciality.nameBN)}
          </span>
        )}
      </div>
      <CardBody className="space-y-4">
        {offDate && (
          <div
            role="status"
            className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900"
          >
            <strong>Off</strong>
            {(offDate.reason || offDate.reasonBN) &&
              `: ${bilingual(offDate.reason, offDate.reasonBN)}`}
          </div>
        )}
        {chambers.map(({ chamber, isOff, turns }) => {
          const name = chamber.name || "Unnamed chamber";
          return (
            <div key={chamber.id} className="rounded-md border border-zinc-200">
              <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 bg-zinc-50 px-3 py-2 text-sm">
                <span className="font-medium">{name}</span>
                <Badge tone={chamber.chamberType === "SELF" ? "teal" : "blue"}>
                  {chamber.chamberType}
                </Badge>
                {chamber.hospital && (
                  <span className="text-zinc-600">{chamber.hospital.name}</span>
                )}
                <span className="text-zinc-500">{chamber.address}</span>
                {isOff && <Badge tone="gray">Chamber off</Badge>}
              </div>
              {turns.length === 0 ? (
                <p className="px-3 py-3 text-sm text-zinc-500">No turns.</p>
              ) : (
                <ul className="divide-y divide-zinc-100">
                  {turns.map((t) => (
                    <li
                      key={t.turnId}
                      className="flex flex-wrap items-center gap-x-6 gap-y-2 px-3 py-3 text-sm"
                    >
                      <span className="w-40 font-medium">
                        {formatTime(t.startTime)} - {formatTime(t.endTime)}
                      </span>
                      <span className="w-20">{formatMoney(t.fee)}</span>
                      <span className="w-20 text-zinc-600">
                        {t.slotDurationMinutes} min
                      </span>
                      <Occupancy turn={t} />
                      <Button
                        size="sm"
                        variant="secondary"
                        className="ml-auto"
                        onClick={() => onSlots(chamber.id, t, name)}
                      >
                        View slots
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
        {chambers.length === 0 && !offDate && (
          <p className="text-sm text-zinc-500">No chambers open this day.</p>
        )}
      </CardBody>
    </Card>
  );
}
