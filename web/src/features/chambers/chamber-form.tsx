"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { AsyncSelect, type Option } from "@/components/forms/async-select";
import { BilingualRow } from "@/components/forms/bilingual-fields";
import { FormError } from "@/components/forms/form-error";
import { useDistricts, useDivisions } from "@/components/forms/select-options";
import { api, errorMessage } from "@/lib/api";
import type { Chamber, Doctor, DoctorOption, Ref } from "@/lib/types";
import { ScheduleEditor } from "./schedule-editor";
import {
  emptyDays,
  toDrafts,
  toPayloadDays,
  validateSchedule,
  type DayDraft,
} from "./schedule-utils";

const optionSchema = z.object({
  id: z.number(),
  label: z.string(),
  sublabel: z.string().nullish(),
});

const schema = z
  .object({
    doctor: optionSchema.nullable(),
    name: z.string(),
    nameBN: z.string(),
    chamberType: z.enum(["SELF", "HOSPITAL"]),
    hospital: optionSchema.nullable(),
    divisionId: z.string().min(1, "Division is required"),
    districtId: z.string().min(1, "District is required"),
    address: z.string().trim().min(1, "Address is required"),
    addressBN: z.string(),
    description: z.string(),
    descriptionBN: z.string(),
    advanceBookingDays: z
      .string()
      .refine(
        (v) => /^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 365,
        "Enter a number from 1 to 365",
      ),
    isActive: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (!v.doctor)
      ctx.addIssue({
        code: "custom",
        path: ["doctor"],
        message: "Doctor is required",
      });
    if (v.chamberType === "HOSPITAL" && !v.hospital)
      ctx.addIssue({
        code: "custom",
        path: ["hospital"],
        message: "Hospital is required for a hospital chamber",
      });
  });

type FormValues = z.infer<typeof schema>;

const blankToNull = (v: string) => (v.trim() === "" ? null : v.trim());

const searchHospitals = async (search: string): Promise<Option[]> => {
  const list = await api<Ref[]>("admin/hospital/options", {
    query: { search },
  });
  const q = search.trim().toLowerCase();
  return list
    .filter(
      (h) =>
        !q ||
        h.name.toLowerCase().includes(q) ||
        (h.nameBN ?? "").toLowerCase().includes(q),
    )
    .map((h) => ({ id: h.id, label: h.name, sublabel: h.nameBN }));
};

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

function defaultsFor(chamber?: Chamber, doctor?: Option | null): FormValues {
  return {
    doctor: chamber
      ? { id: chamber.doctor.id, label: chamber.doctor.name }
      : (doctor ?? null),
    name: chamber?.name ?? "",
    nameBN: chamber?.nameBN ?? "",
    chamberType: chamber?.chamberType ?? "SELF",
    hospital: chamber?.hospital
      ? { id: chamber.hospital.id, label: chamber.hospital.name }
      : null,
    divisionId: chamber ? String(chamber.divisionId) : "",
    districtId: chamber ? String(chamber.districtId) : "",
    address: chamber?.address ?? "",
    addressBN: chamber?.addressBN ?? "",
    description: chamber?.description ?? "",
    descriptionBN: chamber?.descriptionBN ?? "",
    advanceBookingDays: String(chamber?.advanceBookingDays ?? 30),
    isActive: chamber?.isActive ?? true,
  };
}

function basicBody(v: FormValues) {
  return {
    chamberType: v.chamberType,
    hospitalId: v.chamberType === "HOSPITAL" ? v.hospital?.id : null,
    name: blankToNull(v.name),
    nameBN: blankToNull(v.nameBN),
    divisionId: Number(v.divisionId),
    districtId: Number(v.districtId),
    address: v.address.trim(),
    addressBN: blankToNull(v.addressBN),
    description: blankToNull(v.description),
    descriptionBN: blankToNull(v.descriptionBN),
    advanceBookingDays: Number(v.advanceBookingDays),
    isActive: v.isActive,
  };
}

export function ChamberFormView({
  chamberId,
  doctorId,
}: {
  chamberId?: number;
  doctorId?: number;
}) {
  const chamberQuery = useQuery({
    queryKey: ["chamber", chamberId],
    queryFn: () => api<Chamber>(`admin/chamber/${chamberId}`),
    enabled: chamberId !== undefined,
  });
  const prefill = useQuery({
    queryKey: ["doctor", doctorId],
    queryFn: () => api<Doctor>(`admin/doctor/${doctorId}`),
    enabled: chamberId === undefined && doctorId !== undefined,
  });

  if (chamberId !== undefined) {
    if (chamberQuery.error)
      return (
        <ErrorState
          message={errorMessage(chamberQuery.error)}
          onRetry={() => chamberQuery.refetch()}
        />
      );
    if (!chamberQuery.data) return <Spinner />;
    return <ChamberForm chamber={chamberQuery.data} />;
  }
  if (doctorId !== undefined && prefill.isLoading) return <Spinner />;
  return (
    <ChamberForm
      initialDoctor={
        prefill.data ? { id: prefill.data.id, label: prefill.data.name } : null
      }
    />
  );
}

