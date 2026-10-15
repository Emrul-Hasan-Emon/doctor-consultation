# Phase 8: Doctor app

Status: not started. Flutter project created.

## Planned approach
- Follow the reference app's concepts: Flutter, GetX, Dio, EN/BN translations.
- Reuse ideas only: auth interceptor with refresh, i18n structure, shared widgets.
- Drop instant consultation, calls, emergency and the SSK side.
- Slot generation happens on the server, not in the app.
- One app for doctor and staff login.

## Done
Default `flutter create` project.

## Prescription screens (from the reference audit)
- One prescribe screen for all roles. Sections shown depend on `Speciality.prescriptionType` (GENERAL, NUTRITIONIST, OTHER), gender (menstrual history for female) and appointment category (no follow-up on a follow-up).
- Summary page plus a chip bar. Each section opens a bottom sheet. Medicine is a full page.
- Per-doctor saved vocabulary ("recent written history") and saved medicines.
- Debounce search at 250-300 ms (the reference uses 50 ms, effectively none). Queue and surface autosave errors.
- Drop video call, chat and call-log chips, the session-complete screen, and the dead nutritionist/other legacy screens.
