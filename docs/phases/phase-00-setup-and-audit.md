# Phase 0: Setup and reference audit

Status: done.

## Goal
Understand the reference projects and create the four project skeletons.

## What we did

### Reference audit (read-only)
- `shukhee-api`: NestJS 10, TypeORM, MySQL. No migrations in practice (`synchronize` is used). No chamber concept. No doctor-staff entity (its staff entity belongs to the SSK portal). Slot booking has no transaction or unique constraint, so double booking is possible.
- `shukhee-doctor-app`: Flutter, GetX, Dio. Schedule is a weekly range editor with no off-dates and no chamber. Slots are generated on the client. Instant consultation, calls (Agora), emergency and the whole `ssk/` tree are out of scope.
- Two findings to pass on: `shukhee-api` has an uncommitted line in `src/auth/guards/auth.guard.ts` forcing `request.user.id = 86`, and `shukhee-doctor-app/.env` is committed with real values. Neither was copied.

### Skeletons
| Folder | Tool | Notes |
|---|---|---|
| `backend/` | `nest new` | Added TypeORM, pg, config, class-validator, JWT, bcrypt, dotenv |
| `web/` | `create-next-app` (Next.js 16, App Router, Tailwind, `src/`) | Removed the nested `.git` it creates |
| `doctor/` | `flutter create` (`com.ghl.doctor_app`) | Android and iOS |
| `patient/` | `flutter create` (`com.ghl.patient_app`) | Android and iOS |

### Backend layout
```
backend/src/
  database/
    entities/        one file per entity, index.ts, all-entities.ts
    enums/
    migrations/  seeds/
    orm-config.ts    shared by Nest and the CLI
    data-source.ts   TypeORM CLI entry
    database.module.ts   registers every entity (global)
    database.service.ts  injects every repository
  modules/<feature>/
    controllers/  services/  dtos/  utils/  <feature>.module.ts
```
Per-actor files follow `{actor}-{feature}.controller.ts` and `.service.ts`, for example `admin-doctor`, `doctor-doctor`, `patient-doctor`. Route prefixes are `api/admin/...`, `api/doctor/...`, `api/patient/...`, and `api/auth/<actor>` for login. Doctor staff reuse the `doctor-*` controllers (same permissions as the doctor), so there is no `doctor-staff` actor folder except for auth and for staff management itself.

Modules: auth, doctor, doctor-staff, patient, speciality, hospital, location, chamber, schedule, appointment.

### Web layout
All admin pages live under `src/app/admin/`, and all doctor web pages under `src/app/doctor/` (same structure, own login). `(dashboard)` is a route group that holds the sidebar layout, so `admin/login` has no sidebar and URLs stay `/admin/...`. `/` redirects to `/admin`. Future portals get their own top-level folder next to `admin/`.

## Verification
- `backend`: `npm run build` and `npm run lint` pass.
- `web`: `npm run lint` and `npm run build` pass, all admin routes are generated.
- Flutter projects: created with defaults, not yet changed.
- Backend later validated against PostgreSQL (see Phase 1).
