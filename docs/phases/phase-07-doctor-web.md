# Phase 7: Doctor web portal

Status: not started. Route skeleton exists.

## Goal
Doctors and doctor staff use the same features as the Doctor app from a browser.

## Approach
- Same Next.js app as the admin portal. All pages under `web/src/app/doctor`, login at `/doctor/login`, everything else in the `(dashboard)` group.
- Same backend `api/doctor/...` routes as the mobile app. Doctor staff log in here too and get the same menus (staff management rules per the Phase 2 decision).
- Prescription editor at `/doctor/appointments/[id]/prescribe`, viewer at `.../prescription`.
- Shared code between `admin` and `doctor` (API client, form components, tables, EN/BN fields) goes in shared folders under `src/`, not copied.
- Do the doctor web portal before the Flutter doctor app, so the API contract is proven first.

## Done
Skeleton pages and sidebar: dashboard, patients, patient details, appointments, appointment details, prescribe, prescription, chambers, schedule, staff, medicines, profile, login.
