import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

const base =
  "block w-full rounded-md border bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:bg-zinc-100 disabled:text-zinc-500";

export function Input({
  className,
  invalid,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      className={cn(
        base,
        "h-10",
        invalid ? "border-red-500" : "border-zinc-300",
        className,
      )}
      {...rest}
    />
  );
}

export function Textarea({
  className,
  invalid,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      className={cn(
        base,
        "min-h-20 py-2",
        invalid ? "border-red-500" : "border-zinc-300",
        className,
      )}
      {...rest}
    />
  );
}

export function Select({
  className,
  invalid,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      className={cn(
        base,
        "h-10",
        invalid ? "border-red-500" : "border-zinc-300",
        className,
      )}
      {...rest}
    >
      {children}
    </select>
  );
}
