import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { AppointmentStatus } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/format";

type Tone = "gray" | "green" | "red" | "amber" | "blue" | "teal";

const TONE: Record<Tone, string> = {
  gray: "bg-zinc-100 text-zinc-700",
  green: "bg-emerald-100 text-emerald-800",
  red: "bg-red-100 text-red-800",
  amber: "bg-amber-100 text-amber-800",
  blue: "bg-sky-100 text-sky-800",
  teal: "bg-teal-100 text-teal-800",
};

export function Badge({
  tone = "gray",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        TONE[tone],
      )}
    >
      {children}
    </span>
  );
}

export const ActiveBadge = ({ active }: { active: boolean }) => (
  <Badge tone={active ? "green" : "gray"}>
    {active ? "Active" : "Inactive"}
  </Badge>
);

const STATUS_TONE: Record<AppointmentStatus, Tone> = {
  SCHEDULED: "blue",
  COMPLETED: "green",
  CANCELLED: "red",
  NO_SHOW: "amber",
};

export const StatusBadge = ({ status }: { status: AppointmentStatus }) => (
  <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>
);
