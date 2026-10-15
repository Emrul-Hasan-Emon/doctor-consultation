import { StaffEditView } from "@/features/doctor-staff/staff-form";

export const metadata = { title: "Edit staff" };

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StaffEditView id={Number(id)} />;
}
