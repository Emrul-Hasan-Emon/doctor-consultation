import { Suspense } from "react";
import { PatientsView } from "@/features/patients/patients-view";

export const metadata = { title: "Patients" };

export default function PatientsPage() {
  return (
    <Suspense>
      <PatientsView />
    </Suspense>
  );
}
