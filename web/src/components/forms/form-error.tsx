import { errorMessage } from "@/lib/api";

/** Shows a failed mutation above the form buttons. */
export function FormError({ error }: { error: unknown }) {
  if (!error) return null;
  return (
    <div
      role="alert"
      className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {errorMessage(error)}
    </div>
  );
}
