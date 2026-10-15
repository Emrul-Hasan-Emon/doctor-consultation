"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { BilingualRow } from "@/components/forms/bilingual-fields";
import { FormError } from "@/components/forms/form-error";
import { useDistricts, useDivisions } from "@/components/forms/select-options";
import { api } from "@/lib/api";
import type { Hospital } from "@/lib/types";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  nameBN: z.string(),
  alias: z.string(),
  aliasBN: z.string(),
  phone: z.string(),
  email: z
    .string()
    .trim()
    .refine(
      (v) => v === "" || z.email().safeParse(v).success,
      "Enter a valid email",
    ),
  address: z.string(),
  addressBN: z.string(),
  description: z.string(),
  descriptionBN: z.string(),
  banner: z.string(),
  icon: z.string(),
  status: z.boolean(),
  divisionId: z.string().min(1, "Division is required"),
  districtId: z.string().min(1, "District is required"),
});
type Values = z.infer<typeof schema>;

const blank = (v: string | null | undefined) => v ?? "";
const orNull = (v: string) => (v.trim() === "" ? null : v.trim());

function toDefaults(h?: Hospital): Values {
  return {
    name: h?.name ?? "",
    nameBN: blank(h?.nameBN),
    alias: blank(h?.alias),
    aliasBN: blank(h?.aliasBN),
    phone: blank(h?.phone),
    email: blank(h?.email),
    address: blank(h?.address),
    addressBN: blank(h?.addressBN),
    description: blank(h?.description),
    descriptionBN: blank(h?.descriptionBN),
    banner: blank(h?.banner),
    icon: blank(h?.icon),
    status: h?.status ?? true,
    divisionId: h ? String(h.divisionId) : "",
    districtId: h ? String(h.districtId) : "",
  };
}

export function HospitalForm({ hospital }: { hospital?: Hospital }) {
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toDefaults(hospital),
  });

  const divisionId = useWatch({ control, name: "divisionId" });
  const divisions = useDivisions();
  const districts = useDistricts(divisionId ? Number(divisionId) : null);

  const save = useMutation({
    mutationFn: (v: Values) => {
      const body = {
        name: v.name.trim(),
        nameBN: orNull(v.nameBN),
        alias: orNull(v.alias),
        aliasBN: orNull(v.aliasBN),
        phone: orNull(v.phone),
        email: orNull(v.email),
        address: orNull(v.address),
        addressBN: orNull(v.addressBN),
        description: orNull(v.description),
        descriptionBN: orNull(v.descriptionBN),
        banner: orNull(v.banner),
        icon: orNull(v.icon),
        status: v.status,
        divisionId: Number(v.divisionId),
        districtId: Number(v.districtId),
      };
      return hospital
        ? api<Hospital>(`admin/hospital/${hospital.id}`, {
            method: "PATCH",
            body,
          })
        : api<Hospital>("admin/hospital", { method: "POST", body });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["hospitals"] });
      await qc.invalidateQueries({ queryKey: ["hospital"] });
      toast.success(hospital ? "Hospital updated" : "Hospital created");
      router.push("/admin/hospitals");
    },
  });

  return (
    <form onSubmit={handleSubmit((v) => save.mutate(v))} noValidate>
      <Card>
        <CardBody className="flex flex-col gap-5">
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
          <BilingualRow
            en={
              <Field label="Alias">
                <Input {...register("alias")} />
              </Field>
            }
            bn={
              <Field label="Alias (Bangla)">
                <Input {...register("aliasBN")} />
              </Field>
            }
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone">
              <Input type="tel" {...register("phone")} />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <Input
                type="email"
                {...register("email")}
                invalid={!!errors.email}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Division" required error={errors.divisionId?.message}>
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
            <Field label="District" required error={errors.districtId?.message}>
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
            <Field label="Banner URL">
              <Input {...register("banner")} />
            </Field>
            <Field label="Icon URL">
              <Input {...register("icon")} />
            </Field>
          </div>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="size-4 accent-teal-600"
                />
                Active (available when creating chambers)
              </label>
            )}
          />
          <FormError error={save.error} />
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => router.push("/admin/hospitals")}
              disabled={save.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" loading={save.isPending}>
              {hospital ? "Save changes" : "Create hospital"}
            </Button>
          </div>
        </CardBody>
      </Card>
    </form>
  );
}
