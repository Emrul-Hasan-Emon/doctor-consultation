"use client";

import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardBody } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { AsyncMultiSelect } from "@/components/forms/async-select";
import { BilingualRow } from "@/components/forms/bilingual-fields";
import { FormError } from "@/components/forms/form-error";
import { useDistricts, useDivisions } from "@/components/forms/select-options";
import { api, errorMessage } from "@/lib/api";
import type { Patient } from "@/lib/types";
import { fetchDoctorOptions } from "./doctor-options";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  nameBN: z.string().trim(),
  mobile: z.string().trim().min(1, "Mobile is required"),
  divisionId: z.string().min(1, "Division is required"),
  districtId: z.string().min(1, "District is required"),
  address: z.string().trim(),
  addressBN: z.string().trim(),
  isActive: z.boolean(),
  doctors: z.array(
    z.object({
      id: z.number(),
      label: z.string(),
      sublabel: z.string().nullish(),
    }),
  ),
});
type Values = z.infer<typeof schema>;

const orNull = (s: string) => (s ? s : null);

function FormBody({ patient }: { patient?: Patient }) {
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const editing = !!patient;

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: patient?.name ?? "",
      nameBN: patient?.nameBN ?? "",
      mobile: patient?.mobile ?? "",
      divisionId: patient ? String(patient.divisionId) : "",
      districtId: patient ? String(patient.districtId) : "",
      address: patient?.address ?? "",
      addressBN: patient?.addressBN ?? "",
      isActive: patient?.isActive ?? true,
      doctors:
        patient?.doctors.map((d) => ({ id: d.doctorId, label: d.name })) ?? [],
    },
  });

  const divisionId = useWatch({ control, name: "divisionId" });
  const divisions = useDivisions();
  const districts = useDistricts(divisionId ? Number(divisionId) : null);

  const save = useMutation({
    mutationFn: (v: Values) => {
      const base = {
        name: v.name,
        nameBN: orNull(v.nameBN),
        mobile: v.mobile,
        divisionId: Number(v.divisionId),
        districtId: Number(v.districtId),
        address: orNull(v.address),
        addressBN: orNull(v.addressBN),
      };
      return editing
        ? api<Patient>(`admin/patient/${patient.id}`, {
            method: "PATCH",
            body: { ...base, isActive: v.isActive },
          })
        : api<Patient>("admin/patient", {
            method: "POST",
            body: { ...base, doctorIds: v.doctors.map((d) => d.id) },
          });
    },
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      qc.invalidateQueries({ queryKey: ["patient", saved.id] });
      toast.success(editing ? "Patient updated" : "Patient created");
      router.push(`/admin/patients/${saved.id}`);
    },
  });

  const onSubmit = handleSubmit((v) => {
    if (!editing && v.doctors.length === 0) {
      setError("doctors", { message: "Select at least one doctor" });
      return;
    }
    save.mutate(v);
  });

  return (
    <>
      <PageHeader
        title={editing ? "Edit patient" : "Add patient"}
        back={{
          href: editing ? `/admin/patients/${patient.id}` : "/admin/patients",
          label: editing ? "Patient" : "Patients",
        }}
      />
      <Card>
        <CardBody>
          <form onSubmit={onSubmit} className="flex max-w-3xl flex-col gap-4">
            <BilingualRow
              en={
                <Field label="Name" required error={errors.name?.message}>
                  <Input {...register("name")} invalid={!!errors.name} />
                </Field>
              }
              bn={
                <Field label="Name (Bangla)">
                  <Input {...register("nameBN")} />
                </Field>
              }
            />
            <Field label="Mobile" required error={errors.mobile?.message}>
              <Input
                {...register("mobile")}
                inputMode="tel"
                placeholder="01XXXXXXXXX"
                invalid={!!errors.mobile}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Division"
                required
                error={errors.divisionId?.message}
              >
                <Select
                  {...register("divisionId", {
                    onChange: () => setValue("districtId", ""),
                  })}
                  invalid={!!errors.divisionId}
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
                  {...register("districtId")}
                  disabled={!divisionId}
                  invalid={!!errors.districtId}
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
                <Field label="Address">
                  <Textarea {...register("address")} />
                </Field>
              }
              bn={
                <Field label="Address (Bangla)">
                  <Textarea {...register("addressBN")} />
                </Field>
              }
            />
            {!editing && (
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-zinc-700">
                  Doctors<span className="ml-0.5 text-red-600">*</span>
                </span>
                <Controller
                  control={control}
                  name="doctors"
                  render={({ field }) => (
                    <AsyncMultiSelect
                      cacheKey="patient-form-doctors"
                      fetchOptions={fetchDoctorOptions}
                      placeholder="Select doctors"
                      value={field.value}
                      invalid={!!errors.doctors}
                      onChange={field.onChange}
                    />
                  )}
                />
                {errors.doctors && (
                  <span role="alert" className="text-xs text-red-600">
                    {errors.doctors.message ?? "Select at least one doctor"}
                  </span>
                )}
              </div>
            )}
            {editing && (
              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  {...register("isActive")}
                  className="size-4 accent-teal-600"
                />
                Active
              </label>
            )}
            <FormError error={save.error} />
            <div className="flex gap-2">
              <Button type="submit" loading={save.isPending}>
                {editing ? "Save changes" : "Create patient"}
              </Button>
              <Button
                variant="secondary"
                disabled={save.isPending}
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </>
  );
}

export function PatientForm({ id }: { id?: number }) {
  const { data, error, refetch } = useQuery({
    queryKey: ["patient", id],
    queryFn: () => api<Patient>(`admin/patient/${id}`),
    enabled: id !== undefined,
  });

  if (id === undefined) return <FormBody />;
  if (error)
    return <ErrorState message={errorMessage(error)} onRetry={refetch} />;
  if (!data) return <Spinner />;
  return <FormBody key={data.updatedAt} patient={data} />;
}
