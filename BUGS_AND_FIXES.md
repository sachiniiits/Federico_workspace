# Federico Platform — Master Bugs, Defects & Remediation Checklist

This document is the authoritative master tracking ledger of all bugs, defects, clinical invariant violations, relational database discrepancies, frontend data-binding failures, dead code, and configuration risks identified across the Federico Hospital Operations platform.

---

## 📋 Table of Contents
1. [Completed Remediations (Phases 1 & 2)](#1-completed-remediations-phases-1--2)
2. [Critical Preserved Defects & Functional System Failures](#2-critical-preserved-defects--functional-system-failures)
3. [Backend Data Generation, Storage & Query Filter Invariants (BE-01 to BE-76)](#3-backend-data-generation-storage--query-filter-invariants)
4. [Frontend Fetching, Attribute Binding & Payload Mapping (FE-01 to FE-22)](#4-frontend-fetching-attribute-binding--payload-mapping)
5. [State Persistence, Concurrency & Boot Mechanics (PST-01 to PST-04)](#5-state-persistence-concurrency--boot-mechanics)
6. [Dead Code, Deprecated Routes & Redundant Aliases (CLN-03 to CLN-06)](#6-dead-code-deprecated-routes--redundant-aliases)
7. [Hardcoded Credentials, Secrets & Configuration Hardening (CFG-01 to CFG-03)](#7-hardcoded-credentials-secrets--configuration-hardening)

---

## 1. Completed Remediations (Phases 1 & 2)

### 🔴 Security Vulnerabilities (Phase 1)
- [x] **SEC-01 (CRITICAL)**: **Authentication Bypass via `x-role` Header**  
  - **File**: [`back-end/src/middleware/actorAccess.js:68,75`](back-end/src/middleware/actorAccess.js)  
  - **Remediation**: Eliminated `x-role` header checks and legacy bypasses. Enforced session token verification across all routes; spoofed `x-role` requests receive HTTP 403 Forbidden.
- [x] **SEC-02 (HIGH)**: **Tenant Boundary Scoping Defense-in-Depth**  
  - **Files**: [`back-end/src/controllers/doctor.controller.js:67`](back-end/src/controllers/doctor.controller.js), [`back-end/src/services/doctor.service.js:66`](back-end/src/services/doctor.service.js)  
  - **Remediation**: Added `belongsToOrg(availability, req)` with an HTTP 403 Forbidden check before executing availability deletion.
- [x] **SEC-03 (HIGH)**: **Mass Assignment in Request Body Validation**  
  - **Files**: [`back-end/src/services/doctor.service.js:36`](back-end/src/services/doctor.service.js), [`back-end/src/services/patient.service.js:62`](back-end/src/services/patient.service.js), [`back-end/src/services/admission.service.js:31`](back-end/src/services/admission.service.js)  
  - **Remediation**: Guarded entity updates to destructure and strip immutable primary keys and tenant identifiers (`doctor_id`, `patient_id`, `admission_id`, `organization_id`, `uhid`, `admit_time`).
- [x] **SEC-04 (MEDIUM)**: **Call Stack Overflow Hazard in Platform Auth**  
  - **File**: [`back-end/src/services/platformAuth.service.js:75`](back-end/src/services/platformAuth.service.js)  
  - **Remediation**: Replaced `Math.max` array spread with safe `maxId(dataStore.platformSuperUsers, 'platform_user_id') + 1 || 1`.
- [x] **SEC-05 (HIGH)**: **Hardcoded Development Secrets**  
  - **File**: [`back-end/src/config/env.js:25`](back-end/src/config/env.js)  
  - **Remediation**: Added startup verification emitting a high-severity security warning if the placeholder secret is detected in production mode.

### 🏥 Clinical & Database Invariants (Phase 2)
- [x] **CLN-01 (HIGH)**: **Doctor Schedule Double-Booking Invariant Breach**  
  - **File**: [`back-end/src/store/dataStore.js`](back-end/src/store/dataStore.js)  
  - **Remediation**: Rescheduled appointment #608 to `2026-08-19T13:00:00` with zero collisions; enforced `UNIQUE KEY uq_doctor_slot (doctor_id, scheduled_datetime)` in DDL.
- [x] **CLN-02 (CRITICAL)**: **Concurrent Double-Admissions for Single Patients**  
  - **File**: [`back-end/src/store/dataStore.js`](back-end/src/store/dataStore.js)  
  - **Remediation**: Reconciled admissions: marked admissions #711 and #703 as `DISCHARGED`; set physical beds #56 and #43 to `AVAILABLE`.
- [x] **DB-01 (HIGH)**: **Broken Foreign Key in `appointments.created_by`**  
  - **File**: [`back-end/src/store/dataStore.js`](back-end/src/store/dataStore.js)  
  - **Remediation**: Mapped `created_by` to linked user accounts (patients 201->102, 202->103, 203->104) and staff user #105 (PRE).
- [x] **DB-02 (HIGH)**: **Phantom Foreign Key in `receipts.payment_id`**  
  - **File**: [`back-end/src/store/dataStore.js`](back-end/src/store/dataStore.js)  
  - **Remediation**: Seeded missing payment record #990 (`ledger_id: 809`, `amount_paid: 500`, `payment_mode: 'UPI'`).
- [x] **DB-03 (HIGH)**: **User Account Scoping for Registered Patients vs Walk-ins**  
  - **File**: [`back-end/src/store/dataStore.js`](back-end/src/store/dataStore.js)  
  - **Remediation**: Formally modeled `patients.user_id INT NULL REFERENCES users(user_id) ON DELETE SET NULL` in SQL DDL.
- [x] **DB-04 (HIGH)**: **Missing Appointment FK in Admissions & Emergency Validation**  
  - **File**: [`back-end/src/validators/admission.validators.js`](back-end/src/validators/admission.validators.js)  
  - **Remediation**: Linked all 6 elective admissions to matching appointment IDs; updated validator with `optional: true` on `appointment_id` for emergency walk-ins.
- [x] **DB-05 (MEDIUM)**: **Declared Ward Capacity vs Bed Array Count Mismatch**  
  - **File**: [`back-end/src/store/dataStore.js`](back-end/src/store/dataStore.js)  
  - **Remediation**: Seeded missing physical beds `G-115` to `G-120` (Ward 1) and `ICU-01` to `ICU-04`, `ICU-09`, `ICU-10` (Ward 2) as `AVAILABLE`.
- [x] **DB-06 (MEDIUM)**: **Missing Billing Ledgers for Active Admissions**  
  - **File**: [`back-end/src/store/dataStore.js`](back-end/src/store/dataStore.js)  
  - **Remediation**: Seeded open financial ledger #812 for admission #708.
- [x] **DB-07 (MEDIUM)**: **Inconsistent Ledger Entry Primary Key Generation**  
  - **File**: [`back-end/src/services/preRequest.service.js:395-404`](back-end/src/services/preRequest.service.js)  
  - **Remediation**: Unified `preRequest.service.js` to compute `entry_id` per-ledger (`filter(e => e.ledger_id === ledger.ledger_id).length + 1`) with `entry_time`.
- [x] **DB-08 (HIGH)**: **Unrestricted Cascading Deletion in Patient Service**  
  - **File**: [`back-end/src/services/patient.service.js:70-80`](back-end/src/services/patient.service.js)  
  - **Remediation**: Added active admission guard throwing HTTP 409 Conflict if patient has an active `ADMITTED` stay.

---

## 2. Critical Preserved Defects & Functional System Failures

- [ ] **DEF-D02 (CRITICAL)**: **Ward Emergencies Route 404 Failure**  
  - **File**: [`front-end/src/api/endpoints/wards.js:64-74`](front-end/src/api/endpoints/wards.js)  
  - **Problem**: Frontend calls plural `/ward/emergencies` (`list()`, `create()`, `update()`), but backend routes are mounted on singular `/ward/emergency` ([`back-end/src/routes/ward.routes.js:93`](back-end/src/routes/ward.routes.js)). All emergency listings and creation requests result in immediate **HTTP 404 Not Found**.  
  - **Remediation**: Update `front-end/src/api/endpoints/wards.js` to call `/ward/emergency`, or add route aliases in `back-end/src/routes/ward.routes.js` to support both forms.

- [ ] **DEF-D03 (HIGH)**: **Platform Rate Card Fee Desync**  
  - **Files**: [`front-end/src/pages/admin/DashboardPage.jsx:93`](front-end/src/pages/admin/DashboardPage.jsx), [`front-end/src/pages/public/OrgSignupPage.jsx:119`](front-end/src/pages/public/OrgSignupPage.jsx)  
  - **Problem**: Frontend reads `r?.base_fee` or `data.base_fee`, but backend API ([`back-end/src/controllers/platform.controller.js:456`](back-end/src/controllers/platform.controller.js)) emits `base_platform_fee: 3000`. As a result, Admin Dashboard and Org Signup Wizard ignore live rate card updates and permanently fall back to 3,000.  
  - **Remediation**: Update frontend property access to `r?.base_platform_fee ?? r?.base_fee ?? 3000` and normalize backend response to include both keys.

- [ ] **DEF-D04 (HIGH)**: **Patient Insurance Display Omission**  
  - **Files**: [`front-end/src/pages/patient/patientStoreShape.js:77-102`](front-end/src/pages/patient/patientStoreShape.js), [`front-end/src/pages/patient/BillingPage.jsx:144-178`](front-end/src/pages/patient/BillingPage.jsx)  
  - **Problem**: `patientStoreShape.js` maps the patient profile and insurance, but omits the boolean property `hasInsurance`. When `BillingPage.jsx` checks `ins.hasInsurance`, it evaluates to `undefined` (falsy), permanently displaying a **"Self Pay (No Active Insurance)"** banner even for fully insured patients with active coverage.  
  - **Remediation**: Export `hasInsurance: Boolean(ins && ins.policyNumber && ins.provider)` in `buildProfile`.

- [ ] **DEF-D05 (MEDIUM)**: **Omission of `doctorId` in `buildAppointments`**  
  - **File**: [`front-end/src/pages/patient/patientStoreShape.js:159-173`](front-end/src/pages/patient/patientStoreShape.js)  
  - **Problem**: Derives `docId = apt.doctor_id`, but omits `doctorId` from the exported appointment item object. Downstream consumers and appointment history components expecting normalized `doctorId` receive `undefined`.  
  - **Remediation**: Include `doctorId: docId` in the returned appointment object in `buildAppointments`.

- [ ] **DEF-D07 (HIGH)**: **Uncontrolled Insurance Override Input in FA Settlement**  
  - **File**: [`front-end/src/pages/fa/SettlementSection.jsx:142-169`](front-end/src/pages/fa/SettlementSection.jsx)  
  - **Problem**: Input `#coverage-override` uses an uncontrolled `ref` without an `onChange` listener, while `#net-payable-preview` is calculated purely from static `coverageLimit`. As finance staff type a custom deduction, the preview never updates dynamically.  
  - **Remediation**: Convert `#coverage-override` to a controlled state variable and recompute net payable on input change.

- [ ] **DEF-D11 (CRITICAL)**: **Ghost Password Update in Patient Profile**  
  - **File**: [`front-end/src/pages/patient/ProfilePage.jsx:176-183`](front-end/src/pages/patient/ProfilePage.jsx)  
  - **Problem**: Changing patient password triggers a local success toast (`toast('Password updated.', 'success')`) but dispatches **zero network requests** to the backend. The user believes their password was changed, but the database retains the old password.  
  - **Remediation**: Implement `PUT /auth/password` in backend and wire frontend profile submission to dispatch the real mutation.

- [ ] **DEF-OCCUPANCY (CRITICAL)**: **HOM Dashboard Bed Occupancy Permanently 0%**  
  - **File**: [`front-end/src/pages/hom/DashboardPage.jsx:128-131`](front-end/src/pages/hom/DashboardPage.jsx)  
  - **Problem**: Calculates `const occupied = d.wards.reduce((sum, w) => sum + (w.occupied_beds || 0), 0)`. Schema Table 15 (`wards`) does not have an `occupied_beds` column. `w.occupied_beds` evaluates to `undefined`, so `occupied` is 0, and occupancy is permanently displayed as **0%** even when beds are full.  
  - **Remediation**: Calculate occupancy from the beds collection: `d.beds.filter(b => b.status === 'OCCUPIED').length` (as in `BedManagementPage.jsx:111`).

- [ ] **DEF-SIGNUP-INS (CRITICAL)**: **Silent Insurance Drop on Patient Registration**  
  - **File**: [`front-end/src/pages/public/SignupPage.jsx:141-155, 324-330`](front-end/src/pages/public/SignupPage.jsx)  
  - **Problem**: Signup form prompts user with `DD/MM/YYYY` placeholder and sends raw strings (e.g. `"15/10/2026"`). Backend `patient.validators.js:43` validates with `validator.isISO8601`, rejecting with `400 Bad Request`. `SignupPage.jsx:153` catches the error and silently ignores it with `console.warn`, creating the account **without saving the insurance policy**.  
  - **Remediation**: Change frontend date inputs to `type="date"` (ISO `YYYY-MM-DD`) and format inputs prior to submission.

- [ ] **DEF-LEDGER-SEQ (CRITICAL)**: **Composite Key Sequence Reset Bug in Billing**  
  - **File**: [`back-end/src/services/billing.service.js:95`](back-end/src/services/billing.service.js)  
  - **Problem**: Computes `entry_id` via `dataStore.ledgerEntries.filter((e) => e.ledger_id === entry.ledger_id).length + 1`. If `entry.ledger_id` is passed as a string (e.g. `"801"`), strict equality `801 === "801"` fails. The filtered array is empty, resetting `entry_id` to `1` repeatedly and causing primary key collisions on `(ledger_id, entry_id)`.  
  - **Remediation**: Coerce `const ledgerId = Number(entry.ledger_id)` before filtering.

---

## 3. Backend Data Generation, Storage & Query Filter Invariants

### 3.1 Strict Equality (`===`) Query Filter Type Mismatches
When frontend or URL parameters pass IDs as strings (e.g., `req.params.id = "701"`), comparing against numeric entity IDs via `===` causes lookups to fail with false 404s or empty lists.

- [ ] **BE-01**: [`back-end/src/services/admission.service.js:11`](back-end/src/services/admission.service.js) — `findOne`: `a.admission_id === id` -> cast `Number(id)`
- [ ] **BE-02**: [`back-end/src/services/appointment.service.js:21`](back-end/src/services/appointment.service.js) — `findOne`: `a.appointment_id === id` -> cast `Number(id)`
- [ ] **BE-03**: [`back-end/src/services/appointment.service.js:86`](back-end/src/services/appointment.service.js) — `update`: `pr.appointment_id === id` -> cast `Number(id)`
- [ ] **BE-04**: [`back-end/src/services/billing.service.js:32`](back-end/src/services/billing.service.js) — `findLedgerByAdmission`: `l.admission_id === admission_id` -> cast `Number(admission_id)`
- [ ] **BE-05**: [`back-end/src/services/billing.service.js:36`](back-end/src/services/billing.service.js) — `findLedgerById`: `l.ledger_id === ledger_id` -> cast `Number(ledger_id)`
- [ ] **BE-06**: [`back-end/src/services/billing.service.js:72`](back-end/src/services/billing.service.js) — `findLedgerEntries`: `e.ledger_id === ledger_id` -> cast `Number(ledger_id)`
- [ ] **BE-07**: [`back-end/src/services/billing.service.js:211`](back-end/src/services/billing.service.js) — `dispatchLedger`: `l.ledger_id === ledger_id` -> cast `Number(ledger_id)`
- [ ] **BE-08**: [`back-end/src/services/billing.service.js:277`](back-end/src/services/billing.service.js) — `findDischargeSummaryByAdmission`: `s.admission_id === admission_id` -> cast `Number(admission_id)`
- [ ] **BE-09**: [`back-end/src/services/billing.service.js:330`](back-end/src/services/billing.service.js) — `findLeaderById`: `l.leader_id === leader_id` -> cast `Number(leader_id)`
- [ ] **BE-10**: [`back-end/src/controllers/billing.controller.js:81`](back-end/src/controllers/billing.controller.js) — passes uncoerced `req.body.ledger_id` to `findLedgerById`, causing tenant ownership bypass
- [ ] **BE-11**: [`back-end/src/services/doctor.service.js:16`](back-end/src/services/doctor.service.js) — `findDoctorById`: `d.doctor_id === doctor_id` -> cast `Number(doctor_id)`
- [ ] **BE-12**: [`back-end/src/services/doctor.service.js:53`](back-end/src/services/doctor.service.js) — `deleteDoctor`: `d.doctor_id !== doctor_id` -> cast `Number(doctor_id)`
- [ ] **BE-13**: [`back-end/src/services/doctor.service.js:65`](back-end/src/services/doctor.service.js) — `findAvailabilityByDoctor`: `a.doctor_id === doctor_id` -> cast `Number(doctor_id)`
- [ ] **BE-14**: [`back-end/src/services/doctor.service.js:72`](back-end/src/services/doctor.service.js) — `findAvailabilityById`: `a.availability_id === availability_id` -> cast `Number(availability_id)`
- [ ] **BE-15**: [`back-end/src/services/doctor.service.js:153`](back-end/src/services/doctor.service.js) — `findConflictingAppointment`: `appointment.appointment_id === excludeId` causes false self-conflict on reschedule
- [ ] **BE-16**: [`back-end/src/services/doctor.service.js:200`](back-end/src/services/doctor.service.js) — `deleteAvailability`: `a.availability_id !== availability_id` -> cast `Number(availability_id)`
- [ ] **BE-17**: [`back-end/src/services/inventory.service.js:28, 36, 39`](back-end/src/services/inventory.service.js) — `updateItem`, `deleteItem`: `i.item_id === item_id` -> cast `Number(item_id)`
- [ ] **BE-18**: [`back-end/src/services/inventory.service.js:71`](back-end/src/services/inventory.service.js) — `updateRequest`: `r.request_id === request_id` -> cast `Number(request_id)`
- [ ] **BE-19**: [`back-end/src/services/preRequest.service.js:115`](back-end/src/services/preRequest.service.js) — `findOne`: `p.pre_request_id === id` -> cast `Number(id)`
- [ ] **BE-20**: [`back-end/src/services/preRequest.service.js:303`](back-end/src/services/preRequest.service.js) — `consultationServiceFor`: `s.organization_id === organizationId` -> cast `Number(organizationId)`
- [ ] **BE-21**: [`back-end/src/services/ward.service.js:64, 109, 120`](back-end/src/services/ward.service.js) — `updateWard`, `deleteWard`: `w.ward_id === ward_id` -> cast `Number(ward_id)`
- [ ] **BE-22**: [`back-end/src/services/ward.service.js:131`](back-end/src/services/ward.service.js) — `findBedsByWard`: `b.ward_id === ward_id` -> cast `Number(ward_id)`
- [ ] **BE-23**: [`back-end/src/services/ward.service.js:149`](back-end/src/services/ward.service.js) — `updateBedStatus`: `b.bed_id === bed_id` -> cast `Number(bed_id)`
- [ ] **BE-24**: [`back-end/src/services/ward.service.js:224`](back-end/src/services/ward.service.js) — `updateBedRequest`: `r.bed_request_id === id` -> cast `Number(id)`
- [ ] **BE-25**: [`back-end/src/services/ward.service.js:304`](back-end/src/services/ward.service.js) — `updateEmergency`: `e.emergency_id === id` -> cast `Number(id)`
- [ ] **BE-26**: [`back-end/src/services/organization.service.js:84`](back-end/src/services/organization.service.js) — `findById`: `o.organization_id === id` -> cast `Number(id)`
- [ ] **BE-27**: [`back-end/src/services/subscription.service.js:9`](back-end/src/services/subscription.service.js) — `findByOrg`: `s.organization_id === organizationId` -> cast `Number(organizationId)`
- [ ] **BE-28**: [`back-end/src/services/subscriptionPlan.service.js:11`](back-end/src/services/subscriptionPlan.service.js) — `findById`: `p.plan_id === id` -> cast `Number(id)`

### 3.2 Hardcoded Values & Foreign Key Integrity Breaches
- [ ] **BE-29**: [`back-end/src/services/appointment.service.js:57`](back-end/src/services/appointment.service.js) — Hardcoded `createdBy = 105` fallback
- [ ] **BE-30**: [`back-end/src/services/preRequest.service.js:104`](back-end/src/services/preRequest.service.js) — Hardcoded `created_by = 105` fallback
- [ ] **BE-31**: [`back-end/src/services/inventory.service.js:57`](back-end/src/services/inventory.service.js) — Hardcoded `requested_by = 101` fallback
- [ ] **BE-32**: [`back-end/src/services/ward.service.js:283`](back-end/src/services/ward.service.js) — Hardcoded `created_by = 101` fallback
- [ ] **BE-33**: [`back-end/src/services/preRequest.service.js:450`](back-end/src/services/preRequest.service.js) — `requested_by: actorRole || 'PRE'` stores role string `'PRE'` into an INT FK pointing to `users.user_id`
- [ ] **BE-34**: [`back-end/src/services/preRequest.service.js:446`](back-end/src/services/preRequest.service.js) — `ward_id: null` in `bed_requests` violates Table 28 mandatory `ward_id INT NOT NULL`
- [ ] **BE-35**: [`back-end/src/services/ward.service.js:184, 186, 190`](back-end/src/services/ward.service.js) — `createBedRequest` allows `pre_request_id`, `ward_id`, and `requested_by` to be `null`
- [ ] **BE-36**: [`back-end/src/services/billing.service.js:60-61`](back-end/src/services/billing.service.js) — `createLedger` sets `organization_id` and `hospital_id` without `Number(...)` coercion
- [ ] **BE-37**: [`back-end/src/utils/tenant.js:77`](back-end/src/utils/tenant.js) — `withTenant` attaches `hospital_id` without `Number(...)` coercion
- [ ] **BE-38**: [`back-end/src/utils/maxId.js:24-28`](back-end/src/utils/maxId.js) — `maxId` returns `0` on empty array; `0 + 1 = 1` makes `|| fallback` dead code; fails to respect domain base ID offsets

### 3.3 Timestamp & Datetime Formatting
- [ ] **BE-39**: [`back-end/src/services/appointment.service.js:68`](back-end/src/services/appointment.service.js) — `${date}T${time}` string template lacks ISO timezone offset (`Z`)
- [ ] **BE-40**: [`back-end/src/services/preRequest.service.js:100`](back-end/src/services/preRequest.service.js) — `${date}T${time}` lacks ISO timezone offset (`Z`)
- [ ] **BE-41**: [`back-end/src/services/preRequest.service.js:196`](back-end/src/services/preRequest.service.js) — `updateFields` produces non-standard ISO string on update

### 3.4 Response Attribute & Schema Enum Mismatches
- [ ] **BE-42**: [`back-end/src/services/appointment.service.js:66-69`](back-end/src/services/appointment.service.js) — Adds redundant fields `appointment_date`, `appointment_time`, `department` not in Table 14
- [ ] **BE-43**: [`back-end/src/services/appointment.service.js:71`](back-end/src/services/appointment.service.js) — Emits `status: 'SCHEDULED'` outside Table 14 schema enum (`CONFIRMED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`)
- [ ] **BE-44**: [`back-end/src/services/billing.service.js:136`](back-end/src/services/billing.service.js) — `payment_mode` defaults to uppercase `'CASH'` vs schema (`Cash`, `Card`, `UPI`)
- [ ] **BE-45**: [`back-end/src/services/billing.service.js:173`](back-end/src/services/billing.service.js) — Injects non-schema attribute `ledger.cleared_at`
- [ ] **BE-46**: [`back-end/src/services/billing.service.js:177`](back-end/src/services/billing.service.js) — Injects non-schema attribute `admission.bills_cleared = true` bypassing `receipt_sent_to_hom`
- [ ] **BE-47**: [`back-end/src/services/billing.service.js:178`](back-end/src/services/billing.service.js) — Mutates `admission.status = 'PAYMENT_CONFIRMED'` outside Table 17 enum (`ADMITTED`, `DISCHARGED`)
- [ ] **BE-48**: [`back-end/src/services/billing.service.js:193`](back-end/src/services/billing.service.js) — Mutates `ledger.status = 'PARTIALLY_PAID'` outside Table 20 enum (`OPEN`, `DISPATCHED`, `PAID`)
- [ ] **BE-49**: [`back-end/src/services/billing.service.js:425`](back-end/src/services/billing.service.js) — Injects non-schema attribute `leader.ledger_id` into Table 24 entity
- [ ] **BE-50**: [`back-end/src/services/doctor.service.js:25`](back-end/src/services/doctor.service.js) — Injects non-schema attribute `department: 'General'` onto doctors entity
- [ ] **BE-51**: [`back-end/src/services/doctor.service.js:28, 51`](back-end/src/services/doctor.service.js) — Injects non-schema attributes `is_active` and `status: 'INACTIVE'`
- [ ] **BE-52**: [`back-end/src/services/inventory.service.js:54`](back-end/src/services/inventory.service.js) — Injects duplicate property `quantity` alongside `quantity_requested`
- [ ] **BE-53**: [`back-end/src/services/inventory.service.js:63`](back-end/src/services/inventory.service.js) — Injects non-schema attribute `invoice_url` into purchase requests
- [ ] **BE-54**: [`back-end/src/services/patient.service.js:48, 50`](back-end/src/services/patient.service.js) — Injects non-schema attributes `email` and `alternate_phone` onto patients entity
- [ ] **BE-55**: [`back-end/src/services/patient.service.js:108`](back-end/src/services/patient.service.js) — `createInsurance` defaults `coverage_type` to non-schema enum value `'Self'`
- [ ] **BE-56**: [`back-end/src/services/preRequest.service.js:16-26`](back-end/src/services/preRequest.service.js) — Overloads pre-requests with 9 statuses (`ADMITTED`, `DISCHARGED`) vs Table 27 schema enum (`PENDING`, `APPROVED`, `REJECTED`, `ALLOCATED`)
- [ ] **BE-57**: [`back-end/src/services/preRequest.service.js:132-133`](back-end/src/services/preRequest.service.js) — Injects non-schema properties `note` and `document_urls`
- [ ] **BE-58**: [`back-end/src/services/preRequest.service.js:369`](back-end/src/services/preRequest.service.js) — OPD check-in emits `admission_date` instead of Table 17 `admit_time`
- [ ] **BE-59**: [`back-end/src/services/preRequest.service.js:364-374`](back-end/src/services/preRequest.service.js) — OPD admission record omits `admit_time`, `bed_id`, `receipt_sent_to_hom`; adds non-schema `doctor_id`, `department`, `visit_type`
- [ ] **BE-60**: [`back-end/src/services/preRequest.service.js:408`](back-end/src/services/preRequest.service.js) — Injects non-schema property `created_at` into `ledger_entries` (schema uses `entry_time`)
- [ ] **BE-61**: [`back-end/src/services/ward.service.js:247`](back-end/src/services/ward.service.js) — Sets `request.status = 'DENIED'` outside Table 28 enum (`PENDING`, `APPROVED`, `ALLOCATED`, `REJECTED`)
- [ ] **BE-62**: [`back-end/src/services/ward.service.js:281`](back-end/src/services/ward.service.js) — `createEmergency` sets `payload.department || null`, violating Table 29 NOT NULL constraint
- [ ] **BE-63**: [`back-end/src/controllers/ward.controller.js:205`](back-end/src/controllers/ward.controller.js) — Logs `result.emergency_type` (always `undefined`) instead of `result.department`
- [ ] **BE-64**: [`back-end/src/services/activity.service.js:13-20`](back-end/src/services/activity.service.js) — Omits `hospital_id` in `activity_log`; logs severity level as `type`
- [ ] **BE-65**: [`back-end/src/services/rbac.service.js:245, 263`](back-end/src/services/rbac.service.js) — Injects non-schema attribute `is_active` onto `users` entity
- [ ] **BE-66**: [`back-end/src/store/dataStore.js:2450-2521`](back-end/src/store/dataStore.js) — `dischargeSummaries` seed records omit `gross_amount` and `insurance_deduction`; summary 7 uses `notes` instead of `discharge_notes`
- [ ] **BE-67**: [`back-end/src/services/auth.service.js:52-59`](back-end/src/services/auth.service.js) — `toPublicUser` strips `organization_id` and `hospital_id`, causing frontend session desync

### 3.5 Validator Constraints & Middleware
- [ ] **BE-68**: [`back-end/src/validators/appointment.validators.js:7, 12, 13`](back-end/src/validators/appointment.validators.js) — `doctor_id`, `scheduled_datetime`, `visit_type` incorrectly marked `optional: true`
- [ ] **BE-69**: [`back-end/src/validators/billing.validators.js:37`](back-end/src/validators/billing.validators.js) — `createDischargeSummaryRules` accepts non-schema attribute `file_path`
- [ ] **BE-70**: [`back-end/src/routes/billing.routes.js:120`](back-end/src/routes/billing.routes.js) — `POST /billing/leaders` lacks `validateBody` DTO validation middleware
- [ ] **BE-71**: [`back-end/src/validators/preRequest.validators.js:12, 13`](back-end/src/validators/preRequest.validators.js) — Accepts non-schema property `document_urls`
- [ ] **BE-72**: [`back-end/src/validators/ward.validators.js:31-32`](back-end/src/validators/ward.validators.js) — `pre_request_id` and `ward_id` incorrectly marked `optional: true`
- [ ] **BE-73**: [`back-end/src/validators/ward.validators.js:44`](back-end/src/validators/ward.validators.js) — `department` incorrectly marked `optional: true` on emergency notifications
- [ ] **BE-74**: [`back-end/src/validators/admission.validators.js:9`](back-end/src/validators/admission.validators.js) — `bed_id` marked `isNotEmpty`, rejecting valid pre-allocation admissions
- [ ] **BE-75**: [`back-end/src/routes/ward.routes.js:93`](back-end/src/routes/ward.routes.js) — Route mounting on singular `/ward/emergency` causes mismatch with frontend clients
- [ ] **BE-76**: [`back-end/src/controllers/platform.controller.js:456`](back-end/src/controllers/platform.controller.js) — Emits `base_platform_fee` without alias `base_fee`, breaking legacy consumers

---

## 4. Frontend Fetching, Attribute Binding & Payload Mapping

- [ ] **FE-01**: [`front-end/src/pages/pre/AppointmentPage.jsx:57, 163-171, 312`](front-end/src/pages/pre/AppointmentPage.jsx) — UI captures clinical complaint `#appointmentReason` in state, but drops `reason` from `api.preRequests.create()` payload
- [ ] **FE-02**: [`front-end/src/pages/pre/AppointmentPage.jsx:169`](front-end/src/pages/pre/AppointmentPage.jsx) — Transmits non-schema `appointment_time` instead of Table 27 canonical `requested_time`
- [ ] **FE-03**: [`front-end/src/pages/pre/BedRequestModal.jsx:120-123`](front-end/src/pages/pre/BedRequestModal.jsx) — Submits `priority` as `NORMAL`, `HIGH`, `CRITICAL` instead of schema enum values `NORMAL`, `URGENT`, `EMERGENCY`
- [ ] **FE-04**: [`front-end/src/pages/pre/Patient360Modal.jsx:137`](front-end/src/pages/pre/Patient360Modal.jsx) — Reads non-existent column `bed.ward_type` (always `undefined`), falling back to `'Ward'`
- [ ] **FE-05**: [`front-end/src/pages/pre/Patient360Modal.jsx:138`](front-end/src/pages/pre/Patient360Modal.jsx) — Reads non-existent column `adm.admission_type` (always `undefined`), falling back to `'Inpatient'`
- [ ] **FE-06**: [`front-end/src/pages/pre/DoctorRosterPage.jsx:51`](front-end/src/pages/pre/DoctorRosterPage.jsx) — Reads non-existent column `avail.days` (always `undefined`), permanently displaying static `'Mon – Sat'`
- [ ] **FE-07**: [`front-end/src/pages/pre/DischargePage.jsx:31-34`](front-end/src/pages/pre/DischargePage.jsx) — Reads non-existent column `a.bills_cleared` rather than checking `ledgers.status === 'PAID'`
- [ ] **FE-08**: [`front-end/src/pages/pre/preHelpers.js:84-134`](front-end/src/pages/pre/preHelpers.js) — Emits duplicate casing keys (`patient_name` AND `patientName`) to bridge mixed conventions
- [ ] **FE-09**: [`front-end/src/pages/pre/ApprovePopup.jsx:47, 50`](front-end/src/pages/pre/ApprovePopup.jsx) — Conflict detection couples directly to non-schema attributes `appointment_date` and `appointment_time`
- [ ] **FE-10**: [`front-end/src/pages/fa/faActions.js:130-139`](front-end/src/pages/fa/faActions.js) — Calculates insurance deduction but omits `insurance_deduction` from `dischargeSummary.create()` payload
- [ ] **FE-11**: [`front-end/src/pages/fa/faHelpers.js:73, 86`](front-end/src/pages/fa/faHelpers.js) — Dereferences non-existent columns `admission.doctor_id` and `admission.department`
- [ ] **FE-12**: [`front-end/src/pages/patient/PatientStoreContext.jsx:166-179`](front-end/src/pages/patient/PatientStoreContext.jsx) — Omits `copay_percentage` when saving insurance, silently resetting it to 0%
- [ ] **FE-13**: [`front-end/src/pages/hom/RestockModal.jsx:29-31, 81-87`](front-end/src/pages/hom/RestockModal.jsx) — Captures `supplier`, `priority`, and `notes`, but drops all three on submission; passes non-schema `invoice_url`
- [ ] **FE-14**: [`front-end/src/pages/hom/PostServiceModal.jsx:41-45`](front-end/src/pages/hom/PostServiceModal.jsx) — Omits mandatory `patient_id` from service payload, relying on backend memory fallback
- [ ] **FE-15**: [`front-end/src/pages/hom/PatientFlowPage.jsx:58-61`](front-end/src/pages/hom/PatientFlowPage.jsx) — Checks non-existent column `a.bills_cleared` rather than Table 17 `receipt_sent_to_hom`
- [ ] **FE-16**: [`front-end/src/pages/hom/HomLayout.jsx:26`](front-end/src/pages/hom/HomLayout.jsx) — Reads `session?.tenant?.hospital_name`, falling back to hardcoded string `'City General Hospital'`
- [ ] **FE-17**: [`front-end/src/pages/admin/DoctorDialog.jsx:15, 32, 49`](front-end/src/pages/admin/DoctorDialog.jsx) — Collects and submits `department`; Table 12 (`doctors`) lacks this column (assigned via `ward_id`)
- [ ] **FE-18**: [`front-end/src/pages/admin/ItemDialog.jsx:54-59`](front-end/src/pages/admin/ItemDialog.jsx) — Presents non-schema categories `Medicine` and `Linen` instead of `Medication` and `Consumable`
- [ ] **FE-19**: [`front-end/src/pages/platform/ProvisionDialog.jsx:52`](front-end/src/pages/platform/ProvisionDialog.jsx) — Hardcodes `plan_id: 1` during organization provisioning
- [ ] **FE-20**: [`front-end/src/pages/public/OrgSignupPage.jsx:192`](front-end/src/pages/public/OrgSignupPage.jsx) — Hardcodes `plan_id: 1` during public self-onboarding
- [ ] **FE-21**: [`front-end/src/api/endpoints/auth.js:34-40`](front-end/src/api/endpoints/auth.js) — Reads `payload.user.organization_id` (null) instead of `payload.tenant.organization_id`
- [ ] **FE-22**: [`front-end/src/api/endpoints/doctors.js`](front-end/src/api/endpoints/doctors.js), [`platform.js`](front-end/src/api/endpoints/platform.js) — Missing API client facade methods for `removeAvailability`, `getFullState`, and `setFullState`

---

## 5. State Persistence, Concurrency & Boot Mechanics

- [ ] **PST-01 (CRITICAL)**: **Event Loop Starvation & Data Loss in Persistence**  
  - **File**: [`back-end/src/store/persist.js:64-89`](back-end/src/store/persist.js)  
  - **Problem**: Synchronous busy-wait loop (`while (Date.now() < delayUntil)`) freezes the Node.js event loop for up to 75ms during Windows file locks; unlinks `.tmp` and fails silently if retries are exhausted.  
  - **Remediation**: Replace synchronous busy-wait with asynchronous debounced retry using `setTimeout` or `fs.promises`.

- [ ] **PST-02 (HIGH)**: **Zero Dirty-State Tracking on Disk Writes**  
  - **File**: [`back-end/src/store/persist.js:56-116`](back-end/src/store/persist.js)  
  - **Problem**: Serializes all 40 entity collections (7,100+ lines) on every non-GET request, causing heavy synchronous disk I/O under load.  
  - **Remediation**: Introduce dirty collection tracking so persistence only writes when actual data mutations have occurred.

- [ ] **PST-03 (MEDIUM)**: **Unpersisted Boot Reconciliation State**  
  - **File**: [`back-end/src/bootstrap.js:15-45`](back-end/src/bootstrap.js)  
  - **Problem**: `runBootReconciliation()` mutates `dataStore` in memory (permissions catalog, email domains, module flags) but never calls `persist.save()`. Modifications are lost if the process crashes before an external mutation.  
  - **Remediation**: Call `persist.save()` at the end of `runBootReconciliation()`.

- [ ] **PST-04 (MEDIUM)**: **Dirty State Leakage Across Failed Mutations**  
  - **File**: [`back-end/src/middleware/persistOnMutation.js:5-12`](back-end/src/middleware/persistOnMutation.js)  
  - **Problem**: If an endpoint partially mutates `dataStore` before throwing an error (`status >= 400`), the partial mutation remains in memory and is accidentally flushed to disk by a subsequent request.  
  - **Remediation**: Ensure service operations validate all preconditions and invariants before mutating in-memory arrays.

---

## 6. Dead Code, Deprecated Routes & Redundant Aliases

- [ ] **CLN-03 (LOW)**: **Remove Redundant Request Alias Trio**  
  - **Files**: [`back-end/src/routes/request.routes.js`](back-end/src/routes/request.routes.js), [`back-end/src/controllers/request.controller.js`](back-end/src/controllers/request.controller.js), [`back-end/src/services/request.service.js`](back-end/src/services/request.service.js)  
  - **Problem**: Legacy pass-through alias stubs re-exporting `appointment.*` without added logic.  
  - **Remediation**: Remove the 3 alias files and point any remaining consumers directly to `appointment.*`.

- [ ] **CLN-04 (LOW)**: **Clean Up Empty Collections in `dataStore.js`**  
  - **File**: [`back-end/src/store/dataStore.js`](back-end/src/store/dataStore.js)  
  - **Problem**: 4 empty/unused collections: `patientInsuranceDocuments`, `insurances`, `platformActivityLog`, `leaders`.  
  - **Remediation**: Deprecate and remove empty unused collections, updating schema references.

- [ ] **CLN-05 (LOW)**: **Remove Unreachable Defensive Code in Departments Page**  
  - **File**: [`front-end/src/pages/admin/DepartmentsPage.jsx:47-53`](front-end/src/pages/admin/DepartmentsPage.jsx)  
  - **Problem**: Defensive check `if (result && result.error)` is unreachable because `api.wards.remove()` throws an `ApiError` on HTTP errors.  
  - **Remediation**: Remove dead branch; rely on the existing `catch (err)` block.

- [ ] **CLN-06 (LOW)**: **Clean Up Legacy FA Hash Route Aliases**  
  - **File**: [`front-end/src/pages/fa/useHashRoute.js:14-17`](front-end/src/pages/fa/useHashRoute.js)  
  - **Problem**: Legacy aliases `#/dashboard` -> `#/ledger`, `#/discharge` -> `#/eod`, and `#/receipts` -> `#/eod`.  
  - **Remediation**: Consolidate onto the standard canonical routes.

---

## 7. Hardcoded Credentials, Secrets & Configuration Hardening

- [ ] **CFG-01 (MEDIUM)**: **Extract Fallback Secrets & Session Configuration**  
  - **File**: [`back-end/src/config/env.js:14`](back-end/src/config/env.js)  
  - **Problem**: Hardcoded fallback `SESSION_SECRET = 'federico-dev-secret'`.  
  - **Remediation**: Require `.env` secret in production; fail startup if missing.

- [ ] **CFG-02 (LOW)**: **Dynamic Invoice & Receipt Metadata**  
  - **Files**: [`front-end/src/pages/patient/patientInvoiceCopy.js:92`](front-end/src/pages/patient/patientInvoiceCopy.js), [`front-end/src/pages/patient/patientDocumentCopy.js:25-26`](front-end/src/pages/patient/patientDocumentCopy.js)  
  - **Problem**: Hardcoded hospital name `FEDERICO HOSPITALS`, support phone `+91 1800-456-7890`, and fallback UHID `UHID-882100`.  
  - **Remediation**: Read hospital branding and contact details dynamically from active tenant branding context.

- [ ] **CFG-03 (LOW)**: **Gate Demo Accounts by Environment**  
  - **File**: [`back-end/src/services/auth.service.js:299-314`](back-end/src/services/auth.service.js)  
  - **Problem**: `KNOWN_DEMO_PASSWORDS` returns plaintext passwords on `GET /auth/demo-accounts`.  
  - **Remediation**: Restrict `GET /auth/demo-accounts` to development/test environments (`NODE_ENV !== 'production'`).
