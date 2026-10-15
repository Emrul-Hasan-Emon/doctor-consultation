"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { BilingualRow } from "@/components/forms/bilingual-fields";
import { FormError } from "@/components/forms/form-error";
import { ApiError, api, errorMessage } from "@/lib/api";
import {
  WEEKDAYS,
  bilingual,
  formatDate,
  formatMoney,
  formatTime,
  todayDhaka,
} from "@/lib/format";
import type { Chamber, DoctorScheduleOverview, OffDate } from "@/lib/types";

const schema = z.object({
  date: z.string().min(1, "Date is required"),
  reason: z.string(),
  reasonBN: z.string(),
  cancelAppointments: z.boolean(),
});
type Values = z.infer<typeof schema>;

function WeeklySummary({ chamber }: { chamber: Chamber }) {
  return (
    <div className="rounded-md border border-zinc-200 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium text-zinc-900">
            {bilingual(chamber.name, chamber.nameBN) || chamber.address}
          </p>
          <p className="text-xs text-zinc-500">
            {chamber.hospital
              ? bilingual(chamber.hospital.name, chamber.hospital.nameBN)
              : "Self chamber"}
            {!chamber.isActive && " (inactive)"}
          </p>
        </div>
        <Link
          href={`/admin/chambers/${chamber.id}`}
          className="text-sm text-teal-700 hover:underline"
        >
          Edit schedule
        </Link>
      </div>
      <ul className="divide-y divide-zinc-100 text-sm">
        {WEEKDAYS.map((w) => {
          const day = chamber.days.find((d) => d.weekday === w.value);
          const turns = day?.turns.filter((t) => t.isActive !== false) ?? [];
          return (
            <li key={w.value} className="flex gap-4 py-1.5">
              <span className="w-24 shrink-0 text-zinc-600">{w.en}</span>
              {day?.isOff || turns.length === 0 ? (
                <span className="text-zinc-400">
                  {day?.isOff ? "Off" : "No turns"}
                </span>
              ) : (
                <span className="flex flex-wrap gap-x-4 gap-y-1 text-zinc-800">
                  {turns.map((t, i) => (
                    <span key={t.id ?? i}>
                      {formatTime(t.startTime)} - {formatTime(t.endTime)} (
                      {t.maxPatients} patients, {formatMoney(t.fee)})
                    </span>
                  ))}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function AddOffDateModal({
  open,
  onClose,
  doctorId,
}: {
  open: boolean;
  onClose: () => void;
  doctorId: number;
}) {
  const toast = useToast();
  const qc = useQueryClient();
  const [conflict, setConflict] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: "",
      reason: "",
      reasonBN: "",
      cancelAppointments: false,
    },
  });

  const close = () => {
    setConflict(null);
    reset();
    onClose();
  };

  const mutation = useMutation({
    mutationFn: (v: Values) =>
      api<OffDate & { cancelledAppointments: number }>(
        `admin/schedule/doctors/${doctorId}/off-dates`,
        {
          method: "POST",
          body: {
            date: v.date,
            reason: v.reason.trim() || undefined,
            reasonBN: v.reasonBN.trim() || undefined,
            cancelAppointments: v.cancelAppointments ? true : undefined,
          },
        },
      ),
    onSuccess: async (res) => {
      await qc.invalidateQueries({ queryKey: ["doctor-schedule", doctorId] });
      toast.success(
        res.cancelledAppointments
          ? `Off date added, ${res.cancelledAppointments} appointment(s) cancelled`
          : "Off date added",
      );
      close();
    },
    onError: (e) => {
      // 409 about existing appointments (not "already off") unlocks the cancel option.
      if (
        e instanceof ApiError &&
        e.status === 409 &&
        /appointment/i.test(e.messages.join(" "))
      ) {
        setConflict(errorMessage(e));
      } else {
        setConflict(null);
      }
    },
  });

  return (
    <Modal open={open} title="Add off date" onClose={close}>
      <form
        onSubmit={handleSubmit((v) => mutation.mutate(v))}
        className="flex flex-col gap-4"
        noValidate
      >
        <Field label="Date" required error={errors.date?.message}>
          <Input
            type="date"
            min={todayDhaka()}
            invalid={!!errors.date}
            {...register("date")}
          />
        </Field>
        <BilingualRow
          en={
            <Field label="Reason">
              <Input {...register("reason")} />
            </Field>
          }
          bn={
            <Field label="Reason (Bangla)">
              <Input lang="bn" {...register("reasonBN")} />
            </Field>
          }
        />
        {conflict && (
          <div className="flex flex-col gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p>{conflict}</p>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="size-4 accent-teal-600"
                {...register("cancelAppointments")}
              />
              Cancel existing appointments on that day
            </label>
          </div>
        )}
        {!conflict && <FormError error={mutation.error} />}
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={close}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Add off date
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function DoctorScheduleTab({ doctorId }: { doctorId: number }) {
  const toast = useToast();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<OffDate | null>(null);

  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["doctor-schedule", doctorId],
    queryFn: () =>
      api<DoctorScheduleOverview>(`admin/schedule/doctors/${doctorId}`),
  });

  const remove = useMutation({
    mutationFn: (o: OffDate) =>
      api<void>(`admin/schedule/doctors/${doctorId}/off-dates/${o.id}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["doctor-schedule", doctorId] });
      toast.success("Off date removed");
      setDeleting(null);
    },
    onError: (e) => {
      toast.error(errorMessage(e));
      setDeleting(null);
    },
  });

  if (isLoading) return <Spinner />;
  if (error)
    return (
      <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
    );
  if (!data) return null;

  const columns: Column<OffDate>[] = [
    { header: "Date", cell: (o) => formatDate(o.date) },
    { header: "Reason", cell: (o) => bilingual(o.reason, o.reasonBN) },
    {
      header: "",
      className: "text-right",
      cell: (o) => (
        <Button size="sm" variant="ghost" onClick={() => setDeleting(o)}>
          Remove
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader
          title="Weekly schedule"
          description={`Consultation duration ${data.doctor.consultationDurationMinutes} minutes. Read only: edit in the chamber.`}
        />
        <CardBody className="grid gap-4 lg:grid-cols-2">
          {data.chambers.length === 0 ? (
            <p className="text-sm text-zinc-500">No chambers yet.</p>
          ) : (
            data.chambers.map((c) => <WeeklySummary key={c.id} chamber={c} />)
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Off dates"
          description="Upcoming days the doctor is unavailable"
          actions={
            <Button size="sm" onClick={() => setAdding(true)}>
              Add off date
            </Button>
          }
        />
        <DataTable
          columns={columns}
          rows={data.offDates}
          rowKey={(o) => o.id}
          empty={{ title: "No upcoming off dates" }}
        />
      </Card>

      <AddOffDateModal
        open={adding}
        onClose={() => setAdding(false)}
        doctorId={doctorId}
      />
      <ConfirmDialog
        open={!!deleting}
        title="Remove off date"
        message={
          deleting
            ? `The doctor becomes available again on ${formatDate(deleting.date)}. Appointments cancelled earlier are not restored.`
            : ""
        }
        confirmLabel="Remove"
        danger
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting)}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
