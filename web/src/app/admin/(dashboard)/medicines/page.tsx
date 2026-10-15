import { Suspense } from "react";
import type { Metadata } from "next";
import { MedicineListView } from "@/features/medicines/medicine-list-view";

export const metadata: Metadata = { title: "Medicines" };

export default function Page() {
  return (
    <Suspense>
      <MedicineListView />
    </Suspense>
  );
}
