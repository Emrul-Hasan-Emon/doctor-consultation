"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { BilingualRow } from "@/components/forms/bilingual-fields";
import { FormError } from "@/components/forms/form-error";
import { api } from "@/lib/api";
import type { PrescriptionType, Speciality } from "@/lib/types";
import { slugify } from "./slug";

export const PRESCRIPTION_HELP: Record<PrescriptionType, string> = {
  GENERAL:
    "GENERAL: standard prescription with diagnosis, medicines and advice.",
  NUTRITIONIST:
    "NUTRITIONIST: diet-focused prescription (meal plans, nutrition advice).",
  OTHER: "OTHER: a custom layout for specialities that fit neither type.",
};

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  nameBN: z.string(),
  title: z.string(),
  titleBN: z.string(),
  value: z
    .string()
    .trim()
    .min(1, "Value is required")
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      "Use lowercase letters, digits and hyphens",
    ),
  icon: z.string(),
  prescriptionType: z.enum(["GENERAL", "NUTRITIONIST", "OTHER"]),
  isActive: z.boolean(),
});
type Values = z.infer<typeof schema>;

const orNull = (v: string) => (v.trim() === "" ? null : v.trim());

export function SpecialityForm({
  speciality,
  onDone,
}: {
  speciality: Speciality | null;
  onDone: () => void;
}) {
  const qc = useQueryClient();
  const toast = useToast();
  // On create the slug follows the English name until the user edits it.
  const [slugTouched, setSlugTouched] = useState(!!speciality);
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: speciality?.name ?? "",
      nameBN: speciality?.nameBN ?? "",
      title: speciality?.title ?? "",
      titleBN: speciality?.titleBN ?? "",
      value: speciality?.value ?? "",
      icon: speciality?.icon ?? "",
      prescriptionType: speciality?.prescriptionType ?? "GENERAL",
      isActive: speciality?.isActive ?? true,
    },
  });
  const type = useWatch({ control, name: "prescriptionType" });

  const save = useMutation({
    mutationFn: (v: Values) => {
      const body = {
        name: v.name.trim(),
        nameBN: orNull(v.nameBN),
        title: orNull(v.title),
        titleBN: orNull(v.titleBN),
        value: v.value.trim(),
        icon: orNull(v.icon),
        prescriptionType: v.prescriptionType,
        isActive: v.isActive,
      };
      return speciality
        ? api<Speciality>(`admin/speciality/${speciality.id}`, {
            method: "PATCH",
            body,
          })
        : api<Speciality>("admin/speciality", { method: "POST", body });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["specialities"] });
      toast.success(speciality ? "Speciality updated" : "Speciality created");
      onDone();
    },
  });

  const valueField = register("value", {
    onChange: () => {
      setSlugTouched(true);
    },
  });

  return (
    <form
      onSubmit={handleSubmit((v) => save.mutate(v))}
      noValidate
      className="flex flex-col gap-4"
    >
      <BilingualRow
        en={
          <Field label="Name" required error={errors.name?.message}>
            <Input
              {...register("name", {
                onChange: (e: { target: { value: string } }) => {
                  if (!slugTouched)
                    setValue("value", slugify(e.target.value), {
                      shouldValidate: true,
                    });
                },
              })}
              invalid={!!errors.name}
            />
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
          <Field label="Title">
            <Input {...register("title")} />
          </Field>
        }
        bn={
          <Field label="Title (Bangla)">
            <Input {...register("titleBN")} />
          </Field>
        }
      />
      <Field
        label="Value"
        required
        hint="Unique slug: lowercase letters, digits and hyphens, e.g. general-medicine."
        error={errors.value?.message}
      >
        <Input {...valueField} invalid={!!errors.value} />
      </Field>
      <Field label="Icon" hint="Icon name or image URL.">
        <Input {...register("icon")} />
      </Field>
      <Field label="Prescription type" required>
        <Select {...register("prescriptionType")}>
          <option value="GENERAL">General</option>
          <option value="NUTRITIONIST">Nutritionist</option>
          <option value="OTHER">Other</option>
        </Select>
      </Field>
      <p className="-mt-2 text-xs text-zinc-500">{PRESCRIPTION_HELP[type]}</p>
      <Controller
        control={control}
        name="isActive"
        render={({ field }) => (
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
              className="size-4 accent-teal-600"
            />
            Active (uncheck to deactivate; specialities cannot be deleted)
          </label>
        )}
      />
      <FormError error={save.error} />
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onDone} disabled={save.isPending}>
          Cancel
        </Button>
        <Button type="submit" loading={save.isPending}>
          {speciality ? "Save changes" : "Create speciality"}
        </Button>
      </div>
    </form>
  );
}
