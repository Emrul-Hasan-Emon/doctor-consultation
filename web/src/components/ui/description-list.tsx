import type { ReactNode } from "react";

/** Label/value grid for detail pages. Empty values show a dash. */
export function DescriptionList({
  items,
}: {
  items: { label: string; value: ReactNode }[];
}) {
  return (
    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((i) => (
        <div key={i.label}>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            {i.label}
          </dt>
          <dd className="mt-1 text-sm text-zinc-900">
            {i.value || <span className="text-zinc-400">-</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
