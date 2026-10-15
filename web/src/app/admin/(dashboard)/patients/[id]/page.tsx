import { PatientDetailView } from "@/features/patients/patient-detail-view";

export const metadata = { title: "Patient" };

export default async function PatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PatientDetailView id={Number(id)} />;
}
