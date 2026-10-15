"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/badge";
import { api, errorMessage } from "@/lib/api";
import { formatTime } from "@/lib/format";
import type { SlotInfo } from "@/lib/types";

export interface SlotTarget {
  doctorId: number;
  chamberId: number;
  turnId: number;
  date: string;
  title: string;
}

export function SlotsModal({
  target,
  onClose,
}: {
  target: SlotTarget | null;
  onClose: () => void;
}) {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["schedule", "slots", target?.turnId, target?.date],
    queryFn: () =>
      api<{ turnId: number; date: string; slots: SlotInfo[] }>(
        "admin/appointment/slots",
        { query: { turnId: target?.turnId, date: target?.date } },
      ),
    enabled: !!target,
  });

  return (
    <Modal
      open={!!target}
      title={target ? `Slots: ${target.title}` : "Slots"}
      onClose={onClose}
      size="lg"
    >
      {isLoading && <Spinner />}
      {error && (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      )}
      {data && data.slots.length === 0 && (
        <p className="text-sm text-zinc-500">This turn has no slots.</p>
      )}
      {data && target && data.slots.length > 0 && (
        <ul className="divide-y divide-zinc-100 text-sm">
          {data.slots.map((s) => (
            <li
              key={s.slotNumber}
              className="flex flex-wrap items-center gap-3 py-2"
            >
              <span className="w-8 text-zinc-500">#{s.slotNumber}</span>
              <span className="w-36 font-medium">
                {formatTime(s.startTime)} - {formatTime(s.endTime)}
              </span>
              {s.status === "FREE" && <Badge tone="green">Free</Badge>}
              {s.status === "PAST" && <Badge tone="gray">Past</Badge>}
              {s.status === "BOOKED" && <Badge tone="blue">Booked</Badge>}
              {s.status === "BOOKED" && s.appointment && (
                <span className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/appointments/${s.appointment.id}`}
                    className="text-teal-700 hover:underline"
                  >
                    {s.appointment.patientName}
                  </Link>
                  <span className="text-zinc-500">
                    {s.appointment.patientMobile}
                  </span>
                  <StatusBadge status={s.appointment.status} />
                </span>
              )}
              {s.status === "FREE" && (
                <Link
                  className="ml-auto text-teal-700 hover:underline"
                  href={`/admin/appointments/new?${new URLSearchParams({
                    doctorId: String(target.doctorId),
                    chamberId: String(target.chamberId),
                    turnId: String(target.turnId),
                    date: target.date,
                    slotNumber: String(s.slotNumber),
                  }).toString()}`}
                >
                  Book
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
