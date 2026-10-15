# Phase 2: Backend core

Status: admin part done. Doctor, staff and patient actors pending.

## Goal
Auth, guards and the shared master data and people modules, implemented per actor.

## Planned approach
- Response shape, validation pipe, error filter, env validation.
- Every actor logs in through `UserAccount` (one login service, per-type profile lookup). Lockout uses `failedLoginCount` and `lockedUntil`. Bumping `tokenVersion` or setting `revokedAt` ends sessions.
- JWT access plus refresh (`AuthToken` stores a hash, not the token). Patient sessions store `selectedDoctorId`.
- Creating a doctor, staff or patient creates the `UserAccount` and profile in one transaction. Mobile is normalized to `01XXXXXXXXX` first.
- Writes by admin or staff on a doctor's behalf go to `AuditLog`. Token payload: `type`, `id`, and `doctorId` for staff and for the selected doctor on patient tokens.
- `ActorContext` resolver gives `actorType`, `actorId`, `effectiveDoctorId`. Staff `doctorId` is read from the DB. Every doctor-scoped query uses `effectiveDoctorId` only.
- Doctor-created patients are linked to `effectiveDoctorId`, ignoring any `doctorId` in the body.
- Patient login: `lookup(mobile)` returns the doctors, `login(mobile, doctorId, otp)` returns tokens.
- Doctors and staff cannot update or delete patients (no such route in `doctor-patient` controllers).
- Reference reuse: doctor and speciality service patterns from `shukhee-api`, adapted.

## Done
Built for the admin actor. Doctor, staff and patient login and routes are the remaining work (tasks 2.4 to 2.6, 2.13).

### How
- **Common layer** (`backend/src/common`): `JwtAuthGuard`, `RolesGuard`, `@Public`, `@Roles`, `@Actor`, pagination DTO and helper (`{ items, meta }`), `DbExceptionFilter`, `AuditService`, mobile normalizer (`01XXXXXXXXX`), Asia/Dhaka date helpers, `escapeLike`.
- **Fail closed:** a route with neither `@Public` nor `@Roles` is rejected. Guard order is throttle, authenticate, role.
- **Revocation:** the JWT guard reads the account on every request. A deactivated account or a bumped `tokenVersion` ends the session at once, so access tokens can be short (15 min).
- **Sessions:** refresh tokens are random, stored as SHA-256 hashes and rotated on use. Five failed logins lock the account for 15 minutes. Login does a dummy password check for unknown accounts so timing does not reveal them.
- **Accounts:** `AccountService` creates and updates `UserAccount` rows inside the caller's transaction (mobile and email unique per account type among live rows).
- **Admin modules**, each with its own controller and service per the actor convention: location, speciality, hospital, doctor, doctor-staff, patient. Every write is audited, and acting on behalf of a doctor records `onBehalfOfDoctorId`.
- **Patients:** at least one active doctor is enforced in the service. Removing a doctor link deactivates it. Deleting a patient soft-deletes the patient and account, refused while future appointments exist. A deleted patient's mobile can be registered again.
- **Swagger** at `/api/docs`, generated from the DTOs by the Nest plugin. Contract: `docs/api/admin-api-contract.md`.

### Verified
End-to-end through HTTP against PostgreSQL: create hospital, doctor, staff, patient, chamber, booking, duplicate refused (409), cancel, summary, 401 without token. 55 unit tests.

### Known gaps
- `AccountService.setActive` and `setPassword` run after the profile transaction commits, not inside it. A failure between the two leaves the profile changed and the account not.
- Session revocation on deactivation and password reset is implemented but was not checked against `auth_token` rows (no doctor login exists yet to produce sessions).
