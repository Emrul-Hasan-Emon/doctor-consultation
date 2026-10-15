"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { BilingualRow } from "@/components/forms/bilingual-fields";
import { FormError } from "@/components/forms/form-error";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/ui/empty-state";
import { api, errorMessage } from "@/lib/api";
import { bilingual } from "@/lib/format";
import type { Doctor, Ref } from "@/lib/types";

const intString = (label: string, min: number, max?: number) =>
  z
    .string()
    .trim()
    .refine(
      (v) => v === "" || /^\d+$/.test(v),
      `${label} must be a whole number`,
    )
    .refine(
      (v) => v === "" || Number(v) >= min,
      `${label} must be at least ${min}`,
    )
    .refine(
      (v) => v === "" || max === undefined || Number(v) <= max,
      `${label} must be at most ${max}`,
    );

const baseShape = {
  name: z.string().trim().min(1, "Name is required"),
  nameBN: z.string(),
  mobile: z.string().trim().min(1, "Mobile is required"),
  email: z
    .string()
    .trim()
    .refine((v) => v === "" || z.email().safeParse(v).success, "Invalid email"),
  password: z.string(),
  specialityId: z.string(),
  degrees: z.string(),
  degreesBN: z.string(),
  experience: intString("Experience", 0),
  bmdcCode: z.string(),
  bmdcExpiryDate: z.string(),
  workingAt: z.string(),
  workingAtBN: z.string(),
  biography: z.string(),
  biographyBN: z.string(),
  consultationDurationMinutes: intString("Duration", 1, 240).refine(
    (v) => v !== "",
    "Duration is required",
  ),
  defaultFollowUpDays: intString("Follow-up days", 0),
  profilePic: z.string(),
  signatureUrl: z.string(),
  isActive: z.boolean(),
};

const createSchema = z.object(baseShape).refine((v) => v.password.length >= 8, {
  path: ["password"],
  message: "Password must be at least 8 characters",
});
const editSchema = z.object(baseShape);
type Values = z.infer<typeof editSchema>;

const str = (v: string | null | undefined) => v ?? "";
const num = (v: number | null | undefined) =>
  v === null || v === undefined ? "" : String(v);

function defaults(d?: Doctor): Values {
  return {
    name: str(d?.name),
    nameBN: str(d?.nameBN),
    mobile: str(d?.mobile),
    email: str(d?.email),
    password: "",
    specialityId: num(d?.specialityId),
    degrees: str(d?.degrees),
    degreesBN: str(d?.degreesBN),
    experience: num(d?.experience),
    bmdcCode: str(d?.bmdcCode),
    bmdcExpiryDate: str(d?.bmdcExpiryDate).slice(0, 10),
    workingAt: str(d?.workingAt),
    workingAtBN: str(d?.workingAtBN),
    biography: str(d?.biography),
    biographyBN: str(d?.biographyBN),
    consultationDurationMinutes: num(d?.consultationDurationMinutes ?? 15),
    defaultFollowUpDays: num(d?.defaultFollowUpDays),
    profilePic: str(d?.profilePic),
    signatureUrl: str(d?.signatureUrl),
    isActive: d?.isActive ?? true,
  };
}

const text = (v: string) => v.trim() || null;
const int = (v: string) => (v.trim() === "" ? null : Number(v));

function toPayload(v: Values, edit: boolean) {
  const body: Record<string, unknown> = {
    name: v.name.trim(),
    nameBN: text(v.nameBN),
    mobile: v.mobile.trim(),
    email: text(v.email),
    specialityId: int(v.specialityId),
    degrees: text(v.degrees),
    degreesBN: text(v.degreesBN),
    experience: int(v.experience),
    bmdcCode: text(v.bmdcCode),
    bmdcExpiryDate: text(v.bmdcExpiryDate),
    workingAt: text(v.workingAt),
    workingAtBN: text(v.workingAtBN),
    biography: text(v.biography),
    biographyBN: text(v.biographyBN),
    consultationDurationMinutes: Number(v.consultationDurationMinutes),
    defaultFollowUpDays: int(v.defaultFollowUpDays),
    profilePic: text(v.profilePic),
    signatureUrl: text(v.signatureUrl),
  };
  if (edit) {
    body.isActive = v.isActive;
    return body;
  }
  // Create: omit empty optional values instead of sending null.
  for (const k of Object.keys(body)) if (body[k] === null) delete body[k];
  body.password = v.password;
  return body;
}

