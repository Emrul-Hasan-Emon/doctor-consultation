"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { FormError } from "@/components/forms/form-error";
import { api } from "@/lib/api";
import type { Medicine } from "@/lib/types";

const schema = z.object({
  manufacturer: z.string().trim().min(1, "Manufacturer is required"),
  brandName: z.string().trim().min(1, "Brand name is required"),
  genericName: z.string().trim().min(1, "Generic name is required"),
  strength: z.string(),
  dosage: z.string().trim().min(1, "Dosage form is required"),
  dar: z.string().trim().min(1, "DAR is required"),
  isChronic: z.boolean(),
  isActive: z.boolean(),
});
type Values = z.infer<typeof schema>;

export function MedicineForm({
  medicine,
  onDone,
}: {
  medicine: Medicine | null;
  onDone: () => void;
}) {
  const qc = useQueryClient();
  const toast = useToast();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      manufacturer: medicine?.manufacturer ?? "",
      brandName: medicine?.brandName ?? "",
      genericName: medicine?.genericName ?? "",
      strength: medicine?.strength ?? "",
      dosage: medicine?.dosage ?? "",
      dar: medicine?.dar ?? "",
      isChronic: medicine?.isChronic ?? false,
      isActive: medicine?.isActive ?? true,
    },
  });

  const save = useMutation({
    mutationFn: (v: Values) => {
      const body = {
        manufacturer: v.manufacturer.trim(),
        brandName: v.brandName.trim(),
        genericName: v.genericName.trim(),
        strength: v.strength.trim() === "" ? null : v.strength.trim(),
        dosage: v.dosage.trim(),
        dar: v.dar.trim(),
        isChronic: v.isChronic,
        isActive: v.isActive,
      };
      return medicine
        ? api<Medicine>(`admin/medicine/${medicine.id}`, {
            method: "PATCH",
            body,
          })
        : api<Medicine>("admin/medicine", { method: "POST", body });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["medicines"] });
      toast.success(medicine ? "Medicine updated" : "Medicine created");
      onDone();
    },
  });

  const check = (name: "isChronic" | "isActive", label: string) => (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={field.value}
            onChange={(e) => field.onChange(e.target.checked)}
            className="size-4 accent-teal-600"
          />
          {label}
        </label>
      )}
    />
  );

  return (
    <form
      onSubmit={handleSubmit((v) => save.mutate(v))}
      noValidate
      className="flex flex-col gap-4"
    >
      <Field label="Brand name" required error={errors.brandName?.message}>
        <Input {...register("brandName")} invalid={!!errors.brandName} />
      </Field>
      <Field label="Generic name" required error={errors.genericName?.message}>
        <Input {...register("genericName")} invalid={!!errors.genericName} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Strength" hint="e.g. 500 mg">
          <Input {...register("strength")} />
        </Field>
        <Field
          label="Dosage form"
          required
          hint="e.g. Tablet"
          error={errors.dosage?.message}
        >
          <Input {...register("dosage")} invalid={!!errors.dosage} />
        </Field>
      </div>
      <Field label="Manufacturer" required error={errors.manufacturer?.message}>
        <Input {...register("manufacturer")} invalid={!!errors.manufacturer} />
      </Field>
      <Field label="DAR" required error={errors.dar?.message}>
        <Input {...register("dar")} invalid={!!errors.dar} />
      </Field>
      {check("isChronic", "Chronic medicine")}
      {check("isActive", "Active")}
      <FormError error={save.error} />
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onDone} disabled={save.isPending}>
          Cancel
        </Button>
        <Button type="submit" loading={save.isPending}>
          {medicine ? "Save changes" : "Create medicine"}
        </Button>
      </div>
    </form>
  );
}
