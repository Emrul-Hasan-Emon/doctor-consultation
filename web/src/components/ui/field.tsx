import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface Props {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

/** Label, control, hint and error. Pass the control as children. */
export function Field({
  label,
  error,
  hint,
  required,
  className,
  children,
}: Props) {
  return (
    <label className={cn("flex flex-col gap-1", className)}>
      <span className="text-sm font-medium text-zinc-700">
        {label}
        {required && <span className="ml-0.5 text-red-600">*</span>}
      </span>
      {children}
      {hint && !error && <span className="text-xs text-zinc-500">{hint}</span>}
      {error && (
        <span role="alert" className="text-xs text-red-600">
          {error}
        </span>
      )}
    </label>
  );
}
