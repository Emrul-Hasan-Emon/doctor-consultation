import { PatientForm } from "@/features/patients/patient-form";

export const metadata = { title: "Edit patient" };

export default async function EditPatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PatientForm id={Number(id)} />;
}
