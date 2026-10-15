import { AppointmentDetailView } from "@/features/appointments/appointment-detail-view";

export const metadata = { title: "Appointment" };

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AppointmentDetailView id={Number(id)} />;
}
