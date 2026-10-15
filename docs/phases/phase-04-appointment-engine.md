# Phase 4: Appointment booking engine

Status: engine and admin routes done. Doctor and patient listing, timezone boundary tests pending.

## Planned approach
- Slots are computed, not stored: slot N starts at `turn.start + (N-1) * turn.slotDurationMinutes`.
- Booking runs in one transaction: validate doctor link, chamber ownership, open day, no off-date, free slot, remaining capacity. The unique `activeSlotKey` is the final guard against a race.
- Fee, duration and slot times are copied onto the appointment.
- Every status change writes `AppointmentStatusLog`.
- Bookings must be within `Chamber.advanceBookingDays`. `category` is `FOLLOW_UP` when the patient has a completed prescription from this doctor whose follow-up date has not passed.
- Cancel frees the slot (status CANCELLED takes the row out of the partial unique index).
- Tests: parallel bookings of the last seat, cancel then rebook, off-date, Asia/Dhaka date boundaries.

## Done
Engine and admin routes done.

### How
- **Shared services** in the appointment module: `AppointmentAvailabilityService` (availability by date range, slots for a turn) and `AppointmentBookingService` (book, cancel, change status). They take an explicit actor, so the doctor and patient actors will reuse them.
- **Booking** runs in one transaction. It locks the turn row, re-counts live appointments, picks the lowest free slot when none is given, then snapshots slot times, duration and fee. The partial unique index on (turn, date, slot) is the last guard. Queries inside the transaction run one after another because a transaction is one connection.
- **Rules:** active patient with an active link to the doctor, chamber belongs to the doctor, open weekday, no doctor off-date, not in the past (today: slot must start later than now in Asia/Dhaka), within `advanceBookingDays`, one live booking per patient per turn and date.
- **Closed reasons** reported by availability, in this order: past, out of window, doctor off, chamber off, no turns.
- Every transition writes `AppointmentStatusLog`. Only `SCHEDULED` can be cancelled, completed or marked no-show.

### Verified
- 10 parallel requests for the last free slot: one 201, nine 409 (`backend/test/appointment-concurrency.mjs`).
- Cancelled slot can be booked again. Duplicate patient in the same turn is refused with a visible message in the UI.
- 22 unit tests on the pure rules and slot math.

### Not verified
The explicit "slot already booked" catch for a database unique violation never fires in practice because the turn lock serializes bookings first. Doctor and patient actor use of the services is untested.
