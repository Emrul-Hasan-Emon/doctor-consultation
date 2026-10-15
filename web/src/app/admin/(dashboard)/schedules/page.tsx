import { Suspense } from "react";
import { DailyView } from "@/features/schedules/daily-view";

export const metadata = { title: "Daily schedule" };

export default function SchedulesPage() {
  return (
    <Suspense>
      <DailyView />
    </Suspense>
  );
}
