import type { ReactNode } from "react";
import { Providers } from "@/components/providers";

/** Every admin page lives under /admin. Future portals get their own top-level folder. */
export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <Providers>{children}</Providers>;
}
