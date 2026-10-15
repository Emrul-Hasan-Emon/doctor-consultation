import type { AppointmentStatus } from "./types";

/** '2026-10-08' -> '8 Oct 2026' */
export function formatDate(date: string | null | undefined): string {
  if (!date) return "";
  const d = new Date(`${date.slice(0, 10)}T00:00:00Z`);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Dhaka",
  });
}

/** '14:30:00' -> '2:30 PM' */
export function formatTime(time: string | null | undefined): string {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** 'HH:mm:ss' -> 'HH:mm' for <input type="time"> */
export const toInputTime = (time: string) => time.slice(0, 5);

export const formatMoney = (amount: number) =>
  `৳${amount.toLocaleString("en-IN")}`;

export const WEEKDAYS = [
  { value: 0, en: "Saturday", bn: "শনিবার" },
  { value: 1, en: "Sunday", bn: "রবিবার" },
  { value: 2, en: "Monday", bn: "সোমবার" },
  { value: 3, en: "Tuesday", bn: "মঙ্গলবার" },
  { value: 4, en: "Wednesday", bn: "বুধবার" },
  { value: 5, en: "Thursday", bn: "বৃহস্পতিবার" },
  { value: 6, en: "Friday", bn: "শুক্রবার" },
] as const;

export const weekdayName = (value: number) => WEEKDAYS[value]?.en ?? "";

/** Today in Asia/Dhaka as YYYY-MM-DD. */
export function todayDhaka(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  SCHEDULED: "Scheduled",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No show",
};

/** Shows both languages when a Bengali value exists: "Dhaka · ঢাকা". */
export const bilingual = (
  en: string | null | undefined,
  bn: string | null | undefined,
) => [en, bn].filter(Boolean).join(" · ");
