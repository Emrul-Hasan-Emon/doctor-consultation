"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/cn";

export interface Option {
  id: number;
  label: string;
  sublabel?: string | null;
}

interface BaseProps {
  /** Distinct per data source. Part of the cache key. */
  cacheKey: string;
  fetchOptions: (search: string) => Promise<Option[]>;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
}

function useDebounced(value: string, ms = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function useOutsideClose(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);
  return ref;
}

function Dropdown({
  options,
  loading,
  isSelected,
  onPick,
  id,
}: {
  options: Option[] | undefined;
  loading: boolean;
  isSelected: (o: Option) => boolean;
  onPick: (o: Option) => void;
  id: string;
}) {
  return (
    <ul
      id={id}
      role="listbox"
      className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-zinc-200 bg-white py-1 shadow-lg"
    >
      {loading && !options && (
        <li className="px-3 py-2 text-sm text-zinc-500">Loading...</li>
      )}
      {options?.length === 0 && (
        <li className="px-3 py-2 text-sm text-zinc-500">No results</li>
      )}
      {options?.map((o) => (
        <li key={o.id} role="option" aria-selected={isSelected(o)}>
          <button
            type="button"
            onClick={() => onPick(o)}
            className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-50"
          >
            <span>
              {o.label}
              {o.sublabel && (
                <span className="ml-2 text-xs text-zinc-500">{o.sublabel}</span>
              )}
            </span>
            {isSelected(o) && <Check className="size-4 text-teal-600" />}
          </button>
        </li>
      ))}
    </ul>
  );
}

const triggerClass = (invalid?: boolean, disabled?: boolean) =>
  cn(
    "flex min-h-10 w-full items-center justify-between gap-2 rounded-md border bg-white px-3 text-left text-sm",
    invalid ? "border-red-500" : "border-zinc-300",
    disabled && "bg-zinc-100 text-zinc-500",
  );

interface SingleProps extends BaseProps {
  value: Option | null;
  onChange: (option: Option | null) => void;
  clearable?: boolean;
}

/** Search-as-you-type single select backed by an API call. */
export function AsyncSelect({
  value,
  onChange,
  cacheKey,
  fetchOptions,
  placeholder = "Select",
  disabled,
  invalid,
  clearable,
}: SingleProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debounced = useDebounced(search);
  const id = useId();
  const ref = useOutsideClose(() => setOpen(false));
  const { data, isFetching } = useQuery({
    queryKey: ["async-select", cacheKey, debounced],
    queryFn: () => fetchOptions(debounced),
    enabled: open,
    staleTime: 30_000,
  });

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className={triggerClass(invalid, disabled)}
      >
        <span className={cn(!value && "text-zinc-400")}>
          {value?.label ?? placeholder}
        </span>
        <span className="flex items-center gap-1">
          {clearable && value && !disabled && (
            <span
              role="button"
              aria-label="Clear"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              className="rounded p-0.5 text-zinc-400 hover:text-zinc-700"
            >
              <X className="size-3.5" />
            </span>
          )}
          <ChevronDown className="size-4 text-zinc-400" />
        </span>
      </button>
      {open && (
        <div className="absolute z-20 w-full">
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type to search"
            aria-label="Search options"
            className="mt-1 h-9 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm focus:border-teal-600 focus:outline-none"
          />
          <Dropdown
            id={id}
            options={data}
            loading={isFetching}
            isSelected={(o) => o.id === value?.id}
            onPick={(o) => {
              onChange(o);
              setOpen(false);
              setSearch("");
            }}
          />
        </div>
      )}
    </div>
  );
}

interface MultiProps extends BaseProps {
  value: Option[];
  onChange: (options: Option[]) => void;
}

/** Search-as-you-type multi select. Selected items show as removable chips. */
export function AsyncMultiSelect({
  value,
  onChange,
  cacheKey,
  fetchOptions,
  placeholder = "Add",
  disabled,
  invalid,
}: MultiProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debounced = useDebounced(search);
  const id = useId();
  const ref = useOutsideClose(() => setOpen(false));
  const { data, isFetching } = useQuery({
    queryKey: ["async-select", cacheKey, debounced],
    queryFn: () => fetchOptions(debounced),
    enabled: open,
    staleTime: 30_000,
  });
  const selected = new Set(value.map((v) => v.id));

  return (
    <div ref={ref} className="relative">
      <div
        className={cn(
          triggerClass(invalid, disabled),
          "flex-wrap justify-start",
        )}
      >
        {value.map((o) => (
          <span
            key={o.id}
            className="inline-flex items-center gap-1 rounded bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-800"
          >
            {o.label}
            {!disabled && (
              <button
                type="button"
                aria-label={`Remove ${o.label}`}
                onClick={() => onChange(value.filter((v) => v.id !== o.id))}
              >
                <X className="size-3" />
              </button>
            )}
          </span>
        ))}
        <button
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="px-1 text-sm text-teal-700 hover:underline"
        >
          {value.length ? "+ Add" : placeholder}
        </button>
      </div>
      {open && (
        <div className="absolute z-20 w-full">
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type to search"
            aria-label="Search options"
            className="mt-1 h-9 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm focus:border-teal-600 focus:outline-none"
          />
          <Dropdown
            id={id}
            options={data}
            loading={isFetching}
            isSelected={(o) => selected.has(o.id)}
            onPick={(o) =>
              onChange(
                selected.has(o.id)
                  ? value.filter((v) => v.id !== o.id)
                  : [...value, o],
              )
            }
          />
        </div>
      )}
    </div>
  );
}
