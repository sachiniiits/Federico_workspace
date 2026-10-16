# Federico Platform — Master Bugs, Defects & Remediation Checklist (`bugsandfixes.md`)

This is the comprehensive, exhaustive master tracking checklist containing every defect, bug, clinical invariant violation, relational schema discrepancy, frontend data-binding failure, race condition, dead code block, and hardcoded value identified across the Federico Hospital Operations platform from the line-by-line audit documented in `PROJECT_MEMORY.md`.

---

## 📑 Table of Contents
1. [Phased Remediation Roadmap & Summary](#1-phased-remediation-roadmap--summary)
2. [Completed Remediations (Phase 1 Security & Phase 2 Clinical Invariants)](#2-completed-remediations-phase-1--phase-2)
3. [Critical Preserved Defects & Systemic Functional Failures](#3-critical-preserved-defects--systemic-functional-failures)
4. [Backend Data Generation, Storage & Query Filter Invariants (D01 – D76)](#4-backend-data-generation-storage--query-filter-invariants-d01--d76)
5. [Frontend Fetching, Attribute Binding & Payload Mapping (DISC-01 – DISC-19 & Obs-A1 – Obs-E3)](#5-frontend-fetching-attribute-binding--payload-mapping)
6. [State Machine Inconsistencies & Concurrency Race Conditions](#6-state-machine-inconsistencies--concurrency-race-conditions)
7. [State Persistence, Concurrency & Boot Mechanics (PST-01 – PST-04)](#7-state-persistence-concurrency--boot-mechanics)
8. [Dead Code, Deprecated Routes & Redundant Aliases (CLN-03 – CLN-06)](#8-dead-code-deprecated-routes--redundant-aliases)
9. [Hardcoded Data, Credentials & Magic Numbers Catalog (CFG-01 – CFG-03)](#9-hardcoded-data-credentials--magic-numbers-catalog)

---

## 1. Phased Remediation Roadmap & Summary

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 REMEDIATION EXECUTION STATUS & ROADMAP                                │
├─────────┬───────────────────────────────────────────┬───────────────┬─────────────────────────────────┤
│ Phase   │ Category / Focus Area                     │ Total Items   │ Status                          │
├─────────┼───────────────────────────────────────────┼───────────────┼─────────────────────────────────┤
│ Phase 1 │ Critical Security Vulnerabilities         │ 5 Items       │ ✅ 100% COMPLETE & VERIFIED     │
│ Phase 2 │ Clinical Invariants & Relational Schema   │ 10 Items      │ ✅ 100% COMPLETE & VERIFIED     │
│ Phase 3 │ State Persistence & Concurrency (PST/RACE)│ 9 Items       │ ✅ 100% COMPLETE & VERIFIED     │
│ Phase 4 │ Critical Preserved Defects (DEF-D02-D11)  │ 8 Items       │ ✅ 100% COMPLETE & VERIFIED     │
│ Phase 5 │ Backend Query & Data Invariants (D01–D76) │ 76 Items      │ ✅ 100% COMPLETE & VERIFIED     │
│ Phase 6 │ Frontend Attribute & Payload Discrepancy  │ 32 Items      │ ✅ 100% COMPLETE & VERIFIED     │
│ Phase 7 │ Dead Code & Redundant Alias Removal (CLN) │ 4 Items       │ ✅ 100% COMPLETE & VERIFIED     │
│ Phase 8 │ Hardcoded Values & Config Hardening (CFG) │ 3 Items       │ ✅ 100% COMPLETE & VERIFIED     │
└─────────┴───────────────────────────────────────────┴───────────────┴─────────────────────────────────┘
```

---

## 2. Completed Remediations (Phase 1 & Phase 2)

### 🔴 Phase 1: Security Hardening (100% Complete)
- [x] **SEC-01 (CRITICAL)**: **Authentication Bypass via `x-role` Header**  
  - **File**: [`back-end/src/middleware/actorAccess.js:68,75`](file:///d:/Federico_workspace/back-end/src/middleware/actorAccess.js)  
  - **Remediation**: Completely eliminated `x-role` header checks and legacy bypasses from `actorAccess.js`, `preRequest.controller.js`, and `swagger.js`. Enforced session token verification across all routes and modernized test suites with `Authorization: Bearer <token>`; verified spoofed `x-role` requests receive HTTP 403 Forbidden.
- [x] **SEC-02 (HIGH)**: **Tenant Boundary Scoping Defense-in-Depth**  
  - **Files**: [`back-end/src/controllers/doctor.controller.js:67`](file:///d:/Federico_workspace/back-end/src/controllers/doctor.controller.js), [`back-end/src/services/doctor.service.js:66`](file:///d:/Federico_workspace/back-end/src/services/doctor.service.js)  
  - **Remediation**: Added `findAvailabilityById(id)` helper and enforced `belongsToOrg(availability, req)` with an HTTP 403 Forbidden check before executing availability deletion.
- [x] **SEC-03 (HIGH)**: **Mass Assignment in Request Body Validation**  
  - **Files**: [`back-end/src/services/doctor.service.js:36`](file:///d:/Federico_workspace/back-end/src/services/doctor.service.js), [`back-end/src/services/patient.service.js:62`](file:///d:/Federico_workspace/back-end/src/services/patient.service.js), [`back-end/src/services/admission.service.js:31`](file:///d:/Federico_workspace/back-end/src/services/admission.service.js)  
  - **Remediation**: Guarded entity updates to destructure and strip immutable primary keys and tenant identifiers (`doctor_id`, `patient_id`, `admission_id`, `organization_id`, `uhid`, `admit_time`).
- [x] **SEC-04 (MEDIUM)**: **Call Stack Overflow Hazard in Platform Auth**  
  - **File**: [`back-end/src/services/platformAuth.service.js:75`](file:///d:/Federico_workspace/back-end/src/services/platformAuth.service.js)  
  - **Remediation**: Replaced `Math.max` array spread with `maxId(dataStore.platformSuperUsers, 'platform_user_id') + 1 || 1`.
- [x] **SEC-05 (HIGH)**: **Hardcoded Development Secrets**  
  - **File**: [`back-end/src/config/env.js:25`](file:///d:/Federico_workspace/back-end/src/config/env.js)  
  - **Remediation**: Added startup verification emitting a high-severity security warning if the placeholder secret is detected in production mode.

### 🏥 Phase 2: Clinical & Relational Invariants (100% Complete)
- [x] **CLN-01 (HIGH)**: **Doctor Schedule Double-Booking Invariant Breach**  
  - **File**: [`back-end/src/store/dataStore.js`](file:///d:/Federico_workspace/back-end/src/store/dataStore.js)  
  - **Remediation**: Rescheduled appointment #608 to `2026-08-19T13:00:00` within availability window 516 (12:00–15:00) with zero collisions; enforced `UNIQUE KEY uq_doctor_slot (doctor_id, scheduled_datetime)` in DDL.
- [x] **CLN-02 (CRITICAL)**: **Concurrent Double-Admissions for Single Patients**  
  - **File**: [`back-end/src/store/dataStore.js`](file:///d:/Federico_workspace/back-end/src/store/dataStore.js)  
  - **Remediation**: Reconciled historical admissions: marked admission #711 (dispatched ledger #810) and admission #703 as `DISCHARGED` with historical timestamps; set physical beds #56 and #43 to `AVAILABLE`.
- [x] **DB-01 (HIGH)**: **Broken Foreign Key in `appointments.created_by`**  
  - **File**: [`back-end/src/store/dataStore.js`](file:///d:/Federico_workspace/back-end/src/store/dataStore.js)  
  - **Remediation**: Mapped `created_by` to linked patient user accounts (201 -> 102, 202 -> 103, 203 -> 104) and front-desk booking staff user #105 (Rekha Nair, PRE), strictly satisfying `FOREIGN KEY (created_by) REFERENCES users(user_id)`.
- [x] **DB-02 (HIGH)**: **Phantom Foreign Key in `receipts.payment_id`**  
  - **File**: [`back-end/src/store/dataStore.js`](file:///d:/Federico_workspace/back-end/src/store/dataStore.js)  
  - **Remediation**: Seeded missing payment record #990 (`ledger_id: 809`, `amount_paid: 500`, `payment_mode: 'UPI'`), ensuring complete referential integrity with `FOREIGN KEY (payment_id) REFERENCES payments(payment_id)`.
- [x] **DB-03 (HIGH)**: **User Account Scoping for Registered Patients vs Walk-ins**  
  - **File**: [`back-end/src/store/dataStore.js`](file:///d:/Federico_workspace/back-end/src/store/dataStore.js), [`Database/Federico_Schemas.md`](file:///d:/Federico_workspace/Database/Federico_Schemas.md)  
  - **Remediation**: Formally modeled `patients.user_id INT NULL REFERENCES users(user_id) ON DELETE SET NULL` in SQL DDL and schema documentation, cleanly separating walk-in clinical records from portal self-service users.
- [x] **DB-04 (HIGH)**: **Missing Appointment FK in Admissions & Emergency Validation**  
  - **File**: [`back-end/src/store/dataStore.js`](file:///d:/Federico_workspace/back-end/src/store/dataStore.js), [`back-end/src/validators/admission.validators.js`](file:///d:/Federico_workspace/back-end/src/validators/admission.validators.js)  
  - **Remediation**: Linked all 6 elective admissions (#705, #707, #710, #712, #717, #718) to their matching appointment IDs; updated `admission.validators.js` with `optional: true` on `appointment_id` for direct emergency admissions.
- [x] **DB-05 (MEDIUM)**: **Declared Ward Capacity vs Bed Array Count Mismatch**  
  - **File**: [`back-end/src/store/dataStore.js`](file:///d:/Federico_workspace/back-end/src/store/dataStore.js)  
  - **Remediation**: Seeded missing physical beds `G-115` to `G-120` (Ward 1) and `ICU-01` to `ICU-04`, `ICU-09`, `ICU-10` (Ward 2) as `AVAILABLE`, restoring 100% capacity alignment.
- [x] **DB-06 (MEDIUM)**: **Missing Billing Ledgers for Active Admissions**  
  - **File**: [`back-end/src/store/dataStore.js`](file:///d:/Federico_workspace/back-end/src/store/dataStore.js), [`back-end/src/test/allocation_and_booking_guards.spec.js`](file:///d:/Federico_workspace/back-end/src/test/allocation_and_booking_guards.spec.js)  
  - **Remediation**: Seeded open financial ledger #812 for admission #708, and updated test suite with dynamic fallback creation so tests remain resilient under any ledger state.
- [x] **DB-07 (MEDIUM)**: **Inconsistent Ledger Entry Primary Key Generation**  
  - **File**: [`back-end/src/services/preRequest.service.js:395-404`](file:///d:/Federico_workspace/back-end/src/services/preRequest.service.js)  
  - **Remediation**: Unified `preRequest.service.js` to compute `entry_id` per-ledger (`filter(e => e.ledger_id === ledger.ledger_id).length + 1`) and populated `entry_time`.
- [x] **DB-08 (HIGH)**: **Unrestricted Cascading Deletion in Patient Service**  
  - **File**: [`back-end/src/services/patient.service.js:70-80`](file:///d:/Federico_workspace/back-end/src/services/patient.service.js), [`back-end/src/controllers/patient.controller.js:70-78`](file:///d:/Federico_workspace/back-end/src/controllers/patient.controller.js)  
  - **Remediation**: Added active admission guard in `patient.service.js:remove()` throwing HTTP 409 Conflict if `admissions.some(a => a.patient_id === id && a.status === 'ADMITTED')`, forwarded via controller try/catch to standard error handler.

---

## 3. Critical Preserved Defects & Systemic Functional Failures

- [x] **DEF-D02 (CRITICAL)**: **Ward Emergencies Dead Code & Route Retirement**  
  - **Files**: [`front-end/src/api/endpoints/wards.js`](file:///d:/Federico_workspace/front-end/src/api/endpoints/wards.js), [`back-end/src/routes/ward.routes.js`](file:///d:/Federico_workspace/back-end/src/routes/ward.routes.js), [`back-end/src/controllers/ward.controller.js`](file:///d:/Federico_workspace/back-end/src/controllers/ward.controller.js), [`back-end/src/services/ward.service.js`](file:///d:/Federico_workspace/back-end/src/services/ward.service.js), [`back-end/src/validators/ward.validators.js`](file:///d:/Federico_workspace/back-end/src/validators/ward.validators.js), [`back-end/src/config/swagger.js`](file:///d:/Federico_workspace/back-end/src/config/swagger.js), [`back-end/docs/swagger.json`](file:///d:/Federico_workspace/back-end/docs/swagger.json)  
  - **Remediation**: Completely excised dead emergency cases / notifications subsystem per user directive. Removed dead `api.wards.emergencies` client methods, excised `/emergency` and `/emergencies` routes, removed corresponding controller handlers (`findAllEmergencies`, `createEmergency`, `updateEmergency`), service methods, and request validation rules (`createEmergencyRules`, `updateEmergencyRules`), and pruned Swagger documentation. Verified 404 behavior and test suite passes via `phase_4_critical_defects.spec.js`.

- [x] **DEF-D03 (HIGH)**: **Platform Rate Card Fee Desync**  
  - **Files**: [`front-end/src/pages/admin/DashboardPage.jsx:93-94`](file:///d:/Federico_workspace/front-end/src/pages/admin/DashboardPage.jsx#L93-L94), [`front-end/src/pages/public/OrgSignupPage.jsx:119-122`](file:///d:/Federico_workspace/front-end/src/pages/public/OrgSignupPage.jsx#L119-L122), [`back-end/src/controllers/platform.controller.js:470-512`](file:///d:/Federico_workspace/back-end/src/controllers/platform.controller.js#L470-L512)  
  - **Remediation**: Normalized `getGlobalRates` and `updateGlobalRates` in `platform.controller.js` to emit both `base_platform_fee` and legacy alias `base_fee`. Updated `DashboardPage.jsx` to read `r?.base_platform_fee ?? r?.base_fee ?? 3000` and `OrgSignupPage.jsx` to read `data.base_platform_fee ?? data.base_fee`. Verified via automated tests.

- [x] **DEF-D04 (HIGH)**: **Patient Insurance Display Omission**  
  - **Files**: [`front-end/src/pages/patient/patientStoreShape.js:77-103`](file:///d:/Federico_workspace/front-end/src/pages/patient/patientStoreShape.js#L77-L103), [`front-end/src/pages/patient/BillingPage.jsx:33, 143-180`](file:///d:/Federico_workspace/front-end/src/pages/patient/BillingPage.jsx#L143-L180)  
  - **Remediation**: Exported `hasInsurance: Boolean(insurance && (insurance.policy_number || insurance.provider_name) && insurance.provider_name !== 'Self Pay')` in `buildProfile`. In `BillingPage.jsx`, wired dynamic insurance banner rendering active verified policy details when `ins?.hasInsurance` is true, and cleanly falling back to the Self Pay card when false.

- [x] **DEF-D05 (MEDIUM)**: **Omission of `doctorId` in `buildAppointments`**  
  - **File**: [`front-end/src/pages/patient/patientStoreShape.js:174, 207`](file:///d:/Federico_workspace/front-end/src/pages/patient/patientStoreShape.js#L174)  
  - **Remediation**: Exported `doctorId: docId` on appointment items and `doctorId: pr.doctor_id || null` on pre-request items in `buildAppointments`, ensuring doctor filter criteria narrow correctly for downstream consumers.

- [x] **DEF-D07 (HIGH)**: **Uncontrolled Insurance Override Input in FA Settlement**  
  - **File**: [`front-end/src/pages/fa/SettlementSection.jsx:87-165`](file:///d:/Federico_workspace/front-end/src/pages/fa/SettlementSection.jsx#L87-L165)  
  - **Remediation**: Controlled `#coverage-override` input with reactive state `userOverride`, dynamically recalculating `#net-payable-preview` in real time as the user types without useEffect cascading re-renders, while maintaining `coverageOverrideRef` attachment for click handlers.

- [x] **DEF-D11 (CRITICAL)**: **Ghost Password Update in Patient Profile**  
  - **Files**: [`front-end/src/pages/patient/ProfilePage.jsx:169-188`](file:///d:/Federico_workspace/front-end/src/pages/patient/ProfilePage.jsx#L169-L188), [`front-end/src/api/endpoints/auth.js:82-85`](file:///d:/Federico_workspace/front-end/src/api/endpoints/auth.js#L82-L85), [`back-end/src/routes/auth.routes.js:33`](file:///d:/Federico_workspace/back-end/src/routes/auth.routes.js#L33), [`back-end/src/controllers/auth.controller.js:172-200`](file:///d:/Federico_workspace/back-end/src/controllers/auth.controller.js#L172-L200), [`back-end/src/services/auth.service.js:378-397`](file:///d:/Federico_workspace/back-end/src/services/auth.service.js#L378-L397)  
  - **Remediation**: Implemented `changePassword(userId, newPassword, currentPassword)` in `auth.service.js` with bcrypt verification and hashing. Exposed `PUT /auth/password` with session authentication in `auth.controller.js` and `auth.routes.js`. Wired frontend `api.auth.changePassword()` to ProfilePage submit handler with client/server validation. Verified via automated tests.

- [x] **DEF-OCCUPANCY (CRITICAL)**: **HOM Dashboard Bed Occupancy Permanently 0%**  
  - **File**: [`front-end/src/pages/hom/DashboardPage.jsx:128-132`](file:///d:/Federico_workspace/front-end/src/pages/hom/DashboardPage.jsx#L128-L132)  
  - **Remediation**: Replaced non-existent `w.occupied_beds` with physical bed status filtering: `d.beds.filter(b => b.status === 'OCCUPIED').length` and `totalBeds = d.beds.length || ...`, matching `BedManagementPage.jsx:111` and schema Table 16.

- [x] **DEF-SIGNUP-INS (CRITICAL)**: **Silent Insurance Drop on Patient Registration**  
  - **File**: [`front-end/src/pages/public/SignupPage.jsx:25-38, 161-175, 340-350`](file:///d:/Federico_workspace/front-end/src/pages/public/SignupPage.jsx#L25-L38)  
  - **Remediation**: Added `normalizeToIsoDate` utility converting localized `DD/MM/YYYY` formats to ISO-8601 `YYYY-MM-DD`. Updated validity date inputs to `type="date"` and normalized dates before dispatching `createInsurance`, preventing silent validator rejections on signup.

- [x] **DEF-LEDGER-SEQ (CRITICAL)**: **Composite Key Sequence Reset Bug in Billing**  
  - **File**: [`back-end/src/services/billing.service.js:95`](file:///d:/Federico_workspace/back-end/src/services/billing.service.js#L95)  
  - **Remediation**: Coerced `ledgerId = Number(entry.ledger_id)` before filtering and computed `reduce((max, e) => Math.max(max, Number(e.entry_id) || 0), 0) + 1` for monotonic sequential primary key generation without collisions.

---

## 4. Backend Data Generation, Storage & Query Filter Invariants (D01 – D76) — ✅ COMPLETED & VERIFIED

| ID | File Path & Line | Method / Location | Expected (`Federico_Schemas.md`) | Implemented in Code | Category | Operational Impact |
|:---|:---|:---|:---|:---|:---|:---|
| **D01** | [`admission.service.js:11`](file:///d:/Federico_workspace/back-end/src/services/admission.service.js#L11) | `findOne(id)` | `admission_id INT` | `a.admission_id === id` | Filter type mismatch | Returns `null` if `id` is string parameter; false 404s. |
| **D02** | [`appointment.service.js:21`](file:///d:/Federico_workspace/back-end/src/services/appointment.service.js#L21) | `findOne(id)` | `appointment_id INT` | `a.appointment_id === id` | Filter type mismatch | Appointment lookup fails if `id` is string. |
| **D03** | [`appointment.service.js:57`](file:///d:/Federico_workspace/back-end/src/services/appointment.service.js#L57) | `create(appointment)` | `created_by INT NOT NULL` (FK -> `users`) | Hardcoded fallback `105` | FK hardcoding | Misattributes appointment creator to User 105 across tenants. |
| **D04** | [`appointment.service.js:66-69`](file:///d:/Federico_workspace/back-end/src/services/appointment.service.js#L66-L69) | `create(appointment)` | Only `scheduled_datetime DATETIME` | Adds `appointment_date`, `appointment_time`, `department` | Attribute mismatch | Redundant fields polluting entity payload. |
| **D05** | [`appointment.service.js:68`](file:///d:/Federico_workspace/back-end/src/services/appointment.service.js#L68) | `create(appointment)` | `scheduled_datetime DATETIME NOT NULL` | Template `${date}T${time}` without timezone | Timestamp format | Creates invalid/unstandardized ISO strings (e.g. `...T09:00 AM`). |
| **D06** | [`appointment.service.js:71`](file:///d:/Federico_workspace/back-end/src/services/appointment.service.js#L71) | `create(appointment)` | `status DEFAULT 'CONFIRMED'` | `status: appointment.status \|\| 'SCHEDULED'` | Enum mismatch | Uses `'SCHEDULED'` not present in Table 14 schema enum. |
| **D07** | [`appointment.service.js:86`](file:///d:/Federico_workspace/back-end/src/services/appointment.service.js#L86) | `update(id, patch)` | `appointment_id INT` | `pr.appointment_id === id` | Filter type mismatch | Pre-request appointment sync fails if `id` is string. |
| **D08** | [`appointment.validators.js:7, 12, 13`](file:///d:/Federico_workspace/back-end/src/validators/appointment.validators.js#L7) | `createAppointmentRules` | `doctor_id`, `scheduled_datetime`, `visit_type` NOT NULL | Marked `optional: true` | Validation constraint | Incomplete appointments pass validation. |
| **D09** | [`billing.service.js:32`](file:///d:/Federico_workspace/back-end/src/services/billing.service.js#L32) | `findLedgerByAdmission` | `admission_id INT` | `l.admission_id === admission_id` | Filter type mismatch | Ledger lookup fails when `admission_id` is string. |
| **D10** | [`billing.service.js:36`](file:///d:/Federico_workspace/back-end/src/services/billing.service.js#L36) | `findLedgerById` | `ledger_id INT` | `l.ledger_id === ledger_id` | Filter type mismatch | Fails to find ledger if `ledger_id` is string. |
| **D11** | [`billing.service.js:60-61`](file:///d:/Federico_workspace/back-end/src/services/billing.service.js#L60-L61) | `createLedger` | `organization_id INT`, `hospital_id INT` | Uncoerced `ledger.organization_id`, `hospital_id` | FK coercion | Stores string foreign keys in integer columns. |
| **D12** | [`billing.service.js:72`](file:///d:/Federico_workspace/back-end/src/services/billing.service.js#L72) | `findLedgerEntries` | `ledger_id INT` | `e.ledger_id === ledger_id` | Filter type mismatch | Returns `[]` if `ledger_id` is string; causes 0 total bill calculation. |
| **D13** | [`billing.service.js:95`](file:///d:/Federico_workspace/back-end/src/services/billing.service.js#L95) | `addLedgerEntry` | Composite key sequence `(ledger_id, entry_id)` | Compares `e.ledger_id === entry.ledger_id` (uncoerced) | Filter / PK generation | If `entry.ledger_id` is string, `entry_id` always resets to 1, duplicating PK. |
| **D14** | [`billing.service.js:136`](file:///d:/Federico_workspace/back-end/src/services/billing.service.js#L136) | `createPayment` | `payment_mode VARCHAR` (`Cash`, `Card`, `UPI`) | Defaults to uppercase `'CASH'` | Enum casing | Inconsistent enum casing with schema definition. |
| **D15** | [`billing.service.js:173`](file:///d:/Federico_workspace/back-end/src/services/billing.service.js#L173) | `createPayment` | `ledgers` columns per Table 20 | Injects `ledger.cleared_at` | Attribute mismatch | Non-schema attribute added to ledger. |
| **D16** | [`billing.service.js:177`](file:///d:/Federico_workspace/back-end/src/services/billing.service.js#L177) | `createPayment` | `admissions.receipt_sent_to_hom BOOLEAN` | Injects `admission.bills_cleared = true` | Attribute mismatch | Redundant field that bypasses schema `receipt_sent_to_hom`. |
| **D17** | [`billing.service.js:178`](file:///d:/Federico_workspace/back-end/src/services/billing.service.js#L178) | `createPayment` | `admissions.status ('ADMITTED', 'DISCHARGED')` | `admission.status = 'PAYMENT_CONFIRMED'` | Enum mismatch | Corrupts admission status to a value outside Table 17 enum. |
| **D18** | [`billing.service.js:193`](file:///d:/Federico_workspace/back-end/src/services/billing.service.js#L193) | `createPayment` | `ledgers.status ('OPEN', 'DISPATCHED', 'PAID')` | `ledger.status = 'PARTIALLY_PAID'` | Enum mismatch | Corrupts ledger status to a value outside Table 20 enum. |
| **D19** | [`billing.service.js:211`](file:///d:/Federico_workspace/back-end/src/services/billing.service.js#L211) | `dispatchLedger` | `ledger_id INT` | `l.ledger_id === ledger_id` | Filter type mismatch | Dispatch fails if `ledger_id` is string. |
| **D20** | [`billing.service.js:277`](file:///d:/Federico_workspace/back-end/src/services/billing.service.js#L277) | `findDischargeSummaryByAdmission` | `admission_id INT` | `s.admission_id === admission_id` | Filter type mismatch | Discharge summary lookup fails if `admission_id` is string. |
| **D21** | [`billing.service.js:330`](file:///d:/Federico_workspace/back-end/src/services/billing.service.js#L330) | `findLeaderById` | `leader_id INT` | `l.leader_id === leader_id` | Filter type mismatch | Leader lookup fails if `leader_id` is string. |
| **D22** | [`billing.service.js:425`](file:///d:/Federico_workspace/back-end/src/services/billing.service.js#L425) | `approveLeader` | `leaders` columns per Table 24 | Injects `leader.ledger_id` | Attribute mismatch | Non-schema attribute added to leader. |
| **D23** | [`billing.controller.js:81`](file:///d:/Federico_workspace/back-end/src/controllers/billing.controller.js#L81) | `createPayment` | `ledger_id INT` | Passes uncoerced `req.body.ledger_id` to `findLedgerById` | Security / Filter mismatch | Ledger evaluates to null; tenant ownership check bypassed. |
| **D24** | [`billing.validators.js:37`](file:///d:/Federico_workspace/back-end/src/validators/billing.validators.js#L37) | `createDischargeSummaryRules` | `discharge_summaries` per Table 18 | Accepts `file_path` | Attribute mismatch | Accepts non-schema field. |
| **D25** | [`billing.routes.js:120`](file:///d:/Federico_workspace/back-end/src/routes/billing.routes.js#L120) | `POST /billing/leaders` | DTO validation middleware | No `validateBody` middleware attached | Validation missing | Unvalidated payloads accepted directly into billing leaders. |
| **D26** | [`doctor.service.js:16`](file:///d:/Federico_workspace/back-end/src/services/doctor.service.js#L16) | `findDoctorById` | `doctor_id INT` | `d.doctor_id === doctor_id` | Filter type mismatch | Doctor lookup returns null if string passed. |
| **D27** | [`doctor.service.js:25`](file:///d:/Federico_workspace/back-end/src/services/doctor.service.js#L25) | `createDoctor` | `doctors` columns per Table 12 | Adds `department: 'General'` | Attribute mismatch | Non-schema field stored on doctors. |
| **D28** | [`doctor.service.js:28, 51`](file:///d:/Federico_workspace/back-end/src/services/doctor.service.js#L28) | `createDoctor`, `deleteDoctor` | `doctors` columns per Table 12 | Adds `is_active` and `status: 'INACTIVE'` | Attribute mismatch | Non-schema fields stored on doctors. |
| **D29** | [`doctor.service.js:53`](file:///d:/Federico_workspace/back-end/src/services/doctor.service.js#L53) | `deleteDoctor` | `doctor_id INT` | `d.doctor_id !== doctor_id` | Filter type mismatch | Deletion fails if string ID passed. |
| **D30** | [`doctor.service.js:65`](file:///d:/Federico_workspace/back-end/src/services/doctor.service.js#L65) | `findAvailabilityByDoctor` | `doctor_id INT` | `a.doctor_id === doctor_id` | Filter type mismatch | Returns empty list if doctor_id is string. |
| **D31** | [`doctor.service.js:72`](file:///d:/Federico_workspace/back-end/src/services/doctor.service.js#L72) | `findAvailabilityById` | `availability_id INT` | `a.availability_id === availability_id` | Filter type mismatch | Returns null if availability_id is string. |
| **D32** | [`doctor.service.js:200`](file:///d:/Federico_workspace/back-end/src/services/doctor.service.js#L200) | `deleteAvailability` | `availability_id INT` | `a.availability_id !== availability_id` | Filter type mismatch | Deletion fails if string ID passed. |
| **D33** | [`inventory.service.js:28, 36, 39`](file:///d:/Federico_workspace/back-end/src/services/inventory.service.js#L28) | `updateItem`, `deleteItem` | `item_id INT` | `i.item_id === item_id` / `!== item_id` | Filter type mismatch | Item updates/deletions fail if string ID passed. |
| **D34** | [`inventory.service.js:54`](file:///d:/Federico_workspace/back-end/src/services/inventory.service.js#L54) | `createRequest` | `quantity_requested INT` | Injects both `quantity` and `quantity_requested` | Attribute mismatch | Redundant non-schema attribute `quantity`. |
| **D35** | [`inventory.service.js:57`](file:///d:/Federico_workspace/back-end/src/services/inventory.service.js#L57) | `createRequest` | `requested_by INT` (FK -> `users`) | Hardcoded fallback `101` | FK hardcoding | Misattributes purchase requests to User 101. |
| **D36** | [`inventory.service.js:63`](file:///d:/Federico_workspace/back-end/src/services/inventory.service.js#L63) | `createRequest` | `purchase_requests` per Table 26 | Injects `invoice_url` | Attribute mismatch | Non-schema field stored on purchase request. |
| **D37** | [`inventory.service.js:71`](file:///d:/Federico_workspace/back-end/src/services/inventory.service.js#L71) | `updateRequest` | `request_id INT` | `r.request_id === request_id` | Filter type mismatch | Request update fails if string ID passed. |
| **D38** | [`patient.service.js:48, 50`](file:///d:/Federico_workspace/back-end/src/services/patient.service.js#L48) | `create(patient)` | `patients` columns per Table 10 | Adds `email` and `alternate_phone` | Attribute mismatch | Non-schema fields stored on patient. |
| **D39** | [`patient.service.js:108`](file:///d:/Federico_workspace/back-end/src/services/patient.service.js#L108) | `createInsurance` | `coverage_type ('Comprehensive', 'Corporate', 'Individual')` | Defaults to `'Self'` | Enum mismatch | Non-schema enum value `'Self'` stored. |
| **D40** | [`preRequest.service.js:16-26`](file:///d:/Federico_workspace/back-end/src/services/preRequest.service.js#L16-L26) | Pre-request state machine | `status ('PENDING', 'APPROVED', 'REJECTED', 'ALLOCATED')` | 9 distinct statuses (`ADMITTED`, `DISCHARGED`, etc.) | State machine mismatch | Overloads pre-requests with inpatient admission states. |
| **D41** | [`preRequest.service.js:100`](file:///d:/Federico_workspace/back-end/src/services/preRequest.service.js#L100) | `createLinkedAppointment` | `scheduled_datetime DATETIME NOT NULL` | Template `${date}T${time}` without timezone | Timestamp format | Stored string is unstandardized ISO-8601. |
| **D42** | [`preRequest.service.js:104`](file:///d:/Federico_workspace/back-end/src/services/preRequest.service.js#L104) | `createLinkedAppointment` | `created_by INT` (FK -> `users`) | Hardcoded fallback `105` | FK hardcoding | Misattributes appointment creator to User 105. |
| **D43** | [`preRequest.service.js:115`](file:///d:/Federico_workspace/back-end/src/services/preRequest.service.js#L115) | `findOne(id)` | `pre_request_id INT` | `p.pre_request_id === id` | Filter type mismatch | Lookup fails if `id` is string. |
| **D44** | [`preRequest.service.js:132-133`](file:///d:/Federico_workspace/back-end/src/services/preRequest.service.js#L132-L133) | `create` | `pre_requests` columns per Table 27 | Injects `note` and `document_urls` | Attribute mismatch | Non-schema attributes stored on pre-request. |
| **D45** | [`preRequest.service.js:196`](file:///d:/Federico_workspace/back-end/src/services/preRequest.service.js#L196) | `updateFields` | `scheduled_datetime DATETIME` | Template `${date}T${time}` | Timestamp format | Produces non-standard ISO string. |
| **D46** | [`preRequest.service.js:303`](file:///d:/Federico_workspace/back-end/src/services/preRequest.service.js#L303) | `consultationServiceFor` | `organization_id INT` | `s.organization_id === organizationId` | Filter type mismatch | Fails to match org service if string passed; creates duplicate service. |
| **D47** | [`preRequest.service.js:369`](file:///d:/Federico_workspace/back-end/src/services/preRequest.service.js#L369) | `checkIn` (OPD branch) | `admit_time DATETIME NOT NULL` | Uses `admission_date` | Field name mismatch | Emits `admission_date` instead of `admit_time`; consumers get `undefined`. |
| **D48** | [`preRequest.service.js:364-374`](file:///d:/Federico_workspace/back-end/src/services/preRequest.service.js#L364-L374) | `checkIn` (OPD branch) | Table 17 `admissions` schema | Omits `admit_time`, `discharge_time`, `bed_id`, `receipt_sent_to_hom`; adds `doctor_id`, `department`, `visit_type`, `created_at` | Attribute mismatch | Admission record fails Table 17 structural conformity. |
| **D49** | [`preRequest.service.js:408`](file:///d:/Federico_workspace/back-end/src/services/preRequest.service.js#L408) | `checkIn` (OPD branch) | Table 21 `ledger_entries` schema | Injects `created_at` | Attribute mismatch | Extra field not in Table 21 schema. |
| **D50** | [`preRequest.service.js:446`](file:///d:/Federico_workspace/back-end/src/services/preRequest.service.js#L446) | `checkIn` (Inpatient branch) | `ward_id INT NOT NULL` (FK -> `wards`) | `ward_id: null` | FK constraint breach | Sets null on NOT NULL foreign key. |
| **D51** | [`preRequest.service.js:450`](file:///d:/Federico_workspace/back-end/src/services/preRequest.service.js#L450) | `checkIn` (Inpatient branch) | `requested_by INT NOT NULL` (FK -> `users`) | `requested_by: actorRole \|\| 'PRE'` (string) | FK type mismatch | Stores role string `'PRE'` into an integer foreign key column. |
| **D52** | [`preRequest.validators.js:12, 13`](file:///d:/Federico_workspace/back-end/src/validators/preRequest.validators.js#L12) | `createPreRequestRules` | Table 27 columns | Accepts `document_urls` | Attribute mismatch | Accepts non-schema property. |
| **D53** | [`ward.service.js:64, 109, 120`](file:///d:/Federico_workspace/back-end/src/services/ward.service.js#L64) | `updateWard`, `deleteWard` | `ward_id INT` | `w.ward_id === ward_id` / `!== ward_id` | Filter type mismatch | Ward operations fail if string ID passed. |
| **D54** | [`ward.service.js:131`](file:///d:/Federico_workspace/back-end/src/services/ward.service.js#L131) | `findBedsByWard` | `ward_id INT` | `b.ward_id === ward_id` | Filter type mismatch | Returns empty array if string ward_id passed. |
| **D55** | [`ward.service.js:149`](file:///d:/Federico_workspace/back-end/src/services/ward.service.js#L149) | `updateBedStatus` | `bed_id INT` | `b.bed_id === bed_id` | Filter type mismatch | Bed update fails if string bed_id passed. |
| **D56** | [`ward.service.js:184`](file:///d:/Federico_workspace/back-end/src/services/ward.service.js#L184) | `createBedRequest` | `pre_request_id INT NOT NULL` (FK) | Allows `null` | FK constraint breach | Violates Table 28 mandatory foreign key. |
| **D57** | [`ward.service.js:186`](file:///d:/Federico_workspace/back-end/src/services/ward.service.js#L186) | `createBedRequest` | `ward_id INT NOT NULL` (FK) | Allows `null` | FK constraint breach | Violates Table 28 mandatory foreign key. |
| **D58** | [`ward.service.js:190`](file:///d:/Federico_workspace/back-end/src/services/ward.service.js#L190) | `createBedRequest` | `requested_by INT NOT NULL` (FK) | Allows `null` / uncoerced | FK constraint breach | Violates Table 28 mandatory foreign key. |
| **D59** | [`ward.service.js:224`](file:///d:/Federico_workspace/back-end/src/services/ward.service.js#L224) | `updateBedRequest` | `bed_request_id INT` | `r.bed_request_id === id` | Filter type mismatch | Bed request update fails if string ID passed. |
| **D60** | [`ward.service.js:247`](file:///d:/Federico_workspace/back-end/src/services/ward.service.js#L247) | `updateBedRequest` | `status ('PENDING', 'APPROVED', 'ALLOCATED', 'REJECTED')` | `request.status = 'DENIED'` | Enum mismatch | Sets status `'DENIED'` not in Table 28 schema enum. |
| **D61** | [`ward.service.js`](file:///d:/Federico_workspace/back-end/src/services/ward.service.js) | `createEmergency` | `department VARCHAR(100) NOT NULL` | Retired | Subsystem Removal | Subsystem removed entirely per user directive. |
| **D62** | [`ward.service.js`](file:///d:/Federico_workspace/back-end/src/services/ward.service.js) | `createEmergency` | `created_by INT NOT NULL` (FK -> `users`) | Retired | Subsystem Removal | Subsystem removed entirely per user directive. |
| **D63** | [`ward.service.js`](file:///d:/Federico_workspace/back-end/src/services/ward.service.js) | `updateEmergency` | `emergency_id INT` | Retired | Subsystem Removal | Subsystem removed entirely per user directive. |
| **D64** | [`ward.controller.js`](file:///d:/Federico_workspace/back-end/src/controllers/ward.controller.js) | `createEmergency` | `emergency_notifications.department` | Retired | Subsystem Removal | Subsystem removed entirely per user directive. |
| **D65** | [`ward.validators.js:31-32`](file:///d:/Federico_workspace/back-end/src/validators/ward.validators.js#L31) | `createBedRequestRules` | `pre_request_id`, `ward_id` NOT NULL | Both marked `optional: true` | Validation constraint | Incomplete bed requests pass validation. |
| **D66** | [`ward.validators.js`](file:///d:/Federico_workspace/back-end/src/validators/ward.validators.js) | `createEmergencyRules` | `department` NOT NULL | Retired | Subsystem Removal | Subsystem removed entirely per user directive. |
| **D67** | [`admission.validators.js:9`](file:///d:/Federico_workspace/back-end/src/validators/admission.validators.js#L9) | `createAdmissionRules` | `bed_id INT NULL` | Marked `isNotEmpty` | Validation constraint | Rejects valid pre-allocation admissions. |
| **D68** | [`organization.service.js:84`](file:///d:/Federico_workspace/back-end/src/services/organization.service.js#L84) | `findById` | `organization_id INT` | `o.organization_id === id` | Filter type mismatch | Org lookup fails if string ID passed. |
| **D69** | [`subscription.service.js:9`](file:///d:/Federico_workspace/back-end/src/services/subscription.service.js#L9) | `findByOrg` | `organization_id INT` | `s.organization_id === organizationId` | Filter type mismatch | Subscription lookup fails if string org ID passed. |
| **D70** | [`subscriptionPlan.service.js:11`](file:///d:/Federico_workspace/back-end/src/services/subscriptionPlan.service.js#L11) | `findById` | `plan_id INT` | `p.plan_id === id` | Filter type mismatch | Plan lookup fails if string ID passed. |
| **D71** | [`activity.service.js:13-20`](file:///d:/Federico_workspace/back-end/src/services/activity.service.js#L13-L20) | `log` | `activity_log` per Table 36 | Omits `hospital_id`; logs severity level as `type` | Attribute mismatch | Missing multi-facility scoping column; non-semantic event types. |
| **D72** | [`doctor.service.js:153`](file:///d:/Federico_workspace/back-end/src/services/doctor.service.js#L153) | `findConflictingAppointment` | `appointment_id INT` | `appointment.appointment_id === excludeId` (uncoerced) | Filter type mismatch | Strict comparison against string `excludeId` causes false self-conflict on reschedule. |
| **D73** | [`rbac.service.js:245, 263`](file:///d:/Federico_workspace/back-end/src/services/rbac.service.js#L245) | `newUser`, `setStaffActive` | Table 4 (`users`) schema columns | Injects `is_active: true` and mutates `user.is_active` | Non-schema attribute | Table 4 defines no `is_active` column. |
| **D74** | [`dataStore.js:2450-2521`](file:///d:/Federico_workspace/back-end/src/store/dataStore.js#L2450-L2521) | `dischargeSummaries` seeds | Table 18 `gross_amount DECIMAL`, `insurance_deduction DECIMAL` | Seed records omit `gross_amount` and `insurance_deduction`; summary 7 uses `notes` | Schema seed omission | Seed records violate Table 18 contract; finance reads return `undefined`. |
| **D75** | [`maxId.js:24-28`](file:///d:/Federico_workspace/back-end/src/utils/maxId.js#L24-L28) | `maxId(...) + 1 \|\| fallback` | Seeds primary key at domain base (701, 801, 401) | `maxId(...)` returns 0 on empty array; `0 + 1 = 1` is truthy, rendering `\|\| fallback` dead code | Dead fallback logic | Empty collections start primary keys at 1 instead of domain base offsets. |
| **D76** | [`auth.service.js:52-59`](file:///d:/Federico_workspace/back-end/src/services/auth.service.js#L52-L59) | `toPublicUser` | Table 4 `organization_id INT NOT NULL`, `hospital_id INT NULL` | Strips `organization_id` and `hospital_id` from public user object | Attribute stripping | Strips tenant scoping attributes; frontend consumers get `undefined` (Obs-A3). |

---

## 5. Frontend Fetching, Attribute Binding & Payload Mapping (✅ COMPLETED & VERIFIED)

### 5.1 Itemized Discrepancies (DISC-01 – DISC-19)
| Reference ID | Target File & Line | Category | Expected (`Database/Federico_Schemas.md` / Backend) | Implemented in Frontend | Severity & Operational Impact |
|:---|:---|:---|:---|:---|:---|
| **DISC-01** | [`AppointmentPage.jsx:57, 163-171, 312`](file:///d:/Federico_workspace/front-end/src/pages/pre/AppointmentPage.jsx#L57) | Dropped Form Payload | Transmit `note: reason` (`preRequest.service.js:132`) | `reason` captured in state but dropped from `create()` payload | **High**: Clinical complaints entered by PRE staff are silently lost. |
| **DISC-02** | [`AppointmentPage.jsx:169`](file:///d:/Federico_workspace/front-end/src/pages/pre/AppointmentPage.jsx#L169) | Attribute Key Mismatch | Transmit `requested_time` (`Federico_Schemas.md` Table 27) | Sends `appointment_time: time` | **Medium**: Relies on service fallback; bypasses strict validator rules. |
| **DISC-03** | [`BedRequestModal.jsx:120-123`](file:///d:/Federico_workspace/front-end/src/pages/pre/BedRequestModal.jsx#L120-L123) | Enum Discrepancy | `priority` IN (`NORMAL`, `URGENT`, `EMERGENCY`) | Submits `NORMAL`, `HIGH`, `CRITICAL` | **High**: Schema domain violation on strict SQL validation. |
| **DISC-04** | [`Patient360Modal.jsx:137`](file:///d:/Federico_workspace/front-end/src/pages/pre/Patient360Modal.jsx#L137) | Non-Existent Column | `wards.ward_name` joined via `ward_id` | Reads `bed.ward_type` (always `undefined`) | **Low**: Silently falls back to string `'Ward'`. |
| **DISC-05** | [`Patient360Modal.jsx:138`](file:///d:/Federico_workspace/front-end/src/pages/pre/Patient360Modal.jsx#L138) | Non-Existent Column | `admissions` has no type column | Reads `adm.admission_type` (always `undefined`) | **Low**: Silently falls back to string `'Inpatient'`. |
| **DISC-06** | [`DoctorRosterPage.jsx:51`](file:///d:/Federico_workspace/front-end/src/pages/pre/DoctorRosterPage.jsx#L51) | Non-Existent Column | Discrete dates in `doctor_availabilities` | Reads `avail.days` (always `undefined`) | **Medium**: Every doctor displayed with static `'Mon – Sat'`. |
| **DISC-07** | [`DischargePage.jsx:31-34`](file:///d:/Federico_workspace/front-end/src/pages/pre/DischargePage.jsx#L31-L34) | Non-Existent Column | `ledgers.status === 'PAID'` | Tests phantom property `a.bills_cleared` | **Low**: Rescued by secondary ledger check. |
| **DISC-08** | [`preHelpers.js:84-134`](file:///d:/Federico_workspace/front-end/src/pages/pre/preHelpers.js#L84-L134) | Casing Inconsistency | Uniform `snake_case` or `camelCase` | Emits duplicate keys (`patient_name` AND `patientName`) | **Medium**: Architectural fragility across PRE views. |
| **DISC-09** | [`faActions.js:130-139`](file:///d:/Federico_workspace/front-end/src/pages/fa/faActions.js#L130-L139) | Payload Omission | Transmit `insurance_deduction: deduction` | Omitted; sends only `final_amount` | **Medium**: Backend must infer deduction via arithmetic fallback. |
| **DISC-10** | [`SettlementSection.jsx:148-155, 169`](file:///d:/Federico_workspace/front-end/src/pages/fa/SettlementSection.jsx#L148) | Uncontrolled Input (Defect D7) | Reactive state updating `#net-payable-preview` | Uncontrolled `<input ref={...}>` without `onChange` | **High**: Net payable preview fails to update as user types. |
| **DISC-11** | [`faHelpers.js:73, 86`](file:///d:/Federico_workspace/front-end/src/pages/fa/faHelpers.js#L73) | Non-Existent Column | Resolve via `pre_requests` / `appointments` | Reads `admission.doctor_id`, `department` | **Low**: Rescued by preRequest fallback. |
| **DISC-12** | [`patientStoreShape.js:84-102`](file:///d:/Federico_workspace/front-end/src/pages/patient/patientStoreShape.js#L84-L102) | Missing Property (Defect D4) | `hasInsurance: Boolean(...)` | `hasInsurance` omitted from profile object | **High**: Insured patients permanently see "Self Pay" banner. |
| **DISC-13** | [`patientStoreShape.js:159-173`](file:///d:/Federico_workspace/front-end/src/pages/patient/patientStoreShape.js#L159-L173) | Missing Property (Defect D5) | Appointment item includes `doctorId: docId` | `doctorId` omitted from appointment items | **Medium**: Downstream appointment consumers lose `doctorId`. |
| **DISC-14** | [`PatientStoreContext.jsx:166-179`](file:///d:/Federico_workspace/front-end/src/pages/patient/PatientStoreContext.jsx#L166-L179) | Payload Omission | Transmit `copay_percentage` (Table 11) | `copay_percentage` omitted from `createInsurance` | **Medium**: Profile edits silently reset copay to 0%. |
| **DISC-15** | [`ProfilePage.jsx:176-183`](file:///d:/Federico_workspace/front-end/src/pages/patient/ProfilePage.jsx#L176-L183) | Ghost Mutation (Defect D11) | Dispatch to backend password endpoint | Simulates success via toast; zero network dispatch | **Critical**: False security impression; password never changes. |
| **DISC-16** | [`RestockModal.jsx:29-31, 81-87`](file:///d:/Federico_workspace/front-end/src/pages/hom/RestockModal.jsx#L29-L31) | Dropped Form Fields | Aligned with Table 26 `purchase_requests` | Captures supplier, priority, notes; drops all 3 | **Medium**: User input discarded on purchase order submit. |
| **DISC-17** | [`PostServiceModal.jsx:41-45`](file:///d:/Federico_workspace/front-end/src/pages/hom/PostServiceModal.jsx#L41-L45) | Payload Omission | Transmit `patient_id` (Table 24 NOT NULL) | Omitted; relies on backend admission resolution | **Low**: Service auto-resolves from admission store. |
| **DISC-18** | [`wards.js`](file:///d:/Federico_workspace/front-end/src/api/endpoints/wards.js) | Retired Dead Surface | Subsystem removed entirely per user directive | Dead `api.wards.emergencies` removed | **Resolved**: Dead frontend API client methods excised completely. |
| **DISC-19** | [`ApprovePopup.jsx:47, 50`](file:///d:/Federico_workspace/front-end/src/pages/pre/ApprovePopup.jsx#L47) | Non-Schema Coupling | `scheduled_datetime DATETIME NOT NULL` (Table 14) | Couples to non-schema `appointment_date` & `appointment_time` | **High**: Conflict detection directly depends on redundant non-schema attributes (D04). |

### 5.2 Subsystem Observations (Obs-A1 – Obs-E3)
| Reference ID | Target File & Line | Category | Expected (`Database/Federico_Schemas.md` / Backend) | Implemented in Frontend | Severity & Operational Impact |
|:---|:---|:---|:---|:---|:---|
| **Obs-A1** | [`wards.js`](file:///d:/Federico_workspace/front-end/src/api/endpoints/wards.js) | Retired Dead Surface | Subsystem removed entirely per user directive | Dead `api.wards.emergencies` removed | **Resolved**: Dead frontend API client methods excised completely. |
| **Obs-A2** | [`doctors.js`](file:///d:/Federico_workspace/front-end/src/api/endpoints/doctors.js), [`platform.js`](file:///d:/Federico_workspace/front-end/src/api/endpoints/platform.js) | Missing API Bindings | Client wrappers for all backend routes | Missing `removeAvailability`, `getFullState`, `setFullState` | **Low**: Endpoints unreachable via standard facade methods. |
| **Obs-A3** | [`auth.js:34-40, 62-63`](file:///d:/Federico_workspace/front-end/src/api/endpoints/auth.js#L34-L40) | Attribute Misalignment | Reads `payload.tenant.organization_id` | Reads `payload.user.organization_id` (null) | **Medium**: Evaluates to null outside SessionContext. |
| **Obs-B1** | [`DashboardPage.jsx:93-94`](file:///d:/Federico_workspace/front-end/src/pages/admin/DashboardPage.jsx#L93-L94) | Attribute Mismatch (Defect D3) | `base_platform_fee` emitted by backend | Reads `r?.base_fee` | **High**: Admin dashboard fails to reflect updated rate card fee. |
| **Obs-B2** | [`DoctorDialog.jsx:15, 32, 49`](file:///d:/Federico_workspace/front-end/src/pages/admin/DoctorDialog.jsx#L15) | Non-Schema Attribute | Doctors table per Table 12 | Collects and submits `department` | **Low**: Unnormalized property stored in mock dataStore. |
| **Obs-B3** | [`ItemDialog.jsx:54-59`](file:///d:/Federico_workspace/front-end/src/pages/admin/ItemDialog.jsx#L54-L59) | Enum Mismatch | `category` IN (`Medication`, `Consumable`, `Equipment`) | Presents `Medicine` and `Linen` | **Medium**: Schema enum divergence in inventory catalog. |
| **Obs-C1** | [`DashboardPage.jsx:128-131`](file:///d:/Federico_workspace/front-end/src/pages/hom/DashboardPage.jsx#L128-L131) | Non-Existent Column | Calculate occupancy from `beds` collection | Reads `w.occupied_beds` on `wards` | **Critical**: Bed occupancy permanently displays 0%. |
| **Obs-C2** | [`PatientFlowPage.jsx:58-61`](file:///d:/Federico_workspace/front-end/src/pages/hom/PatientFlowPage.jsx#L58-L61) | Non-Existent Column | `receipt_sent_to_hom` (Table 17) | Checks phantom `a.bills_cleared` | **Low**: Rescued by secondary ledger check. |
| **Obs-C3** | [`RestockModal.jsx:29-31, 81-87`](file:///d:/Federico_workspace/front-end/src/pages/hom/RestockModal.jsx#L29-L31) | Dropped Fields / Non-Schema Column | Aligned with Table 26 schema | Drops supplier/priority/notes; passes `invoice_url` | **Medium**: Data lost; non-schema column passed to Table 26. |
| **Obs-C4** | [`HomLayout.jsx:26`](file:///d:/Federico_workspace/front-end/src/pages/hom/HomLayout.jsx#L26) | Field Fallback Mismatch | Read `organization_name` from tenant | Reads `hospital_name`, falls back to hardcoded string | **Low**: Defaults to `'City General Hospital'`. |
| **Obs-D1** | [`ProvisionDialog.jsx:52`](file:///d:/Federico_workspace/front-end/src/pages/platform/ProvisionDialog.jsx#L52) | Hardcoded ID | Dynamic plan selection from Table 2 | Hardcodes `plan_id: 1` | **Medium**: Bypasses subscription tier configuration. |
| **Obs-D2** | [`PlatformDashboardPage.jsx:343`](file:///d:/Federico_workspace/front-end/src/pages/platform/PlatformDashboardPage.jsx#L343) | Attribute Discrepancy | Unified `base_platform_fee` | Page handles D3, but sibling pages remain broken | **Medium**: Inconsistent rate property handling across portals. |
| **Obs-E1** | [`SignupPage.jsx:141-155, 324`](file:///d:/Federico_workspace/front-end/src/pages/public/SignupPage.jsx#L141-L155) | Date Validation Drop | ISO 8601 string (`YYYY-MM-DD`) | Prompts and sends `DD/MM/YYYY`; error swallowed | **Critical**: Patient insurance silently dropped during registration. |
| **Obs-E2** | [`OrgSignupPage.jsx:119-120`](file:///d:/Federico_workspace/front-end/src/pages/public/OrgSignupPage.jsx#L119-L120) | Attribute Mismatch (Defect D3) | `base_platform_fee` emitted by backend | Checks `data.base_fee` | **High**: Prospective hospital signups miss live rate updates. |
| **Obs-E3** | [`OrgSignupPage.jsx:192`](file:///d:/Federico_workspace/front-end/src/pages/public/OrgSignupPage.jsx#L192) | Hardcoded ID | Dynamic plan selection from Table 2 | Hardcodes `plan_id: 1` | **Medium**: Limits self-onboarded tenants to single tier. |

---

## 6. State Machine Inconsistencies & Concurrency Race Conditions
 
- [x] **RACE-01 (HIGH)**: **Bed Allocation Double-Booking Race Condition**  
  - **File**: [`back-end/src/services/ward.service.js:149-160, 223-255`](file:///d:/Federico_workspace/back-end/src/services/ward.service.js#L149)  
  - **Remediation**: Added atomic bed acquisition check (`if (!target || target.status === 'OCCUPIED') throw conflict('Bed is already occupied')`) and numeric ID coercion for `id` and `patch.bed_id`, preventing double bed allocation.

- [x] **RACE-02 (HIGH)**: **Pre-Request Check-In Transition State Desync**  
  - **File**: [`back-end/src/services/preRequest.service.js:348-420`](file:///d:/Federico_workspace/back-end/src/services/preRequest.service.js#L348)  
  - **Remediation**: Implemented two-phase staged commit pattern in `checkIn()`; pre-validates and stages admission, ledger, and ledger entry objects before committing them together to `dataStore`.

- [x] **RACE-03 (MEDIUM)**: **Composite Key Ledger Sequence Collision Under Concurrency**  
  - **File**: [`back-end/src/services/billing.service.js:90-108`](file:///d:/Federico_workspace/back-end/src/services/billing.service.js#L90)  
  - **Remediation**: Coerced `ledgerId = Number(entry.ledger_id)` and calculated `reduce((max, e) => Math.max(max, Number(e.entry_id) || 0), 0) + 1` to guarantee monotonic key increments.

- [x] **RACE-04 (MEDIUM)**: **Doctor Reschedule Self-Conflict False Rejection**  
  - **File**: [`back-end/src/services/doctor.service.js:145-162`](file:///d:/Federico_workspace/back-end/src/services/doctor.service.js#L145)  
  - **Remediation**: Coerced `numExcludeId = Number(excludeId)` before checking conflicts, preventing appointments from erroneously detecting themselves as slot collisions during reschedules.

---

## 7. State Persistence, Concurrency & Boot Mechanics

- [x] **PST-01 (CRITICAL)**: **Event Loop Starvation & Data Loss in Persistence**  
  - **File**: [`back-end/src/store/persist.js`](file:///d:/Federico_workspace/back-end/src/store/persist.js)  
  - **Remediation**: Replaced 75ms synchronous busy-wait loop with asynchronous non-blocking file I/O (`fs.promises`) and exponential backoff with randomized jitter. Implemented a promise-based mutex queue for in-flight writes, and preserved failed temporary files (`.failed.<timestamp>`) with `isDirty = true` for automatic retry.

- [x] **PST-02 (HIGH)**: **Zero Dirty-State Tracking on Disk Writes**  
  - **File**: [`back-end/src/store/persist.js`](file:///d:/Federico_workspace/back-end/src/store/persist.js), [`back-end/src/middleware/persistOnMutation.js`](file:///d:/Federico_workspace/back-end/src/middleware/persistOnMutation.js)  
  - **Remediation**: Introduced `isDirty` state tracking and `markDirty()` helper. Unchanged states bypass disk serialization entirely; successful mutations trigger `markDirty()` before debounced saving.

- [x] **PST-03 (MEDIUM)**: **Unpersisted Boot Reconciliation State**  
  - **File**: [`back-end/src/bootstrap.js:25-50`](file:///d:/Federico_workspace/back-end/src/bootstrap.js#L25)  
  - **Remediation**: Invoked `persist.markDirty()` and `persist.saveImmediate()` at the end of `runBootReconciliation()`, ensuring permission catalogs and email domain backfills are durably written to `db.json` on startup.

- [x] **PST-04 (MEDIUM)**: **Dirty State Leakage Across Failed Mutations**  
  - **File**: [`back-end/src/services/preRequest.service.js`](file:///d:/Federico_workspace/back-end/src/services/preRequest.service.js), [`back-end/src/middleware/persistOnMutation.js`](file:///d:/Federico_workspace/back-end/src/middleware/persistOnMutation.js)  
  - **Remediation**: Re-architected multi-entity mutation handlers to stage new entities locally and validate all prerequisites before committing to memory arrays. `persistOnMutation.js` only triggers persistence on `res.statusCode < 400`.

---

## 8. Dead Code, Deprecated Routes & Redundant Aliases (✅ COMPLETED & VERIFIED)

- [x] **CLN-03 (LOW)**: **Remove Redundant Request Alias Trio**  
  - **Files**:  
    - [`back-end/src/routes/request.routes.js`](file:///d:/Federico_workspace/back-end/src/routes/request.routes.js)  
    - [`back-end/src/controllers/request.controller.js`](file:///d:/Federico_workspace/back-end/src/controllers/request.controller.js)  
    - [`back-end/src/services/request.service.js`](file:///d:/Federico_workspace/back-end/src/services/request.service.js)  
  - **Remediation**: Completely decommissioned and deleted the 3 alias files and `request.validators.js`; unmounted `/request` router from `routes/index.js`, directing all appointment operations to canonical `/appointment`.

- [x] **CLN-04 (LOW)**: **Clean Up Empty Collections in `dataStore.js`**  
  - **Files**: [`back-end/src/store/dataStore.js`](file:///d:/Federico_workspace/back-end/src/store/dataStore.js), [`back-end/src/services/data.service.js`](file:///d:/Federico_workspace/back-end/src/services/data.service.js)  
  - **Remediation**: Removed obsolete dead collections `patientInsuranceDocuments` and `insurances` from `dataStore.js` and excised `'stateVersion'`, `'patientInsuranceDocuments'`, and `'insurances'` from `data.service.js:SYNCED_KEYS`. Preserved active runtime collections `platformActivityLog` and `leaders`.

- [x] **CLN-05 (LOW)**: **Remove Unreachable Defensive Code in Departments Page**  
  - **File**: [`front-end/src/pages/admin/DepartmentsPage.jsx:47-53`](file:///d:/Federico_workspace/front-end/src/pages/admin/DepartmentsPage.jsx#L47-L53)  
  - **Remediation**: Excised dead `if (result && result.error)` branch; `api.wards.remove()` throws an `ApiError` caught cleanly by the existing `catch (err)` block.

- [x] **CLN-06 (LOW)**: **Clean Up Legacy FA Hash Route Aliases**  
  - **File**: [`front-end/src/pages/fa/useHashRoute.js:14-17`](file:///d:/Federico_workspace/front-end/src/pages/fa/useHashRoute.js#L14-L17)  
  - **Remediation**: Replaced `ROUTE_ALIASES` lookup with `CANONICAL_ROUTES = new Set(['#/ledger', '#/charges', '#/eod'])`, cleanly resolving valid views and defaulting unknown hashes to `DEFAULT_ROUTE` (`#/ledger`).

---

## 9. Hardcoded Data, Credentials & Magic Numbers Catalog (✅ COMPLETED & VERIFIED)

- [x] **CFG-01 (MEDIUM)**: **Extract Fallback Secrets & Session Configuration**  
  - **File**: [`back-end/src/config/env.js:14, 28-36`](file:///d:/Federico_workspace/back-end/src/config/env.js)  
  - **Remediation**: Added startup check enforcing fatal error in production if `SESSION_SECRET` is unset or matches development placeholder, while preserving safe fallback for development/test environments.

- [x] **CFG-02 (LOW)**: **Dynamic Invoice & Receipt Metadata**  
  - **Files**: [`front-end/src/pages/patient/patientInvoiceCopy.js`](file:///d:/Federico_workspace/front-end/src/pages/patient/patientInvoiceCopy.js), [`front-end/src/pages/patient/patientDocumentCopy.js`](file:///d:/Federico_workspace/front-end/src/pages/patient/patientDocumentCopy.js), [`front-end/src/pages/patient/patientStoreShape.js`](file:///d:/Federico_workspace/front-end/src/pages/patient/patientStoreShape.js), [`front-end/src/pages/patient/PatientStoreContext.jsx`](file:///d:/Federico_workspace/front-end/src/pages/patient/PatientStoreContext.jsx)  
  - **Remediation**: Connected patient receipts, invoices, and digital document copies to dynamic tenant branding context (`hospitalName`, `orgName`, `supportPhone`) and patient UHID (`FED-${patientId}`), eliminating hardcoded `FEDERICO HOSPITALS` and static `UHID-882100`.

- [x] **CFG-03 (LOW)**: **Gate Demo Accounts by Environment**  
  - **File**: [`back-end/src/controllers/auth.controller.js:168-176`](file:///d:/Federico_workspace/back-end/src/controllers/auth.controller.js)  
  - **Remediation**: Gated `GET /auth/demo-accounts` behind `NODE_ENV !== 'production'`. In production, requests receive HTTP 403 Forbidden to prevent credential leakage, while remaining active by default in development and test environments.

---

## 10. Canonical Schema Attribute Unification (✅ COMPLETED & VERIFIED)

- [x] **CANON-01 (MEDIUM)**: **Wards & Beds Variable Unification**  
  - **Files**: [`front-end/src/pages/pre/Patient360Modal.jsx:141`](file:///d:/Federico_workspace/front-end/src/pages/pre/Patient360Modal.jsx#L141), [`front-end/src/pages/pre/PatientRecordsPage.jsx:28-48`](file:///d:/Federico_workspace/front-end/src/pages/pre/PatientRecordsPage.jsx#L28)  
  - **Remediation**: Standardized on canonical `bed.ward_name` (Table 13). Eliminated phantom `bed.ward_type`. Enriched `bedsById` at load time by joining `api.wards.list()`.

- [x] **CANON-02 (MEDIUM)**: **Admissions Type & Discharge Clearance Unification**  
  - **Files**: [`front-end/src/pages/pre/Patient360Modal.jsx:140, 142`](file:///d:/Federico_workspace/front-end/src/pages/pre/Patient360Modal.jsx#L140), [`front-end/src/pages/pre/DischargePage.jsx:33`](file:///d:/Federico_workspace/front-end/src/pages/pre/DischargePage.jsx#L33), [`front-end/src/pages/hom/PatientFlowPage.jsx:60`](file:///d:/Federico_workspace/front-end/src/pages/hom/PatientFlowPage.jsx#L60)  
  - **Remediation**: Standardized on `adm.visit_type` (Table 16) and `adm.admit_time` (Table 16). Removed phantom `adm.admission_type` and phantom `a.bills_cleared` in favor of canonical `a.receipt_sent_to_hom` (Table 17) and ledger status.

- [x] **CANON-03 (MEDIUM)**: **PreHelpers Single-Key View Unification**  
  - **File**: [`front-end/src/pages/pre/preHelpers.js:107-134`](file:///d:/Federico_workspace/front-end/src/pages/pre/preHelpers.js#L107-L134)  
  - **Remediation**: Excised dual duplicate key emission (`patient_name` AND `patientName`, `patient_uhid` AND `patientUhid`, etc.). Standardized on single camelCase view attributes (`patientName`, `patientUhid`, `patientAge`, `patientGender`, `patientPhone`, `patientBloodGroup`, `doctorName`, `doctorSpecialization`) mapped directly from Table 10 and Table 12 sources of truth.

- [x] **CANON-04 (MEDIUM)**: **Pre-Request and Appointment Date/Time Unification**  
  - **Files**: [`front-end/src/pages/pre/Patient360Modal.jsx:102-105`](file:///d:/Federico_workspace/front-end/src/pages/pre/Patient360Modal.jsx#L102), [`back-end/src/controllers/preRequest.controller.js:77-78`](file:///d:/Federico_workspace/back-end/src/controllers/preRequest.controller.js#L77), [`back-end/src/services/preRequest.service.js:141-142`](file:///d:/Federico_workspace/back-end/src/services/preRequest.service.js#L141)  
  - **Remediation**: Standardized pre-requests on `payload.requested_date` and `payload.requested_time` (Table 27). Removed `appointment_date` and `appointment_time` aliases from pre-request controllers and services.

- [x] **CANON-05 (LOW)**: **Doctor Specialization & Qualification Unification**  
  - **Files**: [`front-end/src/pages/patient/BookAppointmentPage.jsx:297`](file:///d:/Federico_workspace/front-end/src/pages/patient/BookAppointmentPage.jsx#L297), [`front-end/src/pages/admin/DoctorDialog.jsx:48`](file:///d:/Federico_workspace/front-end/src/pages/admin/DoctorDialog.jsx#L48), [`front-end/src/pages/pre/DoctorRosterPage.jsx:57`](file:///d:/Federico_workspace/front-end/src/pages/pre/DoctorRosterPage.jsx#L57)  
  - **Remediation**: Standardized on canonical `specialization` (Table 12). Removed phantom `qualification`, separated specialization from department fallbacks, and removed phantom availability `days` array checks.

- [x] **CANON-06 (LOW)**: **Finance & Patient Billing Canonical Attributes**  
  - **Files**: [`front-end/src/pages/fa/ChargesView.jsx:38, 58`](file:///d:/Federico_workspace/front-end/src/pages/fa/ChargesView.jsx#L38), [`front-end/src/pages/fa/LedgerView.jsx:140`](file:///d:/Federico_workspace/front-end/src/pages/fa/LedgerView.jsx#L140), [`front-end/src/pages/fa/faHelpers.js:73, 86`](file:///d:/Federico_workspace/front-end/src/pages/fa/faHelpers.js#L73), [`front-end/src/pages/patient/patientDocumentCopy.js:24-29`](file:///d:/Federico_workspace/front-end/src/pages/patient/patientDocumentCopy.js#L24), [`front-end/src/pages/patient/patientInvoiceCopy.js:117-121`](file:///d:/Federico_workspace/front-end/src/pages/patient/patientInvoiceCopy.js#L117), [`front-end/src/pages/patient/patientStoreShape.js:264-265, 340`](file:///d:/Federico_workspace/front-end/src/pages/patient/patientStoreShape.js#L264)  
  - **Remediation**: Replaced multi-property fallback chains (`patient_id || admission_id || uhid`, `mode || payment_mode`, `gross || amount`, `coverage || insurance_deduction`) with canonical schema columns `patient_id` (Table 10), `payment_mode` (Table 19), `gross_amount` (Table 18), and `insurance_deduction` (Table 18). Removed phantom `admission.doctor_id` and `admission.department` in favor of `preRequest.doctor_id` and `preRequest.department`.

- [x] **CANON-07 (LOW)**: **Audit Log Primary Key & Navigation Canonical Attributes**  
  - **Files**: [`front-end/src/pages/hom/DashboardPage.jsx:154, 316`](file:///d:/Federico_workspace/front-end/src/pages/hom/DashboardPage.jsx#L154), [`front-end/src/pages/hom/BedDetailModal.jsx:38`](file:///d:/Federico_workspace/front-end/src/pages/hom/BedDetailModal.jsx#L38), [`front-end/src/components/layout/AppNavbar.jsx:63, 96, 98`](file:///d:/Federico_workspace/front-end/src/components/layout/AppNavbar.jsx#L63)  
  - **Remediation**: Standardized operational log sorting and key binding on Table 36 primary key `log_id`. Standardized bed admission timestamp on Table 28 canonical column `decided_at`. Standardized navigation links on `item.href`.

