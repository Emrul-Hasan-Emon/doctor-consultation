"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  ClipboardList,
  Building2,
  LayoutDashboard,
  LogOut,
  Pill,
  Stethoscope,
  Tags,
  UserCog,
  Users,
  Hospital,
} from "lucide-react";
import type { ReactNode } from "react";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { AdminMe } from "@/lib/types";

const NAV = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Doctors", href: "/admin/doctors", icon: Stethoscope },
  { label: "Doctor staff", href: "/admin/staff", icon: UserCog },
  { label: "Patients", href: "/admin/patients", icon: Users },
  { label: "Hospitals", href: "/admin/hospitals", icon: Hospital },
  { label: "Specialities", href: "/admin/specialities", icon: Tags },
  { label: "Chambers", href: "/admin/chambers", icon: Building2 },
  { label: "Schedules", href: "/admin/schedules", icon: CalendarDays },
  { label: "Appointments", href: "/admin/appointments", icon: ClipboardList },
  { label: "Medicines", href: "/admin/medicines", icon: Pill },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => api<AdminMe>("auth/admin/me"),
  });

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-zinc-200 bg-white md:flex">
        <div className="px-5 py-5 text-lg font-semibold text-teal-700">
          Doctor Consultation
        </div>
        <nav
          aria-label="Main"
          className="flex-1 space-y-0.5 overflow-y-auto px-3"
        >
          {NAV.map(({ label, href, icon: Icon, exact }) => {
            const active = exact
              ? pathname === href
              : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                  active
                    ? "bg-teal-50 text-teal-800"
                    : "text-zinc-600 hover:bg-zinc-100",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-zinc-200 p-3">
          <div className="px-2 pb-2 text-sm">
            <p className="font-medium text-zinc-900">{me?.name ?? "..."}</p>
            <p className="text-xs text-zinc-500">{me?.mobile}</p>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100"
          >
            <LogOut className="size-4" aria-hidden />
            Log out
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 md:hidden">
          <span className="font-semibold text-teal-700">
            Doctor Consultation
          </span>
          <button onClick={logout} className="text-sm text-zinc-600">
            Log out
          </button>
        </header>
        <nav
          aria-label="Main (mobile)"
          className="flex gap-1 overflow-x-auto border-b border-zinc-200 bg-white px-2 py-2 md:hidden"
        >
          {NAV.map(({ label, href, exact }) => {
            const active = exact
              ? pathname === href
              : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "whitespace-nowrap rounded px-3 py-1.5 text-sm",
                  active
                    ? "bg-teal-50 font-medium text-teal-800"
                    : "text-zinc-600",
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
