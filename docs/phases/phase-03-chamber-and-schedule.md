# Phase 3: Chamber and schedule

Status: admin part done. Doctor and staff routes pending (task 3.9).

## Planned approach
- Chamber create/update validates `SELF` vs `HOSPITAL` (hospital required and must exist) in the service as well as by the DB CHECK.
- Day-wise config saved as a whole (replace days and turns in one transaction). Turns validated: end after start, no overlap in a day, `maxPatients` not above the slot count for the doctor's duration.
- Admin and doctor controllers call the same shared service logic so validation is identical.
- Off-dates: unique per doctor and date. An off-date removes all slots for that date.
- Admin daily view: read-only join of doctors, off-dates, turns and booked counts for one date.
- Editing a turn that has future bookings is blocked or requires a new turn.

## Done
Built for the admin actor.

### How
- **Shared service** `ChamberScheduleService` (exported from the chamber module) holds validation and the schedule replacement, so the doctor actor can reuse it. `AdminChamberService` adds audit.
- **`PUT /chamber/:id/schedule`** replaces the week in one transaction with the chamber row locked. Turns are matched by id. A turn removed from the payload is deleted if it never had an appointment, otherwise deactivated. A turn with scheduled appointments from today cannot change time or slot length, cannot be deactivated, and cannot drop capacity below its highest booked slot (409 with the reason). The same protection applies to marking a day off.
- **Slot length per turn:** `slotDurationMinutes` defaults to the doctor's consultation duration when the turn is saved. Changing the doctor's default later does not move slots on existing turns.
- **Rules** (shared with the web editor): end after start, no overlap, capacity not above the slots that fit, fee not negative, `isOff` days carry no turns.
- **Off-dates:** unique per doctor and date, not in the past. If scheduled appointments exist that day the API answers 409 with the count, unless `cancelAppointments: true`, which cancels them with a status log in the same transaction.
- **Daily view** runs a fixed number of queries (no per-doctor queries) and reports capacity, booked and remaining per turn.
- Web: the chamber page has a weekly editor with live "N slots fit, bookable M" text, copy-to-days, and client validation that mirrors the server.

### Verified
15 unit tests on the plan logic. Manual API checks for each rejection and for the protected-turn 409s. In Chrome: create a hospital chamber with seven days, see the validation error for 8 patients in 6 slots, then save with 6.

### Not verified
Two admins saving the same schedule at the same moment (row locks are in place, not load-tested).
