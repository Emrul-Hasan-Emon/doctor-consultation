# Phase 1: Database design

Status: nearly done. Entities reviewed, migrated and seeded on PostgreSQL 18. Open decisions remain.

## Goal
One schema that serves all four projects and can grow. Shukhee is a source of ideas, not a template. Entities live in `backend/src/database/entities`.

## Design principles
1. **One identity table, many profiles.** Login data lives in `UserAccount`. `AdminUser`, `Doctor`, `DoctorStaff`, `Patient` are profile tables. A new portal or actor type means a new `UserType` and a new profile table, with no change to auth.
2. **Deactivate, do not delete.** Default base entity has no `deletedAt`. Rows use `isActive` or `status`. Soft delete exists only for `UserAccount`, `Patient`, `Chamber`.
3. **No plain UNIQUE on soft-deletable rows.** A soft-deleted row would block reuse. Uniqueness uses a partial unique index `WHERE "deletedAt" IS NULL` (`UserAccount`: type + mobile, type + email).
4. **Snapshot what history depends on.** Appointments copy slot time, duration and fee. Prescription medicines copy name and strength from the catalog. Later edits never rewrite the past.
5. **Rows over JSON for anything searched or reported.** Medicines and prescription lines are rows. JSON is kept only for rare, display-only blobs (`mealInstruction`, `patientDetails`).
6. **Store object keys, not URLs.** Signed URLs are made on read.
7. **Record the real actor.** Admins and staff act for doctors, so audit columns use `ActorType` plus id, and `AuditLog` records the doctor acted for.
8. **Side effects go through an outbox.** SMS is written to `SmsOutbox` in the request transaction and sent by a worker.
9. **Time:** chamber and appointment `date`/`time` columns hold local Asia/Dhaka values. Audit timestamps are UTC.
10. **Schema changes:** migrations only, `synchronize: false`.

## Entities (31)

