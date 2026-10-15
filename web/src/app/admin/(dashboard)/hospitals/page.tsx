import { Suspense } from "react";
import type { Metadata } from "next";
import { HospitalListView } from "@/features/hospitals/hospital-list-view";

export const metadata: Metadata = { title: "Hospitals" };

export default function Page() {
  return (
    <Suspense>
      <HospitalListView />
    </Suspense>
  );
}
