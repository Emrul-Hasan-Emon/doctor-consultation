# Phase Tracker

Single source of truth for progress. Tick a box only when the work is done **and** verified.
Each phase has a detail file in [`phases/`](phases/) describing what was done and how.
Update both in the same change.

Last updated: 2026-10-08

## Overview

| # | Phase | Done / Total | Progress | Detail |
|---|-------|--------------|----------|--------|
| 0 | Setup and reference audit | 9 / 9 | 100% | [phase-00](phases/phase-00-setup-and-audit.md) |
| 1 | Database design | 13 / 16 | 81% | [phase-01](phases/phase-01-database-design.md) |
| 2 | Backend core | 9 / 13 | 69% | [phase-02](phases/phase-02-backend-core.md) |
| 3 | Chamber and schedule | 8 / 9 | 89% | [phase-03](phases/phase-03-chamber-and-schedule.md) |
| 4 | Appointment booking engine | 6 / 8 | 75% | [phase-04](phases/phase-04-appointment-engine.md) |
| 5 | Prescription | 1 / 9 | 11% | [phase-05](phases/phase-05-prescription.md) |
| 6 | Admin portal (web) | 10 / 10 | 100% | [phase-06](phases/phase-06-admin-portal.md) |
| 7 | Doctor web portal | 0 / 9 | 0% | [phase-07](phases/phase-07-doctor-web.md) |
| 8 | Doctor app (Flutter) | 0 / 11 | 0% | [phase-08](phases/phase-08-doctor-app.md) |
| 9 | Patient app (Flutter) | 0 / 8 | 0% | [phase-09](phases/phase-09-patient-app.md) |
| 10 | Hardening and release | 0 / 7 | 0% | [phase-10](phases/phase-10-hardening-and-release.md) |

Overall: 56 / 109 tasks (51%). Backend admin API and the whole admin portal are done and verified in a browser. Doctor, staff and patient actors, prescription and the mobile apps remain.

---

## Phase 0: Setup and reference audit (100%)

- [x] 0.1 Audit `shukhee-api` (stack, entities, auth, appointment, schedule)
- [x] 0.2 Audit `shukhee-doctor-app` (stack, screens, reusable vs droppable)
- [x] 0.3 `git init` in the repo root
- [x] 0.4 Scaffold `backend/` (NestJS)
- [x] 0.5 Scaffold `web/` (Next.js; `/admin` and `/doctor` route skeletons)
- [x] 0.6 Scaffold `doctor/` (Flutter)
- [x] 0.7 Scaffold `patient/` (Flutter)
- [x] 0.8 Backend database layer and per-actor feature modules
- [x] 0.9 Phase tracker and phase docs

## Phase 1: Database design (81%)

- [x] 1.1 Conventions fixed (int ids, soft delete, `BN` suffix, local time columns, no `synchronize`)
- [x] 1.2 Identity tables drafted: `UserAccount`, `AdminUser`, `AuthToken`, `OtpChallenge`
- [x] 1.3 Location tables: `Division`, `District`
- [x] 1.4 Doctor domain drafted: `Speciality`, `Doctor`, `DoctorStaff`, `DoctorOffDate`
- [x] 1.5 `Hospital` drafted (trimmed from reference)
- [x] 1.6 Patient domain drafted: `Patient`, `DoctorPatient`
- [x] 1.7 Chamber domain drafted: `Chamber`, `ChamberDay`, `ChamberTurn`
- [x] 1.8 `Appointment` drafted with double-booking guard
- [x] 1.9 Prescription entities drafted (`Diagnosis`, five history tables, saved items, medicine catalog)
- [x] 1.10 Design review and scalability pass (accounts, audit, outbox, rows over JSON, slot duration per turn)
- [ ] 1.11 Patient OTP: confirm own `OtpChallenge` or external service
- [x] 1.12 Schema validated on PostgreSQL 18 (partial unique indexes, CHECK constraints, trigram indexes)
- [x] 1.13 Initial migration generated and run
- [x] 1.14 Seeds: divisions, districts, specialities, admin user
- [ ] 1.15 ER diagram and per-table spec, open decisions resolved (see phase doc)
- [ ] 1.16 Sign-off, schema frozen

## Phase 2: Backend core (69%)

- [x] 2.1 Config and env validation (`JWT_SECRET` length check)
- [x] 2.2 Validation pipe (whitelist, forbid unknown), DB error filter (unique, FK, check to 409/400), pagination shape, Swagger at `/api/docs`
- [x] 2.3 Auth: admin login, refresh with rotation, logout, me; lockout after 5 failures; rate limits
- [ ] 2.4 Auth: doctor login, refresh, password reset
- [ ] 2.5 Auth: doctor-staff login
- [ ] 2.6 Auth: patient lookup, OTP, login with doctor selection
- [x] 2.7 Guards: JWT guard with revocation check, fail-closed roles guard, actor carries `doctorId` (own, staff's doctor, or patient's selected doctor)
- [x] 2.8 Admin: speciality, hospital, location
- [x] 2.9 Admin: doctor CRUD, reset password, activate and deactivate
- [x] 2.10 Admin: doctor staff CRUD on behalf of a doctor
- [x] 2.11 Admin: patient CRUD, doctor links, soft delete
- [x] 2.12 Paginated doctor-patients and patient-doctors lists
- [ ] 2.13 Doctor and patient actor routes for master data, patients (doctor creates and lists), own staff


