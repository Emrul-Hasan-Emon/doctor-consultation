"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { DescriptionList } from "@/components/ui/description-list";
import { PageHeader } from "@/components/ui/page-header";
import { ActiveBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import { Spinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { AsyncMultiSelect, type Option } from "@/components/forms/async-select";
import { FormError } from "@/components/forms/form-error";
import { api, errorMessage } from "@/lib/api";
import { bilingual, formatDate, formatDateTime } from "@/lib/format";
import type { Paginated, Patient, PatientDoctorLink } from "@/lib/types";
import { fetchDoctorOptions } from "./doctor-options";

function ManageDoctorsModal({
  patient,
  open,
  onClose,
}: {
  patient: Patient;
  open: boolean;
  onClose: () => void;
}) {
  const toast = useToast();
  const qc = useQueryClient();
  const [value, setValue] = useState<Option[]>(() =>
    patient.doctors.map((d) => ({ id: d.doctorId, label: d.name })),
  );
  const [empty, setEmpty] = useState(false);

  const save = useMutation({
    mutationFn: () =>
      api<void>(`admin/patient/${patient.id}/doctors`, {
        method: "PUT",
        body: { doctorIds: value.map((v) => v.id) },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patient", patient.id] });
      qc.invalidateQueries({ queryKey: ["patient-doctors", patient.id] });
      qc.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Doctors updated");
      onClose();
    },
  });

  return (
    <Modal open={open} title="Manage doctors" onClose={onClose}>
      <div className="flex min-h-64 flex-col gap-4">
        <AsyncMultiSelect
          cacheKey="patient-manage-doctors"
          fetchOptions={fetchDoctorOptions}
          value={value}
          invalid={empty}
          onChange={(v) => {
            setValue(v);
            setEmpty(false);
          }}
        />
        {empty && (
          <p role="alert" className="text-xs text-red-600">
            Select at least one doctor
          </p>
        )}
        <FormError error={save.error} />
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={save.isPending}
          >
            Cancel
          </Button>
          <Button
            loading={save.isPending}
            onClick={() => {
              if (value.length === 0) return setEmpty(true);
              save.mutate();
            }}
          >
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function PatientDetailView({ id }: { id: number }) {
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [managing, setManaging] = useState(false);
  const [removing, setRemoving] = useState<PatientDoctorLink | null>(null);
  const [deleting, setDeleting] = useState(false);

  const patient = useQuery({
    queryKey: ["patient", id],
    queryFn: () => api<Patient>(`admin/patient/${id}`),
  });
  const doctors = useQuery({
    queryKey: ["patient-doctors", id, page],
    queryFn: () =>
      api<Paginated<PatientDoctorLink>>(`admin/patient/${id}/doctors`, {
        query: { page, limit: 10 },
      }),
    placeholderData: (prev) => prev,
  });

  const remove = useMutation({
    mutationFn: (doctorId: number) =>
      api<void>(`admin/patient/${id}/doctors/${doctorId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patient", id] });
      qc.invalidateQueries({ queryKey: ["patient-doctors", id] });
      qc.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Doctor removed");
      setRemoving(null);
      setPage(1);
    },
  });

  const del = useMutation({
    mutationFn: () => api<void>(`admin/patient/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      qc.removeQueries({ queryKey: ["patient", id] });
      toast.success("Patient deleted");
      router.push("/admin/patients");
    },
  });

  if (patient.error)
    return (
      <ErrorState
        message={errorMessage(patient.error)}
        onRetry={() => patient.refetch()}
      />
    );
  if (!patient.data) return <Spinner />;
  const p = patient.data;

  const columns: Column<PatientDoctorLink>[] = [
    {
      header: "Doctor",
      cell: (d) => (
        <Link
          href={`/admin/doctors/${d.doctorId}`}
          className="font-medium text-teal-700 hover:underline"
        >
          {bilingual(d.name, d.nameBN)}
        </Link>
      ),
    },
    { header: "Speciality", cell: (d) => d.speciality?.name ?? "" },
    { header: "Mobile", cell: (d) => d.mobile },
    { header: "Linked", cell: (d) => formatDate(d.linkedAt) },
    {
      header: "Actions",
      className: "text-right",
      cell: (d) => (
        <Button
          size="sm"
          variant="ghost"
          aria-label={`Remove ${d.name}`}
          onClick={() => {
            remove.reset();
            setRemoving(d);
          }}
        >
          Remove
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={bilingual(p.name, p.nameBN)}
        description={p.mobile}
        back={{ href: "/admin/patients", label: "Patients" }}
        actions={
          <>
            <Link href={`/admin/patients/${id}/edit`}>
              <Button variant="secondary">Edit</Button>
            </Link>
            <Button
              variant="danger"
              onClick={() => {
                del.reset();
                setDeleting(true);
              }}
            >
              Delete patient
            </Button>
          </>
        }
      />
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader title="Profile" />
          <CardBody>
            <DescriptionList
              items={[
                { label: "Status", value: <ActiveBadge active={p.isActive} /> },
                { label: "Mobile", value: p.mobile },
                {
                  label: "Division",
                  value: bilingual(p.division?.name, p.division?.nameBN),
                },
                {
                  label: "District",
                  value: bilingual(p.district?.name, p.district?.nameBN),
                },
                { label: "Address", value: p.address },
                { label: "Address (Bangla)", value: p.addressBN },
                { label: "Created by", value: p.createdByType },
                { label: "Created", value: formatDateTime(p.createdAt) },
                { label: "Updated", value: formatDateTime(p.updatedAt) },
              ]}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Doctors"
            actions={
              <Button size="sm" onClick={() => setManaging(true)}>
                Manage doctors
              </Button>
            }
          />
          <DataTable
            columns={columns}
            rows={doctors.data?.items}
            rowKey={(d) => d.linkId}
            loading={doctors.isLoading || doctors.isFetching}
            error={doctors.error ? errorMessage(doctors.error) : null}
            onRetry={() => doctors.refetch()}
            empty={{ title: "No doctors linked" }}
          />
          {doctors.data && (
            <Pagination meta={doctors.data.meta} onPage={setPage} />
          )}
        </Card>
      </div>

      {managing && (
        <ManageDoctorsModal
          key={p.updatedAt + p.doctors.map((d) => d.doctorId).join(",")}
          patient={p}
          open
          onClose={() => setManaging(false)}
        />
      )}

      <ConfirmDialog
        open={!!removing}
        title="Remove doctor"
        danger
        confirmLabel="Remove"
        loading={remove.isPending}
        onClose={() => setRemoving(null)}
        onConfirm={() => removing && remove.mutate(removing.doctorId)}
        message={
          <div className="flex flex-col gap-3">
            <p>
              Unlink {removing?.name} from this patient. The last remaining
              doctor cannot be removed.
            </p>
            <FormError error={remove.error} />
          </div>
        }
      />
      <ConfirmDialog
        open={deleting}
        title="Delete patient"
        danger
        confirmLabel="Delete"
        loading={del.isPending}
        onClose={() => setDeleting(false)}
        onConfirm={() => del.mutate()}
        message={
          <div className="flex flex-col gap-3">
            <p>
              This is a soft delete: the patient is hidden from the portal but
              the record is kept. It is refused when the patient has future
              scheduled appointments.
            </p>
            <FormError error={del.error} />
          </div>
        }
      />
    </>
  );
}
