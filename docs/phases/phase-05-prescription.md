# Phase 5: Prescription

Status: medicine catalog done (admin). The rest is not started. Entities drafted in Phase 1.

## Goal
Doctors write prescriptions for appointments, copied from Shukhee's V2 diagnosis flow, minus payment, calls, instant consultation, B2B and marketing.

## Reference flow (what we copy)
1. `POST appointment/:id`: get or create the draft. Idempotent. Only the appointment's doctor.
2. `PATCH :id`: autosave the whole prescription (complaints, diagnosis, lab tests, advice, medicines, meal instruction, follow-up).
3. History rows have their own create, update, delete: vitals, past illness, drug history, family history, menstrual history. Patient-wide paginated lists per history type.
4. Per-doctor saved items (complaint, diagnosis, lab test, advice) and saved medicines. Medicine catalog search (brand or generic, full-text).
5. `POST complete/:id {sendSms}`: render PDF, set appointment `COMPLETED`, `prescribedAt`, `prescriptionLink`. Optionally SMS a short link.
6. `POST prescription-sms`: SMS the medicine and lab text.

## Differences from the reference
| Reference | Here | Why |
|---|---|---|
| Legacy and new JSON columns written together; medicines and lines as JSON | `DiagnosisItem` and `DiagnosisMedicine` rows | Searchable, patient medication history, no dual-column sync. |
| Several `Diagnosis` rows per appointment | Unique `appointmentId` | Draft endpoint is idempotent anyway. |
| Four saved-item tables | One `DoctorSavedItem` with `kind`, unique per doctor | Same behavior, dedupes. |
| Hard-coded speciality ids 18, 25, 28 | `Speciality.prescriptionType` | Ids differ per database. |
| No doctor ownership check on PATCH, history update, saved-item update, SMS | Every route checks `effectiveDoctorId` | Reference lets any doctor edit any prescription. |
| Unguarded V1 reads, medicine and lab-test lists | All routes guarded | Same reason. |
| History rows trust body ids | Server verifies appointment, diagnosis and patient match | Same reason. |
| `createdBy` int | `createdByType` + `createdById` | Staff may write on the doctor's behalf. |
| Completing creates a doctor transaction and a service outcome record | Removed | Payments are out of scope. |
| PDF link and SMS flags on the appointment | On `Diagnosis` (`pdfFileKey`, `smsSentAt`, `textSmsSentAt`), key not URL | Appointment should not know about prescriptions. |
| SMS sent inline | Written to `SmsOutbox`, worker sends | Provider outage must not fail completion. |
| ICD-11 title only | See open decisions | Code is dropped by the reference. |

## Planned approach
- Modules: `diagnosis` (admin read-only, doctor) and `medicine` (admin catalog CRUD and bulk import, doctor search and saved medicines). Doctor staff use the `doctor-*` controllers.
- Admin catalog import must upsert, not `DELETE FROM medicine` first like the reference.
- Complete: transaction that locks the diagnosis, renders the PDF, then updates the appointment. If PDF fails, the appointment stays as it was.
- Follow-up date: appointment end date plus N days in `Asia/Dhaka`. Skipped for follow-up appointments.
- Demographics snapshot `Appointment.patientDetails` is edited from the prescribe screen. `Patient` itself stays minimal.

## Open decisions
1. **PDF rendering:** reuse Shukhee's external PDF microservice, or render in our backend (puppeteer and handlebars)? The reference's in-repo renderer is dead code. Its templates (`prescription.hbs`, `prescription-advice-v2.hbs`) can be copied. The nutritionist template is not in the repo.
2. **SMS and email provider** for sending the link. Not decided.
3. **ICD-11:** the app calls Shukhee's own ICD service. Use it, call WHO directly, or free text plus saved items only?
4. **Staff writing prescriptions:** "staff can do everything the doctor can" would let staff author a medical document under the doctor's BMDC code. Recommend staff can enter drafts but only the doctor completes. Confirm.
5. **Patient access:** the reference has no patient prescription endpoint, only `prescriptionLink` on the appointment. Should our patient app show prescriptions for the selected doctor?
6. **Variants:** support NUTRITIONIST and OTHER forms now, or only GENERAL first?
7. **History visibility:** patient-wide history lists are scoped to the viewing doctor's own entries by default. Sharing across a patient's doctors needs a policy decision.
8. **Storage:** where do PDFs live (S3 or other), and are links signed and short-lived?

## Done
Entities drafted: `Diagnosis`, `DiagnosisItem`, `DiagnosisMedicine`, `Vitals`, `PastIllness`, `DrugHistory`, `FamilyHistory`, `MenstrualHistory`, `DoctorSavedItem`, `Medicine`, `DoctorMedicine`. Columns added to `Doctor` (`signatureUrl`, `defaultFollowUpDays`), `Speciality` (`prescriptionType`), `Appointment` (`patientDetails`, `category`). Module shells `diagnosis` and `medicine` exist.

### Medicine catalog (task 5.1, done)
Admin CRUD plus `POST /api/admin/medicine/import`. Import validates each item on its own, reports errors by index, and upserts on `sourceKey` (sha1 of brand, strength, dosage form and manufacturer, lower-cased) in batches of 1000, in one transaction. Search uses `lower(brandName)` and `lower(genericName)` with `LIKE`, which the trigram indexes serve. The web import page parses the CSV in the browser (quotes, BOM, CRLF, line numbers), uploads in chunks of 1000 and maps server errors back to CSV lines.
