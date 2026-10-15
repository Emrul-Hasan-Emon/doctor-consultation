# Admin API contract

Source of truth for the backend admin routes and the admin web portal. Swagger at `/api/docs` is generated from the code and must match this.

## Conventions
- Base `http://localhost:3001`. All routes below are under `/api/admin/...`, role `ADMIN`, bearer JWT.
- Lists: query `page` (1-based), `limit` (max 100), `search`. Response `{ items: T[], meta: { page, limit, total, totalPages } }`.
- Dates `YYYY-MM-DD` (Asia/Dhaka calendar date). Times `HH:mm:ss` in responses, `HH:mm` or `HH:mm:ss` accepted. Weekday `0=Saturday ... 6=Friday`.
- Mobile accepted as `01XXXXXXXXX`, `8801...`, `+8801...`. Always returned as `01XXXXXXXXX`.
- Bilingual fields are `x` and `xBN`.
- Errors: Nest default `{ statusCode, message, error }`. Validation errors have `message: string[]`. 409 for conflicts, 404 for missing.
- Create returns the full resource (201). Patch returns the full resource (200). Optional body fields may be omitted. Send `null` to clear a nullable field.
- Nested short refs: `Ref = { id, name, nameBN }`.

## Location
- `GET /api/admin/location/divisions` -> `Ref[]` (name, nameBN)
- `GET /api/admin/location/districts?divisionId=` -> `(Ref & { divisionId })[]`

## Speciality `/api/admin/speciality`
- `GET /` list (`search`, `isActive`). `GET /options` -> all active `Ref[]` (not paginated). `GET /:id`. `POST /`. `PATCH /:id`.
- Resource: `{ id, name, nameBN, title, titleBN, value, icon, prescriptionType: GENERAL|NUTRITIONIST|OTHER, isActive, createdAt, updatedAt }`
- Body: `name` (req), `nameBN`, `title`, `titleBN`, `value` (req, unique slug, lowercase letters digits hyphen), `icon`, `prescriptionType` (req), `isActive`.

## Hospital `/api/admin/hospital`
- `GET /` (`search`, `status`, `divisionId`, `districtId`). `GET /options` -> `Ref[]`. `GET /:id`. `POST /`. `PATCH /:id`.
- Resource: `{ id, name, nameBN, alias, aliasBN, phone, email, address, addressBN, description, descriptionBN, banner, icon, status, divisionId, districtId, division: Ref, district: Ref, createdAt, updatedAt }`
- Body: `name` (req, unique), `nameBN`, `alias`, `aliasBN`, `phone`, `email`, `address`, `addressBN`, `description`, `descriptionBN`, `banner`, `icon`, `status`, `divisionId` (req), `districtId` (req, must belong to the division).

## Medicine catalog `/api/admin/medicine`
- `GET /` (`search` matches brand or generic, contains, case-insensitive; `isActive`, `isChronic`). `GET /:id`. `POST /`. `PATCH /:id`.
- `POST /import` body `{ items: MedicineInput[] }` (max 5000). Upsert on `sourceKey`. Response `{ created, updated, skipped, errors: { index, message }[] }`.
- Resource: `{ id, manufacturer, brandName, genericName, strength, dosage, dar, isChronic, isActive, sourceKey, createdAt, updatedAt }`
- Body: `manufacturer` (req), `brandName` (req), `genericName` (req), `strength`, `dosage` (req, form e.g. Tablet), `dar` (req), `isChronic`, `isActive`.
- `sourceKey` = sha1 of lowercase trimmed `brandName|strength|dosage|manufacturer`.

## Doctor `/api/admin/doctor`
- `GET /` (`search` name, nameBN, mobile, email, bmdcCode; `specialityId`, `isActive`).
- `GET /options?search=` -> `{ id, name, nameBN, specialityName }[]` (max 50, active only).
- `GET /:id`, `POST /`, `PATCH /:id`, `POST /:id/reset-password { password }` (204).
- `GET /:id/patients` (`search`, paginated): items `{ linkId, patientId, name, nameBN, mobile, division: Ref, district: Ref, linkedAt }` (active links only).
- Resource: `{ id, accountId, name, nameBN, mobile, email, profilePic, signatureUrl, degrees, degreesBN, experience, bmdcCode, bmdcExpiryDate, workingAt, workingAtBN, biography, biographyBN, consultationDurationMinutes, defaultFollowUpDays, isActive, accountActive, specialityId, speciality: Ref | null, patientCount, staffCount, chamberCount, createdAt, updatedAt }`. List items omit the long text fields.
- Create body: `name` (req), `nameBN`, `mobile` (req), `email`, `password` (req, min 8), `specialityId`, `degrees`, `degreesBN`, `experience`, `bmdcCode` (unique), `bmdcExpiryDate`, `workingAt`, `workingAtBN`, `biography`, `biographyBN`, `consultationDurationMinutes` (1..240, default 15), `defaultFollowUpDays`, `profilePic`, `signatureUrl`.
- Patch body: same without `password`, plus `isActive` (sets profile and account; deactivating revokes sessions).

