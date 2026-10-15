"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { DescriptionList } from "@/components/ui/description-list";
import { ErrorState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/input";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { FormError } from "@/components/forms/form-error";
import { api, errorMessage } from "@/lib/api";
import {
  STATUS_LABEL,
  bilingual,
  formatDate,
  formatDateTime,
  formatMoney,
  formatTime,
} from "@/lib/format";
import type { ActorType, AppointmentDetail } from "@/lib/types";
import { chamberLabel } from "./shared";

const ACTOR: Record<ActorType, string> = {
  ADMIN: "Admin",
  DOCTOR: "Doctor",
  DOCTOR_STAFF: "Doctor staff",
  PATIENT: "Patient",
};

const cancelSchema = z.object({
  reason: z.string().max(500, "Max 500 characters"),
});
type CancelValues = z.infer<typeof cancelSchema>;

function CancelModal({
  id,
  open,
  onClose,
}: {
  id: number;
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const toast = useToast();
  const form = useForm<CancelValues>({
    resolver: zodResolver(cancelSchema),
    defaultValues: { reason: "" },
  });
  const mutation = useMutation({
    mutationFn: (v: CancelValues) =>
      api(`admin/appointment/${id}/cancel`, {
        method: "POST",
        body: v.reason.trim() ? { reason: v.reason.trim() } : {},
      }),
    onSuccess: async () => {
      toast.success("Appointment cancelled");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["appointment", id] }),
        qc.invalidateQueries({ queryKey: ["appointments"] }),
        qc.invalidateQueries({ queryKey: ["appointment-slots"] }),
        qc.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
      form.reset();
      mutation.reset();
      onClose();
    },
  });

  return (
    <Modal open={open} title="Cancel appointment" onClose={onClose} size="sm">
      <form
        onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
        className="space-y-4"
        noValidate
      >
        <p className="text-sm text-zinc-600">
          The slot becomes free again and the appointment is marked as
          cancelled. This cannot be undone.
        </p>
        <Field
          label="Reason (optional)"
          error={form.formState.errors.reason?.message}
        >
          <Textarea
            {...form.register("reason")}
            invalid={!!form.formState.errors.reason}
          />
        </Field>
        <FormError error={mutation.error} />
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Keep appointment
          </Button>
          <Button type="submit" variant="danger" loading={mutation.isPending}>
            Cancel appointment
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function AppointmentDetailView({ id }: { id: number }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [confirm, setConfirm] = useState<"COMPLETED" | "NO_SHOW" | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["appointment", id],
    queryFn: () => api<AppointmentDetail>(`admin/appointment/${id}`),
    enabled: Number.isFinite(id),
  });

  const statusMutation = useMutation({
    mutationFn: (status: "COMPLETED" | "NO_SHOW") =>
      api(`admin/appointment/${id}/status`, {
        method: "PATCH",
        body: { status },
      }),
    onSuccess: async (_r, status) => {
      toast.success(
        status === "COMPLETED" ? "Marked as completed" : "Marked as no-show",
      );
      setConfirm(null);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["appointment", id] }),
        qc.invalidateQueries({ queryKey: ["appointments"] }),
        qc.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
    onError: (e) => {
      toast.error(errorMessage(e));
      setConfirm(null);
    },
  });

  const back = { href: "/admin/appointments", label: "Appointments" };
  if (isLoading) return <Spinner />;
  if (error || !data)
    return (
      <>
        <PageHeader title="Appointment" back={back} />
        <Card>
          <ErrorState
            message={error ? errorMessage(error) : "Not found"}
            onRetry={() => refetch()}
          />
        </Card>
      </>
    );

  const a = data;
  const scheduled = a.status === "SCHEDULED";

  return (
    <>
      <PageHeader
        title={`Appointment #${a.id}`}
        description={`${formatDate(a.appointmentDate)}, ${formatTime(a.slotStartTime)}`}
        back={back}
        actions={
          <>
            <StatusBadge status={a.status} />
            {scheduled && (
              <>
                <Button onClick={() => setConfirm("COMPLETED")}>
                  Mark completed
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setConfirm("NO_SHOW")}
                >
                  Mark no-show
                </Button>
                <Button variant="danger" onClick={() => setCancelOpen(true)}>
                  Cancel
                </Button>
              </>
            )}
          </>
        }
      />

      {a.status === "CANCELLED" && (
        <div
          role="status"
          className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <p className="font-medium">
            Cancelled
            {a.cancelledByType ? ` by ${ACTOR[a.cancelledByType]}` : ""}
            {a.cancelledAt ? ` on ${formatDateTime(a.cancelledAt)}` : ""}
          </p>
          <p className="mt-1">
            Reason: {a.cancelReason ? a.cancelReason : "No reason given"}
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Appointment" />
          <CardBody>
            <DescriptionList
              items={[
                { label: "Date", value: formatDate(a.appointmentDate) },
                {
                  label: "Slot time",
                  value: `${formatTime(a.slotStartTime)} - ${formatTime(a.slotEndTime)}`,
                },
                { label: "Duration", value: `${a.durationMinutes} min` },
                { label: "Fee", value: formatMoney(a.fee) },
                {
                  label: "Category",
                  value: (
                    <Badge tone={a.category === "NEW" ? "teal" : "blue"}>
                      {a.category === "NEW" ? "New" : "Follow-up"}
                    </Badge>
                  ),
                },
                { label: "Booked by", value: ACTOR[a.bookedByType] },
                { label: "Slot number", value: `#${a.slotNumber}` },
                { label: "Booked on", value: formatDateTime(a.createdAt) },
                {
                  label: "Completed on",
                  value: formatDateTime(a.completedAt),
                },
              ]}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Patient" />
          <CardBody>
            <DescriptionList
              items={[
                {
                  label: "Name",
                  value: (
                    <Link
                      className="text-teal-700 hover:underline"
                      href={`/admin/patients/${a.patient.id}`}
                    >
                      {bilingual(a.patient.name, a.patient.nameBN)}
                    </Link>
                  ),
                },
                { label: "Mobile", value: a.patient.mobile },
              ]}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Doctor" />
          <CardBody>
            <DescriptionList
              items={[
                {
                  label: "Name",
                  value: (
                    <Link
                      className="text-teal-700 hover:underline"
                      href={`/admin/doctors/${a.doctor.id}`}
                    >
                      {bilingual(a.doctor.name, a.doctor.nameBN)}
                    </Link>
                  ),
                },
              ]}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Chamber" />
          <CardBody>
            <DescriptionList
              items={[
                {
                  label: "Chamber",
                  value: (
                    <Link
                      className="text-teal-700 hover:underline"
                      href={`/admin/chambers/${a.chamber.id}/edit`}
                    >
                      {chamberLabel(a.chamber)}
                    </Link>
                  ),
                },
                {
                  label: "Hospital",
                  value: a.chamber.hospital
                    ? bilingual(
                        a.chamber.hospital.name,
                        a.chamber.hospital.nameBN,
                      )
                    : "",
                },
                {
                  label: "Address",
                  value: (a.chamber as { address?: string }).address ?? "",
                },
                {
                  label: "Turn",
                  value: `${formatTime(a.chamberTurn.startTime)} - ${formatTime(a.chamberTurn.endTime)}`,
                },
              ]}
            />
          </CardBody>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Status history" />
        <CardBody>
          {a.statusLog.length === 0 ? (
            <p className="text-sm text-zinc-500">No history recorded.</p>
          ) : (
            <ol className="space-y-4 border-l border-zinc-200 pl-5">
              {a.statusLog.map((l, i) => (
                <li key={i} className="relative">
                  <span
                    aria-hidden
                    className="absolute -left-[26px] top-1.5 size-2.5 rounded-full bg-teal-600"
                  />
                  <p className="text-sm font-medium text-zinc-900">
                    {l.fromStatus
                      ? `${STATUS_LABEL[l.fromStatus]} to ${STATUS_LABEL[l.toStatus]}`
                      : `Created as ${STATUS_LABEL[l.toStatus]}`}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {formatDateTime(l.createdAt)} by {ACTOR[l.actorType]} #
                    {l.actorId}
                  </p>
                  {l.reason && (
                    <p className="mt-1 text-sm text-zinc-700">{l.reason}</p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </CardBody>
      </Card>

      <ConfirmDialog
        open={confirm !== null}
        title={
          confirm === "COMPLETED" ? "Mark as completed" : "Mark as no-show"
        }
        message={
          confirm === "COMPLETED"
            ? "The visit is recorded as done. The status cannot be changed afterwards."
            : "The patient is recorded as not having turned up. The status cannot be changed afterwards."
        }
        confirmLabel={
          confirm === "COMPLETED" ? "Mark completed" : "Mark no-show"
        }
        loading={statusMutation.isPending}
        onConfirm={() => confirm && statusMutation.mutate(confirm)}
        onClose={() => setConfirm(null)}
      />
      <CancelModal
        id={id}
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
      />
    </>
  );
}
