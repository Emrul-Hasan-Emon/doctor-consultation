"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface TabItem {
  key: string;
  label: string;
  count?: number;
}

export function Tabs({
  items,
  active,
  onChange,
}: {
  items: TabItem[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div role="tablist" className="mb-4 flex gap-1 border-b border-zinc-200">
      {items.map((t) => (
        <button
          key={t.key}
          role="tab"
          aria-selected={active === t.key}
          onClick={() => onChange(t.key)}
          className={cn(
            "-mb-px border-b-2 px-4 py-2 text-sm font-medium",
            active === t.key
              ? "border-teal-600 text-teal-700"
              : "border-transparent text-zinc-500 hover:text-zinc-800",
          )}
        >
          {t.label}
          {t.count !== undefined && (
            <span className="ml-1.5 rounded-full bg-zinc-100 px-1.5 text-xs text-zinc-600">
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export const TabPanel = ({ children }: { children: ReactNode }) => (
  <div role="tabpanel">{children}</div>
);
