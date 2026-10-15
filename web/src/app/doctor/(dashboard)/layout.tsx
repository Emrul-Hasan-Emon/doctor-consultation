import Link from "next/link";
import type { ReactNode } from "react";

const NAV = [
  { label: "Dashboard", href: "/doctor" },
  { label: "Patients", href: "/doctor/patients" },
  { label: "Appointments", href: "/doctor/appointments" },
  { label: "Chambers", href: "/doctor/chambers" },
  { label: "Schedule", href: "/doctor/schedule" },
  { label: "Staff", href: "/doctor/staff" },
  { label: "Medicines", href: "/doctor/medicines" },
  { label: "Profile", href: "/doctor/profile" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-zinc-200 p-4">
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded px-3 py-2 hover:bg-zinc-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