### Accounts and sessions
| Entity | Notes |
|---|---|
| `UserAccount` | `type`, `mobile`, `email`, `passwordHash` (null for patients), `isActive`, `lastLoginAt`, `tokenVersion` (bump to kill all tokens), `failedLoginCount`, `lockedUntil`. Partial unique indexes on (type, mobile) and (type, email), live rows only. |
| `AuthToken` | One row per session: hash, expiry, `revokedAt`, `selectedDoctorId` (patient's chosen doctor), device. |
| `OtpChallenge` | Hashed code, purpose, expiry, attempts, `consumedAt`. Gives rate limiting a place to live. |
| `AdminUser` | Profile. `AdminRole`: `SUPER_ADMIN`, `ADMIN`. |

### People
| Entity | Notes |
|---|---|
| `Doctor` | Profile. Mobile, email, password are on the account. Unique `bmdcCode`. `consultationDurationMinutes` is a default only. |
| `DoctorStaff` | Profile, belongs to one doctor. |
| `Patient` | Profile, soft delete. Mobile is on the account. Name, division, district, address. |
| `DoctorPatient` | Unique (doctor, patient). `isActive` and `deactivatedAt` replace deleting, so history stays. |
| `Speciality` | `name`/`nameBN`, `prescriptionType`. Single per doctor. |
| `Division`, `District`, `Hospital` | Reference data. |

### Chambers and booking
| Entity | Notes |
|---|---|
| `Chamber` | Now has `name`/`nameBN` (the patient app shows a chamber name), `advanceBookingDays`, soft delete. CHECK ties hospital to `HOSPITAL`. |
| `ChamberDay` | Unique (chamber, weekday), `isOff`. |
| `ChamberTurn` | Adds `slotDurationMinutes`. |
| `DoctorOffDate` | Unique (doctor, date). |
| `Appointment` | Adds `category` (`NEW`/`FOLLOW_UP`), cancelled-by fields. Prescription fields moved off it. Partial unique index on (turn, date, slot) where status is not `CANCELLED` blocks double booking. |
| `AppointmentStatusLog` | Append-only status history. |

### Prescription
| Entity | Notes |
|---|---|
| `Diagnosis` | Header only: status `DRAFT`/`COMPLETED`, meal instruction, follow-up, PDF key and sent times. Unique per appointment. |
| `DiagnosisItem` | Complaint, diagnosis, lab test, advice rows with sort order and optional `code` (ICD-11). |
| `DiagnosisMedicine` | One row per medicine, indexed by `medicineId`. |
| `Vitals`, `PastIllness`, `DrugHistory`, `FamilyHistory`, `MenstrualHistory` | History rows on a shared base. Hard-deleted with the diagnosis. |
| `DoctorSavedItem` | Reusable text per doctor, unique per (doctor, kind, text). |
| `Medicine` | Global catalog. `isActive`, `sourceKey` (import upserts on it), trigram (pg_trgm) indexes on brand and generic name. |
| `DoctorMedicine` | A doctor's saved medicines with default frequency, duration, instruction. |

### Cross-cutting
| Entity | Notes |
|---|---|
| `AuditLog` | Append-only. Actor, on-behalf-of doctor, action, entity, changes, ip. |
| `SmsOutbox` | Pending, sent, failed, attempts, provider id. |

## Review: what changed and why

| # | Problem in the first draft | Change |
|---|---|---|
| 1 | Password, mobile, email copied onto Doctor, Staff, Admin. Three login paths, no shared lockout, token or OTP handling, mobile uniqueness only inside one table. | `UserAccount` plus profiles. |
| 2 | `Patient.mobile` unique plus soft delete: a deleted patient's mobile could never be reused. Same for doctor and staff email. | Generated unique keys on `UserAccount`; soft delete only where needed. |
| 3 | Changing the doctor's consultation duration would shift slot numbers on turns that already have bookings (slot 3 is 10:30 at 15 min but 11:00 at 30). | `ChamberTurn.slotDurationMinutes`, copied when the turn is saved. Doctor value is only a default. |
| 4 | Spec says the patient app shows a "chamber name", but chambers had none. | `Chamber.name`, `nameBN`. |
| 5 | Medicines and prescription lines in JSON: no medication history for a patient, no search or reports, hard to evolve. | `DiagnosisMedicine` and `DiagnosisItem` rows. Also keeps the ICD code that the reference threw away. |
| 6 | PDF link and SMS flags lived on `Appointment`, which should not know about prescriptions. Stored a URL. | Moved to `Diagnosis` (`pdfFileKey`, `smsSentAt`, `textSmsSentAt`) and a `DRAFT`/`COMPLETED` status. |
| 7 | Removing a doctor-patient link lost who had treated whom. | `isActive` and `deactivatedAt`. |
| 8 | `AuthToken` was polymorphic with no FK, and a patient's chosen doctor had nowhere to live. | FK to `UserAccount`, `revokedAt`, `selectedDoctorId`. |
| 9 | No record of who changed what, though admins act for doctors. | `AuditLog`, `AppointmentStatusLog`. |
| 10 | SMS tied to the request. A provider outage would fail bookings and prescriptions. | `SmsOutbox`. |
| 11 | Every table had `deletedAt`, including medical history. | Removed from the default base. |
| 12 | Catalog import in the reference wipes the table. | `Medicine.sourceKey` for upsert, `isActive` to retire items. |
| 13 | Missing indexes for the paginated lists and daily view. | Composite indexes on `DoctorPatient`, `Appointment`, `Patient` location, `Doctor.specialityId`. |
| 14 | Follow-up logic needs to know if an appointment is a follow-up. | `Appointment.category`. |
| 15 | Patients could not book arbitrarily far ahead without a rule. | `Chamber.advanceBookingDays`. |

## Decisions I kept, with reasons
- **Bilingual as `X` / `XBN` columns**, as you asked. Adding a third language would need a schema change. Revisit only if that is likely.
- **Single speciality per doctor.** Many-to-many is a small later change (`DoctorSpeciality` with a primary flag), but then `prescriptionType` needs a rule for which speciality wins.
- **Int ids.** Simple and indexable. Public ids in URLs would leak counts. Add a public `uuid` column later if the patient app needs opaque ids.
- **Money as integer taka.** Single currency.

## Scale notes
- `Appointment`, `AuditLog`, `AppointmentStatusLog`, `SmsOutbox`, `OtpChallenge` grow fastest. Appointment can be partitioned by `appointmentDate`; logs by `createdAt`. Purge `OtpChallenge` and sent `SmsOutbox` rows on a schedule.
- Read replicas: services read through `DatabaseService`, so a replica connection can be added without touching features.
- Slots are computed, never stored, so schedule edits cost nothing at scale.

## Open decisions
1. **History visibility.** A patient can have several doctors. Should doctor A see vitals and history written by doctor B? Default in this design: each doctor sees only their own entries. Sharing would be a policy and consent choice.
2. **OTP:** own `OtpChallenge` (now modeled) or an external OTP service.
3. **Hospital trim** accepted?
4. **Chat, notifications** in scope? Not modeled.
5. **Staff:** may staff manage staff, one doctor per staff, login identifier. With `UserAccount`, a person who is both a doctor and a patient gets two accounts, one per type.
6. **Shared mobile:** one mobile is one patient per doctor-facing flow (unique per type). Families sharing a phone are not supported.
7. **Doctor-level schedule:** chamber turns only (current), or a separate doctor availability table.

## Database engine
PostgreSQL 18, chosen over MySQL for partial unique indexes (double-booking guard, reusable mobile after soft delete), `timestamptz`, `jsonb` and trigram search.

## Verified
- `npm run migration:generate` produced `InitialSchema`; `npm run migration:run` created 31 tables plus the migrations table. Trigram indexes are added by hand in that migration.
- CHECK constraints and partial unique indexes exist.
- `npm run seed` is idempotent: 8 divisions, 64 districts, 12 specialities, one super admin.
- Double booking: 10 parallel requests for the last slot gave exactly one success (`backend/test/appointment-concurrency.mjs`).
- A deleted patient's mobile can be registered again.

## Still open
Task 1.15 (ER diagram and per-table spec), 1.16 (sign-off), and the open decisions above.
