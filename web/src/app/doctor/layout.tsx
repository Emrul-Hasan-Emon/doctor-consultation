import type { ReactNode } from "react";

/** Every doctor web page lives under /doctor. Doctor staff sign in here too. */
export default function DoctorRootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
