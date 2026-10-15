import type { Metadata } from "next";
import { HospitalCreateView } from "@/features/hospitals/hospital-create-view";

export const metadata: Metadata = { title: "New hospital" };

export default function Page() {
  return <HospitalCreateView />;
}
