import { Suspense } from "react";
import { StaffCreateView } from "@/features/doctor-staff/staff-form";

export const metadata = { title: "Add staff" };

export default function Page() {
  return (
    <Suspense>
      <StaffCreateView />
    </Suspense>
  );
}