## Phase 3: Chamber and schedule (89%)

- [x] 3.1 Chamber CRUD with `SELF`/`HOSPITAL` validation (service and DB CHECK)
- [x] 3.2 Day-wise config and turns, overlap and capacity validation
- [x] 3.3 Admin manages chambers on behalf of doctors, audited
- [x] 3.4 Doctor consultation duration (default copied to each turn)
- [x] 3.5 Doctor off-dates, with optional cancel of existing appointments
- [x] 3.6 Schedule overview for one doctor
- [x] 3.7 Admin daily schedule view with occupancy
- [x] 3.8 Turn edit rules when bookings exist
- [ ] 3.9 Doctor and staff routes for own chambers, schedule and off-dates (reuse the shared chamber service)


## Phase 4: Appointment booking engine (75%)

- [x] 4.1 Server-side slot generation (`modules/schedule/utils/slots.ts`)
- [x] 4.2 Availability by chamber and date range, slots per turn
- [x] 4.3 Booking in one transaction with a turn row lock and capacity check
- [x] 4.4 Booking rules (doctor link, open day, off-date, window, past, one live booking per patient per turn)
- [x] 4.5 Cancel and status transitions with status log
- [ ] 4.6 Per-actor listing: admin done, doctor and patient pending
- [x] 4.7 Concurrency test: 10 parallel bookings of the last slot, one wins
- [ ] 4.8 Asia/Dhaka boundary tests (midnight, `nowMinutesDhaka`)


## Phase 5: Prescription (0%)

- [x] 5.1 Medicine catalog: admin CRUD and upsert-based bulk import
- [ ] 5.2 Doctor medicine search (brand/generic, trigram) and saved medicines
- [ ] 5.3 Get-or-create draft per appointment, ownership checked
- [ ] 5.4 Autosave, ownership checked on every route
- [ ] 5.5 History rows: vitals, past illness, drug, family, menstrual, plus patient-wide paginated lists
- [ ] 5.6 Doctor saved items (complaint, diagnosis, lab test, advice)
- [ ] 5.7 Complete: PDF, appointment `COMPLETED`, `prescriptionLink`
- [ ] 5.8 Send link and medicine text by SMS
- [ ] 5.9 Tests: wrong doctor, staff, draft resume, complete failure leaves appointment unchanged

## Phase 6: Admin portal (100%)

- [x] 6.1 Cookie session through a same-origin proxy, silent refresh, route gate under `/admin`
- [x] 6.2 Doctors list, form, details (overview, patients, staff, chambers, schedule tabs)
- [x] 6.3 Patients list, form, details with paginated doctors and manage-doctors
- [x] 6.4 Hospitals
- [x] 6.5 Specialities (including prescription type)
- [x] 6.6 Chambers and weekly turn editor
- [x] 6.7 Doctor schedule management (off-dates on the doctor page)
- [x] 6.8 Daily schedule view with slot modal
- [x] 6.9 Appointments: list, booking wizard, details, cancel, status
- [x] 6.10 Medicine catalog with CSV import


## Phase 7: Doctor web portal (0%)

- [ ] 7.1 Auth (doctor and staff), route protection under `/doctor`
- [ ] 7.2 Profile and signature
- [ ] 7.3 Patients: create, list, read-only details
- [ ] 7.4 Chambers and turns
- [ ] 7.5 Schedule and off-dates
- [ ] 7.6 Staff management
- [ ] 7.7 Appointments list and details
- [ ] 7.8 Prescription editor
- [ ] 7.9 Prescription view, PDF, send

## Phase 8: Doctor app (0%)

- [ ] 8.1 Project structure, theme, EN/BN i18n
- [ ] 8.2 API layer and auth (doctor and staff login)
- [ ] 8.3 Profile
- [ ] 8.4 Patients: create, list
- [ ] 8.5 Chambers and turns
- [ ] 8.6 Schedule and off-dates
- [ ] 8.7 Staff management
- [ ] 8.8 Appointments list and details
- [ ] 8.9 Prescription editor
- [ ] 8.10 Prescription view and send
- [ ] 8.11 Release build

## Phase 9: Patient app (0%)

- [ ] 9.1 Project structure, theme, EN/BN i18n
- [ ] 9.2 Login: mobile, OTP, doctor selection
- [ ] 9.3 Doctor context and doctor info
- [ ] 9.4 Chambers list
- [ ] 9.5 Booking flow: chamber, date, turn, slot
- [ ] 9.6 My appointments, cancel
- [ ] 9.7 Switch doctor
- [ ] 9.8 Release build

## Phase 10: Hardening and release (0%)

- [ ] 10.1 Role-permission test matrix (admin, doctor, staff, patient)
- [ ] 10.2 Security review (auth, rate limits, OTP abuse)
- [ ] 10.3 Backend e2e tests
- [ ] 10.4 CI
- [ ] 10.5 Deployment and environments
- [ ] 10.6 Backups and migration runbook
- [ ] 10.7 Final QA
