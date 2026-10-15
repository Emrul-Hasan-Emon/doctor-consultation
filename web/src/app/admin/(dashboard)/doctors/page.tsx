import { Suspense } from "react";
import { DoctorListView } from "@/features/doctors/doctor-list-view";

export const metadata = { title: "Doctors" };

export default function Page() {
  return (
    <Suspense>
      <DoctorListView />
    </Suspense>
  );
}
