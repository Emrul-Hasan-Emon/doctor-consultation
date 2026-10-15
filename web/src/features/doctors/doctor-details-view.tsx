"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { DescriptionList } from "@/components/ui/description-list";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabPanel } from "@/components/ui/tabs";
import { ActiveBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { api, errorMessage } from "@/lib/api";
import { bilingual, formatDate } from "@/lib/format";
import type { Doctor } from "@/lib/types";
import { ResetPasswordModal } from "./reset-password-modal";
import { DoctorPatientsTab } from "./doctor-patients-tab";
import { DoctorStaffTab } from "./doctor-staff-tab";
import { DoctorChambersTab } from "./doctor-chambers-tab";
import { DoctorScheduleTab } from "./doctor-schedule-tab";

export function DoctorDetailsView({ id }: { id: number }) {
  const toast = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState("overview");
  const [resetOpen, setResetOpen] = useState(false);
  const [toggleOpen, setToggleOpen] = useState(false);

  const {
    data: d,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["doctor", id],
    queryFn: () => api<Doctor>(`admin/doctor/${id}`),
  });

  const toggle = useMutation({
    mutationFn: (isActive: boolean) =>
      api<Doctor>(`admin/doctor/${id}`, {
        method: "PATCH",
        body: { isActive },
      }),
    onSuccess: async (saved) => {
      await qc.invalidateQueries({ queryKey: ["doctors"] });
      await qc.invalidateQueries({ queryKey: ["doctor", id] });
      toast.success(saved.isActive ? "Doctor activated" : "Doctor deactivated");
      setToggleOpen(false);
    },
    onError: (e) => {
      toast.error(errorMessage(e));
      setToggleOpen(false);
    },
  });

  if (isLoading) return <Spinner />;
  if (error)
    return (
      <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
    );
  if (!d) return null;

  return (
    <>
      <PageHeader
        title={bilingual(d.name, d.nameBN)}
        description={
          d.speciality
            ? bilingual(d.speciality.name, d.speciality.nameBN)
            : undefined
        }
        back={{ href: "/admin/doctors", label: "Doctors" }}
        actions={
          <>
            <ActiveBadge active={d.isActive} />
            <Link href={`/admin/doctors/${id}/edit`}>
              <Button variant="secondary">Edit</Button>
            </Link>
            <Button variant="secondary" onClick={() => setResetOpen(true)}>
              Reset password
            </Button>
            <Button
              variant={d.isActive ? "danger" : "primary"}
              onClick={() => setToggleOpen(true)}
            >
              {d.isActive ? "Deactivate" : "Activate"}
            </Button>
          </>
        }
      />

      <Tabs
        active={tab}
        onChange={setTab}
        items={[
          { key: "overview", label: "Overview" },
          { key: "patients", label: "Patients", count: d.patientCount },
          { key: "staff", label: "Staff", count: d.staffCount },
          { key: "chambers", label: "Chambers", count: d.chamberCount },
          { key: "schedule", label: "Schedule" },
        ]}
      />

      <TabPanel>
        {tab === "overview" && (
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader title="Details" />
              <CardBody>
                <DescriptionList
                  items={[
                    { label: "Name", value: d.name },
                    { label: "Name (Bangla)", value: d.nameBN },
                    {
                      label: "Speciality",
                      value: bilingual(
                        d.speciality?.name,
                        d.speciality?.nameBN,
                      ),
                    },
                    { label: "Mobile", value: d.mobile },
                    { label: "Email", value: d.email },
                    {
                      label: "Degrees",
                      value: bilingual(d.degrees, d.degreesBN),
                    },
                    {
                      label: "Experience",
                      value:
                        d.experience !== null ? `${d.experience} years` : null,
                    },
                    {
                      label: "Working at",
                      value: bilingual(d.workingAt, d.workingAtBN),
                    },
                    { label: "BMDC code", value: d.bmdcCode },
                    {
                      label: "BMDC expiry",
                      value: formatDate(d.bmdcExpiryDate),
                    },
                    {
                      label: "Consultation duration",
                      value: `${d.consultationDurationMinutes} minutes`,
                    },
                    {
                      label: "Default follow-up",
                      value:
                        d.defaultFollowUpDays !== null
                          ? `${d.defaultFollowUpDays} days`
                          : null,
                    },
                    {
                      label: "Account",
                      value: <ActiveBadge active={d.accountActive} />,
                    },
                    { label: "Created", value: formatDate(d.createdAt) },
                  ]}
                />
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Biography" />
              <CardBody className="grid gap-6 text-sm text-zinc-800 md:grid-cols-2">
                <p className="whitespace-pre-line">
                  {d.biography || <span className="text-zinc-400">-</span>}
                </p>
                <p lang="bn" className="whitespace-pre-line">
                  {d.biographyBN || <span className="text-zinc-400">-</span>}
                </p>
              </CardBody>
            </Card>
          </div>
        )}
        {tab === "patients" && <DoctorPatientsTab doctorId={id} />}
        {tab === "staff" && <DoctorStaffTab doctorId={id} />}
        {tab === "chambers" && <DoctorChambersTab doctorId={id} />}
        {tab === "schedule" && <DoctorScheduleTab doctorId={id} />}
      </TabPanel>

      <ResetPasswordModal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        path={`admin/doctor/${id}/reset-password`}
        subject={d.name}
      />
      <ConfirmDialog
        open={toggleOpen}
        title={d.isActive ? "Deactivate doctor" : "Activate doctor"}
        message={
          d.isActive
            ? `${d.name} will be signed out and unable to log in until activated again.`
            : `${d.name} will be able to log in again.`
        }
        confirmLabel={d.isActive ? "Deactivate" : "Activate"}
        danger={d.isActive}
        loading={toggle.isPending}
        onConfirm={() => toggle.mutate(!d.isActive)}
        onClose={() => setToggleOpen(false)}
      />
    </>
  );
}
