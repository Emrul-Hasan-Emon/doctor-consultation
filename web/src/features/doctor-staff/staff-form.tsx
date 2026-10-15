"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardBody } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { AsyncSelect, type Option } from "@/components/forms/async-select";
import { BilingualRow } from "@/components/forms/bilingual-fields";
import { FormError } from "@/components/forms/form-error";
import { api, errorMessage } from "@/lib/api";
import { bilingual } from "@/lib/format";
import type { Doctor, DoctorStaff } from "@/lib/types";
import { ResetPasswordModal } from "@/features/doctors/reset-password-modal";
import { fetchDoctorOptions } from "./doctor-options";

const baseShape = {
  doctor: z.custom<Option | null>(),
  name: z.string().trim().min(1, "Name is required"),
  nameBN: z.string(),
  mobile: z.string().trim().min(1, "Mobile is required"),
  email: z
    .string()
    .trim()
    .refine((v) => v === "" || z.email().safeParse(v).success, "Invalid email"),
  password: z.string(),
  isActive: z.boolean(),
};
const createSchema = z
  .object(baseShape)
  .refine((v) => v.doctor !== null && v.doctor !== undefined, {
    path: ["doctor"],
    message: "Doctor is required",
  })
  .refine((v) => v.password.length >= 8, {
    path: ["password"],
    message: "Password must be at least 8 characters",
  });
const editSchema = z.object(baseShape);
type Values = z.infer<typeof editSchema>;

const text = (v: string) => v.trim() || null;

function StaffForm({
  staff,
  initialDoctor,
}: {
  staff?: DoctorStaff;
  initialDoctor?: Option | null;
}) {
  const edit = !!staff;
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const [resetOpen, setResetOpen] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(edit ? editSchema : createSchema),
    defaultValues: {
      doctor: staff
        ? {
            id: staff.doctor.id,
            label: bilingual(staff.doctor.name, staff.doctor.nameBN),
          }
        : (initialDoctor ?? null),
      name: staff?.name ?? "",
      nameBN: staff?.nameBN ?? "",
      mobile: staff?.mobile ?? "",
      email: staff?.email ?? "",
      password: "",
      isActive: staff?.isActive ?? true,
    },
  });

  const mutation = useMutation({
    mutationFn: (v: Values) => {
      if (staff) {
        return api<DoctorStaff>(`admin/doctor-staff/${staff.id}`, {
          method: "PATCH",
          body: {
            name: v.name.trim(),
            nameBN: text(v.nameBN),
            mobile: v.mobile.trim(),
            email: text(v.email),
            isActive: v.isActive,
          },
        });
      }
      return api<DoctorStaff>("admin/doctor-staff", {
        method: "POST",
        body: {
          doctorId: v.doctor?.id,
          name: v.name.trim(),
          nameBN: text(v.nameBN) ?? undefined,
          mobile: v.mobile.trim(),
          email: text(v.email) ?? undefined,
          password: v.password,
        },
      });
    },
    onSuccess: async (saved) => {
      await qc.invalidateQueries({ queryKey: ["staff"] });
      await qc.invalidateQueries({ queryKey: ["doctor-staff"] });
      await qc.invalidateQueries({ queryKey: ["doctors"] });
      await qc.invalidateQueries({ queryKey: ["doctor", saved.doctorId] });
      await qc.invalidateQueries({ queryKey: ["staff-item", saved.id] });
      toast.success(edit ? "Staff updated" : "Staff created");
      router.push(edit ? "/admin/staff" : `/admin/doctors/${saved.doctorId}`);
    },
  });

  return (
    <>
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate>
        <Card>
          <CardBody className="flex flex-col gap-4">
            <Field label="Doctor" required error={errors.doctor?.message}>
              {edit ? (
                <p className="flex h-10 items-center text-sm text-zinc-800">
                  {bilingual(staff.doctor.name, staff.doctor.nameBN)}
                </p>
              ) : (
                <Controller
                  control={control}
                  name="doctor"
                  render={({ field }) => (
                    <AsyncSelect
                      cacheKey="doctor-options"
                      fetchOptions={fetchDoctorOptions}
                      placeholder="Select doctor"
                      value={field.value ?? null}
                      onChange={field.onChange}
                      invalid={!!errors.doctor}
                    />
                  )}
                />
              )}
            </Field>
            <BilingualRow
              en={
                <Field label="Name" required error={errors.name?.message}>
                  <Input invalid={!!errors.name} {...register("name")} />
                </Field>
              }
              bn={
                <Field label="Name (Bangla)">
                  <Input lang="bn" {...register("nameBN")} />
                </Field>
              }
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Mobile" required error={errors.mobile?.message}>
                <Input
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  invalid={!!errors.mobile}
                  {...register("mobile")}
                />
              </Field>
              <Field label="Email" error={errors.email?.message}>
                <Input
                  type="email"
                  invalid={!!errors.email}
                  {...register("email")}
                />
              </Field>
              {!edit && (
                <Field
                  label="Password"
                  required
                  error={errors.password?.message}
                  hint="At least 8 characters"
                >
                  <Input
                    type="password"
                    autoComplete="new-password"
                    invalid={!!errors.password}
                    {...register("password")}
                  />
                </Field>
              )}
            </div>
            {edit && (
              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  className="size-4 accent-teal-600"
                  {...register("isActive")}
                />
                Active
              </label>
            )}
            <FormError error={mutation.error} />
            <div className="flex justify-end gap-2">
              {edit && (
                <Button variant="secondary" onClick={() => setResetOpen(true)}>
                  Reset password
                </Button>
              )}
              <Link href="/admin/staff">
                <Button variant="secondary">Cancel</Button>
              </Link>
              <Button type="submit" loading={mutation.isPending}>
                {edit ? "Save changes" : "Create staff"}
              </Button>
            </div>
          </CardBody>
        </Card>
      </form>
      {staff && (
        <ResetPasswordModal
          open={resetOpen}
          onClose={() => setResetOpen(false)}
          path={`admin/doctor-staff/${staff.id}/reset-password`}
          subject={staff.name}
        />
      )}
    </>
  );
}

/** Loads the doctor from ?doctorId so the select shows its name. */
function CreateWithDoctor({ doctorId }: { doctorId: number }) {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["doctor", doctorId],
    queryFn: () => api<Doctor>(`admin/doctor/${doctorId}`),
  });
  if (isLoading) return <Spinner />;
  if (error)
    return (
      <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
    );
  return (
    <StaffForm
      initialDoctor={
        data ? { id: data.id, label: bilingual(data.name, data.nameBN) } : null
      }
    />
  );
}

export function StaffCreateView() {
  const raw = Number(useSearchParams().get("doctorId"));
  const doctorId = Number.isInteger(raw) && raw > 0 ? raw : null;
  return (
    <>
      <PageHeader
        title="Add staff"
        back={{ href: "/admin/staff", label: "Doctor staff" }}
      />
      {doctorId ? <CreateWithDoctor doctorId={doctorId} /> : <StaffForm />}
    </>
  );
}

export function StaffEditView({ id }: { id: number }) {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["staff-item", id],
    queryFn: () => api<DoctorStaff>(`admin/doctor-staff/${id}`),
  });
  return (
    <>
      <PageHeader
        title="Edit staff"
        description={data ? bilingual(data.name, data.nameBN) : undefined}
        back={{ href: "/admin/staff", label: "Doctor staff" }}
      />
      {isLoading && <Spinner />}
      {error && (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      )}
      {data && <StaffForm staff={data} />}
    </>
  );
}
