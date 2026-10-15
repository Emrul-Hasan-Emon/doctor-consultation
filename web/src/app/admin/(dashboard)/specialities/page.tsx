import { Suspense } from "react";
import type { Metadata } from "next";
import { SpecialityListView } from "@/features/specialities/speciality-list-view";

export const metadata: Metadata = { title: "Specialities" };

export default function Page() {
  return (
    <Suspense>
      <SpecialityListView />
    </Suspense>
  );
}
