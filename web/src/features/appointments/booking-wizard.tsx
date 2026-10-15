"use client";

import { useReducer, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { DescriptionList } from "@/components/ui/description-list";
import { ErrorState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { AsyncSelect, type Option } from "@/components/forms/async-select";
import { FormError } from "@/components/forms/form-error";
import { api, ApiError, errorMessage } from "@/lib/api";
import { cn } from "@/lib/cn";
import {
  bilingual,
  formatDate,
  formatMoney,
  formatTime,
  todayDhaka,
  weekdayName,
} from "@/lib/format";
import type {
  AppointmentDetail,
  AvailabilityDay,
  ChamberListItem,
  ClosedReason,
  Paginated,
  Patient,
  SlotInfo,
  TurnAvailability,
} from "@/lib/types";
import { chamberLabel, fetchDoctorOptions } from "./shared";

const WINDOW_DAYS = 30;

const CLOSED_LABEL: Record<ClosedReason, string> = {
  DOCTOR_OFF: "Doctor off",
  CHAMBER_OFF: "Chamber closed",
  NO_TURNS: "No turns",
  PAST: "Past",
  OUT_OF_WINDOW: "Too far ahead",
};

interface State {
  doctor: Option | null;
  patient: Option | null;
  chamberId: number | null;
  date: string | null;
  turnId: number | null;
  slotNumber: number | null;
}

type Action =
  | { type: "doctor"; doctor: Option | null }
  | { type: "patient"; patient: Option | null }
  | { type: "chamber"; chamberId: number }
  | { type: "date"; date: string; turnId: number | null }
  | { type: "turn"; turnId: number }
  | { type: "slot"; slotNumber: number | null };

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "doctor":
      return {
        doctor: a.doctor,
        patient: null,
        chamberId: null,
        date: null,
        turnId: null,
        slotNumber: null,
      };
    case "patient":
      // The patient does not affect chamber, date or turn availability.
      return { ...s, patient: a.patient };
    case "chamber":
      return {
        ...s,
        chamberId: a.chamberId,
        date: null,
        turnId: null,
        slotNumber: null,
      };
    case "date":
      return { ...s, date: a.date, turnId: a.turnId, slotNumber: null };
    case "turn":
      return { ...s, turnId: a.turnId, slotNumber: null };
    case "slot":
      return { ...s, slotNumber: a.slotNumber };
  }
}

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const num = (v: string | null) => {
  const n = Number(v);
  return v && Number.isInteger(n) && n > 0 ? n : null;
};

const isOpenTurn = (t: TurnAvailability) => t.remaining > 0;

function StepSection({
  index,
  title,
  done,
  locked,
  children,
}: {
  index: number;
  title: string;
  done: boolean;
  locked: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card className={cn(locked && "opacity-60")}>
      <CardHeader
        title={`${index}. ${title}`}
        actions={done ? <Badge tone="green">Done</Badge> : undefined}
      />
      <CardBody>
        {locked ? (
          <p className="text-sm text-zinc-500">
            Complete the previous step first.
          </p>
        ) : (
          children
        )}
      </CardBody>
    </Card>
  );
}

