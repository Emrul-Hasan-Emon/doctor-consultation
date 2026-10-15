import { Suspense } from "react";
import { BookingWizard } from "@/features/appointments/booking-wizard";

export const metadata = { title: "Book appointment" };

export default function NewAppointmentPage() {
  return (
    <Suspense>
      <BookingWizard />
    </Suspense>
  );
}
