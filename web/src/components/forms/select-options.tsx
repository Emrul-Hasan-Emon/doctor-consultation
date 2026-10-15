"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { District, Division } from "@/lib/types";

/** Cached lookups used by many forms. */
export const useDivisions = () =>
  useQuery({
    queryKey: ["location", "divisions"],
    queryFn: () => api<Division[]>("admin/location/divisions"),
    staleTime: Infinity,
  });

export const useDistricts = (divisionId: number | null | undefined) =>
  useQuery({
    queryKey: ["location", "districts", divisionId],
    queryFn: () =>
      api<District[]>("admin/location/districts", { query: { divisionId } }),
    enabled: !!divisionId,
    staleTime: Infinity,
  });
