"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

/**
 * List filters live in the URL so a refresh or a shared link keeps them.
 * Changing any filter other than `page` resets to page 1.
 */
export function useListParams(defaults: Record<string, string> = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const get = (key: string) => search.get(key) ?? defaults[key] ?? "";
  const page = Math.max(1, Number(search.get("page") ?? 1) || 1);

  const set = useCallback(
    (patch: Record<string, string | number | null | undefined>) => {
      const next = new URLSearchParams(search.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === undefined || v === "") next.delete(k);
        else next.set(k, String(v));
      }
      if (!("page" in patch)) next.delete("page");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, search],
  );

  const all = () => {
    const out: Record<string, string> = { ...defaults };
    search.forEach((v, k) => (out[k] = v));
    return out;
  };

  return { get, page, set, all };
}
