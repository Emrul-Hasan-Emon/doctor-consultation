/** Mirrors docs/api/admin-api-contract.md. Keep in sync with the backend. */

export interface Ref {
  id: number;
  name: string;
  nameBN: string | null;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PageMeta;
}

export type PrescriptionType = "GENERAL" | "NUTRITIONIST" | "OTHER";
export type ChamberType = "SELF" | "HOSPITAL";
export type AppointmentStatus =
  "SCHEDULED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";
export type ActorType = "ADMIN" | "DOCTOR" | "DOCTOR_STAFF" | "PATIENT";

export interface AdminMe {
  accountId: number;
  type: "ADMIN";
  profileId: number;
  name: string;
  mobile: string;
  email: string | null;
}

export type Division = Ref;
export interface District extends Ref {
  divisionId: number;
}

export interface Speciality {
  id: number;
  name: string;
  nameBN: string | null;
  title: string | null;
  titleBN: string | null;
  value: string;
  icon: string | null;
  prescriptionType: PrescriptionType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Hospital {
  id: number;
  name: string;
  nameBN: string | null;
  alias: string | null;
  aliasBN: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  addressBN: string | null;
  description: string | null;
  descriptionBN: string | null;
  banner: string | null;
  icon: string | null;
  status: boolean;
  divisionId: number;
  districtId: number;
  division: Ref;
  district: Ref;
  createdAt: string;
  updatedAt: string;
}

export interface Medicine {
  id: number;
  manufacturer: string;
  brandName: string;
  genericName: string;
  strength: string | null;
  dosage: string;
  dar: string;
  isChronic: boolean;
  isActive: boolean;
  sourceKey: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MedicineImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: { index: number; message: string }[];
}

export interface Doctor {
  id: number;
  accountId: number;
  name: string;
  nameBN: string | null;
  mobile: string;
  email: string | null;
  profilePic: string | null;
  signatureUrl: string | null;
  degrees: string | null;
  degreesBN: string | null;
  experience: number | null;
  bmdcCode: string | null;
  bmdcExpiryDate: string | null;
  workingAt: string | null;
  workingAtBN: string | null;
  biography: string | null;
  biographyBN: string | null;
  consultationDurationMinutes: number;
  defaultFollowUpDays: number | null;
  isActive: boolean;
  accountActive: boolean;
  specialityId: number | null;
  speciality: Ref | null;
  patientCount: number;
  staffCount: number;
  chamberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorOption {
  id: number;
  name: string;
  nameBN: string | null;
  specialityName: string | null;
}

export interface DoctorPatientLink {
  linkId: number;
  patientId: number;
  name: string;
  nameBN: string | null;
  mobile: string;
  division: Ref;
  district: Ref;
  linkedAt: string;
}

export interface DoctorStaff {
  id: number;
  accountId: number;
  doctorId: number;
  doctor: Ref;
  name: string;
  nameBN: string | null;
  mobile: string;
  email: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Patient {
  id: number;
  accountId: number;
  name: string;
  nameBN: string | null;
  mobile: string;
  divisionId: number;
  districtId: number;
  division: Ref;
  district: Ref;
  address: string | null;
  addressBN: string | null;
  isActive: boolean;
  createdByType: ActorType;
  doctors: { doctorId: number; name: string; nameBN: string | null }[];
  createdAt: string;
  updatedAt: string;
}

export interface PatientDoctorLink {
  linkId: number;
  doctorId: number;
  name: string;
  nameBN: string | null;
  mobile: string;
  speciality: Ref | null;
  isActive: boolean;
  linkedAt: string;
}

export interface Turn {
  id?: number;
  startTime: string;
  endTime: string;
  maxPatients: number;
  fee: number;
  slotDurationMinutes?: number;
  isActive?: boolean;
  sortOrder?: number;
  slotCapacity?: number;
}

export interface ChamberDay {
  weekday: number;
  isOff: boolean;
  turns: Turn[];
}

export interface ChamberListItem {
  id: number;
  name: string | null;
  nameBN: string | null;
  chamberType: ChamberType;
  doctor: Ref;
  hospital: Ref | null;
  division: Ref;
  district: Ref;
  address: string;
  isActive: boolean;
  openDays: number[];
}

export interface Chamber {
  id: number;
  doctorId: number;
  doctor: Ref;
  name: string | null;
  nameBN: string | null;
  chamberType: ChamberType;
  hospitalId: number | null;
  hospital: Ref | null;
  divisionId: number;
  districtId: number;
  division: Ref;
  district: Ref;
  address: string;
  addressBN: string | null;
  description: string | null;
  descriptionBN: string | null;
  advanceBookingDays: number;
  isActive: boolean;
  days: ChamberDay[];
  createdAt: string;
  updatedAt: string;
}

export interface OffDate {
  id: number;
  date: string;
  reason: string | null;
  reasonBN: string | null;
}

export interface TurnAvailability {
  turnId: number;
  startTime: string;
  endTime: string;
  fee: number;
  slotDurationMinutes: number;
  capacity: number;
  booked: number;
  remaining: number;
}

export interface DailyDoctor {
  doctor: Ref & { speciality: Ref | null };
  offDate: {
    id: number;
    reason: string | null;
    reasonBN: string | null;
  } | null;
  chambers: {
    chamber: {
      id: number;
      name: string | null;
      nameBN: string | null;
      chamberType: ChamberType;
      hospital: Ref | null;
      address: string;
    };
    isOff: boolean;
    turns: TurnAvailability[];
  }[];
}

export interface DailySchedule {
  date: string;
  weekday: number;
  doctors: DailyDoctor[];
}

export interface DoctorScheduleOverview {
  doctor: Ref & { consultationDurationMinutes: number };
  chambers: Chamber[];
  offDates: OffDate[];
}

export type ClosedReason =
  "DOCTOR_OFF" | "CHAMBER_OFF" | "NO_TURNS" | "PAST" | "OUT_OF_WINDOW";

export interface AvailabilityDay {
  date: string;
  weekday: number;
  isOpen: boolean;
  closedReason: ClosedReason | null;
  turns: TurnAvailability[];
}

export interface SlotInfo {
  slotNumber: number;
  startTime: string;
  endTime: string;
  status: "FREE" | "BOOKED" | "PAST";
  appointment: {
    id: number;
    status: AppointmentStatus;
    patientName: string;
    patientMobile: string;
  } | null;
}

export interface AppointmentListItem {
  id: number;
  appointmentDate: string;
  slotNumber: number;
  slotStartTime: string;
  slotEndTime: string;
  status: AppointmentStatus;
  category: "NEW" | "FOLLOW_UP";
  fee: number;
  patient: { id: number; name: string; nameBN: string | null; mobile: string };
  doctor: Ref;
  chamber: {
    id: number;
    name: string | null;
    nameBN: string | null;
    chamberType: ChamberType;
    hospital: Ref | null;
  };
  bookedByType: ActorType;
  createdAt: string;
}

export interface AppointmentDetail extends AppointmentListItem {
  patientDetails: Record<string, unknown> | null;
  durationMinutes: number;
  chamberTurn: { id: number; startTime: string; endTime: string };
  cancelledAt: string | null;
  cancelReason: string | null;
  cancelledByType: ActorType | null;
  completedAt: string | null;
  statusLog: {
    fromStatus: AppointmentStatus | null;
    toStatus: AppointmentStatus;
    actorType: ActorType;
    actorId: number;
    reason: string | null;
    createdAt: string;
  }[];
}

export interface DashboardSummary {
  doctors: number;
  patients: number;
  hospitals: number;
  activeChambers: number;
  today: {
    total: number;
    scheduled: number;
    completed: number;
    cancelled: number;
    noShow: number;
  };
  next7Days: number;
  recent: AppointmentListItem[];
}