## Doctor staff `/api/admin/doctor-staff`
- `GET /` (`doctorId`, `search`, `isActive`). `GET /:id`. `POST /`. `PATCH /:id`. `POST /:id/reset-password { password }` (204).
- Resource: `{ id, accountId, doctorId, doctor: Ref, name, nameBN, mobile, email, isActive, createdAt }`
- Create: `doctorId` (req), `name` (req), `nameBN`, `mobile` (req), `email`, `password` (req, min 8). Patch: `name`, `nameBN`, `mobile`, `email`, `isActive`.

## Patient `/api/admin/patient`
- `GET /` (`search` name or mobile; `divisionId`, `districtId`, `doctorId` (linked, active), `isActive`).
- `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id` (soft delete, 204; 409 if future scheduled appointments).
- `GET /:id/doctors` (paginated): items `{ linkId, doctorId, name, nameBN, mobile, speciality: Ref | null, isActive, linkedAt }` (active links).
- `PUT /:id/doctors { doctorIds: number[] }` (min 1) sets the active set: adds new links, reactivates old, deactivates others.
- `POST /:id/doctors { doctorId }`, `DELETE /:id/doctors/:doctorId` (409 if it is the last active doctor).
- Resource: `{ id, accountId, name, nameBN, mobile, divisionId, districtId, division: Ref, district: Ref, address, addressBN, isActive, createdByType, doctors: { doctorId, name, nameBN }[] (active), createdAt, updatedAt }`
- Create: `name`, `mobile`, `divisionId`, `districtId` (req), `nameBN`, `address`, `addressBN`, `doctorIds` (req, min 1, unique, all active doctors). Patch: same without `doctorIds`, plus `isActive`.

## Chamber `/api/admin/chamber`
- `GET /` (`doctorId`, `hospitalId`, `chamberType`, `divisionId`, `isActive`, `search`): items have `{ id, name, nameBN, chamberType, doctor: Ref, hospital: Ref | null, division: Ref, district: Ref, address, isActive, openDays: number[] }`.
- `GET /:id` -> full resource with `days`. `POST /`. `PATCH /:id` (basic info only). `PUT /:id/schedule`. `DELETE /:id` (soft delete, 204; 409 if future scheduled appointments).
- `ChamberDay = { weekday: 0..6, isOff: boolean, turns: Turn[] }`, `Turn = { id?, startTime, endTime, maxPatients, fee, slotDurationMinutes?, isActive? }`. Response turns also have `sortOrder`, `slotCapacity` (bookable slots).
- Resource: `{ id, doctorId, doctor: Ref, name, nameBN, chamberType: SELF|HOSPITAL, hospitalId, hospital: Ref | null, divisionId, districtId, division: Ref, district: Ref, address, addressBN, description, descriptionBN, advanceBookingDays, isActive, days: ChamberDay[] (always 7, weekday 0..6, missing days returned as isOff=false with no turns), createdAt, updatedAt }`
- Create: `doctorId`, `chamberType`, `divisionId`, `districtId`, `address` (req), `hospitalId` (req iff HOSPITAL, forbidden for SELF, must be an active hospital), `name`, `nameBN`, `addressBN`, `description`, `descriptionBN`, `advanceBookingDays` (1..365, default 30), `isActive`, `days` (optional, same rules as PUT schedule).
- `PUT /:id/schedule { days: ChamberDay[] }` replaces the schedule in one transaction. Rules: unique weekdays, an `isOff` day has no turns, turns of one day validated with `validateTurns`, `slotDurationMinutes` defaults to the doctor's `consultationDurationMinutes`. A turn with `id` is updated, without is created. Existing turns missing from the payload are deleted if they never had an appointment, otherwise deactivated. A turn that has SCHEDULED appointments from today onward cannot change start, end or slot duration, cannot be deactivated, and cannot get `maxPatients` below the highest booked slot number: respond 409 with a clear message. Marking a day off or removing the day's turns while such appointments exist: 409.