export function BookingWizard() {
  const router = useRouter();
  const sp = useSearchParams();
  const qc = useQueryClient();
  const toast = useToast();

  const [state, dispatch] = useReducer(reducer, undefined, (): State => {
    const doctorId = num(sp.get("doctorId"));
    const chamberId = doctorId ? num(sp.get("chamberId")) : null;
    const date = chamberId ? sp.get("date") : null;
    const turnId = date ? num(sp.get("turnId")) : null;
    return {
      doctor: doctorId ? { id: doctorId, label: `Doctor #${doctorId}` } : null,
      patient: null,
      chamberId,
      date: date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null,
      turnId,
      slotNumber: turnId ? num(sp.get("slotNumber")) : null,
    };
  });
  const [slotConflict, setSlotConflict] = useState<string | null>(null);

  const doctorId = state.doctor?.id ?? null;

  // Resolves the real label when the doctor came from the URL.
  const doctorInfo = useQuery({
    queryKey: ["doctor-brief", doctorId],
    queryFn: () =>
      api<{ id: number; name: string; nameBN: string | null }>(
        `admin/doctor/${doctorId}`,
      ),
    enabled: !!doctorId,
    staleTime: 60_000,
  });
  const doctor: Option | null = state.doctor
    ? {
        ...state.doctor,
        label: doctorInfo.data
          ? bilingual(doctorInfo.data.name, doctorInfo.data.nameBN)
          : state.doctor.label,
      }
    : null;

  const chambersQ = useQuery({
    queryKey: ["chambers", "active-for-doctor", doctorId],
    queryFn: () =>
      api<Paginated<ChamberListItem>>("admin/chamber", {
        query: { doctorId, isActive: true, limit: 100 },
      }),
    enabled: !!doctorId,
  });
  const chamber =
    chambersQ.data?.items.find((c) => c.id === state.chamberId) ?? null;

  const today = todayDhaka();
  const availQ = useQuery({
    queryKey: ["appointment-availability", doctorId, state.chamberId, today],
    queryFn: () =>
      api<{ days: AvailabilityDay[] }>("admin/appointment/availability", {
        query: {
          doctorId,
          chamberId: state.chamberId,
          from: today,
          to: addDays(today, WINDOW_DAYS - 1),
        },
      }),
    enabled: !!doctorId && !!chamber,
  });
  const days = availQ.data?.days;
  const day = days?.find((d) => d.date === state.date) ?? null;
  const dayBookable = !!day && day.isOpen && day.turns.some(isOpenTurn);
  const turn =
    dayBookable && day
      ? (day.turns.find((t) => t.turnId === state.turnId && isOpenTurn(t)) ??
        null)
      : null;

  const slotsQ = useQuery({
    queryKey: ["appointment-slots", turn?.turnId, state.date],
    queryFn: () =>
      api<{ slots: SlotInfo[] }>("admin/appointment/slots", {
        query: { turnId: turn?.turnId, date: state.date },
      }),
    enabled: !!turn && !!state.date,
  });
  const slots = slotsQ.data?.slots;
  const firstFree = slots?.find((s) => s.status === "FREE") ?? null;
  const chosen =
    slots?.find(
      (s) => s.slotNumber === state.slotNumber && s.status === "FREE",
    ) ?? firstFree;

  const patientDone = !!state.patient;
  const stepDone = [
    !!doctor,
    patientDone,
    !!chamber,
    !!dayBookable,
    !!turn,
    !!chosen,
  ];
  const titles = ["Doctor", "Patient", "Chamber", "Date", "Turn", "Slot"];
  const currentStep = stepDone.findIndex((d) => !d);

  const book = useMutation({
    mutationFn: () =>
      api<AppointmentDetail>("admin/appointment", {
        method: "POST",
        body: {
          patientId: state.patient!.id,
          doctorId: doctorId!,
          chamberId: chamber!.id,
          turnId: turn!.turnId,
          date: state.date!,
          slotNumber: chosen!.slotNumber,
        },
      }),
    onSuccess: async (created) => {
      toast.success("Appointment booked");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["appointments"] }),
        qc.invalidateQueries({ queryKey: ["appointment-slots"] }),
        qc.invalidateQueries({ queryKey: ["appointment-availability"] }),
        qc.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
      router.push(`/admin/appointments/${created.id}`);
    },
    onError: (e) => {
      if (e instanceof ApiError && e.status === 409) {
        setSlotConflict(errorMessage(e));
        dispatch({ type: "slot", slotNumber: null });
        void qc.invalidateQueries({ queryKey: ["appointment-slots"] });
        void qc.invalidateQueries({ queryKey: ["appointment-availability"] });
      }
    },
  });

  const fetchPatients = async (search: string): Promise<Option[]> => {
    const res = await api<Paginated<Patient>>("admin/patient", {
      query: { doctorId, search, limit: 20 },
    });
    return res.items.map((p) => ({
      id: p.id,
      label: bilingual(p.name, p.nameBN),
      sublabel: p.mobile,
    }));
  };

  return (
    <>
      <PageHeader
        title="Book appointment"
        description="Book on behalf of a patient"
        back={{ href: "/admin/appointments", label: "Appointments" }}
      />

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav
          aria-label="Booking steps"
          className="lg:sticky lg:top-4 lg:self-start"
        >
          <ol className="flex flex-wrap gap-3 lg:flex-col">
            {titles.map((t, i) => {
              const done = stepDone[i];
              const current = i === currentStep;
              return (
                <li
                  key={t}
                  aria-current={current ? "step" : undefined}
                  className="flex items-center gap-2 text-sm"
                >
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full text-xs font-medium",
                      done
                        ? "bg-teal-600 text-white"
                        : current
                          ? "border-2 border-teal-600 text-teal-700"
                          : "border border-zinc-300 text-zinc-400",
                    )}
                  >
                    {done ? <Check className="size-3.5" aria-hidden /> : i + 1}
                  </span>
                  <span
                    className={cn(
                      done || current ? "text-zinc-900" : "text-zinc-400",
                      current && "font-medium",
                    )}
                  >
                    {t}
                  </span>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="space-y-6">
          <StepSection
            index={1}
            title="Doctor"
            done={stepDone[0]}
            locked={false}
          >
            <AsyncSelect
              cacheKey="booking-doctor"
              fetchOptions={fetchDoctorOptions}
              placeholder="Select a doctor"
              value={doctor}
              onChange={(o) => {
                setSlotConflict(null);
                dispatch({ type: "doctor", doctor: o });
              }}
            />
          </StepSection>

          <StepSection
            index={2}
            title="Patient"
            done={stepDone[1]}
            locked={!stepDone[0]}
          >
            <div className="space-y-2">
              <AsyncSelect
                key={doctorId ?? "none"}
                cacheKey={`booking-patient-${doctorId}`}
                fetchOptions={fetchPatients}
                placeholder="Search by name or mobile"
                value={state.patient}
                onChange={(o) => dispatch({ type: "patient", patient: o })}
              />
              <p className="text-xs text-zinc-500">
                Only patients linked to this doctor can be booked.{" "}
                <Link
                  href="/admin/patients/new"
                  className="text-teal-700 hover:underline"
                >
                  Add a new patient
                </Link>{" "}
                and link them to the doctor first if they are missing.
              </p>
            </div>
          </StepSection>

          <StepSection
            index={3}
            title="Chamber"
            done={stepDone[2]}
            locked={!stepDone[0]}
          >
            {chambersQ.isLoading ? (
              <Spinner />
            ) : chambersQ.error ? (
              <ErrorState
                message={errorMessage(chambersQ.error)}
                onRetry={() => chambersQ.refetch()}
              />
            ) : chambersQ.data?.items.length === 0 ? (
              <p className="text-sm text-zinc-500">
                This doctor has no active chambers.
              </p>
            ) : (
              <div
                role="radiogroup"
                aria-label="Chamber"
                className="grid gap-3 sm:grid-cols-2"
              >
                {chambersQ.data?.items.map((c) => {
                  const selected = c.id === state.chamberId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => {
                        setSlotConflict(null);
                        dispatch({ type: "chamber", chamberId: c.id });
                      }}
                      className={cn(
                        "rounded-lg border p-4 text-left text-sm transition-colors",
                        selected
                          ? "border-teal-600 bg-teal-50 ring-1 ring-teal-600"
                          : "border-zinc-200 hover:border-zinc-400",
                      )}
                    >
                      <p className="font-medium text-zinc-900">
                        {chamberLabel(c)}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {c.chamberType === "SELF" ? "Own chamber" : "Hospital"}
                        {c.hospital ? ` · ${c.hospital.name}` : ""}
                      </p>
                      <p className="mt-1 text-zinc-600">{c.address}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </StepSection>

          <StepSection
            index={4}
            title="Date"
            done={stepDone[3]}
            locked={!stepDone[2]}
          >
            {availQ.isLoading ? (
              <Spinner />
            ) : availQ.error ? (
              <ErrorState
                message={errorMessage(availQ.error)}
                onRetry={() => availQ.refetch()}
              />
            ) : (
              <div
                role="radiogroup"
                aria-label="Date"
                className="flex gap-2 overflow-x-auto pb-2"
              >
                {days?.map((d) => {
                  const open = d.isOpen && d.turns.some(isOpenTurn);
                  const reason = !d.isOpen
                    ? d.closedReason
                      ? CLOSED_LABEL[d.closedReason]
                      : "Closed"
                    : open
                      ? null
                      : "Fully booked";
                  const selected = d.date === state.date;
                  const dt = new Date(`${d.date}T00:00:00Z`);
                  return (
                    <button
                      key={d.date}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={!open}
                      title={reason ?? undefined}
                      onClick={() => {
                        setSlotConflict(null);
                        const openTurns = d.turns.filter(isOpenTurn);
                        dispatch({
                          type: "date",
                          date: d.date,
                          turnId:
                            openTurns.length === 1 ? openTurns[0].turnId : null,
                        });
                      }}
                      className={cn(
                        "flex w-20 shrink-0 flex-col items-center rounded-lg border px-2 py-2 text-xs",
                        selected
                          ? "border-teal-600 bg-teal-600 text-white"
                          : open
                            ? "border-zinc-200 hover:border-zinc-400"
                            : "cursor-not-allowed border-zinc-100 bg-zinc-50 text-zinc-400",
                      )}
                    >
                      <span>{weekdayName(d.weekday).slice(0, 3)}</span>
                      <span className="text-lg font-semibold">
                        {dt.getUTCDate()}
                      </span>
                      <span>
                        {dt.toLocaleDateString("en-GB", {
                          month: "short",
                          timeZone: "UTC",
                        })}
                      </span>
                      <span className="mt-1 h-4 text-center text-[10px] leading-tight">
                        {reason}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            {state.date && days && !dayBookable && (
              <p className="mt-2 text-sm text-amber-700">
                {formatDate(state.date)} is not available for this chamber. Pick
                another date.
              </p>
            )}
          </StepSection>

          <StepSection
            index={5}
            title="Turn"
            done={stepDone[4]}
            locked={!stepDone[3]}
          >
            <div
              role="radiogroup"
              aria-label="Turn"
              className="grid gap-3 sm:grid-cols-2"
            >
              {day?.turns.map((t) => {
                const selected = t.turnId === state.turnId;
                const open = isOpenTurn(t);
                return (
                  <button
                    key={t.turnId}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    disabled={!open}
                    onClick={() => {
                      setSlotConflict(null);
                      dispatch({ type: "turn", turnId: t.turnId });
                    }}
                    className={cn(
                      "rounded-lg border p-4 text-left text-sm",
                      selected
                        ? "border-teal-600 bg-teal-50 ring-1 ring-teal-600"
                        : open
                          ? "border-zinc-200 hover:border-zinc-400"
                          : "cursor-not-allowed border-zinc-100 bg-zinc-50 text-zinc-400",
                    )}
                  >
                    <p className="font-medium">
                      {formatTime(t.startTime)} - {formatTime(t.endTime)}
                    </p>
                    <p className="mt-0.5 text-xs">
                      {formatMoney(t.fee)} ·{" "}
                      {open
                        ? `${t.remaining} of ${t.capacity} seats left`
                        : "Full"}
                    </p>
                  </button>
                );
              })}
            </div>
          </StepSection>

          <StepSection
            index={6}
            title="Slot"
            done={stepDone[5]}
            locked={!stepDone[4]}
          >
            {slotsQ.isLoading ? (
              <Spinner />
            ) : slotsQ.error ? (
              <ErrorState
                message={errorMessage(slotsQ.error)}
                onRetry={() => slotsQ.refetch()}
              />
            ) : (
              <>
                {!firstFree && (
                  <p className="mb-3 text-sm text-amber-700">
                    No free slots left in this turn.
                  </p>
                )}
                {firstFree && state.slotNumber === null && (
                  <p className="mb-3 text-sm text-zinc-500">
                    First available slot is selected. Pick another if needed.
                  </p>
                )}
                <div
                  role="radiogroup"
                  aria-label="Slot"
                  className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6"
                >
                  {slots?.map((s) => {
                    const free = s.status === "FREE";
                    const selected = chosen?.slotNumber === s.slotNumber;
                    return (
                      <button
                        key={s.slotNumber}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        disabled={!free}
                        title={
                          s.status === "BOOKED"
                            ? "Already booked"
                            : s.status === "PAST"
                              ? "Time has passed"
                              : undefined
                        }
                        onClick={() => {
                          setSlotConflict(null);
                          dispatch({ type: "slot", slotNumber: s.slotNumber });
                        }}
                        className={cn(
                          "rounded-md border px-2 py-2 text-center text-sm",
                          selected
                            ? "border-teal-600 bg-teal-600 text-white"
                            : free
                              ? "border-zinc-300 hover:border-teal-600"
                              : "cursor-not-allowed border-zinc-100 bg-zinc-50 text-zinc-400 line-through",
                        )}
                      >
                        {formatTime(s.startTime)}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </StepSection>

          <Card>
            <CardHeader title="Summary" />
            <CardBody className="space-y-4">
              <DescriptionList
                items={[
                  { label: "Doctor", value: doctor?.label ?? "" },
                  {
                    label: "Patient",
                    value: state.patient
                      ? `${state.patient.label}${state.patient.sublabel ? ` (${state.patient.sublabel})` : ""}`
                      : "",
                  },
                  {
                    label: "Chamber",
                    value: chamber ? chamberLabel(chamber) : "",
                  },
                  {
                    label: "Date",
                    value:
                      dayBookable && state.date ? formatDate(state.date) : "",
                  },
                  {
                    label: "Time",
                    value: chosen
                      ? `${formatTime(chosen.startTime)} - ${formatTime(chosen.endTime)}`
                      : "",
                  },
                  { label: "Fee", value: turn ? formatMoney(turn.fee) : "" },
                ]}
              />
              {slotConflict && (
                <div
                  role="alert"
                  className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
                >
                  {slotConflict} The slot list was refreshed, please pick
                  another slot.
                </div>
              )}
              {!(
                book.error instanceof ApiError && book.error.status === 409
              ) && <FormError error={book.error} />}
              <div className="flex justify-end">
                <Button
                  disabled={stepDone.some((d) => !d)}
                  loading={book.isPending}
                  onClick={() => {
                    setSlotConflict(null);
                    book.mutate();
                  }}
                >
                  Confirm booking
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
