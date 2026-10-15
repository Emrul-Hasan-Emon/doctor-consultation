import { Suspense } from "react";
import { ChamberListView } from "@/features/chambers/chamber-list-view";

export const metadata = { title: "Chambers" };

export default function ChambersPage() {
  return (
    <Suspense>
      <ChamberListView />
    </Suspense>
  );
}
