import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { EmptyState, ErrorState } from "./empty-state";
import { Spinner } from "./spinner";

export interface Column<T> {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[] | undefined;
  rowKey: (row: T) => string | number;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  empty?: { title: string; description?: string; action?: ReactNode };
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  error,
  onRetry,
  empty,
  onRowClick,
}: Props<T>) {
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (loading && !rows) return <Spinner />;
  if (!rows?.length)
    return (
      <EmptyState
        title={empty?.title ?? "Nothing here yet"}
        description={empty?.description}
        action={empty?.action}
      />
    );

  return (
    <div className={cn("overflow-x-auto", loading && "opacity-60")}>
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            {columns.map((c) => (
              <th
                key={c.header}
                scope="col"
                className={cn("px-4 py-3 font-medium", c.className)}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(onRowClick && "cursor-pointer hover:bg-zinc-50")}
            >
              {columns.map((c) => (
                <td
                  key={c.header}
                  className={cn(
                    "px-4 py-3 align-middle text-zinc-800",
                    c.className,
                  )}
                >
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
