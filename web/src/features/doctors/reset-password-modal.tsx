"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Modal } from "@/components/ui/modal";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { FormError } from "@/components/forms/form-error";
import { api } from "@/lib/api";

const schema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});
type Values = z.infer<typeof schema>;

/** `path` is the reset endpoint, e.g. `admin/doctor/12/reset-password`. */
export function ResetPasswordModal({
  open,
  onClose,
  path,
  subject,
}: {
  open: boolean;
  onClose: () => void;
  path: string;
  subject: string;
}) {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { password: "" },
  });
  useEffect(() => {
    if (open) reset({ password: "" });
  }, [open, reset]);

  const mutation = useMutation({
    mutationFn: (v: Values) => api<void>(path, { method: "POST", body: v }),
    onSuccess: () => {
      toast.success("Password reset");
      onClose();
    },
  });

  return (
    <Modal
      open={open}
      title={`Reset password: ${subject}`}
      onClose={onClose}
      size="sm"
    >
      <form
        onSubmit={handleSubmit((v) => mutation.mutate(v))}
        className="flex flex-col gap-4"
        noValidate
      >
        <Field
          label="New password"
          required
          error={errors.password?.message}
          hint="The user will be signed out of existing sessions."
        >
          <Input
            type="password"
            autoComplete="new-password"
            invalid={!!errors.password}
            {...register("password")}
          />
        </Field>
        <FormError error={mutation.error} />
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Reset password
          </Button>
        </div>
      </form>
    </Modal>
  );
}
