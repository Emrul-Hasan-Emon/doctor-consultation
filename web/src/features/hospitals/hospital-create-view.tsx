"use client";

import { PageHeader } from "@/components/ui/page-header";
import { HospitalForm } from "./hospital-form";

export function HospitalCreateView() {
  return (
    <>
      <PageHeader
        title="New hospital"
        back={{ href: "/admin/hospitals", label: "Hospitals" }}
      />
      <HospitalForm />
    </>
  );
}
