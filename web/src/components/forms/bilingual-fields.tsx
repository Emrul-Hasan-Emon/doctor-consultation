import type { ReactNode } from "react";

/** Lays out an English field and its Bengali twin side by side. */
export function BilingualRow({ en, bn }: { en: ReactNode; bn: ReactNode }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {en}
      {bn}
    </div>
  );
}
