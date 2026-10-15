"use client";

import { useState } from "react";
import { Copy, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { WEEKDAYS } from "@/lib/format";
import { cn } from "@/lib/cn";
import {
  emptyTurn,
  newKey,
  turnCapacity,
  type DayDraft,
  type ScheduleErrors,
  type TurnDraft,
} from "./schedule-utils";

interface Props {
  days: DayDraft[];
  onChange: (days: DayDraft[]) => void;
  /** The doctor's consultation duration, null while unknown. */
  defaultSlot: number | null;
  errors: ScheduleErrors;
  showErrors: boolean;
}

export function ScheduleEditor({
  days,
  onChange,
  defaultSlot,
  errors,
  showErrors,
}: Props) {
  const [copyFrom, setCopyFrom] = useState<number | null>(null);
  const [copyTo, setCopyTo] = useState<number[]>([]);

  const patchDay = (weekday: number, patch: Partial<DayDraft>) =>
    onChange(days.map((d) => (d.weekday === weekday ? { ...d, ...patch } : d)));

  const patchTurn = (weekday: number, key: string, patch: Partial<TurnDraft>) =>
    onChange(
      days.map((d) =>
        d.weekday === weekday
          ? {
              ...d,
              turns: d.turns.map((t) =>
                t.key === key ? { ...t, ...patch } : t,
              ),
            }
          : d,
      ),
    );

  const applyCopy = () => {
    const source = days.find((d) => d.weekday === copyFrom);
    if (!source) return;
    onChange(
      days.map((d) =>
        copyTo.includes(d.weekday)
          ? {
              ...d,
              isOff: source.isOff,
              turns: source.turns.map((t) => ({
                ...t,
                key: newKey(),
                id: undefined,
              })),
            }
          : d,
      ),
    );
    setCopyFrom(null);
    setCopyTo([]);
  };

  return (
    <div className="divide-y divide-zinc-100">
      {WEEKDAYS.map((w) => {
        const day = days.find((d) => d.weekday === w.value);
        if (!day) return null;
        const de = errors[w.value];
        return (
          <div key={w.value} className="px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h3 className="w-28 text-sm font-semibold text-zinc-900">
                  {w.en}
                  <span className="ml-1 text-xs font-normal text-zinc-500">
                    {w.bn}
                  </span>
                </h3>
                <button
                  type="button"
                  role="switch"
                  aria-checked={!day.isOff}
                  aria-label={`${w.en} ${day.isOff ? "off, switch to open" : "open, switch to off"}`}
                  onClick={() =>
                    patchDay(
                      w.value,
                      day.isOff ? { isOff: false } : { isOff: true, turns: [] },
                    )
                  }
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600",
                    day.isOff ? "bg-zinc-300" : "bg-teal-600",
                  )}
                >
                  <span
                    className={cn(
                      "inline-block size-5 rounded-full bg-white shadow transition-transform",
                      day.isOff ? "translate-x-0.5" : "translate-x-5.5",
                    )}
                  />
                </button>
                <Badge tone={day.isOff ? "gray" : "green"}>
                  {day.isOff ? "Off" : "Open"}
                </Badge>
              </div>
              <div className="flex gap-2">
                {!day.isOff && (
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        patchDay(w.value, {
                          turns: [...day.turns, emptyTurn()],
                        })
                      }
                    >
                      <Plus className="size-4" aria-hidden />
                      Add turn
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={day.turns.length === 0}
                      onClick={() => {
                        setCopyFrom(copyFrom === w.value ? null : w.value);
                        setCopyTo([]);
                      }}
                    >
                      <Copy className="size-4" aria-hidden />
                      Copy to other days
                    </Button>
                  </>
                )}
              </div>
            </div>

            {copyFrom === w.value && (
              <div className="mt-3 rounded-md border border-teal-200 bg-teal-50 p-3 text-sm">
                <p className="mb-2 text-zinc-700">
                  Copy {w.en}&apos;s turns to (this replaces the turns on the
                  chosen days):
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {WEEKDAYS.filter((o) => o.value !== w.value).map((o) => (
                    <label key={o.value} className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={copyTo.includes(o.value)}
                        onChange={(e) =>
                          setCopyTo(
                            e.target.checked
                              ? [...copyTo, o.value]
                              : copyTo.filter((v) => v !== o.value),
                          )
                        }
                      />
                      {o.en}
                    </label>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    disabled={copyTo.length === 0}
                    onClick={applyCopy}
                  >
                    Copy
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setCopyFrom(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {!day.isOff && day.turns.length === 0 && (
              <p className="mt-3 text-sm text-zinc-500">
                No turns yet. The day counts as open but has nothing to book.
              </p>
            )}

            {showErrors &&
              de?.day.map((m) => (
                <p key={m} role="alert" className="mt-2 text-xs text-red-600">
                  {m}
                </p>
              ))}

            <div className="mt-3 space-y-3">
              {day.turns.map((t, i) => {
                const cap = turnCapacity(t, defaultSlot);
                const te = showErrors ? de?.turns[t.key] : undefined;
                const label = `${w.en} turn ${i + 1}`;
                return (
                  <div
                    key={t.key}
                    className="rounded-md border border-zinc-200 bg-zinc-50 p-3"
                  >
                    <div className="grid grid-cols-2 items-end gap-3 sm:grid-cols-3 lg:grid-cols-[repeat(5,minmax(0,1fr))_auto]">
                      <TurnInput label="Start">
                        <Input
                          type="time"
                          aria-label={`${label} start time`}
                          value={t.startTime}
                          invalid={!!te}
                          onChange={(e) =>
                            patchTurn(w.value, t.key, {
                              startTime: e.target.value,
                            })
                          }
                        />
                      </TurnInput>
                      <TurnInput label="End">
                        <Input
                          type="time"
                          aria-label={`${label} end time`}
                          value={t.endTime}
                          invalid={!!te}
                          onChange={(e) =>
                            patchTurn(w.value, t.key, {
                              endTime: e.target.value,
                            })
                          }
                        />
                      </TurnInput>
                      <TurnInput label="Max patients">
                        <Input
                          type="number"
                          min={1}
                          aria-label={`${label} max patients`}
                          value={t.maxPatients}
                          invalid={!!te}
                          onChange={(e) =>
                            patchTurn(w.value, t.key, {
                              maxPatients: e.target.value,
                            })
                          }
                        />
                      </TurnInput>
                      <TurnInput label="Fee (৳)">
                        <Input
                          type="number"
                          min={0}
                          aria-label={`${label} fee`}
                          value={t.fee}
                          invalid={!!te}
                          onChange={(e) =>
                            patchTurn(w.value, t.key, { fee: e.target.value })
                          }
                        />
                      </TurnInput>
                      <TurnInput label="Slot (min)">
                        <Input
                          type="number"
                          min={1}
                          aria-label={`${label} slot duration in minutes`}
                          placeholder={defaultSlot ? String(defaultSlot) : ""}
                          value={t.slotDurationMinutes}
                          invalid={!!te}
                          onChange={(e) =>
                            patchTurn(w.value, t.key, {
                              slotDurationMinutes: e.target.value,
                            })
                          }
                        />
                      </TurnInput>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Remove ${label}`}
                        onClick={() =>
                          patchDay(w.value, {
                            turns: day.turns.filter((x) => x.key !== t.key),
                          })
                        }
                      >
                        <Trash2 className="size-4 text-red-600" aria-hidden />
                      </Button>
                    </div>
                    <p className="mt-2 text-xs text-zinc-600">
                      {cap.fit === null
                        ? "Select a doctor and valid times to see slot capacity."
                        : `${cap.fit} slot${cap.fit === 1 ? "" : "s"} fit, bookable ${cap.bookable ?? 0}`}
                    </p>
                    {te?.map((m) => (
                      <p
                        key={m}
                        role="alert"
                        className="mt-1 text-xs text-red-600"
                      >
                        {m}
                      </p>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TurnInput({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-zinc-600">{label}</span>
      {children}
    </div>
  );
}
