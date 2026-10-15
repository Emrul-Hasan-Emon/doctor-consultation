import { DoctorDetailsView } from "@/features/doctors/doctor-details-view";

export const metadata = { title: "Doctor" };

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DoctorDetailsView id={Number(id)} />;
}
