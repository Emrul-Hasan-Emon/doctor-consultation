import type { Metadata } from "next";
import { HospitalEditView } from "@/features/hospitals/hospital-edit-view";

export const metadata: Metadata = { title: "Edit hospital" };

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <HospitalEditView id={id} />;
}
