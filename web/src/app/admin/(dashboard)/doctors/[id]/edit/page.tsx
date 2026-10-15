import { DoctorEditView } from "@/features/doctors/doctor-form";

export const metadata = { title: "Edit doctor" };

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DoctorEditView id={Number(id)} />;
}
