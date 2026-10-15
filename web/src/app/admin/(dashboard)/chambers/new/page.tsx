import { ChamberFormView } from "@/features/chambers/chamber-form";

export const metadata = { title: "Add chamber" };

export default async function NewChamberPage({
  searchParams,
}: {
  searchParams: Promise<{ doctorId?: string }>;
}) {
  const { doctorId } = await searchParams;
  const id = Number(doctorId);
  return (
    <ChamberFormView
      doctorId={Number.isInteger(id) && id > 0 ? id : undefined}
    />
  );
}