export function DoctorForm({ doctor }: { doctor?: Doctor }) {
  const edit = !!doctor;
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();

  const specialities = useQuery({
    queryKey: ["speciality-options"],
    queryFn: () => api<Ref[]>("admin/speciality/options"),
    staleTime: 5 * 60_000,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(edit ? editSchema : createSchema),
    defaultValues: defaults(doctor),
  });

  const mutation = useMutation({
    mutationFn: (v: Values) =>
      edit
        ? api<Doctor>(`admin/doctor/${doctor.id}`, {
            method: "PATCH",
            body: toPayload(v, true),
          })
        : api<Doctor>("admin/doctor", {
            method: "POST",
            body: toPayload(v, false),
          }),
    onSuccess: async (saved) => {
      await qc.invalidateQueries({ queryKey: ["doctors"] });
      await qc.invalidateQueries({ queryKey: ["doctor", saved.id] });
      toast.success(edit ? "Doctor updated" : "Doctor created");
      router.push(`/admin/doctors/${saved.id}`);
    },
  });

  const e = errors;
  return (
    <form
      onSubmit={handleSubmit((v) => mutation.mutate(v))}
      className="flex flex-col gap-6"
      noValidate
    >
      <Card>
        <CardHeader title="Basic information" />
        <CardBody className="flex flex-col gap-4">
          <BilingualRow
            en={
              <Field label="Name" required error={e.name?.message}>
                <Input invalid={!!e.name} {...register("name")} />
              </Field>
            }
            bn={
              <Field label="Name (Bangla)" error={e.nameBN?.message}>
                <Input lang="bn" {...register("nameBN")} />
              </Field>
            }
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Mobile" required error={e.mobile?.message}>
              <Input
                type="tel"
                placeholder="01XXXXXXXXX"
                invalid={!!e.mobile}
                {...register("mobile")}
              />
            </Field>
            <Field label="Email" error={e.email?.message}>
              <Input type="email" invalid={!!e.email} {...register("email")} />
            </Field>
            {!edit && (
              <Field
                label="Password"
                required
                error={e.password?.message}
                hint="At least 8 characters"
              >
                <Input
                  type="password"
                  autoComplete="new-password"
                  invalid={!!e.password}
                  {...register("password")}
                />
              </Field>
            )}
            <Field label="Speciality" error={e.specialityId?.message}>
              <Select {...register("specialityId")}>
                <option value="">None</option>
                {specialities.data?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {bilingual(s.name, s.nameBN)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          {edit && (
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                className="size-4 accent-teal-600"
                {...register("isActive")}
              />
              Active (deactivating signs the doctor out)
            </label>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Professional details" />
        <CardBody className="flex flex-col gap-4">
          <BilingualRow
            en={
              <Field label="Degrees" error={e.degrees?.message}>
                <Input {...register("degrees")} />
              </Field>
            }
            bn={
              <Field label="Degrees (Bangla)" error={e.degreesBN?.message}>
                <Input lang="bn" {...register("degreesBN")} />
              </Field>
            }
          />
          <BilingualRow
            en={
              <Field label="Working at" error={e.workingAt?.message}>
                <Input {...register("workingAt")} />
              </Field>
            }
            bn={
              <Field label="Working at (Bangla)" error={e.workingAtBN?.message}>
                <Input lang="bn" {...register("workingAtBN")} />
              </Field>
            }
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Experience (years)" error={e.experience?.message}>
              <Input
                inputMode="numeric"
                invalid={!!e.experience}
                {...register("experience")}
              />
            </Field>
            <Field label="BMDC code" error={e.bmdcCode?.message}>
              <Input {...register("bmdcCode")} />
            </Field>
            <Field label="BMDC expiry date" error={e.bmdcExpiryDate?.message}>
              <Input type="date" {...register("bmdcExpiryDate")} />
            </Field>
            <Field
              label="Consultation duration (minutes)"
              required
              error={e.consultationDurationMinutes?.message}
              hint="1 to 240"
            >
              <Input
                inputMode="numeric"
                invalid={!!e.consultationDurationMinutes}
                {...register("consultationDurationMinutes")}
              />
            </Field>
            <Field
              label="Default follow-up days"
              error={e.defaultFollowUpDays?.message}
            >
              <Input
                inputMode="numeric"
                invalid={!!e.defaultFollowUpDays}
                {...register("defaultFollowUpDays")}
              />
            </Field>
          </div>
          <BilingualRow
            en={
              <Field label="Biography" error={e.biography?.message}>
                <Textarea rows={4} {...register("biography")} />
              </Field>
            }
            bn={
              <Field label="Biography (Bangla)" error={e.biographyBN?.message}>
                <Textarea lang="bn" rows={4} {...register("biographyBN")} />
              </Field>
            }
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Profile picture URL" error={e.profilePic?.message}>
              <Input {...register("profilePic")} />
            </Field>
            <Field label="Signature URL" error={e.signatureUrl?.message}>
              <Input {...register("signatureUrl")} />
            </Field>
          </div>
        </CardBody>
      </Card>

      <FormError error={mutation.error} />
      <div className="flex justify-end gap-2">
        <Link href={edit ? `/admin/doctors/${doctor.id}` : "/admin/doctors"}>
          <Button variant="secondary">Cancel</Button>
        </Link>
        <Button type="submit" loading={mutation.isPending}>
          {edit ? "Save changes" : "Create doctor"}
        </Button>
      </div>
    </form>
  );
}

export function DoctorCreateView() {
  return (
    <>
      <PageHeader
        title="Add doctor"
        back={{ href: "/admin/doctors", label: "Doctors" }}
      />
      <DoctorForm />
    </>
  );
}

export function DoctorEditView({ id }: { id: number }) {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["doctor", id],
    queryFn: () => api<Doctor>(`admin/doctor/${id}`),
  });
  return (
    <>
      <PageHeader
        title="Edit doctor"
        description={data ? bilingual(data.name, data.nameBN) : undefined}
        back={{ href: `/admin/doctors/${id}`, label: "Doctor" }}
      />
      {isLoading && <Spinner />}
      {error && (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      )}
      {data && <DoctorForm doctor={data} />}
    </>
  );
}
