import { Suspense } from "react";
import { AppointmentsView } from "@/features/appointments/appointments-view";

export const metadata = { title: "Appointments" };

export default function AppointmentsPage() {
  return (
    <Suspense>
      <AppointmentsView />
    </Suspense>
  );
}