function ChamberForm({
  chamber,
  initialDoctor,
}: {
  chamber?: Chamber;
  initialDoctor?: Option | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const isEdit = !!chamber;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultsFor(chamber, initialDoctor),
  });
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = form;
  const chamberType = useWatch({ control, name: "chamberType" });
  const divisionId = useWatch({ control, name: "divisionId" });
  const doctor = useWatch({ control, name: "doctor" });

  const divisions = useDivisions();
  const districts = useDistricts(divisionId ? Number(divisionId) : null);

  const doctorDetail = useQuery({
    queryKey: ["doctor", doctor?.id],
    queryFn: () => api<Doctor>(`admin/doctor/${doctor?.id}`),
    enabled: !!doctor?.id,
  });
  const defaultSlot = doctorDetail.data?.consultationDurationMinutes ?? null;

  // Weekly schedule: part of this page on create, saved separately on edit.
  const [days, setDays] = useState<DayDraft[]>(
    chamber ? toDrafts(chamber.days) : emptyDays(),
  );
  const [showScheduleErrors, setShowScheduleErrors] = useState(false);
  const [scheduleVersion, setScheduleVersion] = useState(0);
  const { errors: scheduleErrors, valid: scheduleValid } = validateSchedule(
    days,
    defaultSlot,
  );

  const [confirmDelete, setConfirmDelete] = useState(false);

  const create = useMutation({
    mutationFn: (v: FormValues) =>
      api<Chamber>("admin/chamber", {
        method: "POST",
        body: {
          ...basicBody(v),
          doctorId: v.doctor?.id,
          hospitalId: v.chamberType === "HOSPITAL" ? v.hospital?.id : undefined,
          days: toPayloadDays(days),
        },
      }),
    onSuccess: async (created) => {
      await qc.invalidateQueries({ queryKey: ["chambers"] });
      qc.invalidateQueries({ queryKey: ["doctor"] });
      toast.success("Chamber created");
      router.push(`/admin/chambers/${created.id}/edit`);
    },
  });

  const update = useMutation({
    mutationFn: (v: FormValues) =>
      api<Chamber>(`admin/chamber/${chamber?.id}`, {
        method: "PATCH",
        body: basicBody(v),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["chambers"] });
      await qc.invalidateQueries({ queryKey: ["chamber", chamber?.id] });
      toast.success("Chamber saved");
    },
  });

  const saveSchedule = useMutation({
    mutationFn: () =>
      api<Chamber>(`admin/chamber/${chamber?.id}/schedule`, {
        method: "PUT",
        body: { days: toPayloadDays(days) },
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["chambers"] });
      await qc.invalidateQueries({ queryKey: ["chamber", chamber?.id] });
      qc.invalidateQueries({ queryKey: ["schedule"] });
      toast.success("Schedule saved");
      setShowScheduleErrors(false);
      setScheduleVersion((v) => v + 1);
    },
  });

  // After a save the server assigns ids to new turns: reload drafts from it.
  const [syncedVersion, setSyncedVersion] = useState(0);
  if (chamber && scheduleVersion !== syncedVersion) {
    setSyncedVersion(scheduleVersion);
    setDays(toDrafts(chamber.days));
  }

  const remove = useMutation({
    mutationFn: () =>
      api<void>(`admin/chamber/${chamber?.id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["chambers"] });
      qc.invalidateQueries({ queryKey: ["schedule"] });
      toast.success("Chamber deleted");
      router.push("/admin/chambers");
    },
  });

  const onSubmit = handleSubmit((v) => {
    if (isEdit) {
      update.mutate(v);
      return;
    }
    if (!scheduleValid) {
      setShowScheduleErrors(true);
      toast.error("Fix the weekly schedule errors first");
      return;
    }
    create.mutate(v);
  });

  const onSaveSchedule = () => {
    if (!scheduleValid) {
      setShowScheduleErrors(true);
      return;
    }
    saveSchedule.mutate();
  };

  const pending = create.isPending || update.isPending;

  return (
    <>
      <PageHeader
        title={isEdit ? (chamber.name ?? "Unnamed chamber") : "Add chamber"}
        description={
          isEdit
            ? `${chamber.doctor.name}${chamber.hospital ? ` at ${chamber.hospital.name}` : ""}`
            : "Create a chamber and its weekly schedule"
        }
        back={{ href: "/admin/chambers", label: "Chambers" }}
        actions={
          isEdit ? (
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              Delete chamber
            </Button>
          ) : undefined
        }
      />

      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <Card>
          <CardHeader title="Basic info" />
          <CardBody className="space-y-4">
            <Field label="Doctor" required error={errors.doctor?.message}>
              <Controller
                control={control}
                name="doctor"
                render={({ field }) => (
                  <AsyncSelect
                    cacheKey="doctor-options"
                    fetchOptions={searchDoctors}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select doctor"
                    disabled={isEdit}
                    invalid={!!errors.doctor}
                  />
                )}
              />
            </Field>

            <BilingualRow
              en={
                <Field label="Name" error={errors.name?.message}>
                  <Input {...register("name")} />
                </Field>
              }
              bn={
                <Field label="Name (Bangla)" error={errors.nameBN?.message}>
                  <Input {...register("nameBN")} />
                </Field>
              }
            />

            <fieldset>
              <legend className="mb-1 text-sm font-medium text-zinc-700">
                Chamber type<span className="ml-0.5 text-red-600">*</span>
              </legend>
              <div className="flex gap-6 text-sm">
                {(["SELF", "HOSPITAL"] as const).map((t) => (
                  <label key={t} className="flex items-center gap-2">
                    <input
                      type="radio"
                      value={t}
                      {...register("chamberType", {
                        onChange: (e) => {
                          if (e.target.value === "SELF")
                            setValue("hospital", null);
                        },
                      })}
                    />
                    {t === "SELF" ? "Self (own chamber)" : "Hospital"}
                  </label>
                ))}
              </div>
            </fieldset>

            {chamberType === "HOSPITAL" && (
              <Field label="Hospital" required error={errors.hospital?.message}>
                <Controller
                  control={control}
                  name="hospital"
                  render={({ field }) => (
                    <AsyncSelect
                      cacheKey="hospital-options"
                      fetchOptions={searchHospitals}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select hospital"
                      invalid={!!errors.hospital}
                    />
                  )}
                />
              </Field>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Division"
                required
                error={errors.divisionId?.message}
              >
                <Select
                  invalid={!!errors.divisionId}
                  {...register("divisionId", {
                    onChange: () => setValue("districtId", ""),
                  })}
                >
                  <option value="">Select division</option>
                  {divisions.data?.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label="District"
                required
                error={errors.districtId?.message}
              >
                <Select
                  disabled={!divisionId}
                  invalid={!!errors.districtId}
                  {...register("districtId")}
                >
                  <option value="">Select district</option>
                  {districts.data?.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <BilingualRow
              en={
                <Field label="Address" required error={errors.address?.message}>
                  <Input invalid={!!errors.address} {...register("address")} />
                </Field>
              }
              bn={
                <Field label="Address (Bangla)">
                  <Input {...register("addressBN")} />
                </Field>
              }
            />
            <BilingualRow
              en={
                <Field label="Description">
                  <Textarea {...register("description")} />
                </Field>
              }
              bn={
                <Field label="Description (Bangla)">
                  <Textarea {...register("descriptionBN")} />
                </Field>
              }
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Advance booking days"
                required
                hint="How many days ahead patients can book (1-365)"
                error={errors.advanceBookingDays?.message}
              >
                <Input
                  type="number"
                  min={1}
                  max={365}
                  invalid={!!errors.advanceBookingDays}
                  {...register("advanceBookingDays")}
                />
              </Field>
              <label className="flex items-center gap-2 self-end pb-2 text-sm text-zinc-700">
                <input type="checkbox" {...register("isActive")} />
                Active
              </label>
            </div>

            <FormError error={create.error ?? update.error} />
            {isEdit && (
              <div className="flex justify-end">
                <Button type="submit" loading={pending}>
                  Save changes
                </Button>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Weekly schedule"
            description={
              defaultSlot
                ? `Slot duration defaults to the doctor's ${defaultSlot} minutes when left blank.`
                : "Pick a doctor to see the default slot duration."
            }
            actions={
              isEdit ? (
                <Button
                  onClick={onSaveSchedule}
                  loading={saveSchedule.isPending}
                >
                  Save schedule
                </Button>
              ) : undefined
            }
          />
          {saveSchedule.error && (
            <div className="px-5 pt-4">
              <div
                role="alert"
                className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
              >
                {errorMessage(saveSchedule.error)}
              </div>
            </div>
          )}
          <ScheduleEditor
            days={days}
            onChange={setDays}
            defaultSlot={defaultSlot}
            errors={scheduleErrors}
            showErrors={showScheduleErrors}
          />
        </Card>

        {!isEdit && (
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => router.push("/admin/chambers")}
            >
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              Create chamber
            </Button>
          </div>
        )}
      </form>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete chamber"
        danger
        confirmLabel="Delete chamber"
        loading={remove.isPending}
        message={
          <>
            <p>
              This soft-deletes the chamber and removes it from booking. It is
              refused when future scheduled appointments exist.
            </p>
            <FormError error={remove.error} />
          </>
        }
        onConfirm={() => remove.mutate()}
        onClose={() => setConfirmDelete(false)}
      />
    </>
  );
}
