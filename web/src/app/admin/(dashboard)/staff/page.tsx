import { Suspense } from "react";
import { StaffListView } from "@/features/doctor-staff/staff-list-view";

export const metadata = { title: "Doctor staff" };

export default function Page() {
  return (
    <Suspense>
      <StaffListView />
    </Suspense>
  );
}
