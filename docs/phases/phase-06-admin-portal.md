# Phase 6: Admin portal

Status: done. Verified in Chrome against the real backend and database.

## Planned approach
- All pages under `web/src/app/admin`. Login at `/admin/login`, everything else in the `(dashboard)` group.
- Doctor details: paginated patients and staff. Patient details: paginated doctors.
- Forms collect English and Bengali fields.

## Done

### How
- **Session:** login posts to a Next route handler that sets two httpOnly cookies. All API calls go through one same-origin proxy (`/api/backend/...`) that adds the bearer token, refreshes an expired token once (parallel requests share one refresh, because refresh tokens rotate) and retries. The browser never holds a token. `proxy.ts` redirects to login when no session cookie exists.
- **Stack:** Next.js 16 (cache components, so client hooks that read the URL sit under `Suspense`), TanStack Query, react-hook-form + zod, Tailwind. Shared kit in `src/components/ui` and `src/components/forms`; feature code in `src/features/<feature>`; route files stay thin.
- **Pages:** dashboard; doctors (list, create, edit, details with overview, patients, staff, chambers and schedule tabs, off-dates, reset password, activate); doctor staff; patients (list, create, edit, details with paginated doctors and manage-doctors); hospitals; specialities; chambers with the weekly turn editor; daily schedule with a slot modal; appointments (list, booking wizard, details, cancel, status); medicines with CSV import.
- Filters live in the URL. Server 409 and 400 messages are shown as returned. English and Bangla fields sit side by side.

### Verified in Chrome (Playwright driving installed Chrome)
All 16 routes load with no console errors. Flows exercised: wrong password message, login, speciality, hospital, doctor (duplicate mobile shows the server error), staff, patient (requires a doctor), chamber with seven days (client validation, then save), daily schedule, booking wizard end to end, duplicate booking message, cancel with reason, doctor off-date reflected in the daily view, patient last-doctor removal refused, edits, reset password, speciality deactivate, CSV import with a bad row, silent session refresh, httpOnly cookies, logout gate.

### Found and fixed during verification
- The doctor and patient pickers did not close on Escape and the open list covered the submit button.
- Booking service ran queries in parallel inside a transaction (pg warns and will stop allowing this in pg 9).

### Not covered
No automated UI test suite is committed (the Chrome scripts were throwaway). Mobile layout was not reviewed beyond the responsive shell.
