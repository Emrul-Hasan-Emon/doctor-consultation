import { ChamberFormView } from "@/features/chambers/chamber-form";

export const metadata = { title: "Edit chamber" };

export default async function EditChamberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ChamberFormView chamberId={Number(id)} />;
}