## Schedule `/api/admin/schedule`
- `GET /daily?date=&doctorId=&specialityId=&search=` -> `{ date, weekday, doctors: DailyDoctor[] }`.
  `DailyDoctor = { doctor: Ref & { speciality: Ref | null }, offDate: { id, reason, reasonBN } | null, chambers: { chamber: { id, name, nameBN, chamberType, hospital: Ref | null, address }, isOff: boolean, turns: { turnId, startTime, endTime, fee, slotDurationMinutes, capacity, booked, remaining }[] }[] }`.
  Includes active doctors that have a chamber with turns that weekday, or an off date that day. `booked` counts SCHEDULED and COMPLETED and NO_SHOW appointments (everything not cancelled).
- `GET /doctors/:doctorId` -> `{ doctor: Ref & { consultationDurationMinutes }, chambers: ChamberResource[], offDates: OffDate[] (today onward) }`.
- `GET /doctors/:doctorId/off-dates?from=&to=` -> `OffDate[]` where `OffDate = { id, date, reason, reasonBN }`.
- `POST /doctors/:doctorId/off-dates { date, reason?, reasonBN?, cancelAppointments? }`: date must be today or later; 409 if already off; 409 with count if SCHEDULED appointments exist that day unless `cancelAppointments: true`, which cancels them with reason "Doctor unavailable" and writes status logs. Returns `OffDate & { cancelledAppointments: number }`.
- `DELETE /doctors/:doctorId/off-dates/:id` (204).

## Appointment `/api/admin/appointment`
- `GET /` (`from`, `to`, `date`, `doctorId`, `patientId`, `chamberId`, `status`, `search` patient name or mobile; default order date desc, slot asc): items `AppointmentListItem = { id, appointmentDate, slotNumber, slotStartTime, slotEndTime, status, category, fee, patient: { id, name, nameBN, mobile }, doctor: Ref, chamber: { id, name, nameBN, chamberType, hospital: Ref | null }, bookedByType, createdAt }`.
- `GET /summary` -> `{ doctors, patients, hospitals, activeChambers, today: { total, scheduled, completed, cancelled, noShow }, next7Days: number, recent: AppointmentListItem[] (latest 10 by createdAt) }`.
- `GET /availability?doctorId=&chamberId=&from=&to=` (max 31 days) -> `{ days: { date, weekday, isOpen, closedReason: DOCTOR_OFF|CHAMBER_OFF|NO_TURNS|PAST|OUT_OF_WINDOW|null, turns: { turnId, startTime, endTime, fee, slotDurationMinutes, capacity, booked, remaining }[] }[] }`.
- `GET /slots?turnId=&date=` -> `{ turnId, date, slots: { slotNumber, startTime, endTime, status: FREE|BOOKED|PAST, appointment: { id, status, patientName, patientMobile } | null }[] }`.
- `GET /:id` -> `AppointmentListItem & { patientDetails, durationMinutes, doctor/patient/chamber full refs, chamberTurn: { id, startTime, endTime }, cancelledAt, cancelReason, cancelledByType, completedAt, statusLog: { fromStatus, toStatus, actorType, actorId, reason, createdAt }[] }`.
- `POST /` book on behalf: `{ patientId, doctorId, chamberId, turnId, date, slotNumber? }` (first free slot if omitted). Rules: active patient linked (active link) to the doctor; chamber belongs to the doctor and is active; day open, not a doctor off date, not in the past (today: slot must start later than now), within `advanceBookingDays`; turn active and on that weekday; slot within capacity; patient has no other live appointment in the same turn and date (409); slot free (409 "Slot already booked", also when the DB unique index fires). Snapshots slot times, duration and fee. Status log written. All in one transaction.
- `POST /:id/cancel { reason? }` (SCHEDULED only). `PATCH /:id/status { status: COMPLETED|NO_SHOW }` (from SCHEDULED only). Both write a status log with the admin as actor.

## Not in this contract (later phases)
Doctor, doctor-staff and patient actor routes, prescription, patient OTP login.
