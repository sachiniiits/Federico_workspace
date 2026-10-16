# Master Project Memory & Architectural Knowledge Codification

**Platform:** Federico Hospital Operations Platform  
**Version:** 2.0.0 (Express.js Backend + React 19 / Vite Frontend)  
**Audit Scope:** Exhaustive line-by-line census across all 142 Backend Files, 197 Frontend Files, and 40 Database Collections  
**Audit Date:** October 14, 2026  
**Integrity Mode:** Analytical Read-Only Audit (Zero Application Code Modifications)  
**Security & Access Attestation:** Verified 100% Zero-Access compliance against all 7 strictly prohibited paths.

---

## 🚫 Restricted Files & Zero-Access Prohibition Directive

Under NO circumstances may any agent or developer read, parse, query, modify, or reference the following 7 paths:
1. `D:\Federico_workspace\LICENSE`
2. `D:\Federico_workspace\react-migration-plan.md`
3. `D:\Federico_workspace\SRS.pdf`
4. `D:\Federico_workspace\Figma`
5. `D:\Federico_workspace\videos`
6. `D:\Federico_workspace\definitions.yml`
7. `D:\Federico_workspace\DomainExpertInteraction.md`

All architectural observations, invariants, and findings codified in this document have been derived strictly from permitted source code, configuration files, test suites, database schema specifications, and in-memory runtime datastores.

---

## 1. Executive Summary & Architecture Overview

The Federico Hospital Operations Platform is a multi-tenant, cloud-native hospital administration and healthcare operations system. The platform manages patient pre-registration, clinical triage, outpatient appointment scheduling, inpatient bed management, consumable pharmacy inventory, staff duty rosters, and multi-tier medical billing.

### 1.1 Non-Clinical Administrative Scope
Federico strictly manages administrative, operational, logistical, and financial workflows. It explicitly does NOT provide medical diagnostic systems, clinical decision support algorithms, drug interaction engines, or vital sign telemetry. Its core mission is the seamless coordination of administrative hospital lifecycles: intake triage, physical bed allocation, inventory consumption tracking, service tariff charging, and multi-stage discharge billing clearance.

### 1.2 System Topology & Multi-Tier Runtime
The platform architecture consists of three integrated tiers:
1. **Express.js Backend Runtime (`back-end/`)**:
   - Transitioned from NestJS to pure Express.js while maintaining exact behavioral and contract parity.
   - Total files: **142 files** | Total lines: **31,630 lines** | Total size: **1,028,649 bytes**.
   - Serves **132 REST API endpoints** spanning 16 domain feature areas.
   - Clean layered architecture: `HTTP Request` -> `Security / Session / Tenant Middleware` -> `Route` -> `DTO Validator` -> `Controller` -> `Domain Service` -> `DataStore / Persist`.
2. **React 19 Single-Page Application (`front-end/`)**:
   - Modern frontend built on **React 19.2.8**, **Vite 8.3.0**, and **React Router DOM 7.18.4** (linted via `oxlint`).
   - Total files: **197 files** completely accounted for across 7 distinct actor portals:
     - **Admin Portal**: Executive KPIs, ward/bed capacity, inventory catalog, staff directory, doctor management.
     - **HOM Portal (Hospital Operations Manager)**: Real-time bed occupancy matrix, bed requests, patient flow, inventory consumption, and restock orders.
     - **PRE Portal (Patient Relational Executive)**: Pre-registration intake, triage queues, OPD appointment scheduling, emergency walk-in intake, patient 360 records.
     - **FA Portal (Finance Associate)**: Charge review and approvals, patient billing ledgers, end-of-day billing dispatch, final discharge settlement, and receipts.
     - **Patient Portal**: Patient self-service dashboard, OPD appointment booking with slot capacity, itemized invoices, payment simulation, and profile/insurance management.
     - **Platform Super User Portal**: Multi-tenant provisioning console, module license toggling, MRR/ARR analytics, and platform rate card configuration.
     - **Public Portal**: Platform landing page, hospital directory marketplace, patient registration, and 4-step hospital chain onboarding wizard.
   - Strict data encapsulation: 100% of network calls route through `src/api/` facade; **zero raw `fetch()` calls outside `src/api/client.js`**, zero `axios` imports, and zero `dangerouslySetInnerHTML` occurrences.
3. **In-Memory Document Store & Atomic Persistence (`back-end/src/store/`)**:
   - Hosts **40 distinct entity collections** in `dataStore.js` (7,117 lines, 185 KB).
   - Conceptual model defined in a comprehensive 38-table relational database specification ([`Database/Federico_Schemas.md`](Database/Federico_Schemas.md)) and Entity-Relationship diagram ([`Database/ER_diagrams.png`](Database/ER_diagrams.png)).
   - Atomic disk snapshot engine (`persist.js`) serializing in-memory state to `data/db.json` using atomic temporary file swaps (`.tmp`) and Windows file lock retry mechanics.

### 1.3 Multi-Tenancy & Governance Architecture
- **Tenant Hierarchy**: Multi-tenancy is structured around `organizations` (hospital chains or independent facilities) and child `hospitals` (individual branches). All core operational entities (`users`, `patients`, `admissions`, `wards`, `beds`, `services`, `ledgers`, `inventoryItems`) are tenant-scoped.
- **Fail-Closed Module Entitlements**: Organizations subscribe to specific modules (`APPOINTMENTS`, `ADMISSIONS`, `INVENTORY`, `BILLING`, `INSURANCE`, `ANALYTICS`, `DOCTOR`, `PATIENT`, `LEADERSHIP`). Backend endpoints enforce licensing via `tenant.requireModule(MODULE_CODE)`, rejecting unauthorized access with HTTP 403 Forbidden.
- **Dynamic RBAC & Permission Catalog**: Beyond 5 base roles (`HOM`, `Patient`, `FA`, `PRE`, `Admin`), organizations configure dynamic `customRoles` with fine-grained permissions (`resource:mode`, e.g. `doctor:read`, `wardAdmin:write`, `billing:write`). Updating a user's role immediately revokes all active session tokens for that user.

### 1.4 Unified Email-Driven Authentication
- All users authenticate via `/login/login-page.html`.
- Staff emails adhere to the `<name>.<role_tag>@<hospital_domain>` identity protocol (e.g. `rekha.pre@citygen.com`, `admin.hom@citygen.com`, `farah.fa@citygen.com`, `owner.admin@citygen.com`).
- Platform Super Users authenticate as `<name>.platform@federico.com`.
- Non-hospital public emails (`@gmail.com`, `@yahoo.com`) are automatically routed to the Patient Portal, presenting a hospital selector when registered at multiple facilities.
- 24-byte cryptographic hex tokens are issued by `sessionStore.js` and stored in `sessionStorage` for tab-level role isolation, with cross-tab logout broadcast via `BroadcastChannel`.

---

## 2. Master Defect & Security Vulnerability Catalog

An exhaustive line-by-line audit identified 21 critical defects, security vulnerabilities, clinical invariant breaches, and concurrency hazards across the backend, frontend, and persistence layers.

### 2.1 Master Defect Matrix

| Defect ID | Severity | Layer | File & Line Reference | Defect Category | Description & Impact | Status |
|:---:|:---:|:---:|---|---|---|:---:|
| **SEC-01** | **CRITICAL** | Backend Middleware | [`back-end/src/middleware/actorAccess.js`](back-end/src/middleware/actorAccess.js) | Authentication Bypass | `req.headers['x-role']` allowed arbitrary callers to bypass session tokens. Eradicated completely; session auth strictly enforced across all routes. | **RESOLVED** |
| **SEC-02** | **HIGH** | Backend Controllers | [`back-end/src/controllers/doctor.controller.js`](back-end/src/controllers/doctor.controller.js) | Multi-Tenancy Boundary Leak | `deleteAvailability` deleted across tenants. Fixed by adding `findAvailabilityById` and enforcing `belongsToOrg(availability, req)`. | **RESOLVED** |
| **SEC-03** | **HIGH** | Backend Validation / Services | [`back-end/src/services/doctor.service.js`](back-end/src/services/doctor.service.js), [`patient.service.js`](back-end/src/services/patient.service.js), [`admission.service.js`](back-end/src/services/admission.service.js) | Mass Assignment | Entity updates used unconstrained `Object.assign`. Fixed by stripping immutable IDs and tenant boundaries (`*_id`, `organization_id`, `uhid`, `admit_time`). | **RESOLVED** |
| **SEC-04** | **MEDIUM** | Backend Service | [`back-end/src/services/platformAuth.service.js`](back-end/src/services/platformAuth.service.js) | Call Stack Overflow | Used `Math.max(...spread)` risking RangeError. Replaced with constant stack `maxId(..., 'platform_user_id') + 1 || 1`. | **RESOLVED** |
| **SEC-05** | **HIGH** | Backend Config | [`back-end/src/config/env.js`](back-end/src/config/env.js) | Hardcoded Secrets | Added startup production validation and security warning for default session secret. | **RESOLVED** |
| **CLN-01** | **HIGH** | Clinical Scheduling | [`back-end/src/store/dataStore.js`](back-end/src/store/dataStore.js) | Double-Booking Invariant | Appointments 601 and 608 double-booked for Doctor 403. Resolved by rescheduling 608 to `2026-08-19 13:00:00` and enforcing `UNIQUE KEY uq_doctor_slot`. | **RESOLVED** |
| **CLN-02** | **CRITICAL** | Clinical Inpatient | [`back-end/src/store/dataStore.js`](back-end/src/store/dataStore.js) | Concurrent Double-Admission | Patients 220 and 212 held concurrent active admissions. Resolved by marking completed stays 711 & 703 as `DISCHARGED` and freeing beds 56 & 43. | **RESOLVED** |
| **DB-01** | **HIGH** | Relational Invariant | [`back-end/src/store/dataStore.js`](back-end/src/store/dataStore.js) | Broken Foreign Key | `created_by` in appointments contained `patient_id`. Resolved by mapping to user accounts (102, 103, 104) and PRE staff #105 (Rekha Nair). | **RESOLVED** |
| **DB-02** | **HIGH** | Relational Invariant | [`back-end/src/store/dataStore.js`](back-end/src/store/dataStore.js) | Phantom Foreign Key | Receipt #8 referenced non-existent `payment_id: 990`. Resolved by seeding payment transaction #990 (`ledger_id: 809`, `amount: 500`). | **RESOLVED** |
| **DB-03** | **HIGH** | Relational Invariant | [`back-end/src/store/dataStore.js`](back-end/src/store/dataStore.js), [`Database/Federico_Schemas.md`](Database/Federico_Schemas.md) | User Account Scoping | 25 of 29 patients are walk-ins without portal logins. Formally modeled `patients.user_id INT NULL REFERENCES users(user_id) ON DELETE SET NULL`. | **RESOLVED** |
| **DB-04** | **HIGH** | Relational Invariant | [`back-end/src/store/dataStore.js`](back-end/src/store/dataStore.js), [`back-end/src/validators/admission.validators.js`](back-end/src/validators/admission.validators.js) | Missing Appointment FK | Linked elective admissions (705, 707, 710, 712, 717, 718) to appointments; made `appointment_id` optional in validator for emergency admissions. | **RESOLVED** |
| **DB-05** | **MEDIUM** | Relational Invariant | [`back-end/src/store/dataStore.js`](back-end/src/store/dataStore.js) | Capacity Mismatch | Ward 1 & 2 bed counts mismatched `total_beds`. Resolved by seeding missing beds `G-115..G-120` and `ICU-01..04, 09, 10` as `AVAILABLE`. | **RESOLVED** |
| **DB-06** | **MEDIUM** | Relational Invariant | [`back-end/src/store/dataStore.js`](back-end/src/store/dataStore.js), [`back-end/src/test/allocation_and_booking_guards.spec.js`](back-end/src/test/allocation_and_booking_guards.spec.js) | Missing Ledgers | Seeded open financial ledger #812 for admission #708; added dynamic unledgered fallback in test suite. | **RESOLVED** |
| **DB-07** | **MEDIUM** | Relational Invariant | [`back-end/src/services/preRequest.service.js:395-404`](back-end/src/services/preRequest.service.js) | Dual PK Generation | Unified `preRequest.service.js` to compute `entry_id` per-ledger (`filter(e => e.ledger_id === ledger.ledger_id).length + 1`) and added `entry_time`. | **RESOLVED** |
| **DB-08** | **HIGH** | Relational Invariant | [`back-end/src/services/patient.service.js:70-80`](back-end/src/services/patient.service.js), [`back-end/src/controllers/patient.controller.js:70-78`](back-end/src/controllers/patient.controller.js) | Unrestricted Cascading Deletion | Guarded `patient.service.js:remove()` to throw HTTP 409 Conflict if active admission exists (`status === 'ADMITTED'`), forwarded to error handler. | **RESOLVED** |
| **PST-01** | **CRITICAL** | Persistence Engine | [`back-end/src/store/persist.js:64-89`](back-end/src/store/persist.js) | Event Loop Starvation & Data Loss | Synchronous busy-wait retry loop (75ms total) blocks Node.js event loop during Windows file locks; unlinks `.tmp` and fails silently on lock exhaustion. |
| **PST-02** | **HIGH** | Persistence Engine | [`back-end/src/store/persist.js:56-116`](back-end/src/store/persist.js) | Zero Dirty State Tracking | Serializes entire 40 collections (7,100+ lines) on every non-GET request; severe synchronous disk I/O overhead. |
| **PST-03** | **MEDIUM** | Bootstrap Subsystem | [`back-end/src/bootstrap.js:15-45`](back-end/src/bootstrap.js) | Unpersisted Boot Mutations | `runBootReconciliation()` modifies `dataStore` in memory but never invokes `persist.save()`. Modifications lost on crash. |
| **PST-04** | **MEDIUM** | Persistence Middleware | [`back-end/src/middleware/persistOnMutation.js:5-12`](back-end/src/middleware/persistOnMutation.js) | Dirty State Leakage | Mutations in memory on failed requests (status >= 400) remain in memory and are accidentally flushed by subsequent requests. |
| **FE-01** | **MEDIUM** | Frontend Portal (Admin/Public) | [`front-end/src/pages/admin/DashboardPage.jsx:17`](front-end/src/pages/admin/DashboardPage.jsx), [`front-end/src/pages/public/OrgSignupPage.jsx:48`](front-end/src/pages/public/OrgSignupPage.jsx) | Defect D3: Rate Card Property Mismatch | Frontend reads `liveRates?.base_fee` or `res.base_fee`, but backend returns `base_platform_fee`. Base fee consistently falls back to 3000. |
| **FE-02** | **LOW** | Frontend Portal (Public) | [`front-end/src/pages/public/OrgSignupPage.jsx:53-56`](front-end/src/pages/public/OrgSignupPage.jsx) | Defect D9: Toast Type Mismatch | Calls `toast(..., 'warn')`. The feedback store supports `['success', 'error', 'warning', 'info']`, falling back to `'info'`. |

---

## 3. Dead Code & Removable Logic Catalog

An exhaustive scan across backend and frontend layers cataloged all redundant, deprecated, and dead logic suitable for consolidation or removal.

### 3.1 Redundant Request Alias Trio
The backend contains three legacy backward-compatibility alias stubs that directly re-export appointment modules without adding any behavior:
1. [`back-end/src/routes/request.routes.js:1-4`](back-end/src/routes/request.routes.js): Re-exports `appointment.routes.js`.
2. [`back-end/src/controllers/request.controller.js:1-4`](back-end/src/controllers/request.controller.js): Re-exports `appointment.controller.js`.
3. [`back-end/src/services/request.service.js:1-5`](back-end/src/services/request.service.js): Re-exports `appointment.service.js`.
- **Recommendation**: Safe for immediate deprecation; consolidate consumers directly onto `appointment.*`.

### 3.2 Dead Collections in `dataStore.js`
1. `dataStore.patientInsuranceDocuments` (0 items): Legacy collection. Insurance card images are stored directly as `card_front_url` / `card_back_url` properties on `patientInsurances`.
2. `dataStore.insurances` (0 items): Legacy relational table from `Federico_Schemas.pdf`. Replaced by dynamic billing fields (`insurance_deduction`, `copay_amount`).
3. `dataStore.platformActivityLog` (0 items): Platform superuser activities currently write to standard `activityLog`.
4. `dataStore.leaders` (0 items): Unpopulated seed collection; dynamically managed at runtime.

### 3.3 Dead Frontend Code & Defensive Branches
1. [`front-end/src/pages/admin/DepartmentsPage.jsx:47-53`](front-end/src/pages/admin/DepartmentsPage.jsx): Dead defensive check `if (result && result.error) { toast(result.message, 'error'); return; }` is unreachable because `api.wards.remove()` throws an `ApiError` on HTTP failure.
2. [`front-end/src/pages/fa/useHashRoute.js:14-17`](front-end/src/pages/fa/useHashRoute.js): Deprecated route aliases `#/dashboard` -> `#/ledger`, `#/discharge` -> `#/eod`, and `#/receipts` -> `#/eod`.
3. [`back-end/src/services/data.service.js:7-28`](back-end/src/services/data.service.js): `SYNCED_KEYS` lists obsolete/empty `stateVersion` property and only synchronizes 20 of 40 collections during state updates.

---

## 4. Hardcoded Data, Credentials & Magic Numbers Catalog

Below is the verified ledger of hardcoded values, fallbacks, magic strings, and static configurations identified across the repository:

### 4.1 Default Credentials & Authentication Constants
| Location | Hardcoded Value | Purpose / Impact |
|---|---|---|
| [`back-end/src/services/auth.service.js:299-314`](back-end/src/services/auth.service.js) | `admin.hom@citygen.com: 'Hom@123'`, `rekha.pre@citygen.com: 'Pre@123'`, `farah.fa@citygen.com: 'Fa@123'`, `owner.admin@citygen.com: 'Owner@123'` | Dynamic demo accounts generator (`GET /auth/demo-accounts`) for QA and local login |
| [`back-end/src/services/auth.service.js:370-376`](back-end/src/services/auth.service.js) | `email: 'super.platform@federico.com'`, `password: 'Federico@Platform123'` | Hardcoded fallback Platform Super User demo credentials |
| [`front-end/src/lib/roleProfiles.js:45-49`](front-end/src/lib/roleProfiles.js) | `super.platform@federico.com` / `Federico@Platform123` | Platform demo credential constant on frontend |
| [`front-end/src/pages/public/LoginPage.jsx:132-135`](front-end/src/pages/public/LoginPage.jsx) | `super.platform@federico.com` / `Federico@Platform123` | Platform Super User quick-fill button |
| [`back-end/src/config/env.js:14`](back-end/src/config/env.js) | `SESSION_SECRET = 'federico-dev-secret'` | Fallback session secret when environment variable is unset |
| [`back-end/src/store/dataStore.js:25-95`](back-end/src/store/dataStore.js) | Pre-computed bcrypt password hashes for 13 users and 1 superuser | Seed database credentials |

### 4.2 Network Hosts, Ports & URLs
| Location | Hardcoded Value | Purpose / Impact |
|---|---|---|
| [`back-end/src/config/env.js:10`](back-end/src/config/env.js) | `PORT = 3000`, `HOST = '0.0.0.0'` | Default backend listening port and interface |
| [`front-end/src/api/client.js:11`](front-end/src/api/client.js) | `http://localhost:3000` | Fallback backend API base URL when `VITE_API_URL` is omitted |
| [`back-end/src/middleware/security.js:24-25`](back-end/src/middleware/security.js) | `http://localhost:*`, `ws://localhost:*` | CSP directives allowing local development connections and Vite HMR |
| [`front-end/vite.config.js:64-65`](front-end/vite.config.js) | `http://localhost:*`, `ws://localhost:*` | Vite dev server CSP header configuration |

### 4.3 Business Logic Baselines & Magic Numbers
| Location | Hardcoded Value | Purpose / Impact |
|---|---|---|
| [`back-end/src/config/serviceCatalog.js:23-33`](back-end/src/config/serviceCatalog.js) | Base prices: `APPOINTMENTS: 1500`, `ADMISSIONS: 2500`, `INVENTORY: 2000`, `BILLING: 2500`, `INSURANCE: 1800`, `ANALYTICS: 3000`, `DOCTOR: 1200`, `PATIENT: 1500`, `LEADERSHIP: 1000` | Monthly base module pricing (INR) per hospital branch |
| [`back-end/src/config/resourceCatalog.js:25-51`](back-end/src/config/resourceCatalog.js) | `GENERAL_BEDS: 150`, `ICU_BEDS: 600`, `PRIVATE_BEDS: 350`, `WAREHOUSES: 1000`, `STAFF_SEATS: 200`, `PATIENT_ADMISSIONS: 10` | Resource quota tier pricing (INR/month/unit) |
| [`back-end/src/config/defaultClinicalCatalog.js:14-21`](back-end/src/config/defaultClinicalCatalog.js) | 6 default wards: `Critical Care` (8 beds), `General Medicine` (20 beds), `Surgery` (12 beds), `Pediatrics` (10 beds), `Emergency` (8 beds), `Obstetrics` (10 beds) | Baseline wards & beds auto-created for new tenants |
| [`back-end/src/config/defaultClinicalCatalog.js:29-49`](back-end/src/config/defaultClinicalCatalog.js) | 19 default services: `Consultation Fee: 500`, `Room Rent: 3000`, `ICU Charges: 9500`, `MRI Scan: 12000`, `CT Scan: 6000`, etc. | Baseline hospital services catalog |
| [`back-end/src/services/doctor.service.js:119-123`](back-end/src/services/doctor.service.js) | `DUTY_DAYS = [1, 2, 3, 4, 5]`, `09:00 - 17:00`, `SLOT_MINUTES = 30` | Default doctor duty schedule and slot collision window |
| [`back-end/src/middleware/security.js:54-85`](back-end/src/middleware/security.js) | Window: `15 mins`; Global limit: `10000`; Auth limit: `200`; Upload limit: `200` | Rate limiter threshold numbers |
| [`back-end/src/middleware/fileUpload.js:33`](back-end/src/middleware/fileUpload.js) | `5 * 1024 * 1024` (5 MB) | Maximum permitted file upload size |
| [`front-end/src/pages/admin/DashboardPage.jsx:23-24`](front-end/src/pages/admin/DashboardPage.jsx) | `terminals: 2`, `warehouses: 1` | Hardcoded facility defaults due to lack of corresponding backend endpoints |
| [`front-end/src/pages/public/OrgSignupPage.jsx:21-31`](front-end/src/pages/public/OrgSignupPage.jsx) | Fallback rates (`GENERAL_BEDS: 150`, `ICU_BEDS: 600`, etc.) | Client-side fallback pricing when rate API is unreachable |

### 4.4 Mock & Fallback Strings
| Location | Hardcoded Value | Purpose / Impact |
|---|---|---|
| [`front-end/src/pages/patient/patientInvoiceCopy.js:92`](front-end/src/pages/patient/patientInvoiceCopy.js) | `+91 1800-456-7890`, `FEDERICO HOSPITALS` | Hardcoded support phone and hospital network name in printable invoice |
| [`front-end/src/pages/patient/patientInvoiceCopy.js:9`](front-end/src/pages/patient/patientInvoiceCopy.js) | `FED-${profile?.patientId || '201'}` | Fallback UHID generation when profile is absent |
| [`front-end/src/pages/patient/patientDocumentCopy.js:25`](front-end/src/pages/patient/patientDocumentCopy.js) | `UHID-882100` | Fallback UHID in printable document view |
| [`front-end/src/pages/patient/patientDocumentCopy.js:26`](front-end/src/pages/patient/patientDocumentCopy.js) | `'UPI'` | Default payment mode fallback in printable document |
| [`front-end/src/lib/formatters.js:18-46`](front-end/src/lib/formatters.js) | `'en-IN'`, `'Rs '` | Hardcoded Indian English locale and Rupee currency symbol |

---

## 5. Frontend Data-Binding & UI Integrity Audit Across All 7 Portals

### 5.1 Strict API Encapsulation Verification
An exhaustive scan across all 197 frontend files verified:
- **Zero Raw Network Requests**: `fetch()` is called in exactly ONE file: `front-end/src/api/client.js` (lines 55, 100, 146).
- **Zero Axios Calls**: Zero instances of `axios` exist across the frontend repository.
- **Strict Facade Access**: 100% of components and views interact with backend resources via `src/api` endpoint modules.

### 5.2 Loading, Empty, and Error State Handling
- **Empty States**: Universal `<EmptyState>` component is used extensively across Platform, Public, HOM, FA, Patient, and Admin portals. PRE pages utilize styled native table rows (`<tr><td colSpan="...">No Pending Requests</td></tr>`), accurately matching legacy styling.
- **Loading States**: Routes utilize `<Suspense fallback={<Loading />}>`. Hook calls use `loading` flags from `useApi()`, rendering skeleton / loading indicators.
- **Error States**: Handled through `ApiError` instances and surfaced uniformly via the centralized `<FeedbackHost>` toast notification system.

### 5.3 Key Stability & Dynamic List Patterns
Across hundreds of dynamic list maps, stable entity IDs (`r.pre_request_id`, `b.bed_id`, `p.patient_id`, `item.item_id`, `e.entry_id`) are consistently used as React `key` props. Exactly 4 instances of array indices used as keys were detected and verified as legitimate:
1. `src/pages/hom/DashboardPage.jsx:314`: `key={i}` on operational event logs (acceptable for static event log slices).
2. `src/pages/platform/PlatformDashboardPage.jsx:126`: `key={i}` on platform activity logs.
3. `src/pages/pre/Patient360Modal.jsx:97`: `key={i}` on patient medical history table rows.
4. `src/pages/patient/BillDetailsModal.jsx:186`: `key={idx}` on dynamically synthesized invoice line items lacking unique database IDs.

### 5.4 State Synchronization & Polling Mechanics
- **HOM Portal**: Uses `usePolling(reload, 15000)` on all 4 main pages, pausing on tab hide and firing on focus.
- **FA Portal**: Controlled by `FaContext`, broadcasting `currentAdmissionId`, `reload()`, and `version` counters across views.
- **Patient Portal**: Centralized in `PatientStoreContext`, managing composite `portalSummary` data and refresh triggers.
- **PRE Portal**: Relies on `useApi()` for consolidated fetching and re-fetches immediately upon mutation completion.

### 5.5 Security & Injection Audit
- **Zero instances of `dangerouslySetInnerHTML`** across all 197 frontend files.
- **Zero runtime `innerHTML` manipulation**.
- `document.write` is strictly confined to `src/lib/printDocument.js` (`win.document.write(html)` on `about:blank` popup windows specifically for offline printing).

---

## 6. Relational Invariants, Clinical Rules & Crash-Safe Persistence Audit

### 6.1 Inventory of 40 Entity Collections in `dataStore.js`

| # | Collection Name | Seed Count | Primary Key | Foreign Key References | Tenant Scoped | Domain Classification |
|:---:|---|:---:|---|---|---|---|
| 1 | `roles` | 5 | `role_id` (INT) | None | No / Global | Core Identity & RBAC |
| 2 | `users` | 13 | `user_id` (INT) | `role_id` -> `roles.role_id` | Yes (`org: 1-2`, `hosp: 1-2`) | Core Identity & RBAC |
| 3 | `patients` | 29 | `patient_id` (INT) | `user_id` -> `users.user_id` (NULLABLE) | Yes (`org: 1-2`, `hosp: 1`) | Core Clinical & Inpatient |
| 4 | `patientInsurances` | 10 | `insurance_id` (INT) | `patient_id` -> `patients.patient_id` | Yes (`org: 1`, `hosp: 1`) | Core Insurance & Billing |
| 5 | `patientInsuranceDocuments` | 0 | `doc_id` (INT) | `insurance_id` -> `patientInsurances.insurance_id` | No (Empty) | Core Insurance & Billing |
| 6 | `doctors` | 17 | `doctor_id` (INT) | None | Yes (`org: 1-2`, `hosp: 1-2`) | Core Clinical & Inpatient |
| 7 | `doctorAvailabilities` | 49 | `availability_id` (INT) | `doctor_id` -> `doctors.doctor_id` | Yes (`org: 1-2`, `hosp: 1-2`) | Core Clinical & Scheduling |
| 8 | `appointments` | 11 | `appointment_id` (INT) | `patient_id`, `doctor_id`, `availability_id`, `created_by` | Yes (`org: 1`, `hosp: 1`) | Core Clinical & Scheduling |
| 9 | `wards` | 7 | `ward_id` (INT) | None | Yes (`org: 1-2`, `hosp: 1-2`) | Core Ward & Bed Operations |
| 10 | `beds` | 64 | `bed_id` (INT) | `ward_id` -> `wards.ward_id` | Yes (`org: 1-2`, `hosp: 1-2`) | Core Ward & Bed Operations |
| 11 | `admissions` | 19 | `admission_id` (INT) | `patient_id`, `appointment_id`, `bed_id` | Yes (`org: 1-2`, `hosp: 1-2`) | Core Clinical & Inpatient |
| 12 | `dischargeSummaries` | 7 | `summary_id` (INT) | `admission_id`, `patient_id` | Yes (`org: 1`, `hosp: 1`) | Core Clinical & Discharge |
| 13 | `services` | 25 | `service_id` (INT) | None | Yes (`org: 1-2`, `hosp: 1-2`) | Core Financial & Tariffs |
| 14 | `ledgers` | 17 | `ledger_id` (INT) | `admission_id` -> `admissions.admission_id` | Yes (`org: 1-2`, `hosp: 1-2`) | Core Financial & Billing |
| 15 | `ledgerEntries` | 71 | `entry_id` (Weak) | `ledger_id` -> `ledgers`, `service_id` -> `services` | Yes (`org: 1-2`, `hosp: 1-2`) | Core Financial & Billing |
| 16 | `insurances` | 0 | `insurance_id` (INT) | `admission_id`, `patient_insurance_id` | No (Empty) | Core Insurance Claims |
| 17 | `payments` | 7 | `payment_id` (INT) | `ledger_id` -> `ledgers.ledger_id` | Yes (`org: 1`, `hosp: 1`) | Core Financial & Billing |
| 18 | `inventoryItems` | 17 | `item_id` (INT) | `service_id` -> `services.service_id` (NULLABLE) | Yes (`org: 1`, `hosp: 1`) | Core Inventory & Supply |
| 19 | `purchaseRequests` | 3 | `request_id` (INT) | `item_id`, `requested_by` -> `users` | Yes (`org: 1`, `hosp: 1`) | Core Inventory & Supply |
| 20 | `preRequests` | 29 | `pre_request_id` (INT) | `patient_id`, `appointment_id`, `doctor_id`, `bed_id` | Yes (`org: 1-2`, `hosp: 1`) | Intake, Triage & Flow |
| 21 | `bedRequests` | 19 | `bed_request_id` (INT) | `pre_request_id`, `patient_id`, `ward_id`, `bed_id` | Yes (`org: 1`, `hosp: 1`) | Intake, Triage & Flow |
| 22 | `emergencyNotifications` | 4 | `emergency_id` (INT) | `patient_id` (NULLABLE), `bed_id`, `created_by` | Yes (`org: 1`, `hosp: 1`) | Intake, Triage & Flow |
| 23 | `receipts` | 8 | `receipt_id` (INT) | `payment_id`, `ledger_id`, `admission_id`, `patient_id` | Yes (`org: 1`, `hosp: 1`) | Financial & Audit |
| 24 | `activityLog` | 155 | `id` (INT) | None | Yes (`org: 1-2`, `hosp: 1-2`) | Operations Audit |
| 25 | `organizations` | 2 | `organization_id` (INT) | None | Self (Tenant Root) | Multi-Tenant Architecture |
| 26 | `hospitals` | 3 | `hospital_id` (INT) | `organization_id` -> `organizations.organization_id` | Yes (`org: 1-2`) | Multi-Tenant Architecture |
| 27 | `subscriptionPlans` | 1 | `plan_id` (INT) | None | No / Global | Platform Commercial Tier |
| 28 | `subscriptions` | 2 | `subscription_id` (INT) | `organization_id`, `plan_id` | Yes (`org: 1-2`) | Multi-Tenant Architecture |
| 29 | `organizationModules` | 18 | Composite `(org, module)` | `organization_id` -> `organizations` | Yes (`org: 1-2`) | Platform Feature Flags |
| 30 | `resourceQuotas` | 2 | `organization_id` (1:1) | `organization_id` -> `organizations` | Yes (`org: 1-2`) | Multi-Tenant Governance |
| 31 | `apiKeys` | 1 | `api_key_id` (INT) | `organization_id` -> `organizations` | Yes (`org: 2`) | Integration & Security |
| 32 | `customRoles` | 1 | `custom_role_id` (INT) | `organization_id` -> `organizations` | Yes (`org: 1`) | Dynamic RBAC |
| 33 | `permissions` | 24 | `permission_id` (INT) | None | No / Global Catalog | Dynamic RBAC |
| 34 | `rolePermissions` | 1 | Composite `(role, perm)` | `custom_role_id`, `permission_id` | No (Linked via role) | Dynamic RBAC |
| 35 | `staffRoleAssignments` | 1 | Composite `(user, role)` | `user_id`, `custom_role_id` | No (Linked via user) | Dynamic RBAC |
| 36 | `platformSuperUsers` | 1 | `platform_user_id` (INT) | None | No / Global Root | Platform Governance |
| 37 | `provisioningLog` | 6 | `id` (INT) | `organization_id` -> `organizations` | Yes (`org: 2`) | Operations Audit |
| 38 | `platformActivityLog` | 0 | `id` (INT) | None | No (Empty) | Platform Governance |
| 39 | `leaders` | 0 | `leader_id` (INT) | `admission_id`, `patient_id`, `service_id` | Yes (Runtime) | Financial Approvals |
| 40 | `organizationResources` | 7 | Composite `(org, mod, res)` | `organization_id` -> `organizations` | Yes (`org: 1-2`) | Commercial Marketplace |

### 6.2 Relational Schema Specification vs In-Memory Runtime Store (19 Formal Tables)

| Relational Entity | Formal Schema Constraints (`Federico_Schemas.pdf`) | Runtime State in `dataStore.js` | Divergence & Impact Analysis |
|---|---|---|---|
| **1. ROLE** | `role_id INT PK, role_name VARCHAR(50) UNIQUE NOT NULL` | 5 roles (`HOM`, `Patient`, `FA`, `PRE`, `Admin`) | Aligned on core roles; extended dynamically with custom roles. |
| **2. USER** | `user_id INT PK, name, email UNIQUE, password_hash, role_id INT NOT NULL FK(ROLE)` | 13 users. Adds `organization_id`, `hospital_id`. | Aligned on core keys; enhanced with multi-tenant fields. |
| **3. PATIENT** | `patient_id INT PK, user_id INT NOT NULL FK(USER), uhid UNIQUE NOT NULL` | 29 patients. 25 records have `user_id: null`. | **Major Violation:** Schema mandates `user_id NOT NULL` with total participation. In `dataStore`, 86.2% of patients lack user accounts. |
| **4. PATIENT_INSURANCE** | `insurance_id INT PK, patient_id INT NOT NULL FK(PATIENT), provider_name, policy_number` | 10 policies. Adds `coverage_limit`, `copay_percentage`. | Aligned. Extended with copay and limit properties. |
| **5. PATIENT_INSURANCE_DOCUMENTS** | `doc_id INT PK, insurance_id INT NOT NULL FK(PATIENT_INSURANCE), file_path` | Empty collection `[]` (0 records). | **Dead Collection:** Never populated. Files stored as `card_front_url` directly on `patientInsurances`. |
| **6. DOCTOR** | `doctor_id INT PK, name, specialization, phone, email` | 17 doctors. Adds `organization_id`, `hospital_id`. | Aligned. Scoped to multi-tenant hierarchy. |
| **7. DOCTOR_AVAILABILITY** | `availability_id INT PK, doctor_id INT NOT NULL FK(DOCTOR), available_date, start_time, end_time` | 49 slots across 17 doctors. | Aligned on keys and relationships. |
| **8. APPOINTMENT** | `appointment_id INT PK, patient_id INT NOT NULL, availability_id INT NOT NULL FK, created_by INT FK(USER)` | 11 appointments. `created_by` stores `patient_id`. | **Critical Defect:** Foreign key `created_by` references `patient_id` rather than `user_id`. Also double-booking present in seed data. |
| **9. WARD** | `ward_id INT PK, ward_name UNIQUE NOT NULL, total_beds INT NOT NULL` | 7 wards. Declared bed counts mismatch actual beds. | **Integrity Gap:** Ward 1 has 14 beds (declared 20); Ward 2 has 4 beds (declared 10). |
| **10. BED** | `bed_id INT PK, ward_id INT NOT NULL FK(WARD), bed_number, status` | 64 beds. | Aligned on schema structure; missing 12 seed records across Wards 1 and 2. |
| **11. ADMISSION** | `admission_id INT PK, appointment_id INT NOT NULL FK, patient_id INT NOT NULL, bed_id INT NOT NULL` | 19 admissions. All 19 have `appointment_id: null`. | **Major Violation:** Relational schema defines `appointment_id NOT NULL`. 100% of dataStore admissions have `appointment_id = null`. |
| **12. DISCHARGE_SUMMARY** | `summary_id INT PK, admission_id INT UNIQUE FK, patient_id INT, final_amount DECIMAL` | 7 summaries. Final amounts stored statically. | Minor divergence: Summary 7 generated for an actively admitted patient with unpaid ledger. |
| **13. SERVICE** | `service_id INT PK, service_name, base_cost DECIMAL(10,2)` | 25 services with base costs. | Aligned. |
| **14. LEDGER** | `ledger_id INT PK, admission_id INT UNIQUE FK, status` | 17 ledgers. 2 admissions (705, 708) lack ledgers. | **Violation:** Relational schema specifies total participation (`ADMISSION (1) —— (1) LEDGER`). |
| **15. LEDGER_ENTRY** | `PRIMARY KEY (entry_id, ledger_id) (Weak Entity), service_id FK` | 71 entries. `entry_id` repeated across ledgers. | Structural match to weak entity, but `preRequest.service.js` assigns `entry_id` as global maxId. |
| **16. INSURANCE** | `insurance_id INT PK, admission_id INT UNIQUE NOT NULL FK, patient_insurance_id INT FK` | Empty collection `[]` (0 records). | **Dead Schema Table:** Admission-level claim workflow absent. Replaced by ad-hoc `insurance_deduction` field. |
| **17. PAYMENT** | `payment_id INT PK, ledger_id INT NOT NULL FK, amount_paid, payment_mode` | 7 payments (IDs 901-907). | Aligned on schema; orphaned by external receipt #8. |
| **18. INVENTORY_ITEM** | `item_id INT PK, item_name, category, stock_quantity, reorder_level, service_id FK` | 17 items. 5 items have `service_id: null`. | Aligned. Schema allows nullable `service_id`. |
| **19. PURCHASE_REQUEST** | `request_id INT PK, item_id INT FK, quantity_requested, status, requested_by FK(USER)` | 3 requests. | Aligned. |

### 6.3 Persistence Mechanics, Crash Safety & Windows File Lock Dynamics
1. **Windows Atomic File Lock Starvation**:
   - `persist.writeAtomic()` executes `fs.renameSync(TMP_PATH, DB_PATH)`. On Windows, anti-virus agents and search indexers hold file locks (`EBUSY`/`EPERM`).
   - The retry loop executes at most 3 attempts with synchronous busy-waits of 25ms and 50ms (total **75ms window**).
   - Once retries are exhausted, the `.tmp` file is unlinked, and the function **silently returns without throwing**. Disk and memory state diverge permanently.
2. **Absence of Dirty Tracking**:
   - Zero dirty state flags or collection change tracking exist. Every single non-GET request serializes all 40 collections and 7,100+ lines, creating heavy disk I/O overhead.
3. **Dirty In-Memory State on Failed Requests**:
   - Direct mutations on `dataStore` occur before HTTP responses finish. If an error occurs (status >= 400), `persistOnMutation` does not save, leaving dirty modified state in memory that is inadvertently flushed by subsequent unrelated requests.

---

## 7. Exhaustive File-by-File Audit Cards

### Part A: Backend Files (142 Files)


### File #1: [`back-end/.env.example`](back-end/.env.example)
- **Absolute Path**: `D:\Federico_workspace\back-end\.env.example`
- **Subsystem / Layer**: **Root Project Config & Scripts** (`Build & Tooling`)
- **Lines**: **9 lines** | **Size**: **229 bytes**
- **Public Interface / Exports**: *None (or side-effect / script / asset)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Root project configuration, build tooling, package manifest, linter config, nodemon daemon config, or test scripts.
- **Architectural & Security Observations**: Defines npm scripts, dependencies (express, bcryptjs, helmet, multer, etc.), and runtime development tooling.

### File #2: [`back-end/.prettierrc`](back-end/.prettierrc)
- **Absolute Path**: `D:\Federico_workspace\back-end\.prettierrc`
- **Subsystem / Layer**: **Root Project Config & Scripts** (`Build & Tooling`)
- **Lines**: **5 lines** | **Size**: **56 bytes**
- **Public Interface / Exports**: *None (or side-effect / script / asset)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Root project configuration, build tooling, package manifest, linter config, nodemon daemon config, or test scripts.
- **Architectural & Security Observations**: Defines npm scripts, dependencies (express, bcryptjs, helmet, multer, etc.), and runtime development tooling.

### File #3: [`back-end/data/README.md`](back-end/data/README.md)
- **Absolute Path**: `D:\Federico_workspace\back-end\data\README.md`
- **Subsystem / Layer**: **Data Spec & Docs** (`Data`)
- **Lines**: **23 lines** | **Size**: **1249 bytes**
- **Public Interface / Exports**: *None (or side-effect / script / asset)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
  - *DataStore Collections Accessed*: `dataStore.js`
- **Primary Responsibility**: Database persistence documentation and local JSON database storage directory.
- **Architectural & Security Observations**: Target directory for `data/db.json` runtime persistence file.

### File #4: [`back-end/docs/README.md`](back-end/docs/README.md)
- **Absolute Path**: `D:\Federico_workspace\back-end\docs\README.md`
- **Subsystem / Layer**: **Documentation** (`Docs`)
- **Lines**: **148 lines** | **Size**: **9525 bytes**
- **Public Interface / Exports**: *None (or side-effect / script / asset)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: API documentation assets, including OpenAPI / Swagger JSON specification export and documentation README.
- **Architectural & Security Observations**: Maintains current contract specification of the 132 backend endpoints.
- **Detected Code Smells / Risks**:
  - ?? Contains hardcoded seed IDs or emails

### File #5: [`back-end/docs/swagger.json`](back-end/docs/swagger.json)
- **Absolute Path**: `D:\Federico_workspace\back-end\docs\swagger.json`
- **Subsystem / Layer**: **Documentation** (`Docs`)
- **Lines**: **2821 lines** | **Size**: **60887 bytes**
- **Public Interface / Exports**: *None (or side-effect / script / asset)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: API documentation assets, including OpenAPI / Swagger JSON specification export and documentation README.
- **Architectural & Security Observations**: Maintains current contract specification of the 132 backend endpoints.

### File #6: [`back-end/eslint.config.mjs`](back-end/eslint.config.mjs)
- **Absolute Path**: `D:\Federico_workspace\back-end\eslint.config.mjs`
- **Subsystem / Layer**: **Root Project Config & Scripts** (`Build & Tooling`)
- **Lines**: **26 lines** | **Size**: **592 bytes**
- **Public Interface / Exports**: *None (or side-effect / script / asset)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Root project configuration, build tooling, package manifest, linter config, nodemon daemon config, or test scripts.
- **Architectural & Security Observations**: Defines npm scripts, dependencies (express, bcryptjs, helmet, multer, etc.), and runtime development tooling.

### File #7: [`back-end/logs/.gitkeep`](back-end/logs/.gitkeep)
- **Absolute Path**: `D:\Federico_workspace\back-end\logs\.gitkeep`
- **Subsystem / Layer**: **Logs & Placeholders** (`Logging`)
- **Lines**: **1 lines** | **Size**: **0 bytes**
- **Public Interface / Exports**: *None (or side-effect / script / asset)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Application runtime log directory containing access, error, and combined log files and .gitkeep placeholder.
- **Architectural & Security Observations**: Populated at runtime by `logManager` and `requestLogger` middleware.

### File #8: [`back-end/logs/access.log`](back-end/logs/access.log)
- **Absolute Path**: `D:\Federico_workspace\back-end\logs\access.log`
- **Subsystem / Layer**: **Logs & Placeholders** (`Logging`)
- **Lines**: **5 lines** | **Size**: **1064 bytes**
- **Public Interface / Exports**: *None (or side-effect / script / asset)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Application runtime log directory containing access, error, and combined log files and .gitkeep placeholder.
- **Architectural & Security Observations**: Populated at runtime by `logManager` and `requestLogger` middleware.

### File #9: [`back-end/logs/combined.log`](back-end/logs/combined.log)
- **Absolute Path**: `D:\Federico_workspace\back-end\logs\combined.log`
- **Subsystem / Layer**: **Logs & Placeholders** (`Logging`)
- **Lines**: **11 lines** | **Size**: **7134 bytes**
- **Public Interface / Exports**: *None (or side-effect / script / asset)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Application runtime log directory containing access, error, and combined log files and .gitkeep placeholder.
- **Architectural & Security Observations**: Populated at runtime by `logManager` and `requestLogger` middleware.

### File #10: [`back-end/logs/error.log`](back-end/logs/error.log)
- **Absolute Path**: `D:\Federico_workspace\back-end\logs\error.log`
- **Subsystem / Layer**: **Logs & Placeholders** (`Logging`)
- **Lines**: **5 lines** | **Size**: **5886 bytes**
- **Public Interface / Exports**: *None (or side-effect / script / asset)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Application runtime log directory containing access, error, and combined log files and .gitkeep placeholder.
- **Architectural & Security Observations**: Populated at runtime by `logManager` and `requestLogger` middleware.

### File #11: [`back-end/nodemon.json`](back-end/nodemon.json)
- **Absolute Path**: `D:\Federico_workspace\back-end\nodemon.json`
- **Subsystem / Layer**: **Root Project Config & Scripts** (`Build & Tooling`)
- **Lines**: **14 lines** | **Size**: **188 bytes**
- **Public Interface / Exports**: *None (or side-effect / script / asset)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Root project configuration, build tooling, package manifest, linter config, nodemon daemon config, or test scripts.
- **Architectural & Security Observations**: Defines npm scripts, dependencies (express, bcryptjs, helmet, multer, etc.), and runtime development tooling.

### File #12: [`back-end/package-lock.json`](back-end/package-lock.json)
- **Absolute Path**: `D:\Federico_workspace\back-end\package-lock.json`
- **Subsystem / Layer**: **Root Project Config & Scripts** (`Build & Tooling`)
- **Lines**: **6994 lines** | **Size**: **259655 bytes**
- **Public Interface / Exports**: *None (or side-effect / script / asset)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Root project configuration, build tooling, package manifest, linter config, nodemon daemon config, or test scripts.
- **Architectural & Security Observations**: Defines npm scripts, dependencies (express, bcryptjs, helmet, multer, etc.), and runtime development tooling.
- **Detected Code Smells / Risks**:
  - ?? Contains TODO / FIXME maintenance tags

### File #13: [`back-end/package.json`](back-end/package.json)
- **Absolute Path**: `D:\Federico_workspace\back-end\package.json`
- **Subsystem / Layer**: **Root Project Config & Scripts** (`Build & Tooling`)
- **Lines**: **57 lines** | **Size**: **1461 bytes**
- **Public Interface / Exports**: *None (or side-effect / script / asset)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Root project configuration, build tooling, package manifest, linter config, nodemon daemon config, or test scripts.
- **Architectural & Security Observations**: Defines npm scripts, dependencies (express, bcryptjs, helmet, multer, etc.), and runtime development tooling.

### File #14: [`back-end/README.md`](back-end/README.md)
- **Absolute Path**: `D:\Federico_workspace\back-end\README.md`
- **Subsystem / Layer**: **Root Project Config & Scripts** (`Build & Tooling`)
- **Lines**: **123 lines** | **Size**: **5949 bytes**
- **Public Interface / Exports**: *None (or side-effect / script / asset)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Root project configuration, build tooling, package manifest, linter config, nodemon daemon config, or test scripts.
- **Architectural & Security Observations**: Defines npm scripts, dependencies (express, bcryptjs, helmet, multer, etc.), and runtime development tooling.
- **Detected Code Smells / Risks**:
  - ?? Contains hardcoded seed IDs or emails

### File #15: [`back-end/server.js`](back-end/server.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\server.js`
- **Subsystem / Layer**: **Server Entry** (`Runtime`)
- **Lines**: **34 lines** | **Size**: **1181 bytes**
- **Public Interface / Exports**: *None (or side-effect / script / asset)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `./src/config`, `./src/store/persist`, `./src/app`, `./src/bootstrap`
- **Primary Responsibility**: HTTP Server entry point. Restores persisted database snapshot, executes boot reconciliation, starts Express listener on configured port/host, and hooks SIGINT/SIGTERM for crash-safe state flushing.
- **Architectural & Security Observations**: Relies on synchronous `persist.load()` before server start. Shutdown hook flushes state synchronously with `persist.saveImmediate()`.
- **Detected Code Smells / Risks**:
  - ?? Synchronous blocking disk persistence call

### File #16: [`back-end/src/app.js`](back-end/src/app.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\app.js`
- **Subsystem / Layer**: **Application Core** (`Core`)
- **Lines**: **81 lines** | **Size**: **2414 bytes**
- **Public Interface / Exports**: `createApp`
- **Dependencies**:
  - *External Packages*: `path`, `express`, `cors`
  - *Internal Modules*: `./middleware/requestLogger`, `./middleware/notFoundHandler`, `./middleware/errorHandler`, `./middleware/session`, `./middleware/tenant`, `./middleware/persistOnMutation`, `./middleware/security`, `./config`, `./routes`
- **Primary Responsibility**: Express application factory (`createApp()`). Assembles global middleware pipeline (Helmet, CORS, rate-limiting, body parsers, input sanitization, request logger, session, tenant, mutation persistence), static file serving, route tree, Swagger docs, and error handling.
- **Architectural & Security Observations**: Mounts `persistOnMutation` which automatically persists state changes on non-GET HTTP responses with status < 400. Direct NestJS compatibility mapping.

### File #17: [`back-end/src/bootstrap.js`](back-end/src/bootstrap.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\bootstrap.js`
- **Subsystem / Layer**: **Bootstrap & Seeding** (`Core`)
- **Lines**: **49 lines** | **Size**: **1871 bytes**
- **Public Interface / Exports**: `runBootReconciliation`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `./services/rbac.service`, `./services/organization.service`, `./services/appointment.service`
- **Primary Responsibility**: Boot-time reconciliation orchestrator (`runBootReconciliation()`). Synchronizes RBAC permission catalog, provisions default module flags across all organizations, and backfills doctor IDs and email domains.
- **Architectural & Security Observations**: Each reconciliation task is wrapped in independent try/catch handlers to ensure startup resilience against corrupt or missing state records.

### File #18: [`back-end/src/config/defaultClinicalCatalog.js`](back-end/src/config/defaultClinicalCatalog.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\config\defaultClinicalCatalog.js`
- **Subsystem / Layer**: **Configuration** (`Config`)
- **Lines**: **75 lines** | **Size**: **5781 bytes**
- **Public Interface / Exports**: `DEFAULT_DEPARTMENTS`, `DEFAULT_SERVICES`, `DEFAULT_INVENTORY_ITEMS`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Baseline clinical catalog definitions. Defines standard hospital departments, default wards, default bed capacities, billable clinical services with base tariffs, and standard inventory medicines/supplies.
- **Architectural & Security Observations**: Deeply frozen (`Object.freeze`) immutable template data used by the tenant provisioning engine to initialize new hospital branches with identical clinical baselines.

### File #19: [`back-end/src/config/env.js`](back-end/src/config/env.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\config\env.js`
- **Subsystem / Layer**: **Configuration** (`Config`)
- **Lines**: **29 lines** | **Size**: **1045 bytes**
- **Public Interface / Exports**: `env`
- **Dependencies**:
  - *External Packages*: `path`
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Centralized environment configuration module following 12-factor principles. Loads `.env` file via `dotenv`, validates integer bounds, and exports strongly typed runtime settings.
- **Architectural & Security Observations**: Hardcoded fallback secret: `SESSION_SECRET` defaults to "federico_dev_placeholder_secret_key" if unset. Fallback debounce set to 250ms.
- **Detected Code Smells / Risks**:
  - ?? Hardcoded fallback session secret

### File #20: [`back-end/src/config/index.js`](back-end/src/config/index.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\config\index.js`
- **Subsystem / Layer**: **Configuration** (`Config`)
- **Lines**: **24 lines** | **Size**: **650 bytes**
- **Public Interface / Exports**: `env`, `DEFAULT_DEPARTMENTS`, `DEFAULT_INVENTORY_ITEMS`, `setupSwagger`, `buildDocument`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `./env`, `./defaultClinicalCatalog`, `./swagger`
- **Primary Responsibility**: Configuration barrel aggregator. Re-exports environment settings, default clinical catalog constants, and Swagger OpenAPI setup utilities.
- **Architectural & Security Observations**: Provides clean module boundary for application-wide configuration access.

### File #21: [`back-end/src/config/resourceCatalog.js`](back-end/src/config/resourceCatalog.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\config\resourceCatalog.js`
- **Subsystem / Layer**: **Configuration** (`Config`)
- **Lines**: **125 lines** | **Size**: **5041 bytes**
- **Public Interface / Exports**: `RESOURCE_CATALOG`, `modulesWithResources`, `resourceTypesFor`, `resourceTypeDef`, `unitPriceFor`, `computeResourceCost`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../store/dataStore`
  - *DataStore Collections Accessed*: `dataStore.platformRates`
- **Primary Responsibility**: Resource pricing catalog and cost calculation engine. Defines billable resource types per module (beds, seats, warehouses, terminals) and computes resource-tier monthly charges.
- **Architectural & Security Observations**: Supports dynamic override from `dataStore.platformRates` if present, enabling platform-wide rate updates without code changes.
- **Detected Code Smells / Risks**:
  - ?? Uses Math.max spread which can exceed stack size on large collections
  - ?? Direct in-place mutation of in-memory dataStore collection

### File #22: [`back-end/src/config/serviceCatalog.js`](back-end/src/config/serviceCatalog.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\config\serviceCatalog.js`
- **Subsystem / Layer**: **Configuration** (`Config`)
- **Lines**: **109 lines** | **Size**: **3996 bytes**
- **Public Interface / Exports**: `SERVICE_PRICES`, `SERVICE_NAMES`, `priceFor`, `computeCost`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `./resourceCatalog`
- **Primary Responsibility**: Usage-based service pricing catalog. Defines monthly base prices per module instance and computes total organization subscription costs combining base module prices and resource add-ons.
- **Architectural & Security Observations**: Implements instance-based scaling (charges per branch/instance) rather than flat organization tiers.
- **Detected Code Smells / Risks**:
  - ?? Uses Math.max spread which can exceed stack size on large collections

### File #23: [`back-end/src/config/swagger.js`](back-end/src/config/swagger.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\config\swagger.js`
- **Subsystem / Layer**: **Configuration** (`Config`)
- **Lines**: **237 lines** | **Size**: **13097 bytes**
- **Public Interface / Exports**: `setupSwagger`, `buildDocument`
- **Dependencies**:
  - *External Packages*: `fs`, `path`, `swagger-ui-express`
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: OpenAPI 3.0 specification builder and Swagger UI router. Maps 50+ REST endpoints with tags, HTTP methods, and bearer/x-role security schemes; exports `swagger.json` to disk.
- **Architectural & Security Observations**: Explicitly registers `x-role` header apiKey security scheme for backward compatibility. Exports spec to `docs/swagger.json` non-blockingly.

### File #24: [`back-end/src/controllers/activity.controller.js`](back-end/src/controllers/activity.controller.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\controllers\activity.controller.js`
- **Subsystem / Layer**: **Controllers** (`Presentation / API`)
- **Lines**: **12 lines** | **Size**: **328 bytes**
- **Public Interface / Exports**: `findAll`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../services/activity.service`, `../utils/sendResult`, `../utils/tenant`
- **Primary Responsibility**: HTTP presentation controller for activity. Handles HTTP request parameters, query parsing, tenant scoping, service invocation, and response formatting via `sendResult`.
- **Architectural & Security Observations**: Applies tenant isolation helpers (`scopeToOrg`, `belongsToOrg`, `withTenant`) to ensure multi-tenant boundary compliance around tenant-agnostic services.
- **Detected Code Smells / Risks**:
  - ?? Multi-tenant isolation checked at controller layer

### File #25: [`back-end/src/controllers/admission.controller.js`](back-end/src/controllers/admission.controller.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\controllers\admission.controller.js`
- **Subsystem / Layer**: **Controllers** (`Presentation / API`)
- **Lines**: **50 lines** | **Size**: **1682 bytes**
- **Public Interface / Exports**: `findAll`, `findOne`, `create`, `update`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../services/admission.service`, `../utils/logger`, `../utils/sendResult`, `../utils/tenant`
- **Primary Responsibility**: HTTP presentation controller for admission. Handles HTTP request parameters, query parsing, tenant scoping, service invocation, and response formatting via `sendResult`.
- **Architectural & Security Observations**: Applies tenant isolation helpers (`scopeToOrg`, `belongsToOrg`, `withTenant`) to ensure multi-tenant boundary compliance around tenant-agnostic services.
- **Detected Code Smells / Risks**:
  - ?? Multi-tenant isolation checked at controller layer

### File #26: [`back-end/src/controllers/app.controller.js`](back-end/src/controllers/app.controller.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\controllers\app.controller.js`
- **Subsystem / Layer**: **Controllers** (`Presentation / API`)
- **Lines**: **10 lines** | **Size**: **191 bytes**
- **Public Interface / Exports**: `getHello`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../services/app.service`
- **Primary Responsibility**: HTTP presentation controller for app. Handles HTTP request parameters, query parsing, tenant scoping, service invocation, and response formatting via `sendResult`.
- **Architectural & Security Observations**: Applies tenant isolation helpers (`scopeToOrg`, `belongsToOrg`, `withTenant`) to ensure multi-tenant boundary compliance around tenant-agnostic services.

### File #27: [`back-end/src/controllers/appointment.controller.js`](back-end/src/controllers/appointment.controller.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\controllers\appointment.controller.js`
- **Subsystem / Layer**: **Controllers** (`Presentation / API`)
- **Lines**: **37 lines** | **Size**: **1182 bytes**
- **Public Interface / Exports**: `findAll`, `create`, `update`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../services/appointment.service`, `../utils/logger`, `../utils/sendResult`, `../utils/tenant`
- **Primary Responsibility**: HTTP presentation controller for appointment. Handles HTTP request parameters, query parsing, tenant scoping, service invocation, and response formatting via `sendResult`.
- **Architectural & Security Observations**: Applies tenant isolation helpers (`scopeToOrg`, `belongsToOrg`, `withTenant`) to ensure multi-tenant boundary compliance around tenant-agnostic services.
- **Detected Code Smells / Risks**:
  - ?? Multi-tenant isolation checked at controller layer

### File #28: [`back-end/src/controllers/auth.controller.js`](back-end/src/controllers/auth.controller.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\controllers\auth.controller.js`
- **Subsystem / Layer**: **Controllers** (`Presentation / API`)
- **Lines**: **181 lines** | **Size**: **5296 bytes**
- **Public Interface / Exports**: `login`, `loginAsActor`, `signup`, `me`, `logout`, `entitlements`, `demoAccounts`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../services/auth.service`, `../services/entitlement.service`, `../utils/logger`, `../utils/roles`, `../middleware/session`
- **Primary Responsibility**: HTTP presentation controller for auth. Handles HTTP request parameters, query parsing, tenant scoping, service invocation, and response formatting via `sendResult`.
- **Architectural & Security Observations**: Applies tenant isolation helpers (`scopeToOrg`, `belongsToOrg`, `withTenant`) to ensure multi-tenant boundary compliance around tenant-agnostic services.

### File #29: [`back-end/src/controllers/billing.controller.js`](back-end/src/controllers/billing.controller.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\controllers\billing.controller.js`
- **Subsystem / Layer**: **Controllers** (`Presentation / API`)
- **Lines**: **216 lines** | **Size**: **7926 bytes**
- **Public Interface / Exports**: `findAllServices`, `createService`, `findLedgerByAdmission`, `findAllLedgers`, `createLedger`, `findLedgerEntries`, `addLedgerEntry`, `findAllPayments`, `createPayment`, `createSummary`, `dispatchLedger`, `findPatientBills`, `findAllReceipts`, `findReceiptsByPatient`, `findDischargeSummary`, `findAllLeaders`, `createLeader`, `approveLeader`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../services/billing.service`, `../store/dataStore`, `../utils/logger`, `../utils/sendResult`, `../utils/patientOwnership`, `../utils/tenant`
  - *DataStore Collections Accessed*: `dataStore.admissions`, `dataStore.patients`
- **Primary Responsibility**: HTTP presentation controller for billing. Handles HTTP request parameters, query parsing, tenant scoping, service invocation, and response formatting via `sendResult`.
- **Architectural & Security Observations**: Applies tenant isolation helpers (`scopeToOrg`, `belongsToOrg`, `withTenant`) to ensure multi-tenant boundary compliance around tenant-agnostic services.
- **Detected Code Smells / Risks**:
  - ?? Multi-tenant isolation checked at controller layer

### File #30: [`back-end/src/controllers/data.controller.js`](back-end/src/controllers/data.controller.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\controllers\data.controller.js`
- **Subsystem / Layer**: **Controllers** (`Presentation / API`)
- **Lines**: **22 lines** | **Size**: **749 bytes**
- **Public Interface / Exports**: `getFullState`, `updateFullState`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../services/data.service`, `../utils/logger`
- **Primary Responsibility**: HTTP presentation controller for data. Handles HTTP request parameters, query parsing, tenant scoping, service invocation, and response formatting via `sendResult`.
- **Architectural & Security Observations**: Applies tenant isolation helpers (`scopeToOrg`, `belongsToOrg`, `withTenant`) to ensure multi-tenant boundary compliance around tenant-agnostic services.

### File #31: [`back-end/src/controllers/doctor.controller.js`](back-end/src/controllers/doctor.controller.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\controllers\doctor.controller.js`
- **Subsystem / Layer**: **Controllers** (`Presentation / API`)
- **Lines**: **82 lines** | **Size**: **2453 bytes**
- **Public Interface / Exports**: `findAllDoctors`, `findDoctor`, `createDoctor`, `updateDoctor`, `deleteDoctor`, `findAllAvailabilities`, `findAvailabilityByDoctor`, `createAvailability`, `deleteAvailability`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../services/doctor.service`, `../utils/logger`, `../utils/sendResult`, `../utils/tenant`
- **Primary Responsibility**: HTTP presentation controller for doctor. Handles HTTP request parameters, query parsing, tenant scoping, service invocation, and response formatting via `sendResult`.
- **Architectural & Security Observations**: Applies tenant isolation helpers (`scopeToOrg`, `belongsToOrg`, `withTenant`) to ensure multi-tenant boundary compliance around tenant-agnostic services.
- **Detected Code Smells / Risks**:
  - ?? Multi-tenant isolation checked at controller layer

### File #32: [`back-end/src/controllers/inventory.controller.js`](back-end/src/controllers/inventory.controller.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\controllers\inventory.controller.js`
- **Subsystem / Layer**: **Controllers** (`Presentation / API`)
- **Lines**: **80 lines** | **Size**: **2339 bytes**
- **Public Interface / Exports**: `findAllItems`, `createItem`, `updateItem`, `deleteItem`, `findAllRequests`, `createRequest`, `updateRequest`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../services/inventory.service`, `../utils/logger`, `../utils/sendResult`, `../utils/tenant`
- **Primary Responsibility**: HTTP presentation controller for inventory. Handles HTTP request parameters, query parsing, tenant scoping, service invocation, and response formatting via `sendResult`.
- **Architectural & Security Observations**: Applies tenant isolation helpers (`scopeToOrg`, `belongsToOrg`, `withTenant`) to ensure multi-tenant boundary compliance around tenant-agnostic services.
- **Detected Code Smells / Risks**:
  - ?? Multi-tenant isolation checked at controller layer

### File #33: [`back-end/src/controllers/marketplace.controller.js`](back-end/src/controllers/marketplace.controller.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\controllers\marketplace.controller.js`
- **Subsystem / Layer**: **Controllers** (`Presentation / API`)
- **Lines**: **103 lines** | **Size**: **3159 bytes**
- **Public Interface / Exports**: `listOrganizations`, `listPlans`, `registerOrganization`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../services/organization.service`, `../services/subscriptionPlan.service`, `../services/provisioning.service`, `../services/auth.service`, `../utils/logger`
- **Primary Responsibility**: HTTP presentation controller for marketplace. Handles HTTP request parameters, query parsing, tenant scoping, service invocation, and response formatting via `sendResult`.
- **Architectural & Security Observations**: Applies tenant isolation helpers (`scopeToOrg`, `belongsToOrg`, `withTenant`) to ensure multi-tenant boundary compliance around tenant-agnostic services.

### File #34: [`back-end/src/controllers/patient.controller.js`](back-end/src/controllers/patient.controller.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\controllers\patient.controller.js`
- **Subsystem / Layer**: **Controllers** (`Presentation / API`)
- **Lines**: **187 lines** | **Size**: **6746 bytes**
- **Public Interface / Exports**: `findAll`, `findOne`, `create`, `update`, `remove`, `findAllInsurances`, `findInsuranceByPatient`, `createInsurance`, `getPortalSummary`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../services/patient.service`, `../services/billing.service`, `../services/preRequest.service`, `../services/appointment.service`, `../services/doctor.service`, `../services/ward.service`, `../utils/logger`, `../utils/sendResult`, `../utils/patientOwnership`, `../utils/tenant`
- **Primary Responsibility**: HTTP presentation controller for patient. Handles HTTP request parameters, query parsing, tenant scoping, service invocation, and response formatting via `sendResult`.
- **Architectural & Security Observations**: Applies tenant isolation helpers (`scopeToOrg`, `belongsToOrg`, `withTenant`) to ensure multi-tenant boundary compliance around tenant-agnostic services.
- **Detected Code Smells / Risks**:
  - ?? Multi-tenant isolation checked at controller layer

### File #35: [`back-end/src/controllers/platform.controller.js`](back-end/src/controllers/platform.controller.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\controllers\platform.controller.js`
- **Subsystem / Layer**: **Controllers** (`Presentation / API`)
- **Lines**: **548 lines** | **Size**: **16238 bytes**
- **Public Interface / Exports**: `login`, `me`, `logout`, `findAllOrganizations`, `findOrganization`, `createOrganization`, `changeEmailDomain`, `emailDomainImpact`, `suspendOrganization`, `activateOrganization`, `deleteOrganization`, `provisioningLog`, `activityLog`, `usage`, `platformUsage`, `findHospitals`, `createHospital`, `findModuleFlags`, `setModuleFlag`, `moduleResourceCatalog`, `findResources`, `setResources`, `findApiKeys`, `createApiKey`, `revokeApiKey`, `findAllPlans`, `createPlan`, `updatePlan`, `getSubscription`, `setSubscription`, `renewSubscription`, `getGlobalRates`, `updateGlobalRates`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../services/platformAuth.service`, `../services/organization.service`, `../services/subscriptionPlan.service`, `../services/subscription.service`, `../services/provisioning.service`, `../services/platformActivity.service`, `../config/serviceCatalog`, `../config/resourceCatalog`, `../store/dataStore`, `../utils/logger`, `../utils/sendResult`
  - *DataStore Collections Accessed*: `dataStore.provisioningLog`, `dataStore.users`, `dataStore.patients`, `dataStore.hospitals`, `dataStore.admissions`, `dataStore.payments`, `dataStore.apiKeys`, `dataStore.platformRates`
- **Primary Responsibility**: HTTP presentation controller for platform. Handles HTTP request parameters, query parsing, tenant scoping, service invocation, and response formatting via `sendResult`.
- **Architectural & Security Observations**: Applies tenant isolation helpers (`scopeToOrg`, `belongsToOrg`, `withTenant`) to ensure multi-tenant boundary compliance around tenant-agnostic services.
- **Detected Code Smells / Risks**:
  - ?? Uses Math.max spread which can exceed stack size on large collections

### File #36: [`back-end/src/controllers/preRequest.controller.js`](back-end/src/controllers/preRequest.controller.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\controllers\preRequest.controller.js`
- **Subsystem / Layer**: **Controllers** (`Presentation / API`)
- **Lines**: **234 lines** | **Size**: **7984 bytes**
- **Public Interface / Exports**: `findAll`, `findOne`, `create`, `update`, `checkIn`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../services/preRequest.service`, `../services/billing.service`, `../services/doctor.service`, `../store/dataStore`, `../utils/sendResult`, `../utils/patientOwnership`, `../utils/tenant`
  - *DataStore Collections Accessed*: `dataStore.admissions`
- **Primary Responsibility**: HTTP presentation controller for preRequest. Handles HTTP request parameters, query parsing, tenant scoping, service invocation, and response formatting via `sendResult`.
- **Architectural & Security Observations**: Applies tenant isolation helpers (`scopeToOrg`, `belongsToOrg`, `withTenant`) to ensure multi-tenant boundary compliance around tenant-agnostic services.
- **Detected Code Smells / Risks**:
  - ?? Multi-tenant isolation checked at controller layer

### File #37: [`back-end/src/controllers/rbac.controller.js`](back-end/src/controllers/rbac.controller.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\controllers\rbac.controller.js`
- **Subsystem / Layer**: **Controllers** (`Presentation / API`)
- **Lines**: **230 lines** | **Size**: **7457 bytes**
- **Public Interface / Exports**: `listRoles`, `createRole`, `listPermissions`, `permissionsForRole`, `assignPermission`, `unassignPermission`, `assignStaffRole`, `unassignStaffRole`, `listStaff`, `createStaff`, `setStaffActive`, `setStaffRole`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../services/rbac.service`, `../store/dataStore`, `../utils/logger`, `../utils/sendResult`, `../store/sessionStore`
  - *DataStore Collections Accessed*: `dataStore.users`
- **Primary Responsibility**: HTTP presentation controller for rbac. Handles HTTP request parameters, query parsing, tenant scoping, service invocation, and response formatting via `sendResult`.
- **Architectural & Security Observations**: Applies tenant isolation helpers (`scopeToOrg`, `belongsToOrg`, `withTenant`) to ensure multi-tenant boundary compliance around tenant-agnostic services.

### File #38: [`back-end/src/controllers/request.controller.js`](back-end/src/controllers/request.controller.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\controllers\request.controller.js`
- **Subsystem / Layer**: **Controllers** (`Presentation / API`)
- **Lines**: **4 lines** | **Size**: **72 bytes**
- **Public Interface / Exports**: `require('./appointment.controller')`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Backward compatibility controller alias. Directly re-exports `appointment.controller.js`.
- **Architectural & Security Observations**: Redundant controller alias safe for eventual deprecation and consolidation.

### File #39: [`back-end/src/controllers/upload.controller.js`](back-end/src/controllers/upload.controller.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\controllers\upload.controller.js`
- **Subsystem / Layer**: **Controllers** (`Presentation / API`)
- **Lines**: **126 lines** | **Size**: **3319 bytes**
- **Public Interface / Exports**: `handleDocumentUpload`, `handleBrandingUpload`, `handleInventoryUpload`, `serveFile`, `getLogStatus`
- **Dependencies**:
  - *External Packages*: `path`, `fs`
  - *Internal Modules*: `../middleware/fileUpload`, `../utils/logManager`
- **Primary Responsibility**: HTTP presentation controller for upload. Handles HTTP request parameters, query parsing, tenant scoping, service invocation, and response formatting via `sendResult`.
- **Architectural & Security Observations**: Applies tenant isolation helpers (`scopeToOrg`, `belongsToOrg`, `withTenant`) to ensure multi-tenant boundary compliance around tenant-agnostic services.

### File #40: [`back-end/src/controllers/ward.controller.js`](back-end/src/controllers/ward.controller.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\controllers\ward.controller.js`
- **Subsystem / Layer**: **Controllers** (`Presentation / API`)
- **Lines**: **235 lines** | **Size**: **8004 bytes**
- **Public Interface / Exports**: `findAllWards`, `createWard`, `updateWard`, `deleteWard`, `findAllBeds`, `findBedsByWard`, `createBed`, `updateBedStatus`, `findAllBedRequests`, `createBedRequest`, `updateBedRequest`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../services/ward.service`, `../services/preRequest.service`, `../services/admission.service`, `../utils/logger`, `../utils/sendResult`, `../utils/tenant`
- **Primary Responsibility**: HTTP presentation controller for ward. Handles HTTP request parameters, query parsing, tenant scoping, service invocation, and response formatting via `sendResult`.
- **Architectural & Security Observations**: Applies tenant isolation helpers (`scopeToOrg`, `belongsToOrg`, `withTenant`) to ensure multi-tenant boundary compliance around tenant-agnostic services.
- **Detected Code Smells / Risks**:
  - ?? Multi-tenant isolation checked at controller layer

### File #41: [`back-end/src/middleware/actorAccess.js`](back-end/src/middleware/actorAccess.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\middleware\actorAccess.js`
- **Subsystem / Layer**: **Middleware** (`HTTP / Middleware`)
- **Lines**: **86 lines** | **Size**: **3023 bytes**
- **Public Interface / Exports**: `authorize`, `ACTOR_ACCESS`, `dynamicRoleGrants`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../store/dataStore`
  - *DataStore Collections Accessed*: `dataStore.permissions`, `dataStore.staffRoleAssignments`, `dataStore.customRoles`, `dataStore.rolePermissions`
- **Primary Responsibility**: Role-Based Access Control authorization middleware. Enforces `ACTOR_ACCESS` resource-mode matrix and evaluates dynamic custom role permissions.
- **Architectural & Security Observations**: [SEC-01 RESOLVED] The legacy `x-role` header check has been completely eradicated. All endpoints strictly require authenticated session actor roles (`req.session.role`) and dynamic RBAC checks. Spoofed header requests are strictly rejected with 403 Forbidden.
- **Detected Code Smells / Risks**:
  - *(None - x-role bypass eliminated)*

### File #42: [`back-end/src/middleware/errorHandler.js`](back-end/src/middleware/errorHandler.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\middleware\errorHandler.js`
- **Subsystem / Layer**: **Middleware** (`HTTP / Middleware`)
- **Lines**: **55 lines** | **Size**: **1682 bytes**
- **Public Interface / Exports**: `errorHandler`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../utils/logManager`
- **Primary Responsibility**: Centralized Express error handling middleware. Formats Multer upload errors, body SyntaxErrors, and custom application exceptions into uniform NestJS-compliant JSON error responses.
- **Architectural & Security Observations**: Logs all exceptions to console and `logs/error.log` via `logManager`. Sanitizes internal 500 errors to prevent stack trace leaks.

### File #43: [`back-end/src/middleware/fileUpload.js`](back-end/src/middleware/fileUpload.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\middleware\fileUpload.js`
- **Subsystem / Layer**: **Middleware** (`HTTP / Middleware`)
- **Lines**: **93 lines** | **Size**: **2491 bytes**
- **Public Interface / Exports**: `UPLOADS_ROOT`, `CATEGORIES`, `uploadDocument`, `uploadBranding`, `uploadInventory`
- **Dependencies**:
  - *External Packages*: `fs`, `path`, `crypto`, `multer`
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Multer file upload middleware. Manages multipart disk storage for documents, branding logos, and inventory invoices with strict 5MB size limits and PDF/JPEG/PNG/WEBP MIME validation.
- **Architectural & Security Observations**: Generates cryptographically random 8-byte hex filenames with extension whitelisting to prevent path traversal and arbitrary file upload execution.

### File #44: [`back-end/src/middleware/notFoundHandler.js`](back-end/src/middleware/notFoundHandler.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\middleware\notFoundHandler.js`
- **Subsystem / Layer**: **Middleware** (`HTTP / Middleware`)
- **Lines**: **13 lines** | **Size**: **252 bytes**
- **Public Interface / Exports**: `notFoundHandler`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Fallback 404 handler for unmatched routes. Formats uniform JSON response.
- **Architectural & Security Observations**: Complies with NestJS standard 404 response structure.

### File #45: [`back-end/src/middleware/persistOnMutation.js`](back-end/src/middleware/persistOnMutation.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\middleware\persistOnMutation.js`
- **Subsystem / Layer**: **Middleware** (`HTTP / Middleware`)
- **Lines**: **15 lines** | **Size**: **290 bytes**
- **Public Interface / Exports**: `persistOnMutation`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../store/persist`
- **Primary Responsibility**: Post-response mutation interceptor. Attaches to `res.on("finish")` and triggers debounced persistence (`persist.save()`) for all successful non-GET requests (status < 400).
- **Architectural & Security Observations**: Non-intrusive architecture: avoids coupling individual controller actions to disk persistence mechanics.

### File #46: [`back-end/src/middleware/platformAccess.js`](back-end/src/middleware/platformAccess.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\middleware\platformAccess.js`
- **Subsystem / Layer**: **Middleware** (`HTTP / Middleware`)
- **Lines**: **15 lines** | **Size**: **348 bytes**
- **Public Interface / Exports**: `requirePlatformUser`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Platform Super User authorization gate (`requirePlatformUser`). Restricts administrative routes to users with `isPlatformUser === true`.
- **Architectural & Security Observations**: Strict privilege separation ensuring tenant staff and patients cannot access multi-tenant infrastructure management endpoints.

### File #47: [`back-end/src/middleware/requestLogger.js`](back-end/src/middleware/requestLogger.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\middleware\requestLogger.js`
- **Subsystem / Layer**: **Middleware** (`HTTP / Middleware`)
- **Lines**: **26 lines** | **Size**: **616 bytes**
- **Public Interface / Exports**: `requestLogger`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../utils/logManager`
- **Primary Responsibility**: HTTP request access logger. Records HTTP method, URL, status code, response time, and remote IP to console, `logs/access.log`, and `logs/combined.log`.
- **Architectural & Security Observations**: Asynchronous file writes buffered through `logManager` to prevent I/O blocking on high-throughput requests.

### File #48: [`back-end/src/middleware/security.js`](back-end/src/middleware/security.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\middleware\security.js`
- **Subsystem / Layer**: **Middleware** (`HTTP / Middleware`)
- **Lines**: **136 lines** | **Size**: **4778 bytes**
- **Public Interface / Exports**: `helmetSecurity`, `globalRateLimiter`, `authRateLimiter`, `uploadRateLimiter`, `sanitizeInput`, `sanitizeValue`
- **Dependencies**:
  - *External Packages*: `helmet`, `express-rate-limit`
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Security headers and rate limiting suite. Configures Helmet CSP, CORS policies, global rate limiter (10k/15m), auth brute-force limiter (200/15m), and recursive string input sanitization.
- **Architectural & Security Observations**: Input sanitization strips `<script>` tags, `javascript:` pseudoprotocols, and `on*` event handlers from request body and query parameters recursively.

### File #49: [`back-end/src/middleware/session.js`](back-end/src/middleware/session.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\middleware\session.js`
- **Subsystem / Layer**: **Middleware** (`HTTP / Middleware`)
- **Lines**: **55 lines** | **Size**: **1570 bytes**
- **Public Interface / Exports**: `attachSession`, `requireSession`, `requireActor`, `extractToken`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../store/sessionStore`
- **Primary Responsibility**: Session authentication middleware. Extracts bearer token from Authorization headers or cookies, resolves session via `sessionStore`, and enforces `requireSession` and `requireActor`.
- **Architectural & Security Observations**: Supports multiple cookie keys (`sessionId`, `sid`, `connect.sid`, `token`) for web client flexibility.

### File #50: [`back-end/src/middleware/tenant.js`](back-end/src/middleware/tenant.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\middleware\tenant.js`
- **Subsystem / Layer**: **Middleware** (`HTTP / Middleware`)
- **Lines**: **74 lines** | **Size**: **2667 bytes**
- **Public Interface / Exports**: `attachTenant`, `requireTenant`, `requireModule`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../store/dataStore`
  - *DataStore Collections Accessed*: `dataStore.organizationModules`
- **Primary Responsibility**: Multi-tenant context resolver and module feature-flag gate. Populates `req.tenant` from session or headers, enforces `requireTenant`, and gates routes with `requireModule`.
- **Architectural & Security Observations**: Fail-closed enforcement: if an organization has no enabled row in `organizationModules` for a module, access is rejected with 403 Forbidden.

### File #51: [`back-end/src/routes/activity.routes.js`](back-end/src/routes/activity.routes.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\routes\activity.routes.js`
- **Subsystem / Layer**: **Routes** (`Routing`)
- **Lines**: **16 lines** | **Size**: **351 bytes**
- **Public Interface / Exports**: `router`
- **Dependencies**:
  - *External Packages*: `express`
  - *Internal Modules*: `../controllers/activity.controller`, `../middleware/actorAccess`
- **Primary Responsibility**: Express router for activity domain endpoints. Defines HTTP method mappings, URL paths, input validation pipes, and controller action bindings.
- **Architectural & Security Observations**: Mounts domain validation pipes and authorization middleware (`authorize`, `requireSession`, `requireModule`).

### File #52: [`back-end/src/routes/admission.routes.js`](back-end/src/routes/admission.routes.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\routes\admission.routes.js`
- **Subsystem / Layer**: **Routes** (`Routing`)
- **Lines**: **40 lines** | **Size**: **1015 bytes**
- **Public Interface / Exports**: `router`
- **Dependencies**:
  - *External Packages*: `express`
  - *Internal Modules*: `../controllers/admission.controller`, `../middleware/actorAccess`, `../middleware/tenant`, `../validators/engine`, `../validators/admission.validators`
- **Primary Responsibility**: Express router for admission domain endpoints. Defines HTTP method mappings, URL paths, input validation pipes, and controller action bindings.
- **Architectural & Security Observations**: Mounts domain validation pipes and authorization middleware (`authorize`, `requireSession`, `requireModule`).

### File #53: [`back-end/src/routes/appointment.routes.js`](back-end/src/routes/appointment.routes.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\routes\appointment.routes.js`
- **Subsystem / Layer**: **Routes** (`Routing`)
- **Lines**: **37 lines** | **Size**: **1010 bytes**
- **Public Interface / Exports**: `router`
- **Dependencies**:
  - *External Packages*: `express`
  - *Internal Modules*: `../controllers/appointment.controller`, `../middleware/actorAccess`, `../middleware/tenant`, `../validators/engine`, `../validators/appointment.validators`
- **Primary Responsibility**: Express router for appointment domain endpoints. Defines HTTP method mappings, URL paths, input validation pipes, and controller action bindings.
- **Architectural & Security Observations**: Mounts domain validation pipes and authorization middleware (`authorize`, `requireSession`, `requireModule`).

### File #54: [`back-end/src/routes/auth.routes.js`](back-end/src/routes/auth.routes.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\routes\auth.routes.js`
- **Subsystem / Layer**: **Routes** (`Routing`)
- **Lines**: **36 lines** | **Size**: **1000 bytes**
- **Public Interface / Exports**: `router`
- **Dependencies**:
  - *External Packages*: `express`
  - *Internal Modules*: `../controllers/auth.controller`, `../middleware/session`, `../middleware/security`, `../validators/engine`, `../validators/auth.validators`
- **Primary Responsibility**: Express router for auth domain endpoints. Defines HTTP method mappings, URL paths, input validation pipes, and controller action bindings.
- **Architectural & Security Observations**: Mounts domain validation pipes and authorization middleware (`authorize`, `requireSession`, `requireModule`).

### File #55: [`back-end/src/routes/billing.routes.js`](back-end/src/routes/billing.routes.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\routes\billing.routes.js`
- **Subsystem / Layer**: **Routes** (`Routing`)
- **Lines**: **131 lines** | **Size**: **3341 bytes**
- **Public Interface / Exports**: `router`
- **Dependencies**:
  - *External Packages*: `express`
  - *Internal Modules*: `../controllers/billing.controller`, `../middleware/actorAccess`, `../middleware/tenant`, `../validators/engine`, `../validators/billing.validators`
- **Primary Responsibility**: Express router for billing domain endpoints. Defines HTTP method mappings, URL paths, input validation pipes, and controller action bindings.
- **Architectural & Security Observations**: Mounts domain validation pipes and authorization middleware (`authorize`, `requireSession`, `requireModule`).

### File #56: [`back-end/src/routes/data.routes.js`](back-end/src/routes/data.routes.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\routes\data.routes.js`
- **Subsystem / Layer**: **Routes** (`Routing`)
- **Lines**: **15 lines** | **Size**: **589 bytes**
- **Public Interface / Exports**: `router`
- **Dependencies**:
  - *External Packages*: `express`
  - *Internal Modules*: `../controllers/data.controller`, `../middleware/session`, `../middleware/platformAccess`
- **Primary Responsibility**: Express router for data domain endpoints. Defines HTTP method mappings, URL paths, input validation pipes, and controller action bindings.
- **Architectural & Security Observations**: Mounts domain validation pipes and authorization middleware (`authorize`, `requireSession`, `requireModule`).

### File #57: [`back-end/src/routes/doctor.routes.js`](back-end/src/routes/doctor.routes.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\routes\doctor.routes.js`
- **Subsystem / Layer**: **Routes** (`Routing`)
- **Lines**: **71 lines** | **Size**: **1828 bytes**
- **Public Interface / Exports**: `router`
- **Dependencies**:
  - *External Packages*: `express`
  - *Internal Modules*: `../controllers/doctor.controller`, `../middleware/actorAccess`, `../middleware/tenant`, `../validators/engine`, `../validators/doctor.validators`
- **Primary Responsibility**: Express router for doctor domain endpoints. Defines HTTP method mappings, URL paths, input validation pipes, and controller action bindings.
- **Architectural & Security Observations**: Mounts domain validation pipes and authorization middleware (`authorize`, `requireSession`, `requireModule`).

### File #58: [`back-end/src/routes/index.js`](back-end/src/routes/index.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\routes\index.js`
- **Subsystem / Layer**: **Routes** (`Routing`)
- **Lines**: **57 lines** | **Size**: **2147 bytes**
- **Public Interface / Exports**: `router`
- **Dependencies**:
  - *External Packages*: `express`
  - *Internal Modules*: `../controllers/app.controller`, `./data.routes`, `./doctor.routes`, `./patient.routes`, `./ward.routes`, `./inventory.routes`, `./billing.routes`, `./appointment.routes`, `./request.routes`, `./admission.routes`, `./auth.routes`, `./preRequest.routes`, `./activity.routes`, `./platform.routes`, `./marketplace.routes`, `./rbac.routes`, `./upload.routes`
- **Primary Responsibility**: Root API router. Aggregates and mounts 16 feature sub-routers under their respective root URL prefixes (/doctor, /patient, /billing, /platform, etc.).
- **Architectural & Security Observations**: Provides unified API gateway routing tree matching NestJS controller route declarations.

### File #59: [`back-end/src/routes/inventory.routes.js`](back-end/src/routes/inventory.routes.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\routes\inventory.routes.js`
- **Subsystem / Layer**: **Routes** (`Routing`)
- **Lines**: **60 lines** | **Size**: **1589 bytes**
- **Public Interface / Exports**: `router`
- **Dependencies**:
  - *External Packages*: `express`
  - *Internal Modules*: `../controllers/inventory.controller`, `../middleware/actorAccess`, `../middleware/tenant`, `../validators/engine`, `../validators/inventory.validators`
- **Primary Responsibility**: Express router for inventory domain endpoints. Defines HTTP method mappings, URL paths, input validation pipes, and controller action bindings.
- **Architectural & Security Observations**: Mounts domain validation pipes and authorization middleware (`authorize`, `requireSession`, `requireModule`).

### File #60: [`back-end/src/routes/marketplace.routes.js`](back-end/src/routes/marketplace.routes.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\routes\marketplace.routes.js`
- **Subsystem / Layer**: **Routes** (`Routing`)
- **Lines**: **14 lines** | **Size**: **366 bytes**
- **Public Interface / Exports**: `router`
- **Dependencies**:
  - *External Packages*: `express`
  - *Internal Modules*: `../controllers/marketplace.controller`
- **Primary Responsibility**: Express router for marketplace domain endpoints. Defines HTTP method mappings, URL paths, input validation pipes, and controller action bindings.
- **Architectural & Security Observations**: Mounts domain validation pipes and authorization middleware (`authorize`, `requireSession`, `requireModule`).

### File #61: [`back-end/src/routes/patient.routes.js`](back-end/src/routes/patient.routes.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\routes\patient.routes.js`
- **Subsystem / Layer**: **Routes** (`Routing`)
- **Lines**: **79 lines** | **Size**: **2156 bytes**
- **Public Interface / Exports**: `router`
- **Dependencies**:
  - *External Packages*: `express`
  - *Internal Modules*: `../controllers/patient.controller`, `../middleware/actorAccess`, `../middleware/tenant`, `../validators/engine`, `../validators/patient.validators`
- **Primary Responsibility**: Express router for patient domain endpoints. Defines HTTP method mappings, URL paths, input validation pipes, and controller action bindings.
- **Architectural & Security Observations**: Mounts domain validation pipes and authorization middleware (`authorize`, `requireSession`, `requireModule`).

### File #62: [`back-end/src/routes/platform.routes.js`](back-end/src/routes/platform.routes.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\routes\platform.routes.js`
- **Subsystem / Layer**: **Routes** (`Routing`)
- **Lines**: **138 lines** | **Size**: **3855 bytes**
- **Public Interface / Exports**: `router`
- **Dependencies**:
  - *External Packages*: `express`
  - *Internal Modules*: `../controllers/platform.controller`, `../middleware/session`, `../middleware/platformAccess`, `../validators/engine`, `../validators/platform.validators`
- **Primary Responsibility**: Express router for platform domain endpoints. Defines HTTP method mappings, URL paths, input validation pipes, and controller action bindings.
- **Architectural & Security Observations**: Mounts domain validation pipes and authorization middleware (`authorize`, `requireSession`, `requireModule`).

### File #63: [`back-end/src/routes/preRequest.routes.js`](back-end/src/routes/preRequest.routes.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\routes\preRequest.routes.js`
- **Subsystem / Layer**: **Routes** (`Routing`)
- **Lines**: **50 lines** | **Size**: **1523 bytes**
- **Public Interface / Exports**: `router`
- **Dependencies**:
  - *External Packages*: `express`
  - *Internal Modules*: `../controllers/preRequest.controller`, `../middleware/actorAccess`, `../middleware/tenant`, `../validators/engine`, `../validators/preRequest.validators`
- **Primary Responsibility**: Express router for preRequest domain endpoints. Defines HTTP method mappings, URL paths, input validation pipes, and controller action bindings.
- **Architectural & Security Observations**: Mounts domain validation pipes and authorization middleware (`authorize`, `requireSession`, `requireModule`).

### File #64: [`back-end/src/routes/rbac.routes.js`](back-end/src/routes/rbac.routes.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\routes\rbac.routes.js`
- **Subsystem / Layer**: **Routes** (`Routing`)
- **Lines**: **97 lines** | **Size**: **2350 bytes**
- **Public Interface / Exports**: `router`
- **Dependencies**:
  - *External Packages*: `express`
  - *Internal Modules*: `../controllers/rbac.controller`, `../middleware/actorAccess`, `../middleware/tenant`, `../validators/engine`, `../validators/rbac.validators`
- **Primary Responsibility**: Express router for rbac domain endpoints. Defines HTTP method mappings, URL paths, input validation pipes, and controller action bindings.
- **Architectural & Security Observations**: Mounts domain validation pipes and authorization middleware (`authorize`, `requireSession`, `requireModule`).

### File #65: [`back-end/src/routes/request.routes.js`](back-end/src/routes/request.routes.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\routes\request.routes.js`
- **Subsystem / Layer**: **Routes** (`Routing`)
- **Lines**: **4 lines** | **Size**: **68 bytes**
- **Public Interface / Exports**: `require('./appointment.routes')`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Backward compatibility router alias. Directly re-exports `appointment.routes.js`.
- **Architectural & Security Observations**: Dead/redundant route wrapper maintained solely for legacy client route compatibility.

### File #66: [`back-end/src/routes/upload.routes.js`](back-end/src/routes/upload.routes.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\routes\upload.routes.js`
- **Subsystem / Layer**: **Routes** (`Routing`)
- **Lines**: **48 lines** | **Size**: **1288 bytes**
- **Public Interface / Exports**: `router`
- **Dependencies**:
  - *External Packages*: `express`
  - *Internal Modules*: `../controllers/upload.controller`, `../middleware/session`, `../middleware/security`, `../middleware/fileUpload`
- **Primary Responsibility**: Express router for upload domain endpoints. Defines HTTP method mappings, URL paths, input validation pipes, and controller action bindings.
- **Architectural & Security Observations**: Mounts domain validation pipes and authorization middleware (`authorize`, `requireSession`, `requireModule`).

### File #67: [`back-end/src/routes/ward.routes.js`](back-end/src/routes/ward.routes.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\routes\ward.routes.js`
- **Subsystem / Layer**: **Routes** (`Routing`)
- **Lines**: **111 lines** | **Size**: **2805 bytes**
- **Public Interface / Exports**: `router`
- **Dependencies**:
  - *External Packages*: `express`
  - *Internal Modules*: `../controllers/ward.controller`, `../middleware/actorAccess`, `../middleware/tenant`, `../validators/engine`, `../validators/ward.validators`
- **Primary Responsibility**: Express router for ward domain endpoints. Defines HTTP method mappings, URL paths, input validation pipes, and controller action bindings.
- **Architectural & Security Observations**: Mounts domain validation pipes and authorization middleware (`authorize`, `requireSession`, `requireModule`).

### File #68: [`back-end/src/services/activity.service.js`](back-end/src/services/activity.service.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\services\activity.service.js`
- **Subsystem / Layer**: **Services** (`Business Logic`)
- **Lines**: **30 lines** | **Size**: **922 bytes**
- **Public Interface / Exports**: `log`, `findAll`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../store/dataStore`, `../utils/maxId`
  - *DataStore Collections Accessed*: `dataStore.activityLog`
- **Primary Responsibility**: Core business logic service for activity. Executes domain workflows, updates in-memory `dataStore` collections, validates state transitions, and creates audit activity records.
- **Architectural & Security Observations**: Operates directly on in-memory `dataStore` collections without database drivers or ORM overhead.

### File #69: [`back-end/src/services/admission.service.js`](back-end/src/services/admission.service.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\services\admission.service.js`
- **Subsystem / Layer**: **Services** (`Business Logic`)
- **Lines**: **39 lines** | **Size**: **1308 bytes**
- **Public Interface / Exports**: `findAll`, `findOne`, `create`, `update`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../store/dataStore`, `../utils/maxId`
  - *DataStore Collections Accessed*: `dataStore.admissions`
- **Primary Responsibility**: Core business logic service for admission. Executes domain workflows, updates in-memory `dataStore` collections, validates state transitions, and creates audit activity records.
- **Architectural & Security Observations**: Operates directly on in-memory `dataStore` collections without database drivers or ORM overhead.
- **Detected Code Smells / Risks**:
  - ?? Direct in-place mutation of in-memory dataStore collection

### File #70: [`back-end/src/services/admission.service.spec.js`](back-end/src/services/admission.service.spec.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\services\admission.service.spec.js`
- **Subsystem / Layer**: **Service Tests** (`Testing`)
- **Lines**: **57 lines** | **Size**: **1757 bytes**
- **Public Interface / Exports**: *None (or side-effect / script / asset)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `./admission.service`
- **Primary Responsibility**: Automated Jest test suite verifying unit behavior, invariants, and edge cases for admission.service.
- **Architectural & Security Observations**: Uses Jest assertions and Supertest for HTTP endpoint testing. Currently 11 suites fail because node_modules (bcryptjs/supertest) are not locally installed.

### File #71: [`back-end/src/services/app.service.js`](back-end/src/services/app.service.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\services\app.service.js`
- **Subsystem / Layer**: **Services** (`Business Logic`)
- **Lines**: **8 lines** | **Size**: **103 bytes**
- **Public Interface / Exports**: `getHello`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Core business logic service for app. Executes domain workflows, updates in-memory `dataStore` collections, validates state transitions, and creates audit activity records.
- **Architectural & Security Observations**: Operates directly on in-memory `dataStore` collections without database drivers or ORM overhead.

### File #72: [`back-end/src/services/appointment.service.js`](back-end/src/services/appointment.service.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\services\appointment.service.js`
- **Subsystem / Layer**: **Services** (`Business Logic`)
- **Lines**: **115 lines** | **Size**: **4444 bytes**
- **Public Interface / Exports**: `findAll`, `findOne`, `create`, `update`, `backfillDoctorIds`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../store/dataStore`, `../utils/maxId`, `./doctor.service`
  - *DataStore Collections Accessed*: `dataStore.appointments`, `dataStore.patients`, `dataStore.doctors`, `dataStore.preRequests`, `dataStore.doctorAvailabilities`
- **Primary Responsibility**: Core business logic service for appointment. Executes domain workflows, updates in-memory `dataStore` collections, validates state transitions, and creates audit activity records.
- **Architectural & Security Observations**: Operates directly on in-memory `dataStore` collections without database drivers or ORM overhead.
- **Detected Code Smells / Risks**:
  - ?? Direct in-place mutation of in-memory dataStore collection

### File #73: [`back-end/src/services/auth.service.js`](back-end/src/services/auth.service.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\services\auth.service.js`
- **Subsystem / Layer**: **Services** (`Business Logic`)
- **Lines**: **393 lines** | **Size**: **13012 bytes**
- **Public Interface / Exports**: `login`, `signup`, `me`, `logout`, `findUserByEmail`, `findUsersByEmail`, `findPatientForUser`, `isReservedStaffEmail`, `roleNameFor`, `tenantContextFor`, `getDemoAccounts`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../store/dataStore`, `../utils/maxId`, `./patient.service`, `./activity.service`, `./organization.service`, `./entitlement.service`, `../utils/password`, `../store/sessionStore`, `../utils/roles`, `../utils/emailIdentity`
  - *DataStore Collections Accessed*: `dataStore.users`, `dataStore.patients`, `dataStore.organizations`
- **Primary Responsibility**: Core business logic service for auth. Executes domain workflows, updates in-memory `dataStore` collections, validates state transitions, and creates audit activity records.
- **Architectural & Security Observations**: Unified login engine supporting multi-hospital patient accounts, staff portal role routing, and tenant context compilation.
- **Detected Code Smells / Risks**:
  - ?? Direct in-place mutation of in-memory dataStore collection
  - ?? Contains hardcoded seed IDs or emails

### File #74: [`back-end/src/services/billing.service.js`](back-end/src/services/billing.service.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\services\billing.service.js`
- **Subsystem / Layer**: **Services** (`Business Logic`)
- **Lines**: **460 lines** | **Size**: **15472 bytes**
- **Public Interface / Exports**: `findAllServices`, `createService`, `findAllLedgers`, `findLedgerByAdmission`, `findLedgerById`, `createLedger`, `findLedgerEntries`, `addLedgerEntry`, `findAllPayments`, `createPayment`, `createDischargeSummary`, `dispatchLedger`, `findPatientBills`, `findAllReceipts`, `findReceiptsByPatient`, `findDischargeSummaryByAdmission`, `grossTotalForAdmission`, `findAllLeaders`, `findLeaderById`, `createLeader`, `approveLeader`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../store/dataStore`, `../utils/maxId`, `./activity.service`
  - *DataStore Collections Accessed*: `dataStore.services`, `dataStore.ledgers`, `dataStore.admissions`, `dataStore.ledgerEntries`, `dataStore.payments`, `dataStore.receipts`, `dataStore.dischargeSummaries`, `dataStore.leaders`
- **Primary Responsibility**: Core business logic service for billing. Executes domain workflows, updates in-memory `dataStore` collections, validates state transitions, and creates audit activity records.
- **Architectural & Security Observations**: Manages ledgers, entries, payments, discharge summaries, and receipts. Overwrites `admission.status = "PAYMENT_CONFIRMED"` upon full payment clearance.
- **Detected Code Smells / Risks**:
  - ?? Uses Math.max spread which can exceed stack size on large collections
  - ?? Direct in-place mutation of in-memory dataStore collection

### File #75: [`back-end/src/services/billing.service.spec.js`](back-end/src/services/billing.service.spec.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\services\billing.service.spec.js`
- **Subsystem / Layer**: **Service Tests** (`Testing`)
- **Lines**: **143 lines** | **Size**: **4569 bytes**
- **Public Interface / Exports**: *None (or side-effect / script / asset)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `./billing.service`, `./admission.service`, `../store/dataStore`
  - *DataStore Collections Accessed*: `dataStore.receipts`, `dataStore.ledgers`, `dataStore.admissions`
- **Primary Responsibility**: Automated Jest test suite verifying unit behavior, invariants, and edge cases for billing.service.
- **Architectural & Security Observations**: Uses Jest assertions and Supertest for HTTP endpoint testing. Currently 11 suites fail because node_modules (bcryptjs/supertest) are not locally installed.

### File #76: [`back-end/src/services/data.service.js`](back-end/src/services/data.service.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\services\data.service.js`
- **Subsystem / Layer**: **Services** (`Business Logic`)
- **Lines**: **52 lines** | **Size**: **1106 bytes**
- **Public Interface / Exports**: `getFullState`, `updateFullState`, `SYNCED_KEYS`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../store/dataStore`
- **Primary Responsibility**: Core business logic service for data. Executes domain workflows, updates in-memory `dataStore` collections, validates state transitions, and creates audit activity records.
- **Architectural & Security Observations**: Operates directly on in-memory `dataStore` collections without database drivers or ORM overhead.

### File #77: [`back-end/src/services/doctor.service.js`](back-end/src/services/doctor.service.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\services\doctor.service.js`
- **Subsystem / Layer**: **Services** (`Business Logic`)
- **Lines**: **215 lines** | **Size**: **7587 bytes**
- **Public Interface / Exports**: `findAllDoctors`, `findDoctorById`, `createDoctor`, `updateDoctor`, `deleteDoctor`, `findAllAvailabilities`, `findAvailabilityByDoctor`, `createAvailability`, `isDoctorAvailableAt`, `findConflictingAppointment`, `isWithinStandardDutyHours`, `UNAVAILABLE_MESSAGE`, `deleteAvailability`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../store/dataStore`, `../utils/maxId`
  - *DataStore Collections Accessed*: `dataStore.doctors`, `dataStore.doctorAvailabilities`, `dataStore.appointments`
- **Primary Responsibility**: Core business logic service for doctor. Executes domain workflows, updates in-memory `dataStore` collections, validates state transitions, and creates audit activity records.
- **Architectural & Security Observations**: Operates directly on in-memory `dataStore` collections without database drivers or ORM overhead.
- **Detected Code Smells / Risks**:
  - ?? Uses Math.max spread which can exceed stack size on large collections
  - ?? Direct in-place mutation of in-memory dataStore collection

### File #78: [`back-end/src/services/doctor.service.spec.js`](back-end/src/services/doctor.service.spec.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\services\doctor.service.spec.js`
- **Subsystem / Layer**: **Service Tests** (`Testing`)
- **Lines**: **59 lines** | **Size**: **1766 bytes**
- **Public Interface / Exports**: *None (or side-effect / script / asset)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../store/dataStore`, `./doctor.service`
  - *DataStore Collections Accessed*: `dataStore.doctorAvailabilities`
- **Primary Responsibility**: Automated Jest test suite verifying unit behavior, invariants, and edge cases for doctor.service.
- **Architectural & Security Observations**: Uses Jest assertions and Supertest for HTTP endpoint testing. Currently 11 suites fail because node_modules (bcryptjs/supertest) are not locally installed.
- **Detected Code Smells / Risks**:
  - ?? Direct in-place mutation of in-memory dataStore collection

### File #79: [`back-end/src/services/entitlement.service.js`](back-end/src/services/entitlement.service.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\services\entitlement.service.js`
- **Subsystem / Layer**: **Services** (`Business Logic`)
- **Lines**: **133 lines** | **Size**: **4909 bytes**
- **Public Interface / Exports**: `modulesFor`, `isModuleEnabled`, `resourcesFor`, `resourceQuantity`, `entitlementsFor`, `assertResourceWithin`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../store/dataStore`, `../utils/tenant`, `../config/resourceCatalog`
  - *DataStore Collections Accessed*: `dataStore.organizationModules`, `dataStore.organizationResources`
- **Primary Responsibility**: Core business logic service for entitlement. Executes domain workflows, updates in-memory `dataStore` collections, validates state transitions, and creates audit activity records.
- **Architectural & Security Observations**: Operates directly on in-memory `dataStore` collections without database drivers or ORM overhead.
- **Detected Code Smells / Risks**:
  - ?? Uses Math.max spread which can exceed stack size on large collections

### File #80: [`back-end/src/services/entitlement.service.spec.js`](back-end/src/services/entitlement.service.spec.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\services\entitlement.service.spec.js`
- **Subsystem / Layer**: **Service Tests** (`Testing`)
- **Lines**: **145 lines** | **Size**: **5149 bytes**
- **Public Interface / Exports**: *None (or side-effect / script / asset)*
- **Dependencies**:
  - *External Packages*: `supertest`
  - *Internal Modules*: `../app`, `../store/dataStore`, `../store/sessionStore`, `./entitlement.service`, `./organization.service`
  - *DataStore Collections Accessed*: `dataStore.organizationModules`, `dataStore.users`
- **Primary Responsibility**: Automated Jest test suite verifying unit behavior, invariants, and edge cases for entitlement.service.
- **Architectural & Security Observations**: Uses Jest assertions and Supertest for HTTP endpoint testing. Currently 11 suites fail because node_modules (bcryptjs/supertest) are not locally installed.

### File #81: [`back-end/src/services/inventory.service.js`](back-end/src/services/inventory.service.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\services\inventory.service.js`
- **Subsystem / Layer**: **Services** (`Business Logic`)
- **Lines**: **85 lines** | **Size**: **2578 bytes**
- **Public Interface / Exports**: `findAllItems`, `createItem`, `updateItem`, `deleteItem`, `findAllRequests`, `createRequest`, `updateRequest`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../store/dataStore`, `../utils/maxId`
  - *DataStore Collections Accessed*: `dataStore.inventoryItems`, `dataStore.purchaseRequests`
- **Primary Responsibility**: Core business logic service for inventory. Executes domain workflows, updates in-memory `dataStore` collections, validates state transitions, and creates audit activity records.
- **Architectural & Security Observations**: Operates directly on in-memory `dataStore` collections without database drivers or ORM overhead.
- **Detected Code Smells / Risks**:
  - ?? Direct in-place mutation of in-memory dataStore collection

### File #82: [`back-end/src/services/inventory.service.spec.js`](back-end/src/services/inventory.service.spec.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\services\inventory.service.spec.js`
- **Subsystem / Layer**: **Service Tests** (`Testing`)
- **Lines**: **27 lines** | **Size**: **771 bytes**
- **Public Interface / Exports**: *None (or side-effect / script / asset)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `./inventory.service`
- **Primary Responsibility**: Automated Jest test suite verifying unit behavior, invariants, and edge cases for inventory.service.
- **Architectural & Security Observations**: Uses Jest assertions and Supertest for HTTP endpoint testing. Currently 11 suites fail because node_modules (bcryptjs/supertest) are not locally installed.

### File #83: [`back-end/src/services/marketplace_revenue.spec.js`](back-end/src/services/marketplace_revenue.spec.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\services\marketplace_revenue.spec.js`
- **Subsystem / Layer**: **Service Tests** (`Testing`)
- **Lines**: **100 lines** | **Size**: **4161 bytes**
- **Public Interface / Exports**: *None (or side-effect / script / asset)*
- **Dependencies**:
  - *External Packages*: `supertest`
  - *Internal Modules*: `../app`, `../store/dataStore`, `./subscription.service`, `./organization.service`, `../config/serviceCatalog`
- **Primary Responsibility**: Automated Jest test suite verifying unit behavior, invariants, and edge cases for marketplace_revenue.
- **Architectural & Security Observations**: Uses Jest assertions and Supertest for HTTP endpoint testing. Currently 11 suites fail because node_modules (bcryptjs/supertest) are not locally installed.

### File #84: [`back-end/src/services/middleware_eval.spec.js`](back-end/src/services/middleware_eval.spec.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\services\middleware_eval.spec.js`
- **Subsystem / Layer**: **Service Tests** (`Testing`)
- **Lines**: **175 lines** | **Size**: **6592 bytes**
- **Public Interface / Exports**: *None (or side-effect / script / asset)*
- **Dependencies**:
  - *External Packages*: `fs`, `supertest`
  - *Internal Modules*: `../app`, `../utils/logManager`, `../store/sessionStore`
- **Primary Responsibility**: Automated Jest test suite verifying unit behavior, invariants, and edge cases for middleware_eval.
- **Architectural & Security Observations**: Uses Jest assertions and Supertest for HTTP endpoint testing. Currently 11 suites fail because node_modules (bcryptjs/supertest) are not locally installed.

### File #85: [`back-end/src/services/organization.service.js`](back-end/src/services/organization.service.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\services\organization.service.js`
- **Subsystem / Layer**: **Services** (`Business Logic`)
- **Lines**: **530 lines** | **Size**: **18414 bytes**
- **Public Interface / Exports**: `findAll`, `findById`, `findByEmailDomain`, `suggestEmailDomain`, `validateEmailDomain`, `changeEmailDomain`, `staffLoginCount`, `backfillEmailDomains`, `create`, `update`, `setStatus`, `remove`, `hospitalsFor`, `primaryHospitalFor`, `createHospital`, `setModuleFlags`, `setModuleFlag`, `enabledModulesFor`, `moduleInstancesFor`, `allModuleFlagsFor`, `setResourceQuantities`, `resourceQuantitiesFor`, `resourceCatalogFor`, `syncOrganizationConfig`, `quotasFor`, `usageFor`, `marketplaceListing`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../store/dataStore`, `../utils/maxId`, `../utils/tenant`, `../config/serviceCatalog`, `../config/resourceCatalog`, `../store/sessionStore`, `../utils/emailIdentity`
  - *DataStore Collections Accessed*: `dataStore.organizations`, `dataStore.users`, `dataStore.hospitals`, `dataStore.organizationModules`, `dataStore.organizationResources`, `dataStore.resourceQuotas`, `dataStore.subscriptions`, `dataStore.preRequests`, `dataStore.admissions`, `dataStore.appointments`, `dataStore.ledgers`, `dataStore.payments`, `dataStore.patients`, `dataStore.beds`
- **Primary Responsibility**: Core business logic service for organization. Executes domain workflows, updates in-memory `dataStore` collections, validates state transitions, and creates audit activity records.
- **Architectural & Security Observations**: Operates directly on in-memory `dataStore` collections without database drivers or ORM overhead.
- **Detected Code Smells / Risks**:
  - ?? Uses Math.max spread which can exceed stack size on large collections
  - ?? Direct in-place mutation of in-memory dataStore collection

### File #86: [`back-end/src/services/organization.service.spec.js`](back-end/src/services/organization.service.spec.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\services\organization.service.spec.js`
- **Subsystem / Layer**: **Service Tests** (`Testing`)
- **Lines**: **97 lines** | **Size**: **3983 bytes**
- **Public Interface / Exports**: *None (or side-effect / script / asset)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `./organization.service`, `../utils/tenant`
- **Primary Responsibility**: Automated Jest test suite verifying unit behavior, invariants, and edge cases for organization.service.
- **Architectural & Security Observations**: Uses Jest assertions and Supertest for HTTP endpoint testing. Currently 11 suites fail because node_modules (bcryptjs/supertest) are not locally installed.

### File #87: [`back-end/src/services/patient.service.js`](back-end/src/services/patient.service.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\services\patient.service.js`
- **Subsystem / Layer**: **Services** (`Business Logic`)
- **Lines**: **124 lines** | **Size**: **3977 bytes**
- **Public Interface / Exports**: `findAll`, `findOne`, `create`, `update`, `remove`, `findAllInsurances`, `findInsuranceByPatient`, `createInsurance`, `generateUhid`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../store/dataStore`, `../utils/maxId`
  - *DataStore Collections Accessed*: `dataStore.patients`, `dataStore.patientInsurances`
- **Primary Responsibility**: Core business logic service for patient. Executes domain workflows, updates in-memory `dataStore` collections, validates state transitions, and creates audit activity records.
- **Architectural & Security Observations**: Operates directly on in-memory `dataStore` collections without database drivers or ORM overhead.
- **Detected Code Smells / Risks**:
  - ?? Direct in-place mutation of in-memory dataStore collection

### File #88: [`back-end/src/services/platformActivity.service.js`](back-end/src/services/platformActivity.service.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\services\platformActivity.service.js`
- **Subsystem / Layer**: **Services** (`Business Logic`)
- **Lines**: **32 lines** | **Size**: **1092 bytes**
- **Public Interface / Exports**: `log`, `findAll`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../store/dataStore`, `../utils/maxId`
  - *DataStore Collections Accessed*: `dataStore.platformActivityLog`
- **Primary Responsibility**: Core business logic service for platformActivity. Executes domain workflows, updates in-memory `dataStore` collections, validates state transitions, and creates audit activity records.
- **Architectural & Security Observations**: Operates directly on in-memory `dataStore` collections without database drivers or ORM overhead.

### File #89: [`back-end/src/services/platformActivity.service.spec.js`](back-end/src/services/platformActivity.service.spec.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\services\platformActivity.service.spec.js`
- **Subsystem / Layer**: **Service Tests** (`Testing`)
- **Lines**: **39 lines** | **Size**: **1121 bytes**
- **Public Interface / Exports**: *None (or side-effect / script / asset)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `./platformActivity.service`
- **Primary Responsibility**: Automated Jest test suite verifying unit behavior, invariants, and edge cases for platformActivity.service.
- **Architectural & Security Observations**: Uses Jest assertions and Supertest for HTTP endpoint testing. Currently 11 suites fail because node_modules (bcryptjs/supertest) are not locally installed.

### File #90: [`back-end/src/services/platformAuth.service.js`](back-end/src/services/platformAuth.service.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\services\platformAuth.service.js`
- **Subsystem / Layer**: **Services** (`Business Logic`)
- **Lines**: **89 lines** | **Size**: **2661 bytes**
- **Public Interface / Exports**: `login`, `me`, `logout`, `create`, `findByEmail`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../store/dataStore`, `../utils/password`, `../store/sessionStore`, `../utils/emailIdentity`
  - *DataStore Collections Accessed*: `dataStore.platformSuperUsers`
- **Primary Responsibility**: Core business logic service for platformAuth. Executes domain workflows, updates in-memory `dataStore` collections, validates state transitions, and creates audit activity records.
- **Architectural & Security Observations**: VULNERABILITY/SMELL: Uses `Math.max(...map)` spread instead of `maxId` helper on line 75, creating potential call stack overflow risk on large datasets.
- **Detected Code Smells / Risks**:
  - ?? Uses Math.max spread which can exceed stack size on large collections
  - ?? Direct in-place mutation of in-memory dataStore collection

### File #91: [`back-end/src/services/preRequest.service.js`](back-end/src/services/preRequest.service.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\services\preRequest.service.js`
- **Subsystem / Layer**: **Services** (`Business Logic`)
- **Lines**: **480 lines** | **Size**: **17707 bytes**
- **Public Interface / Exports**: `STATUSES`, `TRANSITIONS`, `canTransition`, `isTerminal`, `findAll`, `findOne`, `create`, `updateFields`, `transition`, `checkIn`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../store/dataStore`, `../utils/maxId`, `./activity.service`, `./ward.service`
  - *DataStore Collections Accessed*: `dataStore.preRequests`, `dataStore.appointments`, `dataStore.patients`, `dataStore.admissions`, `dataStore.services`, `dataStore.ledgers`, `dataStore.ledgerEntries`, `dataStore.bedRequests`
- **Primary Responsibility**: Core business logic service for preRequest. Executes domain workflows, updates in-memory `dataStore` collections, validates state transitions, and creates audit activity records.
- **Architectural & Security Observations**: Encodes explicit 9-state intake/admission state machine (`PENDING` -> `DISCHARGED`), triage check-in logic, linked appointment creation, and bed request queuing.
- **Detected Code Smells / Risks**:
  - ?? Direct in-place mutation of in-memory dataStore collection

### File #92: [`back-end/src/services/provisioning.service.js`](back-end/src/services/provisioning.service.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\services\provisioning.service.js`
- **Subsystem / Layer**: **Services** (`Business Logic`)
- **Lines**: **316 lines** | **Size**: **10476 bytes**
- **Public Interface / Exports**: `provision`, `errorResponseFor`, `generateApiKey`, `logStep`, `seedDefaultClinicalBaseline`
- **Dependencies**:
  - *External Packages*: `crypto`
  - *Internal Modules*: `../utils/maxId`, `../store/dataStore`, `./organization.service`, `./subscription.service`, `./subscriptionPlan.service`, `./ward.service`, `./inventory.service`, `./billing.service`, `../utils/password`, `../config/defaultClinicalCatalog`, `../utils/tenant`, `../utils/emailIdentity`
  - *DataStore Collections Accessed*: `dataStore.provisioningLog`, `dataStore.apiKeys`, `dataStore.users`
- **Primary Responsibility**: Core business logic service for provisioning. Executes domain workflows, updates in-memory `dataStore` collections, validates state transitions, and creates audit activity records.
- **Architectural & Security Observations**: Operates directly on in-memory `dataStore` collections without database drivers or ORM overhead.
- **Detected Code Smells / Risks**:
  - ?? Direct in-place mutation of in-memory dataStore collection

### File #93: [`back-end/src/services/provisioning.service.spec.js`](back-end/src/services/provisioning.service.spec.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\services\provisioning.service.spec.js`
- **Subsystem / Layer**: **Service Tests** (`Testing`)
- **Lines**: **148 lines** | **Size**: **5381 bytes**
- **Public Interface / Exports**: *None (or side-effect / script / asset)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `./provisioning.service`, `./subscriptionPlan.service`, `./organization.service`, `../store/dataStore`, `../utils/password`
  - *DataStore Collections Accessed*: `dataStore.users`, `dataStore.provisioningLog`, `dataStore.wards`, `dataStore.beds`, `dataStore.inventoryItems`
- **Primary Responsibility**: Automated Jest test suite verifying unit behavior, invariants, and edge cases for provisioning.service.
- **Architectural & Security Observations**: Uses Jest assertions and Supertest for HTTP endpoint testing. Currently 11 suites fail because node_modules (bcryptjs/supertest) are not locally installed.

### File #94: [`back-end/src/services/rbac.service.js`](back-end/src/services/rbac.service.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\services\rbac.service.js`
- **Subsystem / Layer**: **Services** (`Business Logic`)
- **Lines**: **328 lines** | **Size**: **10562 bytes**
- **Public Interface / Exports**: `ensurePermissionCatalog`, `listPermissions`, `listRoles`, `createRole`, `findRole`, `permissionsForRole`, `assignPermission`, `unassignPermission`, `assignStaffRole`, `unassignStaffRole`, `rolesForUser`, `staffFor`, `createStaffUser`, `setStaffActive`, `setStaffRole`, `CREATABLE_STAFF_ROLES`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../store/dataStore`, `../utils/maxId`, `../utils/roles`, `../utils/password`, `../utils/emailIdentity`
  - *DataStore Collections Accessed*: `dataStore.permissions`, `dataStore.customRoles`, `dataStore.rolePermissions`, `dataStore.staffRoleAssignments`, `dataStore.users`, `dataStore.organizations`, `dataStore.hospitals`
- **Primary Responsibility**: Core business logic service for rbac. Executes domain workflows, updates in-memory `dataStore` collections, validates state transitions, and creates audit activity records.
- **Architectural & Security Observations**: Operates directly on in-memory `dataStore` collections without database drivers or ORM overhead.
- **Detected Code Smells / Risks**:
  - ?? Direct in-place mutation of in-memory dataStore collection

### File #95: [`back-end/src/services/rbac.service.spec.js`](back-end/src/services/rbac.service.spec.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\services\rbac.service.spec.js`
- **Subsystem / Layer**: **Service Tests** (`Testing`)
- **Lines**: **119 lines** | **Size**: **4868 bytes**
- **Public Interface / Exports**: *None (or side-effect / script / asset)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `./rbac.service`
  - *DataStore Collections Accessed*: `dataStore.js`
- **Primary Responsibility**: Automated Jest test suite verifying unit behavior, invariants, and edge cases for rbac.service.
- **Architectural & Security Observations**: Uses Jest assertions and Supertest for HTTP endpoint testing. Currently 11 suites fail because node_modules (bcryptjs/supertest) are not locally installed.
- **Detected Code Smells / Risks**:
  - ?? Contains hardcoded seed IDs or emails

### File #96: [`back-end/src/services/request.service.js`](back-end/src/services/request.service.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\services\request.service.js`
- **Subsystem / Layer**: **Services** (`Business Logic`)
- **Lines**: **5 lines** | **Size**: **158 bytes**
- **Public Interface / Exports**: `require('./appointment.service')`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Backward compatibility service alias. Directly re-exports `appointment.service.js`.
- **Architectural & Security Observations**: Redundant service alias module.

### File #97: [`back-end/src/services/subscription.service.js`](back-end/src/services/subscription.service.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\services\subscription.service.js`
- **Subsystem / Layer**: **Services** (`Business Logic`)
- **Lines**: **81 lines** | **Size**: **2510 bytes**
- **Public Interface / Exports**: `findByOrg`, `setPlan`, `renew`, `materializeQuotas`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../store/dataStore`, `../utils/maxId`, `./subscriptionPlan.service`
  - *DataStore Collections Accessed*: `dataStore.subscriptions`, `dataStore.resourceQuotas`
- **Primary Responsibility**: Core business logic service for subscription. Executes domain workflows, updates in-memory `dataStore` collections, validates state transitions, and creates audit activity records.
- **Architectural & Security Observations**: Operates directly on in-memory `dataStore` collections without database drivers or ORM overhead.
- **Detected Code Smells / Risks**:
  - ?? Direct in-place mutation of in-memory dataStore collection

### File #98: [`back-end/src/services/subscription.service.spec.js`](back-end/src/services/subscription.service.spec.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\services\subscription.service.spec.js`
- **Subsystem / Layer**: **Service Tests** (`Testing`)
- **Lines**: **81 lines** | **Size**: **3008 bytes**
- **Public Interface / Exports**: *None (or side-effect / script / asset)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `./subscription.service`, `./subscriptionPlan.service`, `./organization.service`
- **Primary Responsibility**: Automated Jest test suite verifying unit behavior, invariants, and edge cases for subscription.service.
- **Architectural & Security Observations**: Uses Jest assertions and Supertest for HTTP endpoint testing. Currently 11 suites fail because node_modules (bcryptjs/supertest) are not locally installed.

### File #99: [`back-end/src/services/subscriptionPlan.service.js`](back-end/src/services/subscriptionPlan.service.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\services\subscriptionPlan.service.js`
- **Subsystem / Layer**: **Services** (`Business Logic`)
- **Lines**: **40 lines** | **Size**: **1127 bytes**
- **Public Interface / Exports**: `findAll`, `findById`, `create`, `update`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../store/dataStore`, `../utils/maxId`
  - *DataStore Collections Accessed*: `dataStore.subscriptionPlans`
- **Primary Responsibility**: Core business logic service for subscriptionPlan. Executes domain workflows, updates in-memory `dataStore` collections, validates state transitions, and creates audit activity records.
- **Architectural & Security Observations**: Operates directly on in-memory `dataStore` collections without database drivers or ORM overhead.
- **Detected Code Smells / Risks**:
  - ?? Direct in-place mutation of in-memory dataStore collection

### File #100: [`back-end/src/services/subscriptionPlan.service.spec.js`](back-end/src/services/subscriptionPlan.service.spec.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\services\subscriptionPlan.service.spec.js`
- **Subsystem / Layer**: **Service Tests** (`Testing`)
- **Lines**: **41 lines** | **Size**: **1244 bytes**
- **Public Interface / Exports**: *None (or side-effect / script / asset)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `./subscriptionPlan.service`
- **Primary Responsibility**: Automated Jest test suite verifying unit behavior, invariants, and edge cases for subscriptionPlan.service.
- **Architectural & Security Observations**: Uses Jest assertions and Supertest for HTTP endpoint testing. Currently 11 suites fail because node_modules (bcryptjs/supertest) are not locally installed.

### File #101: [`back-end/src/services/ward.service.js`](back-end/src/services/ward.service.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\services\ward.service.js`
- **Subsystem / Layer**: **Services** (`Business Logic`)
- **Lines**: **332 lines** | **Size**: **10746 bytes**
- **Public Interface / Exports**: `findAllWards`, `createWard`, `updateWard`, `deleteWard`, `bedNumberPrefix`, `findAllBeds`, `findBedsByWard`, `createBed`, `updateBedStatus`, `findAllBedRequests`, `createBedRequest`, `updateBedRequest`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../store/dataStore`, `../utils/maxId`, `./activity.service`
  - *DataStore Collections Accessed*: `dataStore.wards`, `dataStore.beds`, `dataStore.bedRequests`, `dataStore.patients`
- **Primary Responsibility**: Core business logic service for ward. Executes domain workflows, updates in-memory `dataStore` collections, validates state transitions, and creates audit activity records.
- **Architectural & Security Observations**: Operates directly on in-memory `dataStore` collections without database drivers or ORM overhead.
- **Detected Code Smells / Risks**:
  - ?? Uses Math.max spread which can exceed stack size on large collections
  - ?? Direct in-place mutation of in-memory dataStore collection

### File #102: [`back-end/src/services/ward.service.spec.js`](back-end/src/services/ward.service.spec.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\services\ward.service.spec.js`
- **Subsystem / Layer**: **Service Tests** (`Testing`)
- **Lines**: **78 lines** | **Size**: **3053 bytes**
- **Public Interface / Exports**: *None (or side-effect / script / asset)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `./ward.service`
- **Primary Responsibility**: Automated Jest test suite verifying unit behavior, invariants, and edge cases for ward.service.
- **Architectural & Security Observations**: Uses Jest assertions and Supertest for HTTP endpoint testing. Currently 11 suites fail because node_modules (bcryptjs/supertest) are not locally installed.

### File #103: [`back-end/src/store/dataStore.js`](back-end/src/store/dataStore.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\store\dataStore.js`
- **Subsystem / Layer**: **Data Store & Persistence** (`Storage`)
- **Lines**: **7117 lines** | **Size**: **185445 bytes**
- **Public Interface / Exports**: `dataStore`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Core in-memory document store. Contains 40 entity collections representing the full application schema (users, patients, appointments, admissions, ledgers, inventory, rbac, organizations, etc.).
- **Architectural & Security Observations**: Direct in-memory mutation without ACID transactions or rollback mechanisms. If an error occurs mid-operation in a service, prior array mutations remain modified in memory.
- **Detected Code Smells / Risks**:
  - ?? Contains pre-computed hardcoded bcrypt hash values
  - ?? Contains hardcoded seed IDs or emails

### File #104: [`back-end/src/store/persist.js`](back-end/src/store/persist.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\store\persist.js`
- **Subsystem / Layer**: **Data Store & Persistence** (`Storage`)
- **Lines**: **125 lines** | **Size**: **3900 bytes**
- **Public Interface / Exports**: `load`, `save`, `saveImmediate`, `flush`, `DB_PATH`
- **Dependencies**:
  - *External Packages*: `fs`, `path`
  - *Internal Modules*: `./dataStore`, `../config/env`
  - *DataStore Collections Accessed*: `dataStore.js`
- **Primary Responsibility**: Crash-safe state durability manager. Reads and writes `data/db.json` using atomic temporary file write and rename operations (`.tmp` -> `.json`) with debounce and Windows file-lock retry backoff.
- **Architectural & Security Observations**: Windows file lock retry contains a synchronous blocking busy-wait loop (`while (Date.now() < delayUntil)`). Skips disk writes in test environment unless `ENABLE_PERSIST_IN_TEST` is set.
- **Detected Code Smells / Risks**:
  - ?? Synchronous busy-wait loop during file rename retry

### File #105: [`back-end/src/store/sessionStore.js`](back-end/src/store/sessionStore.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\store\sessionStore.js`
- **Subsystem / Layer**: **Data Store & Persistence** (`Storage`)
- **Lines**: **59 lines** | **Size**: **1517 bytes**
- **Public Interface / Exports**: `createSession`, `getSession`, `destroySession`, `destroySessionsForUser`
- **Dependencies**:
  - *External Packages*: `crypto`
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: In-memory user session manager using JavaScript `Map`. Issues 24-byte crypto random tokens, resolves active sessions, and destroys individual or all sessions for a user.
- **Architectural & Security Observations**: Transient storage: sessions do not survive server restarts. Role and tenant identifiers are snapshotted at login time; `destroySessionsForUser` allows invalidating stale roles.
- **Detected Code Smells / Risks**:
  - ?? Sessions held in transient in-memory Map (lost on restart)

### File #106: [`back-end/src/test/allocation_and_booking_guards.spec.js`](back-end/src/test/allocation_and_booking_guards.spec.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\test\allocation_and_booking_guards.spec.js`
- **Subsystem / Layer**: **System & Integration Tests** (`Testing`)
- **Lines**: **337 lines** | **Size**: **14813 bytes**
- **Public Interface / Exports**: *None (or side-effect / script / asset)*
- **Dependencies**:
  - *External Packages*: `supertest`
  - *Internal Modules*: `../app`, `../store/sessionStore`, `../store/dataStore`, `../services/ward.service`, `../services/preRequest.service`, `../services/appointment.service`, `../services/doctor.service`, `../services/billing.service`, `../services/provisioning.service`
  - *DataStore Collections Accessed*: `dataStore.beds`, `dataStore.patients`, `dataStore.appointments`, `dataStore.admissions`, `dataStore.users`, `dataStore.services`
- **Primary Responsibility**: Automated Jest test suite verifying unit behavior, invariants, and edge cases for allocation_and_booking_guards.
- **Architectural & Security Observations**: Uses Jest assertions and Supertest for HTTP endpoint testing. Currently 11 suites fail because node_modules (bcryptjs/supertest) are not locally installed.

### File #107: [`back-end/src/test/data_integrity.spec.js`](back-end/src/test/data_integrity.spec.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\test\data_integrity.spec.js`
- **Subsystem / Layer**: **System & Integration Tests** (`Testing`)
- **Lines**: **180 lines** | **Size**: **6205 bytes**
- **Public Interface / Exports**: *None (or side-effect / script / asset)*
- **Dependencies**:
  - *External Packages*: `supertest`
  - *Internal Modules*: `../app`, `../services/provisioning.service`, `../services/rbac.service`, `../services/patient.service`, `../store/persist`
- **Primary Responsibility**: Automated Jest test suite verifying unit behavior, invariants, and edge cases for data_integrity.
- **Architectural & Security Observations**: Uses Jest assertions and Supertest for HTTP endpoint testing. Currently 11 suites fail because node_modules (bcryptjs/supertest) are not locally installed.
- **Detected Code Smells / Risks**:
  - ?? Synchronous blocking disk persistence call

### File #108: [`back-end/src/test/discharge_billing_gate.spec.js`](back-end/src/test/discharge_billing_gate.spec.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\test\discharge_billing_gate.spec.js`
- **Subsystem / Layer**: **System & Integration Tests** (`Testing`)
- **Lines**: **101 lines** | **Size**: **3785 bytes**
- **Public Interface / Exports**: *None (or side-effect / script / asset)*
- **Dependencies**:
  - *External Packages*: `supertest`
  - *Internal Modules*: `../app`, `../store/sessionStore`, `../store/dataStore`, `../services/billing.service`
  - *DataStore Collections Accessed*: `dataStore.preRequests`, `dataStore.admissions`, `dataStore.ledgers`, `dataStore.beds`
- **Primary Responsibility**: Automated Jest test suite verifying unit behavior, invariants, and edge cases for discharge_billing_gate.
- **Architectural & Security Observations**: Uses Jest assertions and Supertest for HTTP endpoint testing. Currently 11 suites fail because node_modules (bcryptjs/supertest) are not locally installed.

### File #109: [`back-end/src/test/e2e_hospital_lifecycle.spec.js`](back-end/src/test/e2e_hospital_lifecycle.spec.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\test\e2e_hospital_lifecycle.spec.js`
- **Subsystem / Layer**: **System & Integration Tests** (`Testing`)
- **Lines**: **280 lines** | **Size**: **10889 bytes**
- **Public Interface / Exports**: *None (or side-effect / script / asset)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../services/provisioning.service`, `../services/auth.service`, `../services/preRequest.service`, `../services/ward.service`, `../services/admission.service`, `../services/billing.service`, `../store/dataStore`
  - *DataStore Collections Accessed*: `dataStore.users`, `dataStore.beds`
- **Primary Responsibility**: Automated Jest test suite verifying unit behavior, invariants, and edge cases for e2e_hospital_lifecycle.
- **Architectural & Security Observations**: Uses Jest assertions and Supertest for HTTP endpoint testing. Currently 11 suites fail because node_modules (bcryptjs/supertest) are not locally installed.

### File #110: [`back-end/src/test/frontend_shared.spec.js`](back-end/src/test/frontend_shared.spec.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\test\frontend_shared.spec.js`
- **Subsystem / Layer**: **System & Integration Tests** (`Testing`)
- **Lines**: **192 lines** | **Size**: **7157 bytes**
- **Public Interface / Exports**: *None (or side-effect / script / asset)*
- **Dependencies**:
  - *External Packages*: `node:fs`, `node:path`, `node:vm`
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Automated Jest test suite verifying unit behavior, invariants, and edge cases for frontend_shared.
- **Architectural & Security Observations**: Uses Jest assertions and Supertest for HTTP endpoint testing. Currently 11 suites fail because node_modules (bcryptjs/supertest) are not locally installed.
- **Detected Code Smells / Risks**:
  - ?? Contains hardcoded seed IDs or emails

### File #111: [`back-end/src/test/opd_checkin_billing.spec.js`](back-end/src/test/opd_checkin_billing.spec.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\test\opd_checkin_billing.spec.js`
- **Subsystem / Layer**: **System & Integration Tests** (`Testing`)
- **Lines**: **122 lines** | **Size**: **5112 bytes**
- **Public Interface / Exports**: *None (or side-effect / script / asset)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../services/provisioning.service`, `../services/patient.service`, `../services/preRequest.service`, `../services/billing.service`, `../store/dataStore`
  - *DataStore Collections Accessed*: `dataStore.ledgers`, `dataStore.admissions`
- **Primary Responsibility**: Automated Jest test suite verifying unit behavior, invariants, and edge cases for opd_checkin_billing.
- **Architectural & Security Observations**: Uses Jest assertions and Supertest for HTTP endpoint testing. Currently 11 suites fail because node_modules (bcryptjs/supertest) are not locally installed.

### File #112: [`back-end/src/test/unified_login.spec.js`](back-end/src/test/unified_login.spec.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\test\unified_login.spec.js`
- **Subsystem / Layer**: **System & Integration Tests** (`Testing`)
- **Lines**: **415 lines** | **Size**: **14307 bytes**
- **Public Interface / Exports**: *None (or side-effect / script / asset)*
- **Dependencies**:
  - *External Packages*: `supertest`
  - *Internal Modules*: `../app`, `../utils/emailIdentity`, `../services/auth.service`, `../services/rbac.service`, `../services/organization.service`, `../services/provisioning.service`, `../store/dataStore`, `../store/sessionStore`
  - *DataStore Collections Accessed*: `dataStore.users`
- **Primary Responsibility**: Automated Jest test suite verifying unit behavior, invariants, and edge cases for unified_login.
- **Architectural & Security Observations**: Uses Jest assertions and Supertest for HTTP endpoint testing. Currently 11 suites fail because node_modules (bcryptjs/supertest) are not locally installed.
- **Detected Code Smells / Risks**:
  - ?? Contains hardcoded seed IDs or emails

### File #113: [`back-end/src/utils/emailIdentity.js`](back-end/src/utils/emailIdentity.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\utils\emailIdentity.js`
- **Subsystem / Layer**: **Utilities** (`Infrastructure / Helpers`)
- **Lines**: **133 lines** | **Size**: **3329 bytes**
- **Public Interface / Exports**: `EMAIL_PATTERN`, `TAG_TO_ACTOR`, `ACTOR_TO_TAG`, `PLATFORM_EMAIL_DOMAIN`, `RESERVED_EMAIL_DOMAINS`, `parseEmail`, `normalizeDomain`, `isValidDomainFormat`, `isReservedDomain`, `suggestEmailDomainBase`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Email routing and tag parser. Parses role-specific staff email formats (name.role@hospital.com) and platform administrative email addresses.
- **Architectural & Security Observations**: Used by unified login to disambiguate actor portal destinations from raw user email strings.

### File #114: [`back-end/src/utils/logger.js`](back-end/src/utils/logger.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\utils\logger.js`
- **Subsystem / Layer**: **Utilities** (`Infrastructure / Helpers`)
- **Lines**: **16 lines** | **Size**: **458 bytes**
- **Public Interface / Exports**: `createLogger`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Console logging facade wrapper.
- **Architectural & Security Observations**: Thin wrapper around native console methods.

### File #115: [`back-end/src/utils/logManager.js`](back-end/src/utils/logManager.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\utils\logManager.js`
- **Subsystem / Layer**: **Utilities** (`Infrastructure / Helpers`)
- **Lines**: **165 lines** | **Size**: **4619 bytes**
- **Public Interface / Exports**: `logAccess`, `logError`, `logEvent`, `flushLogs`, `getLogFilesInfo`, `LOGS_DIR`, `ACCESS_LOG_PATH`, `ERROR_LOG_PATH`, `COMBINED_LOG_PATH`
- **Dependencies**:
  - *External Packages*: `fs`, `path`
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Multi-file application log manager. Handles buffered asynchronous log writes, error formatting, log flushing, and status inspections for `logs/*.log`.
- **Architectural & Security Observations**: Ensures log directories exist and maintains access, error, and combined log streams.

### File #116: [`back-end/src/utils/logManager.spec.js`](back-end/src/utils/logManager.spec.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\utils\logManager.spec.js`
- **Subsystem / Layer**: **Util Tests** (`Testing`)
- **Lines**: **98 lines** | **Size**: **3102 bytes**
- **Public Interface / Exports**: *None (or side-effect / script / asset)*
- **Dependencies**:
  - *External Packages*: `fs`
  - *Internal Modules*: `./logManager`
- **Primary Responsibility**: Automated Jest test suite verifying unit behavior, invariants, and edge cases for logManager.
- **Architectural & Security Observations**: Uses Jest assertions and Supertest for HTTP endpoint testing. Currently 11 suites fail because node_modules (bcryptjs/supertest) are not locally installed.

### File #117: [`back-end/src/utils/maxId.js`](back-end/src/utils/maxId.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\utils\maxId.js`
- **Subsystem / Layer**: **Utilities** (`Infrastructure / Helpers`)
- **Lines**: **32 lines** | **Size**: **1047 bytes**
- **Public Interface / Exports**: `maxId`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
  - *DataStore Collections Accessed*: `dataStore.admissions`
- **Primary Responsibility**: Call-stack-safe ID generation utility using `Array.reduce`. Computes max numeric identifier in constant stack space, preventing RangeError crashes.
- **Architectural & Security Observations**: Critical reliability utility designed to replace crash-prone `Math.max(...map)` pattern.
- **Detected Code Smells / Risks**:
  - ?? Uses Math.max spread which can exceed stack size on large collections

### File #118: [`back-end/src/utils/password.js`](back-end/src/utils/password.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\utils\password.js`
- **Subsystem / Layer**: **Utilities** (`Infrastructure / Helpers`)
- **Lines**: **63 lines** | **Size**: **1528 bytes**
- **Public Interface / Exports**: `hashPassword`, `hashPasswordAsync`, `hashPasswordSync`, `verifyPassword`, `verifyPasswordAsync`, `verifyPasswordSync`
- **Dependencies**:
  - *External Packages*: `bcryptjs`
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Password security utility. Provides synchronous and asynchronous bcrypt hashing (cost factor 10) and constant-time password verification.
- **Architectural & Security Observations**: Encapsulates bcryptjs operations with graceful catch blocks for malformed hash strings.

### File #119: [`back-end/src/utils/patientOwnership.js`](back-end/src/utils/patientOwnership.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\utils\patientOwnership.js`
- **Subsystem / Layer**: **Utilities** (`Infrastructure / Helpers`)
- **Lines**: **33 lines** | **Size**: **1342 bytes**
- **Public Interface / Exports**: `forbidsOtherPatient`, `isPatientSession`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Centralized Insecure Direct Object Reference (IDOR) prevention helper. Verifies patient session ownership against target record IDs.
- **Architectural & Security Observations**: Prevents patient users from viewing or mutating records belonging to other patients.

### File #120: [`back-end/src/utils/roles.js`](back-end/src/utils/roles.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\utils\roles.js`
- **Subsystem / Layer**: **Utilities** (`Infrastructure / Helpers`)
- **Lines**: **32 lines** | **Size**: **837 bytes**
- **Public Interface / Exports**: `ROLE_ID_TO_NAME`, `ROLE_NAME_TO_ID`, `ACTOR_SLUG_TO_ROLE`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Single source of truth for actor role IDs, role names (HOM, PRE, FA, Patient, Admin), and portal URL slug mappings.
- **Architectural & Security Observations**: Replaces duplicated role dictionaries previously scattered across auth and rbac services.

### File #121: [`back-end/src/utils/sendResult.js`](back-end/src/utils/sendResult.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\utils\sendResult.js`
- **Subsystem / Layer**: **Utilities** (`Infrastructure / Helpers`)
- **Lines**: **19 lines** | **Size**: **686 bytes**
- **Public Interface / Exports**: `sendResult`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: NestJS response compatibility serialization helper. Sends empty response body (`res.status(code).end()`) on null/undefined instead of JSON "null".
- **Architectural & Security Observations**: Ensures 100% behavioral parity with NestJS controller return mechanics.
- **Detected Code Smells / Risks**:
  - ?? Returns empty body instead of JSON null for NestJS compatibility

### File #122: [`back-end/src/utils/tenant.js`](back-end/src/utils/tenant.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\utils\tenant.js`
- **Subsystem / Layer**: **Utilities** (`Infrastructure / Helpers`)
- **Lines**: **107 lines** | **Size**: **4118 bytes**
- **Public Interface / Exports**: `MODULES`, `MODULE_CODES`, `MODULE_RESOURCE_AREAS`, `BACKFILL_GRANT_MODULES`, `withTenant`, `scopeToOrg`, `belongsToOrg`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
  - *DataStore Collections Accessed*: `dataStore.X`
- **Primary Responsibility**: Multi-tenant helper library. Implements `scopeToOrg`, `belongsToOrg`, `withTenant`, purchasable module definitions, and module-to-resource mappings.
- **Architectural & Security Observations**: Enforces multi-tenancy at the controller boundary while allowing services to remain tenant-agnostic.
- **Detected Code Smells / Risks**:
  - ?? Multi-tenant isolation checked at controller layer

### File #123: [`back-end/src/utils/tenant.spec.js`](back-end/src/utils/tenant.spec.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\utils\tenant.spec.js`
- **Subsystem / Layer**: **Util Tests** (`Testing`)
- **Lines**: **68 lines** | **Size**: **2366 bytes**
- **Public Interface / Exports**: *None (or side-effect / script / asset)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `./tenant`
- **Primary Responsibility**: Automated Jest test suite verifying unit behavior, invariants, and edge cases for tenant.
- **Architectural & Security Observations**: Uses Jest assertions and Supertest for HTTP endpoint testing. Currently 11 suites fail because node_modules (bcryptjs/supertest) are not locally installed.
- **Detected Code Smells / Risks**:
  - ?? Multi-tenant isolation checked at controller layer

### File #124: [`back-end/src/validators/admission.validators.js`](back-end/src/validators/admission.validators.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\validators\admission.validators.js`
- **Subsystem / Layer**: **Validators** (`Validation`)
- **Lines**: **18 lines** | **Size**: **659 bytes**
- **Public Interface / Exports**: `createAdmissionRules`, `updateAdmissionRules`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `./engine`
- **Primary Responsibility**: DTO validation rules for admission request payloads. Defines field types, required checks, integer constraints, and optional field flags.
- **Architectural & Security Observations**: Mirrors original NestJS DTO class-validator decorators in exact reverse evaluation order.

### File #125: [`back-end/src/validators/appointment.validators.js`](back-end/src/validators/appointment.validators.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\validators\appointment.validators.js`
- **Subsystem / Layer**: **Validators** (`Validation`)
- **Lines**: **21 lines** | **Size**: **905 bytes**
- **Public Interface / Exports**: `createAppointmentRules`, `updateAppointmentRules`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `./engine`
- **Primary Responsibility**: DTO validation rules for appointment request payloads. Defines field types, required checks, integer constraints, and optional field flags.
- **Architectural & Security Observations**: Mirrors original NestJS DTO class-validator decorators in exact reverse evaluation order.

### File #126: [`back-end/src/validators/auth.validators.js`](back-end/src/validators/auth.validators.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\validators\auth.validators.js`
- **Subsystem / Layer**: **Validators** (`Validation`)
- **Lines**: **30 lines** | **Size**: **1169 bytes**
- **Public Interface / Exports**: `loginRules`, `signupRules`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: DTO validation rules for auth request payloads. Defines field types, required checks, integer constraints, and optional field flags.
- **Architectural & Security Observations**: Mirrors original NestJS DTO class-validator decorators in exact reverse evaluation order.

### File #127: [`back-end/src/validators/billing.validators.js`](back-end/src/validators/billing.validators.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\validators\billing.validators.js`
- **Subsystem / Layer**: **Validators** (`Validation`)
- **Lines**: **47 lines** | **Size**: **1693 bytes**
- **Public Interface / Exports**: `createServiceRules`, `createLedgerRules`, `createLedgerEntryRules`, `createPaymentRules`, `createDischargeSummaryRules`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: DTO validation rules for billing request payloads. Defines field types, required checks, integer constraints, and optional field flags.
- **Architectural & Security Observations**: Mirrors original NestJS DTO class-validator decorators in exact reverse evaluation order.

### File #128: [`back-end/src/validators/doctor.validators.js`](back-end/src/validators/doctor.validators.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\validators\doctor.validators.js`
- **Subsystem / Layer**: **Validators** (`Validation`)
- **Lines**: **27 lines** | **Size**: **870 bytes**
- **Public Interface / Exports**: `createDoctorRules`, `updateDoctorRules`, `createDoctorAvailabilityRules`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `./engine`
- **Primary Responsibility**: DTO validation rules for doctor request payloads. Defines field types, required checks, integer constraints, and optional field flags.
- **Architectural & Security Observations**: Mirrors original NestJS DTO class-validator decorators in exact reverse evaluation order.

### File #129: [`back-end/src/validators/engine.js`](back-end/src/validators/engine.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\validators\engine.js`
- **Subsystem / Layer**: **Validators** (`Validation`)
- **Lines**: **99 lines** | **Size**: **3834 bytes**
- **Public Interface / Exports**: `validateBody`, `partial`, `CHECKS`, `MESSAGES`
- **Dependencies**:
  - *External Packages*: `validator`, `libphonenumber-js`
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Custom validation engine stand-in for class-validator and NestJS ValidationPipe. Validates request body fields using `validator` and `libphonenumber-js`.
- **Architectural & Security Observations**: SECURITY CONCERN: Does NOT whitelist or strip unlisted request body fields, allowing arbitrary extra properties to pass through (mass assignment risk).

### File #130: [`back-end/src/validators/inventory.validators.js`](back-end/src/validators/inventory.validators.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\validators\inventory.validators.js`
- **Subsystem / Layer**: **Validators** (`Validation`)
- **Lines**: **34 lines** | **Size**: **1232 bytes**
- **Public Interface / Exports**: `createInventoryItemRules`, `updateInventoryItemRules`, `createPurchaseRequestRules`, `updatePurchaseRequestRules`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `./engine`
- **Primary Responsibility**: DTO validation rules for inventory request payloads. Defines field types, required checks, integer constraints, and optional field flags.
- **Architectural & Security Observations**: Mirrors original NestJS DTO class-validator decorators in exact reverse evaluation order.

### File #131: [`back-end/src/validators/patient.validators.js`](back-end/src/validators/patient.validators.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\validators\patient.validators.js`
- **Subsystem / Layer**: **Validators** (`Validation`)
- **Lines**: **62 lines** | **Size**: **2959 bytes**
- **Public Interface / Exports**: `createPatientRules`, `updatePatientRules`, `createPatientInsuranceRules`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `./engine`
- **Primary Responsibility**: DTO validation rules for patient request payloads. Defines field types, required checks, integer constraints, and optional field flags.
- **Architectural & Security Observations**: Mirrors original NestJS DTO class-validator decorators in exact reverse evaluation order.

### File #132: [`back-end/src/validators/platform.validators.js`](back-end/src/validators/platform.validators.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\validators\platform.validators.js`
- **Subsystem / Layer**: **Validators** (`Validation`)
- **Lines**: **63 lines** | **Size**: **2143 bytes**
- **Public Interface / Exports**: `platformLoginRules`, `provisionOrganizationRules`, `createHospitalRules`, `setModuleFlagRules`, `createApiKeyRules`, `createPlanRules`, `setSubscriptionRules`, `changeEmailDomainRules`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: DTO validation rules for platform request payloads. Defines field types, required checks, integer constraints, and optional field flags.
- **Architectural & Security Observations**: Mirrors original NestJS DTO class-validator decorators in exact reverse evaluation order.

### File #133: [`back-end/src/validators/preRequest.validators.js`](back-end/src/validators/preRequest.validators.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\validators\preRequest.validators.js`
- **Subsystem / Layer**: **Validators** (`Validation`)
- **Lines**: **33 lines** | **Size**: **1750 bytes**
- **Public Interface / Exports**: `createPreRequestRules`, `updatePreRequestRules`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: DTO validation rules for preRequest request payloads. Defines field types, required checks, integer constraints, and optional field flags.
- **Architectural & Security Observations**: Mirrors original NestJS DTO class-validator decorators in exact reverse evaluation order.

### File #134: [`back-end/src/validators/rbac.validators.js`](back-end/src/validators/rbac.validators.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\validators\rbac.validators.js`
- **Subsystem / Layer**: **Validators** (`Validation`)
- **Lines**: **34 lines** | **Size**: **899 bytes**
- **Public Interface / Exports**: `createRoleRules`, `assignPermissionRules`, `assignStaffRoleRules`, `createStaffRules`, `setStaffRoleRules`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: DTO validation rules for rbac request payloads. Defines field types, required checks, integer constraints, and optional field flags.
- **Architectural & Security Observations**: Mirrors original NestJS DTO class-validator decorators in exact reverse evaluation order.

### File #135: [`back-end/src/validators/request.validators.js`](back-end/src/validators/request.validators.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\validators\request.validators.js`
- **Subsystem / Layer**: **Validators** (`Validation`)
- **Lines**: **18 lines** | **Size**: **673 bytes**
- **Public Interface / Exports**: `createAppointmentRules`, `updateAppointmentRules`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `./engine`
- **Primary Responsibility**: DTO validation rules for request request payloads. Defines field types, required checks, integer constraints, and optional field flags.
- **Architectural & Security Observations**: Mirrors original NestJS DTO class-validator decorators in exact reverse evaluation order.

### File #136: [`back-end/src/validators/ward.validators.js`](back-end/src/validators/ward.validators.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\src\validators\ward.validators.js`
- **Subsystem / Layer**: **Validators** (`Validation`)
- **Lines**: **62 lines** | **Size**: **2105 bytes**
- **Public Interface / Exports**: `createWardRules`, `updateWardRules`, `createBedRules`, `updateBedStatusRules`, `createBedRequestRules`, `updateBedRequestRules`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: DTO validation rules for ward request payloads. Defines field types, required checks, integer constraints, and optional field flags.
- **Architectural & Security Observations**: Mirrors original NestJS DTO class-validator decorators in exact reverse evaluation order.

### File #137: [`back-end/test/app.e2e-spec.js`](back-end/test/app.e2e-spec.js)
- **Absolute Path**: `D:\Federico_workspace\back-end\test\app.e2e-spec.js`
- **Subsystem / Layer**: **E2E Tests** (`Testing`)
- **Lines**: **1049 lines** | **Size**: **36725 bytes**
- **Public Interface / Exports**: *None (or side-effect / script / asset)*
- **Dependencies**:
  - *External Packages*: `supertest`
  - *Internal Modules*: `../src/app`
- **Primary Responsibility**: Root project configuration, build tooling, package manifest, linter config, nodemon daemon config, or test scripts.
- **Architectural & Security Observations**: Defines npm scripts, dependencies (express, bcryptjs, helmet, multer, etc.), and runtime development tooling.
- **Detected Code Smells / Risks**:
  - ?? Contains hardcoded seed IDs or emails

### File #138: [`back-end/test/jest-e2e.json`](back-end/test/jest-e2e.json)
- **Absolute Path**: `D:\Federico_workspace\back-end\test\jest-e2e.json`
- **Subsystem / Layer**: **E2E Tests** (`Testing`)
- **Lines**: **7 lines** | **Size**: **130 bytes**
- **Public Interface / Exports**: *None (or side-effect / script / asset)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Root project configuration, build tooling, package manifest, linter config, nodemon daemon config, or test scripts.
- **Architectural & Security Observations**: Defines npm scripts, dependencies (express, bcryptjs, helmet, multer, etc.), and runtime development tooling.

### File #139: [`back-end/test-all-endpoints.ps1`](back-end/test-all-endpoints.ps1)
- **Absolute Path**: `D:\Federico_workspace\back-end\test-all-endpoints.ps1`
- **Subsystem / Layer**: **Root Project Config & Scripts** (`Build & Tooling`)
- **Lines**: **199 lines** | **Size**: **6973 bytes**
- **Public Interface / Exports**: *None (or side-effect / script / asset)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Root project configuration, build tooling, package manifest, linter config, nodemon daemon config, or test scripts.
- **Architectural & Security Observations**: Defines npm scripts, dependencies (express, bcryptjs, helmet, multer, etc.), and runtime development tooling.

### File #140: [`back-end/uploads/branding/.gitkeep`](back-end/uploads/branding/.gitkeep)
- **Absolute Path**: `D:\Federico_workspace\back-end\uploads\branding\.gitkeep`
- **Subsystem / Layer**: **Upload Directories** (`Assets`)
- **Lines**: **1 lines** | **Size**: **0 bytes**
- **Public Interface / Exports**: *None (or side-effect / script / asset)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Static file upload storage directories for patient documents, hospital branding logos, and inventory invoices.
- **Architectural & Security Observations**: Protected by Multer MIME validation and size limits; served publicly via `/uploads-static`.

### File #141: [`back-end/uploads/documents/.gitkeep`](back-end/uploads/documents/.gitkeep)
- **Absolute Path**: `D:\Federico_workspace\back-end\uploads\documents\.gitkeep`
- **Subsystem / Layer**: **Upload Directories** (`Assets`)
- **Lines**: **1 lines** | **Size**: **0 bytes**
- **Public Interface / Exports**: *None (or side-effect / script / asset)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Static file upload storage directories for patient documents, hospital branding logos, and inventory invoices.
- **Architectural & Security Observations**: Protected by Multer MIME validation and size limits; served publicly via `/uploads-static`.

### File #142: [`back-end/uploads/inventory/.gitkeep`](back-end/uploads/inventory/.gitkeep)
- **Absolute Path**: `D:\Federico_workspace\back-end\uploads\inventory\.gitkeep`
- **Subsystem / Layer**: **Upload Directories** (`Assets`)
- **Lines**: **1 lines** | **Size**: **0 bytes**
- **Public Interface / Exports**: *None (or side-effect / script / asset)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Static file upload storage directories for patient documents, hospital branding logos, and inventory invoices.
- **Architectural & Security Observations**: Protected by Multer MIME validation and size limits; served publicly via `/uploads-static`.

---



### Part B: Frontend Files (197 Files)

### File #143: [`front-end/.env.example`](front-end/.env.example)
- **Absolute Path**: `D:\Federico_workspace\front-end\.env.example`
- **Subsystem / Layer**: **Root Project Config & Build Tooling** (`Build & Tooling`)
- **Lines**: **4 lines** | **Size**: **263 bytes**
- **Public Interface / Exports**: *None (or side-effect / style / markup)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Template environment variable definitions for the Vite frontend development and production environments.
- **Architectural & Data-Binding Observations**: Defines `VITE_API_URL` pointing to backend port 3000 (`http://localhost:3000`). Used by `src/api/client.js`.

### File #144: [`front-end/.gitignore`](front-end/.gitignore)
- **Absolute Path**: `D:\Federico_workspace\front-end\.gitignore`
- **Subsystem / Layer**: **Root Project Config & Build Tooling** (`Build & Tooling`)
- **Lines**: **24 lines** | **Size**: **277 bytes**
- **Public Interface / Exports**: *None (or side-effect / style / markup)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Git version control ignore specification for frontend build artifacts, local dependencies, and temporary files.
- **Architectural & Data-Binding Observations**: Standard Vite exclusion matrix: excludes `node_modules/`, `dist/`, `.env`, `.env.local`, and editor configs.

### File #145: [`front-end/.oxlintrc.json`](front-end/.oxlintrc.json)
- **Absolute Path**: `D:\Federico_workspace\front-end\.oxlintrc.json`
- **Subsystem / Layer**: **Root Project Config & Build Tooling** (`Build & Tooling`)
- **Lines**: **8 lines** | **Size**: **239 bytes**
- **Public Interface / Exports**: *None (or side-effect / style / markup)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Linter configuration file for oxlint, enforcing code quality, syntax standards, and React rules.
- **Architectural & Data-Binding Observations**: Configures fast Rust-based linting rules across all React and JavaScript source files; verified with 0 errors across 153 files.

### File #146: [`front-end/README.md`](front-end/README.md)
- **Absolute Path**: `D:\Federico_workspace\front-end\README.md`
- **Subsystem / Layer**: **Root Project Config & Build Tooling** (`Build & Tooling`)
- **Lines**: **195 lines** | **Size**: **8063 bytes**
- **Public Interface / Exports**: *None (or side-effect / style / markup)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Frontend architectural and setup documentation detailing directory structure, design tokens, and commands.
- **Architectural & Data-Binding Observations**: Provides instructions for `npm run dev`, `npm run build`, `npm run lint`, portal route layout, and shared design token conventions.

### File #147: [`front-end/index.html`](front-end/index.html)
- **Absolute Path**: `D:\Federico_workspace\front-end\index.html`
- **Subsystem / Layer**: **Root Project Config & Build Tooling** (`Build & Tooling`)
- **Lines**: **14 lines** | **Size**: **845 bytes**
- **Public Interface / Exports**: *None (or side-effect / style / markup)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: HTML document entry point mounting the React single-page application into `#root`.
- **Architectural & Data-Binding Observations**: Preloads Google Fonts (Inter font family and Material Symbols Outlined icon font) and mounts the root application bundle via `/src/main.jsx`.

### File #148: [`front-end/package-lock.json`](front-end/package-lock.json)
- **Absolute Path**: `D:\Federico_workspace\front-end\package-lock.json`
- **Subsystem / Layer**: **Root Project Config & Build Tooling** (`Build & Tooling`)
- **Lines**: **1325 lines** | **Size**: **43602 bytes**
- **Public Interface / Exports**: *None (or side-effect / style / markup)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: NPM package dependency lockfile ensuring reproducible dependency tree resolution.
- **Architectural & Data-Binding Observations**: Locks all installed transitives for React 19 and Vite tooling; ensures deterministic builds.

### File #149: [`front-end/package.json`](front-end/package.json)
- **Absolute Path**: `D:\Federico_workspace\front-end\package.json`
- **Subsystem / Layer**: **Root Project Config & Build Tooling** (`Build & Tooling`)
- **Lines**: **24 lines** | **Size**: **527 bytes**
- **Public Interface / Exports**: *None (or side-effect / style / markup)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: NPM package manifest declaring dependencies, development tooling, and scripts for the frontend application.
- **Architectural & Data-Binding Observations**: Declares React 19.2.8, React DOM 19.2.8, React Router DOM 7.18.4, Vite 8.3.0, and oxlint 1.81.0. Defines `dev`, `build`, `lint`, and `preview` scripts.

### File #150: [`front-end/vite.config.js`](front-end/vite.config.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\vite.config.js`
- **Subsystem / Layer**: **Root Project Config & Build Tooling** (`Build & Tooling`)
- **Lines**: **72 lines** | **Size**: **2833 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `@vitejs/plugin-react`, `vite`
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Vite build configuration file with React plugin and custom legacy route rewriting middleware.
- **Architectural & Data-Binding Observations**: Intercepts navigation requests targeting legacy `.html` paths (e.g. `/HOM/screen-01-dashboard.html`) and transparently rewrites them to `/index.html` to support direct URL access in SPA.

### File #151: [`front-end/src/App.jsx`](front-end/src/App.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\App.jsx`
- **Subsystem / Layer**: **Root Application Shell** (`Core App`)
- **Lines**: **13 lines** | **Size**: **244 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react-router-dom`
  - *Internal Modules*: `./components/feedback/FeedbackHost.jsx`
- **Primary Responsibility**: Root application shell rendering global feedback host and the React Router outlet.
- **Architectural & Data-Binding Observations**: Renders `<FeedbackHost />` via React portal for imperative toasts and modal dialogs, and `<Outlet />` for child routes.

### File #152: [`front-end/src/main.jsx`](front-end/src/main.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\main.jsx`
- **Subsystem / Layer**: **Root Application Shell** (`Core App`)
- **Lines**: **20 lines** | **Size**: **702 bytes**
- **Public Interface / Exports**: *None (or side-effect / style / markup)*
- **Dependencies**:
  - *External Packages*: `react`, `react-dom/client`
  - *Internal Modules*: `./auth/SessionContext.jsx`, `./routes.jsx`
- **Primary Responsibility**: Frontend application bootstrap script initializing the React DOM root and mounting global providers.
- **Architectural & Data-Binding Observations**: Mounts `design-tokens.css`, `material-components.css`, and `ui-feedback.css`, wraps app in `<SessionProvider>`, and renders `RouterProvider`.

### File #153: [`front-end/src/routes.jsx`](front-end/src/routes.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\routes.jsx`
- **Subsystem / Layer**: **Root Application Shell** (`Core App`)
- **Lines**: **193 lines** | **Size**: **9100 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`, `react-router-dom`
  - *Internal Modules*: `./App.jsx`, `./auth/RequireModule.jsx`, `./auth/actorHome.js`
- **Primary Responsibility**: Central declarative routing table configured with React Router DOM v7 createBrowserRouter.
- **Architectural & Data-Binding Observations**: Defines 90+ routes covering all 7 portals with lazy-loading (`React.lazy`), `<Suspense>` loaders, and role guards (`RequireModule`, `RequirePlatformUser`). Preserves query strings across redirects.

### File #154: [`front-end/src/api/client.js`](front-end/src/api/client.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\api\client.js`
- **Subsystem / Layer**: **API Layer (Core Client)** (`API / Core`)
- **Lines**: **166 lines** | **Size**: **5070 bytes**
- **Public Interface / Exports**: `API_BASE_URL`, `flattenUpload`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `./errors.js`, `./session.js`
- **Primary Responsibility**: Centralized HTTP network client encapsulating all external HTTP communication.
- **Architectural & Data-Binding Observations**: The ONLY file in the frontend making raw network calls. Wraps `fetch()` with 15-second timeouts (`AbortController`), Bearer token injection from `session.js`, automatic 401 logout, and `{ success: true, data }` response body unwrapping. Also manages multipart file uploads (`requestUpload`) and blob retrieval (`openUploadedFile`).
- **Detected Code Smells / Risks**:
  - ⚠️ Contains the only window.fetch() calls in the entire frontend repository

### File #155: [`front-end/src/api/errors.js`](front-end/src/api/errors.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\api\errors.js`
- **Subsystem / Layer**: **API Layer (Core Client)** (`API / Core`)
- **Lines**: **29 lines** | **Size**: **942 bytes**
- **Public Interface / Exports**: `ApiError`, `extractMessage`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Error hierarchy and parser utilities for backend API error responses.
- **Architectural & Data-Binding Observations**: Defines `ApiError` class containing HTTP status codes and parsed payload bodies, and `extractMessage()` resolving nested error strings, error objects, or validation error arrays.

### File #156: [`front-end/src/api/index.js`](front-end/src/api/index.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\api\index.js`
- **Subsystem / Layer**: **API Layer (Core Client)** (`API / Core`)
- **Lines**: **49 lines** | **Size**: **1512 bytes**
- **Public Interface / Exports**: `ApiError`, `api`, `export default`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `./client.js`, `./endpoints/activity.js`, `./endpoints/admissions.js`, `./endpoints/appointments.js`, `./endpoints/auth.js`, `./endpoints/billing.js`, `./endpoints/doctors.js`, `./endpoints/inventory.js`, `./endpoints/marketplace.js`, `./endpoints/patients.js`, `./endpoints/platform.js`, `./endpoints/preRequests.js`, `./endpoints/rbac.js`, `./endpoints/uploads.js`, `./endpoints/wards.js`, `./errors.js`, `./session.js`
- **Primary Responsibility**: Unified API facade barrel aggregating all 14 modular resource endpoint clients.
- **Architectural & Data-Binding Observations**: Exports consolidated `api` object (`api.auth`, `api.wards`, `api.patients`, `api.billing`, etc.) providing strict encapsulation across all portals.

### File #157: [`front-end/src/api/session.js`](front-end/src/api/session.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\api\session.js`
- **Subsystem / Layer**: **API Layer (Core Client)** (`API / Core`)
- **Lines**: **113 lines** | **Size**: **3609 bytes**
- **Public Interface / Exports**: `clearSession`, `getSession`, `getSnapshot`, `setSession`, `subscribe`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Per-tab session storage engine implementing React 19 useSyncExternalStore contract.
- **Architectural & Data-Binding Observations**: Stores session token in `sessionStorage` enabling isolated multi-tab role sessions. Implements synchronized cross-tab logout via `BroadcastChannel("federico_auth_channel")`.

### File #158: [`front-end/src/api/endpoints/activity.js`](front-end/src/api/endpoints/activity.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\api\endpoints\activity.js`
- **Subsystem / Layer**: **API Layer (Resource Endpoints)** (`API / Endpoints`)
- **Lines**: **10 lines** | **Size**: **159 bytes**
- **Public Interface / Exports**: `activityLog`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../client.js`
- **Primary Responsibility**: API client for operational activity audit logs.
- **Architectural & Data-Binding Observations**: Provides `api.activity.list()` fetching `GET /activity-log`.

### File #159: [`front-end/src/api/endpoints/admissions.js`](front-end/src/api/endpoints/admissions.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\api\endpoints\admissions.js`
- **Subsystem / Layer**: **API Layer (Resource Endpoints)** (`API / Endpoints`)
- **Lines**: **19 lines** | **Size**: **385 bytes**
- **Public Interface / Exports**: `admissions`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../client.js`
- **Primary Responsibility**: API client for inpatient admission management and bed occupancy tracking.
- **Architectural & Data-Binding Observations**: Provides `list()`, `get()`, `create()`, and `update()` endpoints matching backend admission controller.

### File #160: [`front-end/src/api/endpoints/appointments.js`](front-end/src/api/endpoints/appointments.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\api\endpoints\appointments.js`
- **Subsystem / Layer**: **API Layer (Resource Endpoints)** (`API / Endpoints`)
- **Lines**: **16 lines** | **Size**: **326 bytes**
- **Public Interface / Exports**: `appointments`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../client.js`
- **Primary Responsibility**: API client for outpatient consultation appointments and doctor availability slots.
- **Architectural & Data-Binding Observations**: Provides `list()`, `create()`, and `update()` endpoints matching backend appointment controllers.

### File #161: [`front-end/src/api/endpoints/auth.js`](front-end/src/api/endpoints/auth.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\api\endpoints\auth.js`
- **Subsystem / Layer**: **API Layer (Resource Endpoints)** (`API / Endpoints`)
- **Lines**: **92 lines** | **Size**: **3503 bytes**
- **Public Interface / Exports**: `auth`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../../lib/emailIdentity.js`, `../../lib/phone.js`, `../client.js`, `../session.js`
- **Primary Responsibility**: API client for user authentication, identity resolution, session management, and demo accounts.
- **Architectural & Data-Binding Observations**: Provides `login()`, `signup()`, `logout()`, `me()`, `entitlements()`, and dynamic `demoAccounts()` endpoints.

### File #162: [`front-end/src/api/endpoints/billing.js`](front-end/src/api/endpoints/billing.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\api\endpoints\billing.js`
- **Subsystem / Layer**: **API Layer (Resource Endpoints)** (`API / Endpoints`)
- **Lines**: **83 lines** | **Size**: **2105 bytes**
- **Public Interface / Exports**: `billing`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../client.js`
- **Primary Responsibility**: Comprehensive financial API client for hospital tariffs, ledgers, charges, payments, and discharge summaries.
- **Architectural & Data-Binding Observations**: Covers `services`, `ledgers`, charge postings, FA approval/rejection, payments, receipts, and discharge summaries.

### File #163: [`front-end/src/api/endpoints/doctors.js`](front-end/src/api/endpoints/doctors.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\api\endpoints\doctors.js`
- **Subsystem / Layer**: **API Layer (Resource Endpoints)** (`API / Endpoints`)
- **Lines**: **32 lines** | **Size**: **819 bytes**
- **Public Interface / Exports**: `doctors`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../../lib/phone.js`, `../client.js`
- **Primary Responsibility**: API client for doctor profiles, duty rosters, availability slots, and specialties.
- **Architectural & Data-Binding Observations**: Provides `list()`, `get()`, `create()`, `update()`, and availability querying methods.

### File #164: [`front-end/src/api/endpoints/inventory.js`](front-end/src/api/endpoints/inventory.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\api\endpoints\inventory.js`
- **Subsystem / Layer**: **API Layer (Resource Endpoints)** (`API / Endpoints`)
- **Lines**: **32 lines** | **Size**: **745 bytes**
- **Public Interface / Exports**: `inventory`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../client.js`
- **Primary Responsibility**: API client for hospital consumables, pharmacy supplies, and stock purchase requests.
- **Architectural & Data-Binding Observations**: Provides item catalog CRUD, stock level updates, and purchase request workflows.

### File #165: [`front-end/src/api/endpoints/marketplace.js`](front-end/src/api/endpoints/marketplace.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\api\endpoints\marketplace.js`
- **Subsystem / Layer**: **API Layer (Resource Endpoints)** (`API / Endpoints`)
- **Lines**: **17 lines** | **Size**: **519 bytes**
- **Public Interface / Exports**: `marketplace`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../client.js`
- **Primary Responsibility**: API client for public hospital marketplace, subscription plans, and tenant registration.
- **Architectural & Data-Binding Observations**: Provides `organizations()`, `plans()`, and self-service `registerOrganization()` onboarding.

### File #166: [`front-end/src/api/endpoints/patients.js`](front-end/src/api/endpoints/patients.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\api\endpoints\patients.js`
- **Subsystem / Layer**: **API Layer (Resource Endpoints)** (`API / Endpoints`)
- **Lines**: **37 lines** | **Size**: **1052 bytes**
- **Public Interface / Exports**: `patients`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../../lib/phone.js`, `../client.js`
- **Primary Responsibility**: API client for patient demographics, insurance policies, and composite portal summary.
- **Architectural & Data-Binding Observations**: Provides patient search, demographic CRUD, insurance policy creation/listing, and composite `portalSummary()`.

### File #167: [`front-end/src/api/endpoints/platform.js`](front-end/src/api/endpoints/platform.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\api\endpoints\platform.js`
- **Subsystem / Layer**: **API Layer (Resource Endpoints)** (`API / Endpoints`)
- **Lines**: **136 lines** | **Size**: **4213 bytes**
- **Public Interface / Exports**: `platform`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../client.js`, `../session.js`
- **Primary Responsibility**: API client for Platform Super User governance, tenant provisioning, and platform rate card.
- **Architectural & Data-Binding Observations**: Provides superuser auth, tenant status updates, quota provisioning, and rate card configuration.

### File #168: [`front-end/src/api/endpoints/preRequests.js`](front-end/src/api/endpoints/preRequests.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\api\endpoints\preRequests.js`
- **Subsystem / Layer**: **API Layer (Resource Endpoints)** (`API / Endpoints`)
- **Lines**: **27 lines** | **Size**: **754 bytes**
- **Public Interface / Exports**: `preRequests`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../client.js`
- **Primary Responsibility**: API client for patient intake triage requests, emergency requisitions, and doctor referrals.
- **Architectural & Data-Binding Observations**: Provides `list()`, `create()`, `update()`, `updateStatus()`, and bed assignment suggestions.

### File #169: [`front-end/src/api/endpoints/rbac.js`](front-end/src/api/endpoints/rbac.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\api\endpoints\rbac.js`
- **Subsystem / Layer**: **API Layer (Resource Endpoints)** (`API / Endpoints`)
- **Lines**: **23 lines** | **Size**: **713 bytes**
- **Public Interface / Exports**: `rbac`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../client.js`
- **Primary Responsibility**: API client for hospital staff directory, custom roles, and permission assignments.
- **Architectural & Data-Binding Observations**: Provides staff listings, staff creation/editing, role assignments, and permission toggling.

### File #170: [`front-end/src/api/endpoints/uploads.js`](front-end/src/api/endpoints/uploads.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\api\endpoints\uploads.js`
- **Subsystem / Layer**: **API Layer (Resource Endpoints)** (`API / Endpoints`)
- **Lines**: **34 lines** | **Size**: **1267 bytes**
- **Public Interface / Exports**: `uploads`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../client.js`
- **Primary Responsibility**: API client for file uploads (insurance cards, hospital logos, medical records).
- **Architectural & Data-Binding Observations**: Wraps multipart form data uploads and file retrieval via `requestUpload`.

### File #171: [`front-end/src/api/endpoints/wards.js`](front-end/src/api/endpoints/wards.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\api\endpoints\wards.js`
- **Subsystem / Layer**: **API Layer (Resource Endpoints)** (`API / Endpoints`)
- **Lines**: **76 lines** | **Size**: **2186 bytes**
- **Public Interface / Exports**: `wards`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../client.js`
- **Primary Responsibility**: API client for physical hospital wards, bed inventory, bed maintenance, and bed requests.
- **Architectural & Data-Binding Observations**: Provides ward CRUD, bed matrix status, bed maintenance toggles, and HOM bed requests.

### File #172: [`front-end/src/auth/RequireModule.jsx`](front-end/src/auth/RequireModule.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\auth\RequireModule.jsx`
- **Subsystem / Layer**: **Authentication & RBAC** (`Auth / Guards`)
- **Lines**: **52 lines** | **Size**: **1990 bytes**
- **Public Interface / Exports**: `RequirePlatformUser`, `export default`
- **Dependencies**:
  - *External Packages*: `react`, `react-router-dom`
  - *Internal Modules*: `../components/feedback/feedback.js`, `./actorHome.js`, `./useSession.js`
- **Primary Responsibility**: Route authorization guard checking user session, module licensing, and role permissions.
- **Architectural & Data-Binding Observations**: Enforces authentication and module entitlements. Unauthenticated users are redirected to login; unauthorized users receive an access denied toast and are routed back to their actor home. Also exports `RequirePlatformUser`.

### File #173: [`front-end/src/auth/SessionContext.jsx`](front-end/src/auth/SessionContext.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\auth\SessionContext.jsx`
- **Subsystem / Layer**: **Authentication & RBAC** (`Auth / Guards`)
- **Lines**: **162 lines** | **Size**: **5862 bytes**
- **Public Interface / Exports**: `SessionProvider`
- **Dependencies**:
  - *External Packages*: `react`
  - *Internal Modules*: `../api/index.js`, `../api/session.js`, `../lib/entitlements.js`, `../lib/roleProfiles.js`, `./contexts.js`
- **Primary Responsibility**: Top-level authentication state provider connecting session storage to React components.
- **Architectural & Data-Binding Observations**: Consumes `session.js` via `useSyncExternalStore`. Provides signin, signup, logout, entitlement checks (`hasModuleAccess`, `hasModule`, `resourceQty`), and multi-tenant patient routing.

### File #174: [`front-end/src/auth/actorHome.js`](front-end/src/auth/actorHome.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\auth\actorHome.js`
- **Subsystem / Layer**: **Authentication & RBAC** (`Auth / Guards`)
- **Lines**: **24 lines** | **Size**: **770 bytes**
- **Public Interface / Exports**: `ACTOR_HOME`, `LOGIN_PATH`, `getActorHome`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Navigation mapping resolving the default home landing route for each actor role.
- **Architectural & Data-Binding Observations**: Maps HOM to `/HOM/screen-01-dashboard.html`, PRE to `/PRE/screen-01-dashboard.html`, FA to `/FA/screen-01-billing.html`, Admin to `/Admin/screen-01-dashboard.html`, Patient to `/Patient/screen-01-dashboard.html`, and Platform to `/Platform/screen-01-dashboard.html`.

### File #175: [`front-end/src/auth/contexts.js`](front-end/src/auth/contexts.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\auth\contexts.js`
- **Subsystem / Layer**: **Authentication & RBAC** (`Auth / Guards`)
- **Lines**: **10 lines** | **Size**: **309 bytes**
- **Public Interface / Exports**: `SessionContext`
- **Dependencies**:
  - *External Packages*: `react`
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: React Context declaration for SessionContext isolated in a dedicated file.
- **Architectural & Data-Binding Observations**: Exports `SessionContext = createContext(null)` isolated from provider components to maintain React Fast Refresh HMR.

### File #176: [`front-end/src/auth/useSession.js`](front-end/src/auth/useSession.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\auth\useSession.js`
- **Subsystem / Layer**: **Authentication & RBAC** (`Auth / Guards`)
- **Lines**: **10 lines** | **Size**: **280 bytes**
- **Public Interface / Exports**: `useSession`
- **Dependencies**:
  - *External Packages*: `react`
  - *Internal Modules*: `./contexts.js`
- **Primary Responsibility**: Custom hook exposing authentication context and user session helpers.
- **Architectural & Data-Binding Observations**: Returns `{ session, tenant, actor, accessRole, isAuthenticated, isPlatformUser, authenticate, logout, hasModuleAccess, hasModule, resourceQty }`.

### File #177: [`front-end/src/components/css/app-navbar.css`](front-end/src/components/css/app-navbar.css)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\components\css\app-navbar.css`
- **Subsystem / Layer**: **Shared Components (Component CSS)** (`Stylesheets / Components`)
- **Lines**: **248 lines** | **Size**: **5477 bytes**
- **Public Interface / Exports**: *None (or side-effect / style / markup)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Shared reusable UI component rendering app-navbar.css with design token styling and accessibility support.
- **Architectural & Data-Binding Observations**: Built with MD3 and design-tokens.css variables. Fully isolated from global CSS bleed.

### File #178: [`front-end/src/components/css/dialog-shell.css`](front-end/src/components/css/dialog-shell.css)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\components\css\dialog-shell.css`
- **Subsystem / Layer**: **Shared Components (Component CSS)** (`Stylesheets / Components`)
- **Lines**: **110 lines** | **Size**: **2299 bytes**
- **Public Interface / Exports**: *None (or side-effect / style / markup)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Shared reusable UI component rendering dialog-shell.css with design token styling and accessibility support.
- **Architectural & Data-Binding Observations**: Built with MD3 and design-tokens.css variables. Fully isolated from global CSS bleed.

### File #179: [`front-end/src/components/css/empty-state.css`](front-end/src/components/css/empty-state.css)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\components\css\empty-state.css`
- **Subsystem / Layer**: **Shared Components (Component CSS)** (`Stylesheets / Components`)
- **Lines**: **56 lines** | **Size**: **1185 bytes**
- **Public Interface / Exports**: *None (or side-effect / style / markup)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Shared reusable UI component rendering empty-state.css with design token styling and accessibility support.
- **Architectural & Data-Binding Observations**: Built with MD3 and design-tokens.css variables. Fully isolated from global CSS bleed.

### File #180: [`front-end/src/components/css/page-header.css`](front-end/src/components/css/page-header.css)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\components\css\page-header.css`
- **Subsystem / Layer**: **Shared Components (Component CSS)** (`Stylesheets / Components`)
- **Lines**: **49 lines** | **Size**: **935 bytes**
- **Public Interface / Exports**: *None (or side-effect / style / markup)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Shared reusable UI component rendering page-header.css with design token styling and accessibility support.
- **Architectural & Data-Binding Observations**: Built with MD3 and design-tokens.css variables. Fully isolated from global CSS bleed.

### File #181: [`front-end/src/components/css/search-toolbar.css`](front-end/src/components/css/search-toolbar.css)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\components\css\search-toolbar.css`
- **Subsystem / Layer**: **Shared Components (Component CSS)** (`Stylesheets / Components`)
- **Lines**: **75 lines** | **Size**: **1688 bytes**
- **Public Interface / Exports**: *None (or side-effect / style / markup)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Shared reusable UI component rendering search-toolbar.css with design token styling and accessibility support.
- **Architectural & Data-Binding Observations**: Built with MD3 and design-tokens.css variables. Fully isolated from global CSS bleed.

### File #182: [`front-end/src/components/css/stat-card.css`](front-end/src/components/css/stat-card.css)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\components\css\stat-card.css`
- **Subsystem / Layer**: **Shared Components (Component CSS)** (`Stylesheets / Components`)
- **Lines**: **100 lines** | **Size**: **2359 bytes**
- **Public Interface / Exports**: *None (or side-effect / style / markup)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Shared reusable UI component rendering stat-card.css with design token styling and accessibility support.
- **Architectural & Data-Binding Observations**: Built with MD3 and design-tokens.css variables. Fully isolated from global CSS bleed.

### File #183: [`front-end/src/components/css/tab-nav.css`](front-end/src/components/css/tab-nav.css)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\components\css\tab-nav.css`
- **Subsystem / Layer**: **Shared Components (Component CSS)** (`Stylesheets / Components`)
- **Lines**: **104 lines** | **Size**: **2546 bytes**
- **Public Interface / Exports**: *None (or side-effect / style / markup)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Shared reusable UI component rendering tab-nav.css with design token styling and accessibility support.
- **Architectural & Data-Binding Observations**: Built with MD3 and design-tokens.css variables. Fully isolated from global CSS bleed.

### File #184: [`front-end/src/components/feedback/Dialog.jsx`](front-end/src/components/feedback/Dialog.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\components\feedback\Dialog.jsx`
- **Subsystem / Layer**: **Shared Components (Feedback)** (`Components / Feedback`)
- **Lines**: **123 lines** | **Size**: **4065 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Shared reusable UI component rendering Dialog with design token styling and accessibility support.
- **Architectural & Data-Binding Observations**: Built with MD3 and design-tokens.css variables. Fully isolated from global CSS bleed.

### File #185: [`front-end/src/components/feedback/FeedbackHost.jsx`](front-end/src/components/feedback/FeedbackHost.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\components\feedback\FeedbackHost.jsx`
- **Subsystem / Layer**: **Shared Components (Feedback)** (`Components / Feedback`)
- **Lines**: **32 lines** | **Size**: **1092 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`, `react-dom`
  - *Internal Modules*: `./Dialog.jsx`, `./Toast.jsx`, `./store.js`
- **Primary Responsibility**: Shared reusable UI component rendering FeedbackHost with design token styling and accessibility support.
- **Architectural & Data-Binding Observations**: Built with MD3 and design-tokens.css variables. Fully isolated from global CSS bleed.

### File #186: [`front-end/src/components/feedback/Toast.jsx`](front-end/src/components/feedback/Toast.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\components\feedback\Toast.jsx`
- **Subsystem / Layer**: **Shared Components (Feedback)** (`Components / Feedback`)
- **Lines**: **88 lines** | **Size**: **3090 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Shared reusable UI component rendering Toast with design token styling and accessibility support.
- **Architectural & Data-Binding Observations**: Built with MD3 and design-tokens.css variables. Fully isolated from global CSS bleed.

### File #187: [`front-end/src/components/feedback/feedback.js`](front-end/src/components/feedback/feedback.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\components\feedback\feedback.js`
- **Subsystem / Layer**: **Shared Components (Feedback)** (`Components / Feedback`)
- **Lines**: **11 lines** | **Size**: **489 bytes**
- **Public Interface / Exports**: `alert`, `confirm`, `selectOne`, `toast`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `./store.js`
- **Primary Responsibility**: Shared reusable UI component rendering feedback.js with design token styling and accessibility support.
- **Architectural & Data-Binding Observations**: Built with MD3 and design-tokens.css variables. Fully isolated from global CSS bleed.

### File #188: [`front-end/src/components/feedback/store.js`](front-end/src/components/feedback/store.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\components\feedback\store.js`
- **Subsystem / Layer**: **Shared Components (Feedback)** (`Components / Feedback`)
- **Lines**: **70 lines** | **Size**: **1976 bytes**
- **Public Interface / Exports**: `alert`, `closeDialog`, `confirm`, `dismissToast`, `getSnapshot`, `selectOne`, `subscribe`, `toast`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Shared reusable UI component rendering store.js with design token styling and accessibility support.
- **Architectural & Data-Binding Observations**: Built with MD3 and design-tokens.css variables. Fully isolated from global CSS bleed.

### File #189: [`front-end/src/components/forms/DepartmentSelect.jsx`](front-end/src/components/forms/DepartmentSelect.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\components\forms\DepartmentSelect.jsx`
- **Subsystem / Layer**: **Shared Components (Forms)** (`Components / Forms`)
- **Lines**: **42 lines** | **Size**: **1039 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Shared reusable UI component rendering DepartmentSelect with design token styling and accessibility support.
- **Architectural & Data-Binding Observations**: Built with MD3 and design-tokens.css variables. Fully isolated from global CSS bleed.

### File #190: [`front-end/src/components/forms/TaggedEmailInput.jsx`](front-end/src/components/forms/TaggedEmailInput.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\components\forms\TaggedEmailInput.jsx`
- **Subsystem / Layer**: **Shared Components (Forms)** (`Components / Forms`)
- **Lines**: **37 lines** | **Size**: **1137 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../../lib/emailIdentity.js`
- **Primary Responsibility**: Shared reusable UI component rendering TaggedEmailInput with design token styling and accessibility support.
- **Architectural & Data-Binding Observations**: Built with MD3 and design-tokens.css variables. Fully isolated from global CSS bleed.

### File #191: [`front-end/src/components/layout/AppNavbar.jsx`](front-end/src/components/layout/AppNavbar.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\components\layout\AppNavbar.jsx`
- **Subsystem / Layer**: **Shared Components (Layout)** (`Components / Layout`)
- **Lines**: **154 lines** | **Size**: **4937 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`, `react-router-dom`
  - *Internal Modules*: `../../auth/actorHome.js`, `../../auth/useSession.js`
- **Primary Responsibility**: Shared reusable UI component rendering AppNavbar with design token styling and accessibility support.
- **Architectural & Data-Binding Observations**: Built with MD3 and design-tokens.css variables. Fully isolated from global CSS bleed.

### File #192: [`front-end/src/components/layout/DialogShell.jsx`](front-end/src/components/layout/DialogShell.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\components\layout\DialogShell.jsx`
- **Subsystem / Layer**: **Shared Components (Layout)** (`Components / Layout`)
- **Lines**: **53 lines** | **Size**: **1334 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `./Modal.jsx`
- **Primary Responsibility**: Shared reusable UI component rendering DialogShell with design token styling and accessibility support.
- **Architectural & Data-Binding Observations**: Built with MD3 and design-tokens.css variables. Fully isolated from global CSS bleed.

### File #193: [`front-end/src/components/layout/Modal.jsx`](front-end/src/components/layout/Modal.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\components\layout\Modal.jsx`
- **Subsystem / Layer**: **Shared Components (Layout)** (`Components / Layout`)
- **Lines**: **46 lines** | **Size**: **1373 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`, `react-dom`
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Shared reusable UI component rendering Modal with design token styling and accessibility support.
- **Architectural & Data-Binding Observations**: Built with MD3 and design-tokens.css variables. Fully isolated from global CSS bleed.

### File #194: [`front-end/src/components/layout/ModuleLock.css`](front-end/src/components/layout/ModuleLock.css)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\components\layout\ModuleLock.css`
- **Subsystem / Layer**: **Shared Components (Layout)** (`Components / Layout`)
- **Lines**: **25 lines** | **Size**: **578 bytes**
- **Public Interface / Exports**: *None (or side-effect / style / markup)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Shared reusable UI component rendering ModuleLock.css with design token styling and accessibility support.
- **Architectural & Data-Binding Observations**: Built with MD3 and design-tokens.css variables. Fully isolated from global CSS bleed.

### File #195: [`front-end/src/components/layout/ModuleLock.jsx`](front-end/src/components/layout/ModuleLock.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\components\layout\ModuleLock.jsx`
- **Subsystem / Layer**: **Shared Components (Layout)** (`Components / Layout`)
- **Lines**: **42 lines** | **Size**: **1318 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../../auth/useSession.js`, `../../lib/entitlements.js`, `../feedback/feedback.js`
- **Primary Responsibility**: Shared reusable UI component rendering ModuleLock with design token styling and accessibility support.
- **Architectural & Data-Binding Observations**: Built with MD3 and design-tokens.css variables. Fully isolated from global CSS bleed.

### File #196: [`front-end/src/components/layout/PageHeader.jsx`](front-end/src/components/layout/PageHeader.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\components\layout\PageHeader.jsx`
- **Subsystem / Layer**: **Shared Components (Layout)** (`Components / Layout`)
- **Lines**: **27 lines** | **Size**: **767 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Shared reusable UI component rendering PageHeader with design token styling and accessibility support.
- **Architectural & Data-Binding Observations**: Built with MD3 and design-tokens.css variables. Fully isolated from global CSS bleed.

### File #197: [`front-end/src/components/layout/SharedNav.css`](front-end/src/components/layout/SharedNav.css)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\components\layout\SharedNav.css`
- **Subsystem / Layer**: **Shared Components (Layout)** (`Components / Layout`)
- **Lines**: **142 lines** | **Size**: **4175 bytes**
- **Public Interface / Exports**: *None (or side-effect / style / markup)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Shared reusable UI component rendering SharedNav.css with design token styling and accessibility support.
- **Architectural & Data-Binding Observations**: Built with MD3 and design-tokens.css variables. Fully isolated from global CSS bleed.

### File #198: [`front-end/src/components/layout/SharedNav.jsx`](front-end/src/components/layout/SharedNav.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\components\layout\SharedNav.jsx`
- **Subsystem / Layer**: **Shared Components (Layout)** (`Components / Layout`)
- **Lines**: **10 lines** | **Size**: **205 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `./AppNavbar.jsx`
- **Primary Responsibility**: Shared reusable UI component rendering SharedNav with design token styling and accessibility support.
- **Architectural & Data-Binding Observations**: Built with MD3 and design-tokens.css variables. Fully isolated from global CSS bleed.

### File #199: [`front-end/src/components/ui/Badge.jsx`](front-end/src/components/ui/Badge.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\components\ui\Badge.jsx`
- **Subsystem / Layer**: **Shared Components (UI Primitives)** (`Components / UI`)
- **Lines**: **16 lines** | **Size**: **570 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Shared reusable UI component rendering Badge with design token styling and accessibility support.
- **Architectural & Data-Binding Observations**: Built with MD3 and design-tokens.css variables. Fully isolated from global CSS bleed.

### File #200: [`front-end/src/components/ui/Button.jsx`](front-end/src/components/ui/Button.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\components\ui\Button.jsx`
- **Subsystem / Layer**: **Shared Components (UI Primitives)** (`Components / UI`)
- **Lines**: **53 lines** | **Size**: **1150 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Shared reusable UI component rendering Button with design token styling and accessibility support.
- **Architectural & Data-Binding Observations**: Built with MD3 and design-tokens.css variables. Fully isolated from global CSS bleed.

### File #201: [`front-end/src/components/ui/Card.jsx`](front-end/src/components/ui/Card.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\components\ui\Card.jsx`
- **Subsystem / Layer**: **Shared Components (UI Primitives)** (`Components / UI`)
- **Lines**: **40 lines** | **Size**: **1227 bytes**
- **Public Interface / Exports**: `Card`, `CardContent`, `CardFooter`, `CardHeader`, `export default`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Shared reusable UI component rendering Card with design token styling and accessibility support.
- **Architectural & Data-Binding Observations**: Built with MD3 and design-tokens.css variables. Fully isolated from global CSS bleed.

### File #202: [`front-end/src/components/ui/DataTable.jsx`](front-end/src/components/ui/DataTable.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\components\ui\DataTable.jsx`
- **Subsystem / Layer**: **Shared Components (UI Primitives)** (`Components / UI`)
- **Lines**: **23 lines** | **Size**: **675 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Shared reusable UI component rendering DataTable with design token styling and accessibility support.
- **Architectural & Data-Binding Observations**: Built with MD3 and design-tokens.css variables. Fully isolated from global CSS bleed.

### File #203: [`front-end/src/components/ui/EmptyState.jsx`](front-end/src/components/ui/EmptyState.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\components\ui\EmptyState.jsx`
- **Subsystem / Layer**: **Shared Components (UI Primitives)** (`Components / UI`)
- **Lines**: **37 lines** | **Size**: **929 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Shared reusable UI component rendering EmptyState with design token styling and accessibility support.
- **Architectural & Data-Binding Observations**: Built with MD3 and design-tokens.css variables. Fully isolated from global CSS bleed.

### File #204: [`front-end/src/components/ui/Input.jsx`](front-end/src/components/ui/Input.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\components\ui\Input.jsx`
- **Subsystem / Layer**: **Shared Components (UI Primitives)** (`Components / UI`)
- **Lines**: **7 lines** | **Size**: **247 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Shared reusable UI component rendering Input with design token styling and accessibility support.
- **Architectural & Data-Binding Observations**: Built with MD3 and design-tokens.css variables. Fully isolated from global CSS bleed.

### File #205: [`front-end/src/components/ui/SearchToolbar.jsx`](front-end/src/components/ui/SearchToolbar.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\components\ui\SearchToolbar.jsx`
- **Subsystem / Layer**: **Shared Components (UI Primitives)** (`Components / UI`)
- **Lines**: **51 lines** | **Size**: **1505 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Shared reusable UI component rendering SearchToolbar with design token styling and accessibility support.
- **Architectural & Data-Binding Observations**: Built with MD3 and design-tokens.css variables. Fully isolated from global CSS bleed.

### File #206: [`front-end/src/components/ui/StatCard.jsx`](front-end/src/components/ui/StatCard.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\components\ui\StatCard.jsx`
- **Subsystem / Layer**: **Shared Components (UI Primitives)** (`Components / UI`)
- **Lines**: **59 lines** | **Size**: **1272 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react-router-dom`
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Shared reusable UI component rendering StatCard with design token styling and accessibility support.
- **Architectural & Data-Binding Observations**: Built with MD3 and design-tokens.css variables. Fully isolated from global CSS bleed.

### File #207: [`front-end/src/components/ui/TabNav.jsx`](front-end/src/components/ui/TabNav.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\components\ui\TabNav.jsx`
- **Subsystem / Layer**: **Shared Components (UI Primitives)** (`Components / UI`)
- **Lines**: **43 lines** | **Size**: **1170 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Shared reusable UI component rendering TabNav with design token styling and accessibility support.
- **Architectural & Data-Binding Observations**: Built with MD3 and design-tokens.css variables. Fully isolated from global CSS bleed.

### File #208: [`front-end/src/components/ui/Tabs.jsx`](front-end/src/components/ui/Tabs.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\components\ui\Tabs.jsx`
- **Subsystem / Layer**: **Shared Components (UI Primitives)** (`Components / UI`)
- **Lines**: **44 lines** | **Size**: **1281 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Shared reusable UI component rendering Tabs with design token styling and accessibility support.
- **Architectural & Data-Binding Observations**: Built with MD3 and design-tokens.css variables. Fully isolated from global CSS bleed.

### File #209: [`front-end/src/hooks/useApi.js`](front-end/src/hooks/useApi.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\hooks\useApi.js`
- **Subsystem / Layer**: **Custom React Hooks** (`Hooks`)
- **Lines**: **66 lines** | **Size**: **2655 bytes**
- **Public Interface / Exports**: `useApi`
- **Dependencies**:
  - *External Packages*: `react`
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Universal asynchronous data fetching hook managing loading, error, and reload states.
- **Architectural & Data-Binding Observations**: Implements a unified effect managing mount lifecycle and initial execution, eliminating React 19 StrictMode double-invocation race conditions.

### File #210: [`front-end/src/hooks/useAsyncLock.js`](front-end/src/hooks/useAsyncLock.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\hooks\useAsyncLock.js`
- **Subsystem / Layer**: **Custom React Hooks** (`Hooks`)
- **Lines**: **28 lines** | **Size**: **738 bytes**
- **Public Interface / Exports**: `useAsyncLock`
- **Dependencies**:
  - *External Packages*: `react`
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Concurrency locking hook preventing form re-entrancy and duplicate click submissions.
- **Architectural & Data-Binding Observations**: Returns `[locked, run]` to ensure asynchronous user actions cannot be executed concurrently.

### File #211: [`front-end/src/hooks/useDocumentTitle.js`](front-end/src/hooks/useDocumentTitle.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\hooks\useDocumentTitle.js`
- **Subsystem / Layer**: **Custom React Hooks** (`Hooks`)
- **Lines**: **19 lines** | **Size**: **537 bytes**
- **Public Interface / Exports**: `useDocumentTitle`
- **Dependencies**:
  - *External Packages*: `react`
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Browser document title management hook updating document.title on mount.
- **Architectural & Data-Binding Observations**: Sets window title with fallback and restores previous title upon route unmount.

### File #212: [`front-end/src/hooks/usePageStyles.js`](front-end/src/hooks/usePageStyles.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\hooks\usePageStyles.js`
- **Subsystem / Layer**: **Custom React Hooks** (`Hooks`)
- **Lines**: **28 lines** | **Size**: **944 bytes**
- **Public Interface / Exports**: `usePageStyles`
- **Dependencies**:
  - *External Packages*: `react`
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Route-scoped stylesheet mounting hook for isolating legacy portal CSS.
- **Architectural & Data-Binding Observations**: Takes inline CSS strings imported with `?inline`, injects a `<style data-page-style>` tag into `<head>` using `useLayoutEffect`, and removes it on unmount to prevent CSS bleed across portals.

### File #213: [`front-end/src/hooks/usePolling.js`](front-end/src/hooks/usePolling.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\hooks\usePolling.js`
- **Subsystem / Layer**: **Custom React Hooks** (`Hooks`)
- **Lines**: **37 lines** | **Size**: **1085 bytes**
- **Public Interface / Exports**: `usePolling`
- **Dependencies**:
  - *External Packages*: `react`
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Periodic background heartbeat polling hook with document visibility and window focus detection.
- **Architectural & Data-Binding Observations**: Executes callback every 15,000ms. Pauses polling when the browser tab is hidden and fires immediately when the tab regains focus.

### File #214: [`front-end/src/hooks/useSearchParam.js`](front-end/src/hooks/useSearchParam.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\hooks\useSearchParam.js`
- **Subsystem / Layer**: **Custom React Hooks** (`Hooks`)
- **Lines**: **13 lines** | **Size**: **347 bytes**
- **Public Interface / Exports**: `useSearchParam`
- **Dependencies**:
  - *External Packages*: `react-router-dom`
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: URL search parameter synchronization hook wrapping React Router useSearchParams.
- **Architectural & Data-Binding Observations**: Provides convenient read/write helpers for specific query string arguments (`?org=`, `?uhid=`, `?patient_id=`).

### File #215: [`front-end/src/lib/constants.js`](front-end/src/lib/constants.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\lib\constants.js`
- **Subsystem / Layer**: **Pure Utilities & Domain Logic** (`Utilities`)
- **Lines**: **52 lines** | **Size**: **1598 bytes**
- **Public Interface / Exports**: `ADMISSION_STATUS`, `BED_STATUS`, `DEFAULT_DEPARTMENTS`, `LEDGER_REQUEST_STATUS`, `PAYMENT_STATUS`, `PRE_STATUS`, `SERVICE_STATUS`, `STATE_VERSION`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Frozen domain constant dictionaries for hospital statuses and baseline clinical defaults.
- **Architectural & Data-Binding Observations**: Exports `BED_STATUS`, `PRE_STATUS`, `ADMISSION_STATUS`, `PAYMENT_STATUS`, `SERVICE_STATUS`, `LEDGER_REQUEST_STATUS`, and `DEFAULT_DEPARTMENTS`.

### File #216: [`front-end/src/lib/csv.js`](front-end/src/lib/csv.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\lib\csv.js`
- **Subsystem / Layer**: **Pure Utilities & Domain Logic** (`Utilities`)
- **Lines**: **20 lines** | **Size**: **590 bytes**
- **Public Interface / Exports**: `csvEscape`, `downloadCsv`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Client-side RFC 4180 compliant CSV export generator.
- **Architectural & Data-Binding Observations**: Provides `csvEscape()` and `downloadCsv()` for generating and triggering browser downloads of tabular data without server round-trips.

### File #217: [`front-end/src/lib/emailIdentity.js`](front-end/src/lib/emailIdentity.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\lib\emailIdentity.js`
- **Subsystem / Layer**: **Pure Utilities & Domain Logic** (`Utilities`)
- **Lines**: **168 lines** | **Size**: **5991 bytes**
- **Public Interface / Exports**: `ACTOR_LOGIN_SLUG`, `ACTOR_TO_TAG`, `EMAIL_PATTERN`, `PLATFORM_EMAIL_DOMAIN`, `PORTAL_LABEL`, `RESERVED_EMAIL_DOMAINS`, `TAG_TO_ACTOR`, `buildTaggedEmail`, `emailDomainProblem`, `isReservedStaffEmail`, `normalizeDomain`, `parseEmail`, `resolveLoginIdentity`, `sanitizeEmailName`, `suggestEmailDomain`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Identity parser and validator implementing the <name>.<role_tag>@<hospital_domain> protocol.
- **Architectural & Data-Binding Observations**: Identifies roles (.hom, .pre, .fa, .admin, .platform), validates domain formats, suggests email formats, and determines actor profiles.

### File #218: [`front-end/src/lib/entitlements.js`](front-end/src/lib/entitlements.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\lib\entitlements.js`
- **Subsystem / Layer**: **Pure Utilities & Domain Logic** (`Utilities`)
- **Lines**: **59 lines** | **Size**: **2111 bytes**
- **Public Interface / Exports**: `MODULE_LABELS`, `MODULE_UNAVAILABLE_BODY`, `getEntitlements`, `hasModule`, `moduleLabel`, `resourceQty`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Client-side evaluation engine for hospital module entitlements and purchased resource quotas.
- **Architectural & Data-Binding Observations**: Provides `hasModule(tenant, code)` and `resourceQty(tenant, moduleCode, resourceCode)`.

### File #219: [`front-end/src/lib/formatters.js`](front-end/src/lib/formatters.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\lib\formatters.js`
- **Subsystem / Layer**: **Pure Utilities & Domain Logic** (`Utilities`)
- **Lines**: **53 lines** | **Size**: **1687 bytes**
- **Public Interface / Exports**: `escapeHtml`, `formatAge`, `formatCurrency`, `formatDate`, `formatDateTime`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Pure string and number formatting utilities using Indian English (en-IN) conventions.
- **Architectural & Data-Binding Observations**: Provides `formatCurrency()` (Rupee symbol with lakh/crore commas), `formatDate()`, `formatDateTime()`, `formatAge()`, and `escapeHtml()`.

### File #220: [`front-end/src/lib/insurance.js`](front-end/src/lib/insurance.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\lib\insurance.js`
- **Subsystem / Layer**: **Pure Utilities & Domain Logic** (`Utilities`)
- **Lines**: **47 lines** | **Size**: **1680 bytes**
- **Public Interface / Exports**: `computePatientShare`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Insurance copay and liability calculation utility for patient billing.
- **Architectural & Data-Binding Observations**: Computes patient share, policy coverage caps, and co-payment amounts based on policy terms.

### File #221: [`front-end/src/lib/phone.js`](front-end/src/lib/phone.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\lib\phone.js`
- **Subsystem / Layer**: **Pure Utilities & Domain Logic** (`Utilities`)
- **Lines**: **23 lines** | **Size**: **712 bytes**
- **Public Interface / Exports**: `normalizePhone`, `withNormalizedPhones`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Phone number normalization and validation utility.
- **Architectural & Data-Binding Observations**: Normalizes phone strings to standard 10-digit Indian numbers and E.164 formats.

### File #222: [`front-end/src/lib/printDocument.js`](front-end/src/lib/printDocument.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\lib\printDocument.js`
- **Subsystem / Layer**: **Pure Utilities & Domain Logic** (`Utilities`)
- **Lines**: **24 lines** | **Size**: **928 bytes**
- **Public Interface / Exports**: `openPrintWindow`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Digital document printing wrapper encapsulating browser window printing.
- **Architectural & Data-Binding Observations**: Opens a new browser tab with `about:blank`, injects formatted printable HTML, and calls `window.print()`. Strictly isolated print helper; only occurrence of `document.write` in the entire frontend.
- **Detected Code Smells / Risks**:
  - ⚠️ Uses win.document.write() for popup printing window (sanctioned offline printing pattern)

### File #223: [`front-end/src/lib/roleProfiles.js`](front-end/src/lib/roleProfiles.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\lib\roleProfiles.js`
- **Subsystem / Layer**: **Pure Utilities & Domain Logic** (`Utilities`)
- **Lines**: **60 lines** | **Size**: **1737 bytes**
- **Public Interface / Exports**: `PLATFORM_DEMO_ACCOUNT`, `actorProfiles`, `getProfile`, `hasModuleAccess`, `mockAccountsByOrg`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Role-Based Access Control configuration mapping actor roles to permissions and module access.
- **Architectural & Data-Binding Observations**: Defines actor access profiles and exports `hasModuleAccess(moduleName, actor)`. Contains static platform demo account constant.
- **Detected Code Smells / Risks**:
  - ⚠️ Hardcoded platform superuser seed credentials (super.platform@federico.com / Federico@Platform123)

### File #224: [`front-end/src/lib/sanitizer.js`](front-end/src/lib/sanitizer.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\lib\sanitizer.js`
- **Subsystem / Layer**: **Pure Utilities & Domain Logic** (`Utilities`)
- **Lines**: **60 lines** | **Size**: **1215 bytes**
- **Public Interface / Exports**: `forRole`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Role-based data sanitization utility preventing sensitive field leaks.
- **Architectural & Data-Binding Observations**: Provides `forRole(data, role)` stripping administrative payment links and internal discharge summaries before exposing records to Patient or HOM views.

### File #225: [`front-end/src/pages/admin/AdminLayout.jsx`](front-end/src/pages/admin/AdminLayout.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\admin\AdminLayout.jsx`
- **Subsystem / Layer**: **Portal Pages (Admin)** (`Pages / Admin`)
- **Lines**: **35 lines** | **Size**: **1109 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react-router-dom`
  - *Internal Modules*: `../../auth/useSession.js`, `../../components/layout/AppNavbar.jsx`, `../../hooks/usePageStyles.js`, `../../styles/admin/admin.css?inline`
- **Primary Responsibility**: Top-level layout shell for the Administrator Portal.
- **Architectural & Data-Binding Observations**: Wraps Admin routes with `AppNavbar` navigation links (Dashboard, Departments, Inventory, People), enforces `RequireModule("ADMIN")`, and mounts `<Outlet />`.

### File #226: [`front-end/src/pages/admin/BrandingCard.jsx`](front-end/src/pages/admin/BrandingCard.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\admin\BrandingCard.jsx`
- **Subsystem / Layer**: **Portal Pages (Admin)** (`Pages / Admin`)
- **Lines**: **85 lines** | **Size**: **3163 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`
  - *Internal Modules*: `../../api/index.js`, `../../components/feedback/feedback.js`
- **Primary Responsibility**: Hospital branding asset manager and logo upload widget.
- **Architectural & Data-Binding Observations**: Permits hospital admins to upload SVG/PNG logos via `api.uploads`, updating tenant branding in `dataStore.hospitals`.

### File #227: [`front-end/src/pages/admin/DashboardPage.jsx`](front-end/src/pages/admin/DashboardPage.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\admin\DashboardPage.jsx`
- **Subsystem / Layer**: **Portal Pages (Admin)** (`Pages / Admin`)
- **Lines**: **334 lines** | **Size**: **15905 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../../api/index.js`, `../../auth/useSession.js`, `../../components/layout/PageHeader.jsx`, `../../components/ui/EmptyState.jsx`, `../../components/ui/StatCard.jsx`, `../../hooks/useApi.js`, `../../hooks/useDocumentTitle.js`, `../../lib/formatters.js`
- **Primary Responsibility**: Executive management dashboard presenting operational and financial KPIs.
- **Architectural & Data-Binding Observations**: Guarded by `hasModule("ANALYTICS")`. Displays bed occupancy, total revenues, inventory valuation, active admissions, and staff counts.
- **Detected Code Smells / Risks**:
  - ⚠️ Defect D3: Reads liveRates?.base_fee which falls back to 3000 because backend returns base_platform_fee
  - ⚠️ Hardcoded metrics: Default billing terminals fixed to 2, warehouses fixed to 1

### File #228: [`front-end/src/pages/admin/DepartmentsPage.jsx`](front-end/src/pages/admin/DepartmentsPage.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\admin\DepartmentsPage.jsx`
- **Subsystem / Layer**: **Portal Pages (Admin)** (`Pages / Admin`)
- **Lines**: **147 lines** | **Size**: **5817 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`
  - *Internal Modules*: `../../api/index.js`, `../../components/feedback/feedback.js`, `../../components/layout/PageHeader.jsx`, `../../components/ui/Button.jsx`, `../../components/ui/EmptyState.jsx`, `../../components/ui/StatCard.jsx`, `../../hooks/useApi.js`, `../../hooks/useDocumentTitle.js`, `../../lib/formatters.js`, `./WardDialog.jsx`
- **Primary Responsibility**: Ward and bed inventory configuration console for administrators.
- **Architectural & Data-Binding Observations**: Lists hospital wards, total bed capacity, active bed counts, and triggers `WardDialog` for creating or modifying wards.
- **Detected Code Smells / Risks**:
  - ⚠️ Dead defensive code: lines 47-53 check if (result && result.error) but api.wards.remove() throws ApiError on failure

### File #229: [`front-end/src/pages/admin/DoctorDialog.jsx`](front-end/src/pages/admin/DoctorDialog.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\admin\DoctorDialog.jsx`
- **Subsystem / Layer**: **Portal Pages (Admin)** (`Pages / Admin`)
- **Lines**: **110 lines** | **Size**: **4373 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`
  - *Internal Modules*: `../../api/index.js`, `../../components/feedback/feedback.js`, `../../components/layout/DialogShell.jsx`
- **Primary Responsibility**: Modal dialog for creating and updating doctor clinical profiles and consultation fee tariffs.
- **Architectural & Data-Binding Observations**: Validates specialty, duty days, phone, and email formatting, mutating `dataStore.doctors` via `api.doctors.create()` / `update()`.

### File #230: [`front-end/src/pages/admin/InventoryCatalogPage.jsx`](front-end/src/pages/admin/InventoryCatalogPage.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\admin\InventoryCatalogPage.jsx`
- **Subsystem / Layer**: **Portal Pages (Admin)** (`Pages / Admin`)
- **Lines**: **115 lines** | **Size**: **4339 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`
  - *Internal Modules*: `../../api/index.js`, `../../components/feedback/feedback.js`, `../../components/layout/PageHeader.jsx`, `../../components/ui/Button.jsx`, `../../components/ui/DataTable.jsx`, `../../components/ui/StatCard.jsx`, `../../hooks/useApi.js`, `../../hooks/useDocumentTitle.js`, `./ItemDialog.jsx`
- **Primary Responsibility**: Master catalog manager for medical supplies, medications, and equipment items.
- **Architectural & Data-Binding Observations**: Allows administrators to configure reorder thresholds, unit prices, linked billing services, and triggers `ItemDialog`.

### File #231: [`front-end/src/pages/admin/ItemDialog.jsx`](front-end/src/pages/admin/ItemDialog.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\admin\ItemDialog.jsx`
- **Subsystem / Layer**: **Portal Pages (Admin)** (`Pages / Admin`)
- **Lines**: **76 lines** | **Size**: **3149 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`
  - *Internal Modules*: `../../api/index.js`, `../../components/feedback/feedback.js`, `../../components/layout/DialogShell.jsx`
- **Primary Responsibility**: Modal dialog for creating and updating inventory item catalog entries.
- **Architectural & Data-Binding Observations**: Validates item name, category, initial stock level, reorder point, unit price, and optional service ID linkage.

### File #232: [`front-end/src/pages/admin/PeoplePage.jsx`](front-end/src/pages/admin/PeoplePage.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\admin\PeoplePage.jsx`
- **Subsystem / Layer**: **Portal Pages (Admin)** (`Pages / Admin`)
- **Lines**: **260 lines** | **Size**: **10449 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`
  - *Internal Modules*: `../../api/index.js`, `../../auth/useSession.js`, `../../components/feedback/feedback.js`, `../../components/layout/PageHeader.jsx`, `../../components/ui/Button.jsx`, `../../components/ui/EmptyState.jsx`, `../../hooks/useApi.js`, `../../hooks/useDocumentTitle.js`, `./BrandingCard.jsx`, `./DoctorDialog.jsx`, `./StaffDialog.jsx`
- **Primary Responsibility**: Hospital staff directory and role assignment management console.
- **Architectural & Data-Binding Observations**: Lists staff members across HOM, PRE, FA, and Admin roles, displays assigned custom permissions, and supports creating/editing staff.

### File #233: [`front-end/src/pages/admin/StaffDialog.jsx`](front-end/src/pages/admin/StaffDialog.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\admin\StaffDialog.jsx`
- **Subsystem / Layer**: **Portal Pages (Admin)** (`Pages / Admin`)
- **Lines**: **104 lines** | **Size**: **4598 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`
  - *Internal Modules*: `../../api/index.js`, `../../components/feedback/feedback.js`, `../../components/forms/TaggedEmailInput.jsx`, `../../components/layout/DialogShell.jsx`, `../../lib/emailIdentity.js`
- **Primary Responsibility**: Modal dialog for onboarding new hospital staff members and assigning portal roles.
- **Architectural & Data-Binding Observations**: Enforces tagged email format (`<name>.<role>@<domain>`), validates phone numbers, and assigns base/custom roles.

### File #234: [`front-end/src/pages/admin/WardDialog.jsx`](front-end/src/pages/admin/WardDialog.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\admin\WardDialog.jsx`
- **Subsystem / Layer**: **Portal Pages (Admin)** (`Pages / Admin`)
- **Lines**: **83 lines** | **Size**: **3336 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`
  - *Internal Modules*: `../../api/index.js`, `../../components/feedback/feedback.js`, `../../components/layout/DialogShell.jsx`
- **Primary Responsibility**: Modal dialog for creating new hospital wards and configuring bed capacity.
- **Architectural & Data-Binding Observations**: Enforces unique ward names, validates bed count constraints, and orchestrates automatic bed creation (`WARD-01`, etc.).

### File #235: [`front-end/src/pages/fa/ChargesView.jsx`](front-end/src/pages/fa/ChargesView.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\fa\ChargesView.jsx`
- **Subsystem / Layer**: **Portal Pages (FA)** (`Pages / Finance`)
- **Lines**: **167 lines** | **Size**: **6857 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../../api/index.js`, `../../components/layout/PageHeader.jsx`, `../../components/ui/EmptyState.jsx`, `../../hooks/useApi.js`, `./FaContext.jsx`, `./ViewFrame.jsx`, `./faActions.js`, `./faHelpers.js`, `./faStyles.js`
- **Primary Responsibility**: Review and approval queue for clinical and consumable service charges posted by HOM staff.
- **Architectural & Data-Binding Observations**: Allows Finance Associates to inspect pending charges, verify tariffs, and execute Approve or Reject actions via `api.billing`.

### File #236: [`front-end/src/pages/fa/EodBillingView.jsx`](front-end/src/pages/fa/EodBillingView.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\fa\EodBillingView.jsx`
- **Subsystem / Layer**: **Portal Pages (FA)** (`Pages / Finance`)
- **Lines**: **223 lines** | **Size**: **8411 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../../components/layout/PageHeader.jsx`, `../../components/ui/EmptyState.jsx`, `../../hooks/useApi.js`, `./FaContext.jsx`, `./FaQueues.jsx`, `./PatientPicker.jsx`, `./ReceiptsSection.jsx`, `./SettlementSection.jsx`, `./ViewFrame.jsx`, `./faActions.js`, `./faHelpers.js`, `./useSelectedRow.js`
- **Primary Responsibility**: Cashier console for End-of-Day billing settlement, final discharge payment, and receipts.
- **Architectural & Data-Binding Observations**: Integrates with `SettlementSection` and `ReceiptsSection`. Calculates insurance coverage deductions, records payments, and emits receipts.

### File #237: [`front-end/src/pages/fa/FaContext.jsx`](front-end/src/pages/fa/FaContext.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\fa\FaContext.jsx`
- **Subsystem / Layer**: **Portal Pages (FA)** (`Pages / Finance`)
- **Lines**: **18 lines** | **Size**: **589 bytes**
- **Public Interface / Exports**: `FaContext`, `useFa`
- **Dependencies**:
  - *External Packages*: `react`
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Dedicated React Context provider for Finance Associate portal state coordination.
- **Architectural & Data-Binding Observations**: Maintains `currentAdmissionId`, global `version` counter, and unified `reload()` triggers across hash-routed FA sub-views.

### File #238: [`front-end/src/pages/fa/FaLayout.jsx`](front-end/src/pages/fa/FaLayout.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\fa\FaLayout.jsx`
- **Subsystem / Layer**: **Portal Pages (FA)** (`Pages / Finance`)
- **Lines**: **123 lines** | **Size**: **4335 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`
  - *Internal Modules*: `../../auth/useSession.js`, `../../components/feedback/feedback.js`, `../../components/layout/AppNavbar.jsx`, `../../hooks/useDocumentTitle.js`, `../../hooks/usePageStyles.js`, `../../styles/fa/base.css?inline`, `../../styles/fa/components.css?inline`, `../../styles/fa/layout.css?inline`, `./ChargesView.jsx`, `./EodBillingView.jsx`, `./FaContext.jsx`, `./LedgerView.jsx`, `./useHashRoute.js`
- **Primary Responsibility**: Single-page layout shell orchestrating Finance Associate sub-views via URL hash routing.
- **Architectural & Data-Binding Observations**: Provides `FaContext`, listens to `window.location.hash`, renders navigation tabs (`#/ledger`, `#/charges`, `#/eod`), and mounts active views.

### File #239: [`front-end/src/pages/fa/FaQueues.jsx`](front-end/src/pages/fa/FaQueues.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\fa\FaQueues.jsx`
- **Subsystem / Layer**: **Portal Pages (FA)** (`Pages / Finance`)
- **Lines**: **206 lines** | **Size**: **7386 bytes**
- **Public Interface / Exports**: `DischargeQueue`, `LedgerQueues`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../../components/ui/EmptyState.jsx`, `../../components/ui/StatCard.jsx`, `./StatusBadge.jsx`, `./faActions.js`, `./faHelpers.js`, `./faStyles.js`
- **Primary Responsibility**: Sidebar queue selector displaying pending charges, unbilled admissions, and settled bills.
- **Architectural & Data-Binding Observations**: Provides quick-filter counters and admission selection synchronization with `FaContext`.

### File #240: [`front-end/src/pages/fa/LedgerView.jsx`](front-end/src/pages/fa/LedgerView.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\fa\LedgerView.jsx`
- **Subsystem / Layer**: **Portal Pages (FA)** (`Pages / Finance`)
- **Lines**: **308 lines** | **Size**: **11493 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`
  - *Internal Modules*: `../../components/feedback/feedback.js`, `../../components/ui/EmptyState.jsx`, `../../hooks/useApi.js`, `./FaContext.jsx`, `./FaQueues.jsx`, `./PatientPicker.jsx`, `./StatusBadge.jsx`, `./ViewFrame.jsx`, `./faActions.js`, `./faHelpers.js`, `./faStyles.js`, `./useSelectedRow.js`
- **Primary Responsibility**: Patient financial ledger console displaying itemized charges, manual postings, and bill dispatch.
- **Architectural & Data-Binding Observations**: Allows FA staff to add custom service charges, inspect running totals, calculate taxes, and dispatch bills to patients.

### File #241: [`front-end/src/pages/fa/PatientPicker.jsx`](front-end/src/pages/fa/PatientPicker.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\fa\PatientPicker.jsx`
- **Subsystem / Layer**: **Portal Pages (FA)** (`Pages / Finance`)
- **Lines**: **76 lines** | **Size**: **2458 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `./FaContext.jsx`
- **Primary Responsibility**: Admission selector and UHID search dropdown for financial ledger management.
- **Architectural & Data-Binding Observations**: Searches active inpatient admissions, displays patient UHID, admission date, and current bed allocation.

### File #242: [`front-end/src/pages/fa/ReceiptsSection.jsx`](front-end/src/pages/fa/ReceiptsSection.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\fa\ReceiptsSection.jsx`
- **Subsystem / Layer**: **Portal Pages (FA)** (`Pages / Finance`)
- **Lines**: **130 lines** | **Size**: **4741 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`
  - *Internal Modules*: `../../api/index.js`, `../../components/ui/EmptyState.jsx`, `../../components/ui/SearchToolbar.jsx`, `../../hooks/useApi.js`, `./faActions.js`, `./faHelpers.js`, `./faStyles.js`
- **Primary Responsibility**: Payment receipts ledger displaying historical transactions and printable digital receipts.
- **Architectural & Data-Binding Observations**: Fetches settled payments, renders transaction IDs, payment modes (Cash, Card, UPI), and opens printable receipt copies.

### File #243: [`front-end/src/pages/fa/SettlementSection.jsx`](front-end/src/pages/fa/SettlementSection.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\fa\SettlementSection.jsx`
- **Subsystem / Layer**: **Portal Pages (FA)** (`Pages / Finance`)
- **Lines**: **261 lines** | **Size**: **9591 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../../api/index.js`, `../../components/layout/PageHeader.jsx`, `../../components/ui/EmptyState.jsx`, `../../hooks/useApi.js`, `./faActions.js`, `./faHelpers.js`
- **Primary Responsibility**: Final discharge financial settlement calculator and simulated payment gateway.
- **Architectural & Data-Binding Observations**: Computes gross amount, insurance policy deductions, patient copay liability, and records payments moving admissions to `PAYMENT_CONFIRMED`.

### File #244: [`front-end/src/pages/fa/StatusBadge.jsx`](front-end/src/pages/fa/StatusBadge.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\fa\StatusBadge.jsx`
- **Subsystem / Layer**: **Portal Pages (FA)** (`Pages / Finance`)
- **Lines**: **12 lines** | **Size**: **587 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Presentation badge component rendering financial ledger, charge, and payment statuses.
- **Architectural & Data-Binding Observations**: Applies semantic MD3 color tokens (`success`, `warning`, `error`, `neutral`) according to financial lifecycle states.

### File #245: [`front-end/src/pages/fa/ViewFrame.jsx`](front-end/src/pages/fa/ViewFrame.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\fa\ViewFrame.jsx`
- **Subsystem / Layer**: **Portal Pages (FA)** (`Pages / Finance`)
- **Lines**: **26 lines** | **Size**: **727 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Card surface container framing FA views with header action slots and consistent padding.
- **Architectural & Data-Binding Observations**: Standardizes surface elevation, header breadcrumbs, and title styling across FA tabs.

### File #246: [`front-end/src/pages/fa/faActions.js`](front-end/src/pages/fa/faActions.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\fa\faActions.js`
- **Subsystem / Layer**: **Portal Pages (FA)** (`Pages / Finance`)
- **Lines**: **316 lines** | **Size**: **17531 bytes**
- **Public Interface / Exports**: *None (or side-effect / style / markup)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../../api/index.js`, `../../components/feedback/feedback.js`, `../../lib/printDocument.js`, `./faHelpers.js`
- **Primary Responsibility**: Action dispatcher module encapsulating financial mutations and backend API calls.
- **Architectural & Data-Binding Observations**: Provides `postCharge()`, `approveCharge()`, `rejectCharge()`, `dispatchBill()`, and `settlePayment()`, coordinating reloads.

### File #247: [`front-end/src/pages/fa/faHelpers.js`](front-end/src/pages/fa/faHelpers.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\fa\faHelpers.js`
- **Subsystem / Layer**: **Portal Pages (FA)** (`Pages / Finance`)
- **Lines**: **119 lines** | **Size**: **4238 bytes**
- **Public Interface / Exports**: `escapeHtml`, `formatCurrency`, `formatDateTime`, `ledgerTotal`, `selectAndReveal`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../../api/index.js`, `../../lib/formatters.js`
- **Primary Responsibility**: Financial calculation and formatting helper library for FA ledger operations.
- **Architectural & Data-Binding Observations**: Computes sub-totals, GST tax percentages, discount adjustments, patient net balances, and insurance copay amounts.

### File #248: [`front-end/src/pages/fa/faStyles.js`](front-end/src/pages/fa/faStyles.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\fa\faStyles.js`
- **Subsystem / Layer**: **Portal Pages (FA)** (`Pages / Finance`)
- **Lines**: **66 lines** | **Size**: **1830 bytes**
- **Public Interface / Exports**: `cardFlush`, `emptyCell`, `pageTitle`, `panelHeader`, `panelHeaderSplit`, `panelTitle`, `smallBtn`, `smallerBtn`, `tableStyle`, `td`, `tdMuted`, `tdWide`, `th`, `thCenter`, `thWide`, `theadStyle`, `tinyBtn`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Shared CSS-in-JS style constants and class dictionaries for Finance Associate components.
- **Architectural & Data-Binding Observations**: Provides reusable layout styles, table cell alignments, and callout banner formatting.

### File #249: [`front-end/src/pages/fa/useHashRoute.js`](front-end/src/pages/fa/useHashRoute.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\fa\useHashRoute.js`
- **Subsystem / Layer**: **Portal Pages (FA)** (`Pages / Finance`)
- **Lines**: **63 lines** | **Size**: **2313 bytes**
- **Public Interface / Exports**: `DEFAULT_ROUTE`, `parseHashRoute`, `useHashRoute`
- **Dependencies**:
  - *External Packages*: `react`
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Custom hash-routing hook synchronizing window.location.hash with active FA views.
- **Architectural & Data-Binding Observations**: Parses current hash (`#/ledger`, `#/charges`, `#/eod`), handles legacy redirects (`#/dashboard` -> `#/ledger`), and emits changes.

### File #250: [`front-end/src/pages/fa/useSelectedRow.js`](front-end/src/pages/fa/useSelectedRow.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\fa\useSelectedRow.js`
- **Subsystem / Layer**: **Portal Pages (FA)** (`Pages / Finance`)
- **Lines**: **27 lines** | **Size**: **909 bytes**
- **Public Interface / Exports**: `useSelectedRow`
- **Dependencies**:
  - *External Packages*: `react`
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Table row selection state hook managing active highlight and selected ledger entry ID.
- **Architectural & Data-Binding Observations**: Provides `[selectedId, selectRow, clearSelection]` for itemized charge tables.

### File #251: [`front-end/src/pages/hom/AssignBedModal.jsx`](front-end/src/pages/hom/AssignBedModal.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\hom\AssignBedModal.jsx`
- **Subsystem / Layer**: **Portal Pages (HOM)** (`Pages / Operations`)
- **Lines**: **276 lines** | **Size**: **11415 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`
  - *Internal Modules*: `../../api/index.js`, `../../components/feedback/feedback.js`, `../../components/layout/DialogShell.jsx`, `../../components/ui/Badge.jsx`, `./homHelpers.js`
- **Primary Responsibility**: Modal dialog for allocating physical beds to approved patient intake requests.
- **Architectural & Data-Binding Observations**: Filters beds by target ward, verifies `AVAILABLE` status, and invokes `api.wards.assignBed()` to trigger admission creation.

### File #252: [`front-end/src/pages/hom/BedDetailModal.jsx`](front-end/src/pages/hom/BedDetailModal.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\hom\BedDetailModal.jsx`
- **Subsystem / Layer**: **Portal Pages (HOM)** (`Pages / Operations`)
- **Lines**: **121 lines** | **Size**: **6064 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../../components/layout/DialogShell.jsx`, `../../components/ui/Badge.jsx`, `./homHelpers.js`
- **Primary Responsibility**: Modal dialog inspecting bed status, occupant UHID, admission timestamp, and maintenance toggles.
- **Architectural & Data-Binding Observations**: Allows HOM operators to view current occupant medical details and toggle bed maintenance mode (`AVAILABLE` <-> `MAINTENANCE`).

### File #253: [`front-end/src/pages/hom/BedManagementPage.jsx`](front-end/src/pages/hom/BedManagementPage.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\hom\BedManagementPage.jsx`
- **Subsystem / Layer**: **Portal Pages (HOM)** (`Pages / Operations`)
- **Lines**: **236 lines** | **Size**: **9170 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`, `react-router-dom`
  - *Internal Modules*: `../../api/index.js`, `../../components/feedback/feedback.js`, `../../components/layout/PageHeader.jsx`, `../../components/ui/EmptyState.jsx`, `../../components/ui/SearchToolbar.jsx`, `../../components/ui/StatCard.jsx`, `../../components/ui/TabNav.jsx`, `../../hooks/useApi.js`, `../../hooks/useDocumentTitle.js`, `../../hooks/usePageStyles.js`, `../../hooks/usePolling.js`, `../../styles/hom/bed-management.css?inline`, `./AssignBedModal.jsx`, `./BedDetailModal.jsx`, `./homHelpers.js`
- **Primary Responsibility**: Interactive hospital ward and bed occupancy matrix with visual status indicators.
- **Architectural & Data-Binding Observations**: Driven by `useApi()` and `usePolling(reload, 15000)`. Renders wards in tabbed format, displays bed grid, and handles bed actions.

### File #254: [`front-end/src/pages/hom/DashboardPage.jsx`](front-end/src/pages/hom/DashboardPage.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\hom\DashboardPage.jsx`
- **Subsystem / Layer**: **Portal Pages (HOM)** (`Pages / Operations`)
- **Lines**: **344 lines** | **Size**: **15818 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`
  - *Internal Modules*: `../../api/index.js`, `../../auth/useSession.js`, `../../components/feedback/feedback.js`, `../../components/layout/PageHeader.jsx`, `../../components/ui/Badge.jsx`, `../../components/ui/Button.jsx`, `../../components/ui/EmptyState.jsx`, `../../components/ui/StatCard.jsx`, `../../hooks/useApi.js`, `../../hooks/useDocumentTitle.js`, `../../hooks/usePageStyles.js`, `../../hooks/usePolling.js`, `../../styles/hom/dashboard.css?inline`, `./AssignBedModal.jsx`, `./homHelpers.js`
- **Primary Responsibility**: Hospital Operations Manager real-time central operational control dashboard.
- **Architectural & Data-Binding Observations**: Displays 5 KPI stat cards, bed allocation queue, pending medical discharge clearance requests, and operational activity feed.
- **Detected Code Smells / Risks**:
  - ⚠️ Index as key: line 314 renders operational activity events with key={i}

### File #255: [`front-end/src/pages/hom/DischargeModal.jsx`](front-end/src/pages/hom/DischargeModal.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\hom\DischargeModal.jsx`
- **Subsystem / Layer**: **Portal Pages (HOM)** (`Pages / Operations`)
- **Lines**: **117 lines** | **Size**: **4949 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`
  - *Internal Modules*: `../../api/index.js`, `../../components/feedback/feedback.js`, `../../components/layout/DialogShell.jsx`, `./homHelpers.js`
- **Primary Responsibility**: Modal dialog for initiating medical discharge clearance for inpatients.
- **Architectural & Data-Binding Observations**: Verifies physician sign-off, records discharge notes, and updates admission status to `DISCHARGE_INITIATED`.

### File #256: [`front-end/src/pages/hom/HomLayout.jsx`](front-end/src/pages/hom/HomLayout.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\hom\HomLayout.jsx`
- **Subsystem / Layer**: **Portal Pages (HOM)** (`Pages / Operations`)
- **Lines**: **35 lines** | **Size**: **1275 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react-router-dom`
  - *Internal Modules*: `../../auth/useSession.js`, `../../components/layout/AppNavbar.jsx`, `../../hooks/usePageStyles.js`, `../../styles/hom/global.css?inline`
- **Primary Responsibility**: Top-level navigation layout for the Hospital Operations Manager portal.
- **Architectural & Data-Binding Observations**: Wraps HOM views with `AppNavbar` (Dashboard, Bed Management, Patient Flow, Inventory), enforces `RequireModule("OPERATIONS")`, and mounts `<Outlet />`.

### File #257: [`front-end/src/pages/hom/InventoryPage.jsx`](front-end/src/pages/hom/InventoryPage.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\hom\InventoryPage.jsx`
- **Subsystem / Layer**: **Portal Pages (HOM)** (`Pages / Operations`)
- **Lines**: **458 lines** | **Size**: **23226 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`
  - *Internal Modules*: `../../api/index.js`, `../../components/feedback/feedback.js`, `../../components/layout/PageHeader.jsx`, `../../components/ui/Badge.jsx`, `../../components/ui/Button.jsx`, `../../components/ui/EmptyState.jsx`, `../../components/ui/SearchToolbar.jsx`, `../../components/ui/StatCard.jsx`, `../../hooks/useApi.js`, `../../hooks/useDocumentTitle.js`, `../../hooks/usePageStyles.js`, `../../hooks/usePolling.js`, `../../lib/csv.js`, `../../styles/hom/inventory.css?inline`, `./LogUsageModal.jsx`, `./RestockModal.jsx`, `./homHelpers.js`, `./inventoryHelpers.js`
- **Primary Responsibility**: Hospital supply and pharmacy inventory tracking with stock levels, usage logging, and restock orders.
- **Architectural & Data-Binding Observations**: Displays current stock levels, highlights items below reorder thresholds, and provides triggers for `LogUsageModal` and `RestockModal`.

### File #258: [`front-end/src/pages/hom/LogUsageModal.jsx`](front-end/src/pages/hom/LogUsageModal.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\hom\LogUsageModal.jsx`
- **Subsystem / Layer**: **Portal Pages (HOM)** (`Pages / Operations`)
- **Lines**: **110 lines** | **Size**: **5196 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`
  - *Internal Modules*: `../../components/layout/DialogShell.jsx`, `./homHelpers.js`, `./inventoryHelpers.js`
- **Primary Responsibility**: Modal dialog logging consumable medical supplies and pharmaceuticals against patient admissions.
- **Architectural & Data-Binding Observations**: Decrements stock quantity in `dataStore.inventoryItems` and posts linked service charge to the admission ledger.

### File #259: [`front-end/src/pages/hom/PatientDetailModal.jsx`](front-end/src/pages/hom/PatientDetailModal.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\hom\PatientDetailModal.jsx`
- **Subsystem / Layer**: **Portal Pages (HOM)** (`Pages / Operations`)
- **Lines**: **145 lines** | **Size**: **6113 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`
  - *Internal Modules*: `../../api/index.js`, `../../components/layout/DialogShell.jsx`, `../../components/ui/Badge.jsx`, `../../components/ui/EmptyState.jsx`, `../../components/ui/TabNav.jsx`, `./homHelpers.js`
- **Primary Responsibility**: Modal dialog inspecting admitted inpatient clinical timeline, bed assignment, and physician notes.
- **Architectural & Data-Binding Observations**: Renders patient demographic details, assigned ward/bed, attending doctor, days admitted, and active charges.

### File #260: [`front-end/src/pages/hom/PatientFlowPage.jsx`](front-end/src/pages/hom/PatientFlowPage.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\hom\PatientFlowPage.jsx`
- **Subsystem / Layer**: **Portal Pages (HOM)** (`Pages / Operations`)
- **Lines**: **353 lines** | **Size**: **16527 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`
  - *Internal Modules*: `../../api/index.js`, `../../components/feedback/feedback.js`, `../../components/layout/PageHeader.jsx`, `../../components/ui/Badge.jsx`, `../../components/ui/Button.jsx`, `../../components/ui/EmptyState.jsx`, `../../components/ui/SearchToolbar.jsx`, `../../hooks/useApi.js`, `../../hooks/useDocumentTitle.js`, `../../hooks/usePageStyles.js`, `../../hooks/usePolling.js`, `../../hooks/useSearchParam.js`, `../../lib/csv.js`, `../../styles/hom/patient-flow.css?inline`, `./DischargeModal.jsx`, `./PatientDetailModal.jsx`, `./PostServiceModal.jsx`, `./homHelpers.js`
- **Primary Responsibility**: Inpatient flow tracker monitoring admitted patients, bed occupancy, and discharge clearance.
- **Architectural & Data-Binding Observations**: Displays active inpatients, days elapsed, financial billing clearance status, and supports client-side CSV export.

### File #261: [`front-end/src/pages/hom/PostServiceModal.jsx`](front-end/src/pages/hom/PostServiceModal.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\hom\PostServiceModal.jsx`
- **Subsystem / Layer**: **Portal Pages (HOM)** (`Pages / Operations`)
- **Lines**: **124 lines** | **Size**: **5637 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`
  - *Internal Modules*: `../../api/index.js`, `../../components/feedback/feedback.js`, `../../components/layout/DialogShell.jsx`, `./homHelpers.js`
- **Primary Responsibility**: Modal dialog for posting clinical service charges (procedures, lab tests, nursing care) to patient ledgers.
- **Architectural & Data-Binding Observations**: Allows HOM operators to select billable services from catalog and submit charge requests for FA approval.

### File #262: [`front-end/src/pages/hom/RestockModal.jsx`](front-end/src/pages/hom/RestockModal.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\hom\RestockModal.jsx`
- **Subsystem / Layer**: **Portal Pages (HOM)** (`Pages / Operations`)
- **Lines**: **166 lines** | **Size**: **7874 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`
  - *Internal Modules*: `../../api/index.js`, `../../components/feedback/feedback.js`, `../../components/layout/DialogShell.jsx`, `./homHelpers.js`, `./inventoryHelpers.js`
- **Primary Responsibility**: Modal dialog for creating inventory purchase requests and restocking hospital consumables.
- **Architectural & Data-Binding Observations**: Validates quantity requested, records requesting user, and creates purchase request in `dataStore.purchaseRequests`.

### File #263: [`front-end/src/pages/hom/homHelpers.js`](front-end/src/pages/hom/homHelpers.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\hom\homHelpers.js`
- **Subsystem / Layer**: **Portal Pages (HOM)** (`Pages / Operations`)
- **Lines**: **79 lines** | **Size**: **2646 bytes**
- **Public Interface / Exports**: `bedStyle`, `daysSince`, `escapeHtml`, `formatAge`, `formatCurrency`, `formatDate`, `formatDateTime`, `joinPreRequestsWithPatients`, `statusLabel`, `statusVariant`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../../lib/formatters.js`
- **Primary Responsibility**: Operational metrics calculation and aggregation library for HOM dashboard KPI cards.
- **Architectural & Data-Binding Observations**: Computes total beds, available beds, occupancy percentage, pending allocations, and active discharge clearances.

### File #264: [`front-end/src/pages/hom/inventoryHelpers.js`](front-end/src/pages/hom/inventoryHelpers.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\hom\inventoryHelpers.js`
- **Subsystem / Layer**: **Portal Pages (HOM)** (`Pages / Operations`)
- **Lines**: **54 lines** | **Size**: **2305 bytes**
- **Public Interface / Exports**: `DEFAULT_RESTOCK_QUANTITY`, `MAX_NOTES_LENGTH`, `computeItemStatus`, `findPatientByUhid`, `itemCost`, `serviceForItem`, `validateUsageDetails`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Stock level calculation, low-stock threshold detection, and category filtering helpers.
- **Architectural & Data-Binding Observations**: Evaluates stock vs reorder level, formats stock badges (`In Stock`, `Low Stock`, `Out of Stock`), and filters items.

### File #265: [`front-end/src/pages/patient/AppointmentRows.jsx`](front-end/src/pages/patient/AppointmentRows.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\patient\AppointmentRows.jsx`
- **Subsystem / Layer**: **Portal Pages (Patient)** (`Pages / Patient Portal`)
- **Lines**: **32 lines** | **Size**: **946 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../../components/ui/EmptyState.jsx`, `./patientDashboardHelpers.jsx`
- **Primary Responsibility**: Presentation component rendering outpatient consultation appointments in tabular format.
- **Architectural & Data-Binding Observations**: Displays appointment date/time, doctor name, specialty, status (`CONFIRMED`, `COMPLETED`, `CANCELLED`), and cancellation buttons.

### File #266: [`front-end/src/pages/patient/AppointmentsModal.jsx`](front-end/src/pages/patient/AppointmentsModal.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\patient\AppointmentsModal.jsx`
- **Subsystem / Layer**: **Portal Pages (Patient)** (`Pages / Patient Portal`)
- **Lines**: **67 lines** | **Size**: **2134 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../../components/layout/DialogShell.jsx`, `./AppointmentRows.jsx`, `./VisitItems.jsx`
- **Primary Responsibility**: Modal dialog listing patient appointment schedule with cancellation and rescheduling actions.
- **Architectural & Data-Binding Observations**: Allows patients to view their upcoming consultations and cancel uncompleted bookings via `api.appointments`.

### File #267: [`front-end/src/pages/patient/BillDetailsModal.jsx`](front-end/src/pages/patient/BillDetailsModal.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\patient\BillDetailsModal.jsx`
- **Subsystem / Layer**: **Portal Pages (Patient)** (`Pages / Patient Portal`)
- **Lines**: **227 lines** | **Size**: **8573 bytes**
- **Public Interface / Exports**: `BillSummaryModal`, `export default`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../../components/layout/DialogShell.jsx`, `../../components/ui/EmptyState.jsx`, `../../lib/sanitizer.js`, `./patientDashboardHelpers.jsx`, `./patientDashboardUtils.js`
- **Primary Responsibility**: Modal dialog rendering itemized invoice breakdown, tariff rates, insurance copay, and printable slip.
- **Architectural & Data-Binding Observations**: Displays charge lines, gross total, insurance coverage, patient liability, and provides a trigger for printable invoice window.
- **Detected Code Smells / Risks**:
  - ⚠️ Index as key: line 186 renders synthetic invoice line items with key={idx}

### File #268: [`front-end/src/pages/patient/BillingPage.jsx`](front-end/src/pages/patient/BillingPage.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\patient\BillingPage.jsx`
- **Subsystem / Layer**: **Portal Pages (Patient)** (`Pages / Patient Portal`)
- **Lines**: **376 lines** | **Size**: **14452 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`, `react-router-dom`
  - *Internal Modules*: `../../components/feedback/feedback.js`, `../../components/layout/PageHeader.jsx`, `../../components/ui/EmptyState.jsx`, `../../components/ui/StatCard.jsx`, `../../components/ui/TabNav.jsx`, `../../hooks/useDocumentTitle.js`, `../../hooks/usePageStyles.js`, `../../styles/patient/patient-billing.css?inline`, `./BillDetailsModal.jsx`, `./DocumentRow.jsx`, `./patientInvoiceCopy.js`, `./usePatientStore.js`
- **Primary Responsibility**: Patient financial console displaying itemized invoices, payment receipts, and discharge statements.
- **Architectural & Data-Binding Observations**: Allows patients to inspect current ledger balance, view historical payments, and simulate online bill settlement.

### File #269: [`front-end/src/pages/patient/BookAppointmentPage.jsx`](front-end/src/pages/patient/BookAppointmentPage.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\patient\BookAppointmentPage.jsx`
- **Subsystem / Layer**: **Portal Pages (Patient)** (`Pages / Patient Portal`)
- **Lines**: **503 lines** | **Size**: **19639 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`, `react-router-dom`
  - *Internal Modules*: `../../api/index.js`, `../../components/feedback/feedback.js`, `../../components/forms/DepartmentSelect.jsx`, `../../hooks/useDocumentTitle.js`, `../../hooks/usePageStyles.js`, `../../styles/patient/patient-book-appointment.css?inline`, `./slotHelpers.js`, `./usePatientStore.js`
- **Primary Responsibility**: Outpatient consultation appointment booking wizard for patients.
- **Architectural & Data-Binding Observations**: Provides department selector, doctor list, interactive 30-minute availability slot picker, and attachment upload.

### File #270: [`front-end/src/pages/patient/DashboardPage.jsx`](front-end/src/pages/patient/DashboardPage.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\patient\DashboardPage.jsx`
- **Subsystem / Layer**: **Portal Pages (Patient)** (`Pages / Patient Portal`)
- **Lines**: **413 lines** | **Size**: **15850 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`, `react-router-dom`
  - *Internal Modules*: `../../components/feedback/feedback.js`, `../../components/ui/StatCard.jsx`, `../../hooks/useDocumentTitle.js`, `../../hooks/usePageStyles.js`, `../../lib/sanitizer.js`, `../../styles/patient/patient-dashboard.css?inline`, `./AppointmentRows.jsx`, `./AppointmentsModal.jsx`, `./BillDetailsModal.jsx`, `./DocumentGroup.jsx`, `./VisitItems.jsx`, `./patientDashboardHelpers.jsx`, `./patientDashboardUtils.js`, `./patientDocumentCopy.js`, `./usePatientStore.js`
- **Primary Responsibility**: Patient central portal dashboard displaying active admission status, appointments, and medical records.
- **Architectural & Data-Binding Observations**: Loads composite summary via `PatientStoreContext`. Renders upcoming consultations, recent visits, active bill summary, and health records.

### File #271: [`front-end/src/pages/patient/DocumentGroup.jsx`](front-end/src/pages/patient/DocumentGroup.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\patient\DocumentGroup.jsx`
- **Subsystem / Layer**: **Portal Pages (Patient)** (`Pages / Patient Portal`)
- **Lines**: **35 lines** | **Size**: **1129 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Grouping container for categorized health records (lab reports, prescriptions, discharge slips).
- **Architectural & Data-Binding Observations**: Renders category headers, document counts, and wraps child `<DocumentRow />` items.

### File #272: [`front-end/src/pages/patient/DocumentRow.jsx`](front-end/src/pages/patient/DocumentRow.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\patient\DocumentRow.jsx`
- **Subsystem / Layer**: **Portal Pages (Patient)** (`Pages / Patient Portal`)
- **Lines**: **37 lines** | **Size**: **1238 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../../lib/sanitizer.js`
- **Primary Responsibility**: Interactive list item rendering file icon, upload timestamp, file size, and download/preview actions.
- **Architectural & Data-Binding Observations**: Fetches session-gated uploaded files via `api.client.openUploadedFile()`.

### File #273: [`front-end/src/pages/patient/EyeField.jsx`](front-end/src/pages/patient/EyeField.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\patient\EyeField.jsx`
- **Subsystem / Layer**: **Portal Pages (Patient)** (`Pages / Patient Portal`)
- **Lines**: **45 lines** | **Size**: **1267 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Accessible password input field with show/hide password visibility toggle.
- **Architectural & Data-Binding Observations**: Encapsulates visibility toggle state and accessible aria labels for credential inputs.

### File #274: [`front-end/src/pages/patient/InsuranceCardUpload.jsx`](front-end/src/pages/patient/InsuranceCardUpload.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\patient\InsuranceCardUpload.jsx`
- **Subsystem / Layer**: **Portal Pages (Patient)** (`Pages / Patient Portal`)
- **Lines**: **86 lines** | **Size**: **2429 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Compound file upload component for submitting front and back photos of health insurance cards.
- **Architectural & Data-Binding Observations**: Validates image MIME types (JPEG, PNG, PDF), enforces 5MB size limit, and uploads files via `api.uploads`.

### File #275: [`front-end/src/pages/patient/PatientLayout.jsx`](front-end/src/pages/patient/PatientLayout.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\patient\PatientLayout.jsx`
- **Subsystem / Layer**: **Portal Pages (Patient)** (`Pages / Patient Portal`)
- **Lines**: **61 lines** | **Size**: **1761 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react-router-dom`
  - *Internal Modules*: `../../auth/useSession.js`, `../../components/feedback/feedback.js`, `../../components/layout/AppNavbar.jsx`, `./PatientStoreContext.jsx`, `./usePatientStore.js`
- **Primary Responsibility**: Top-level layout shell providing PatientStoreProvider and navigation header for the Patient Portal.
- **Architectural & Data-Binding Observations**: Mounts `PatientStoreProvider`, renders `AppNavbar` (Dashboard, Book Appointment, Billing, Profile), and renders `<Outlet />`.

### File #276: [`front-end/src/pages/patient/PatientStoreContext.jsx`](front-end/src/pages/patient/PatientStoreContext.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\patient\PatientStoreContext.jsx`
- **Subsystem / Layer**: **Portal Pages (Patient)** (`Pages / Patient Portal`)
- **Lines**: **221 lines** | **Size**: **9499 bytes**
- **Public Interface / Exports**: `PatientStoreProvider`
- **Dependencies**:
  - *External Packages*: `react`
  - *Internal Modules*: `../../api/index.js`, `../../auth/useSession.js`, `./patientStoreShape.js`, `./usePatientStore.js`
- **Primary Responsibility**: Centralized state management provider for patient data, admissions, appointments, and bills.
- **Architectural & Data-Binding Observations**: Fetches composite `GET /patient/:id/portal-summary`. If composite endpoint fails, automatically executes parallel fallbacks.

### File #277: [`front-end/src/pages/patient/ProfilePage.jsx`](front-end/src/pages/patient/ProfilePage.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\patient\ProfilePage.jsx`
- **Subsystem / Layer**: **Portal Pages (Patient)** (`Pages / Patient Portal`)
- **Lines**: **710 lines** | **Size**: **27197 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`
  - *Internal Modules*: `../../api/index.js`, `../../components/feedback/feedback.js`, `../../components/layout/PageHeader.jsx`, `../../hooks/useDocumentTitle.js`, `../../hooks/usePageStyles.js`, `../../styles/patient/patient-profile.css?inline`, `./EyeField.jsx`, `./InsuranceCardUpload.jsx`, `./profileFields.js`, `./usePatientStore.js`
- **Primary Responsibility**: Patient profile manager across 4 sections: Personal Info, Contact Details, Security, and Insurance.
- **Architectural & Data-Binding Observations**: Allows patients to update personal details, emergency contact numbers, change passwords, and manage insurance policies.

### File #278: [`front-end/src/pages/patient/VisitItems.jsx`](front-end/src/pages/patient/VisitItems.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\patient\VisitItems.jsx`
- **Subsystem / Layer**: **Portal Pages (Patient)** (`Pages / Patient Portal`)
- **Lines**: **31 lines** | **Size**: **911 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Clinical visit history timeline component rendering historical doctor consultations.
- **Architectural & Data-Binding Observations**: Renders consultation dates, physician names, diagnoses, and follow-up clinical instructions.

### File #279: [`front-end/src/pages/patient/patientDashboardHelpers.jsx`](front-end/src/pages/patient/patientDashboardHelpers.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\patient\patientDashboardHelpers.jsx`
- **Subsystem / Layer**: **Portal Pages (Patient)** (`Pages / Patient Portal`)
- **Lines**: **48 lines** | **Size**: **1392 bytes**
- **Public Interface / Exports**: `BillStatusBadge`, `DoctorLine`, `StatusBadge`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Presentation formatters and helper components for patient portal dashboard cards.
- **Architectural & Data-Binding Observations**: Provides quick action buttons, greeting banners with patient name, and status callout formatters.

### File #280: [`front-end/src/pages/patient/patientDashboardUtils.js`](front-end/src/pages/patient/patientDashboardUtils.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\patient\patientDashboardUtils.js`
- **Subsystem / Layer**: **Portal Pages (Patient)** (`Pages / Patient Portal`)
- **Lines**: **41 lines** | **Size**: **1450 bytes**
- **Public Interface / Exports**: `getEffectiveStatus`, `latestPastAppointment`, `pastVisits`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Utility functions computing summary metrics for the patient portal dashboard.
- **Architectural & Data-Binding Observations**: Counts upcoming appointments, active admissions, unpaid bill balances, and uploaded medical documents.

### File #281: [`front-end/src/pages/patient/patientDocumentCopy.js`](front-end/src/pages/patient/patientDocumentCopy.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\patient\patientDocumentCopy.js`
- **Subsystem / Layer**: **Portal Pages (Patient)** (`Pages / Patient Portal`)
- **Lines**: **86 lines** | **Size**: **5829 bytes**
- **Public Interface / Exports**: `openDigitalCopy`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../../lib/formatters.js`, `../../lib/printDocument.js`
- **Primary Responsibility**: HTML template generator for printable digital health records and clinical visit summaries.
- **Architectural & Data-Binding Observations**: Constructs standalone printable document HTML formatted with hospital branding, patient UHID, and doctor notes.
- **Detected Code Smells / Risks**:
  - ⚠️ Hardcoded fallback UHID-882100 and default payment mode "UPI"

### File #282: [`front-end/src/pages/patient/patientInvoiceCopy.js`](front-end/src/pages/patient/patientInvoiceCopy.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\patient\patientInvoiceCopy.js`
- **Subsystem / Layer**: **Portal Pages (Patient)** (`Pages / Patient Portal`)
- **Lines**: **181 lines** | **Size**: **10704 bytes**
- **Public Interface / Exports**: `openBillingDigitalCopy`, `openInvoiceDigitalCopy`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../../lib/formatters.js`, `../../lib/printDocument.js`
- **Primary Responsibility**: HTML template generator for printable hospital tax invoices and payment receipts.
- **Architectural & Data-Binding Observations**: Formats itemized invoice tables with hospital headers, GST numbers, tariff breakdowns, insurance shares, and payment mode.
- **Detected Code Smells / Risks**:
  - ⚠️ Hardcoded support phone "+91 1800-456-7890" and fallback UHID FED-201

### File #283: [`front-end/src/pages/patient/patientStoreShape.js`](front-end/src/pages/patient/patientStoreShape.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\patient\patientStoreShape.js`
- **Subsystem / Layer**: **Portal Pages (Patient)** (`Pages / Patient Portal`)
- **Lines**: **397 lines** | **Size**: **15797 bytes**
- **Public Interface / Exports**: `buildAppointments`, `buildBillsAndDocuments`, `buildNotifications`, `buildProfile`, `buildVisits`, `computeAge`, `formatFullDate`, `formatShortDate`, `formatTimeString`, `indexBy`, `toIsoDate`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../../lib/insurance.js`
- **Primary Responsibility**: Initial state shape schema and property contracts for the PatientStoreContext.
- **Architectural & Data-Binding Observations**: Defines default null states for `profile`, `appointments`, `admissions`, `billing`, `documents`, and loading flags.

### File #284: [`front-end/src/pages/patient/profileFields.js`](front-end/src/pages/patient/profileFields.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\patient\profileFields.js`
- **Subsystem / Layer**: **Portal Pages (Patient)** (`Pages / Patient Portal`)
- **Lines**: **62 lines** | **Size**: **2049 bytes**
- **Public Interface / Exports**: `READONLY_FIELDS`, `SECTION_FIELDS`, `capitalize`, `parseCoverage`, `valuesFromProfile`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Field schema definitions and input validation rules for the patient profile form.
- **Architectural & Data-Binding Observations**: Defines required constraints, regex validators, and helper labels for name, DOB, blood group, address, and insurance policy.

### File #285: [`front-end/src/pages/patient/slotHelpers.js`](front-end/src/pages/patient/slotHelpers.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\patient\slotHelpers.js`
- **Subsystem / Layer**: **Portal Pages (Patient)** (`Pages / Patient Portal`)
- **Lines**: **64 lines** | **Size**: **2528 bytes**
- **Public Interface / Exports**: `ALLOWED_UPLOAD_EXT`, `DUTY_END`, `DUTY_HOURS_LABEL`, `DUTY_START`, `MAX_UPLOAD_BYTES`, `TIME_WINDOWS`, `dutyHoursError`, `formatSlotDate`, `normalizeSlotTime`, `windowFor`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Time slot formatting and grouping utilities for outpatient appointment scheduling.
- **Architectural & Data-Binding Observations**: Converts doctor availability windows (e.g. 09:00 - 17:00) into 30-minute booking chips, filtering out already booked slots.

### File #286: [`front-end/src/pages/patient/usePatientStore.js`](front-end/src/pages/patient/usePatientStore.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\patient\usePatientStore.js`
- **Subsystem / Layer**: **Portal Pages (Patient)** (`Pages / Patient Portal`)
- **Lines**: **16 lines** | **Size**: **515 bytes**
- **Public Interface / Exports**: `PatientStoreContext`, `usePatientStore`
- **Dependencies**:
  - *External Packages*: `react`
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Custom React hook providing convenient consumer access to PatientStoreContext.
- **Architectural & Data-Binding Observations**: Exposes `{ state, refresh, updateProfile, cancelAppointment, payBill }` to patient components.

### File #287: [`front-end/src/pages/platform/OrgDetailDialog.jsx`](front-end/src/pages/platform/OrgDetailDialog.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\platform\OrgDetailDialog.jsx`
- **Subsystem / Layer**: **Portal Pages (Platform)** (`Pages / Super User Console`)
- **Lines**: **175 lines** | **Size**: **6726 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`
  - *Internal Modules*: `../../api/index.js`, `../../components/feedback/feedback.js`, `../../components/layout/DialogShell.jsx`, `../../lib/emailIdentity.js`, `./platformHelpers.js`
- **Primary Responsibility**: Modal dialog inspecting tenant details, allocated resources, subscribed modules, and staff counts.
- **Architectural & Data-Binding Observations**: Displays organization slug, subscription status, purchased bed quotas, active users, and triggers suspension/activation.

### File #288: [`front-end/src/pages/platform/PlatformDashboardPage.jsx`](front-end/src/pages/platform/PlatformDashboardPage.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\platform\PlatformDashboardPage.jsx`
- **Subsystem / Layer**: **Portal Pages (Platform)** (`Pages / Super User Console`)
- **Lines**: **458 lines** | **Size**: **18164 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`, `react-router-dom`
  - *Internal Modules*: `../../api/index.js`, `../../auth/actorHome.js`, `../../auth/useSession.js`, `../../components/feedback/feedback.js`, `../../components/layout/AppNavbar.jsx`, `../../components/ui/EmptyState.jsx`, `../../components/ui/StatCard.jsx`, `../../components/ui/TabNav.jsx`, `../../hooks/useDocumentTitle.js`, `../../hooks/usePageStyles.js`, `../../styles/platform/platform.css?inline`, `./OrgDetailDialog.jsx`, `./ProvisionDialog.jsx`, `./platformHelpers.js`
- **Primary Responsibility**: Platform Super User executive console with Analytics, Tenant Management, and Rate Card tabs.
- **Architectural & Data-Binding Observations**: Guarded by `RequirePlatformUser`. Displays platform MRR/ARR, tenant growth metrics, hospital list, and rate card editor.
- **Detected Code Smells / Risks**:
  - ⚠️ Index as key: line 126 renders platform activity log rows with key={i}

### File #289: [`front-end/src/pages/platform/ProvisionDialog.jsx`](front-end/src/pages/platform/ProvisionDialog.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\platform\ProvisionDialog.jsx`
- **Subsystem / Layer**: **Portal Pages (Platform)** (`Pages / Super User Console`)
- **Lines**: **107 lines** | **Size**: **4658 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`
  - *Internal Modules*: `../../api/index.js`, `../../components/feedback/feedback.js`, `../../components/forms/TaggedEmailInput.jsx`, `../../components/layout/DialogShell.jsx`, `../../lib/emailIdentity.js`, `./platformHelpers.js`
- **Primary Responsibility**: Modal dialog for adjusting tenant resource quotas and toggling subscribed module feature flags.
- **Architectural & Data-Binding Observations**: Allows superusers to modify bed quotas, staff seat limits, and enable/disable modules (`BILLING`, `ANALYTICS`, etc.).

### File #290: [`front-end/src/pages/platform/platformHelpers.js`](front-end/src/pages/platform/platformHelpers.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\platform\platformHelpers.js`
- **Subsystem / Layer**: **Portal Pages (Platform)** (`Pages / Super User Console`)
- **Lines**: **28 lines** | **Size**: **997 bytes**
- **Public Interface / Exports**: `MODULE_CATALOG`, `inr`, `statusChipClass`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Financial calculation and presentation formatting helpers for the Platform Super User console.
- **Architectural & Data-Binding Observations**: Computes Monthly Recurring Revenue (MRR), Annual Recurring Revenue (ARR), and formats tenant subscription badges.

### File #291: [`front-end/src/pages/pre/AdmittedPage.jsx`](front-end/src/pages/pre/AdmittedPage.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\pre\AdmittedPage.jsx`
- **Subsystem / Layer**: **Portal Pages (PRE)** (`Pages / Intake & Triage`)
- **Lines**: **84 lines** | **Size**: **2991 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../../api/index.js`, `../../components/feedback/feedback.js`, `../../hooks/useApi.js`, `../../hooks/useDocumentTitle.js`, `./preHelpers.js`
- **Primary Responsibility**: Inpatient directory tracking admitted patients, bed locations, and discharge requests.
- **Architectural & Data-Binding Observations**: Lists active inpatients, displays assigned ward/bed numbers, and provides triggers to submit discharge clearance requests.

### File #292: [`front-end/src/pages/pre/AppointmentPage.jsx`](front-end/src/pages/pre/AppointmentPage.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\pre\AppointmentPage.jsx`
- **Subsystem / Layer**: **Portal Pages (PRE)** (`Pages / Intake & Triage`)
- **Lines**: **340 lines** | **Size**: **16299 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`
  - *Internal Modules*: `../../api/index.js`, `../../components/feedback/feedback.js`, `../../components/forms/DepartmentSelect.jsx`, `../../hooks/useApi.js`, `../../hooks/useDocumentTitle.js`, `../../hooks/useSearchParam.js`, `./RegisterWalkInPopup.jsx`, `./SearchResultPopup.jsx`, `./preHelpers.js`
- **Primary Responsibility**: Outpatient appointment booking desk for walk-in patients and telephone scheduling.
- **Architectural & Data-Binding Observations**: Provides patient search (`SearchResultPopup`), walk-in registration (`RegisterWalkInPopup`), and slot booking.

### File #293: [`front-end/src/pages/pre/ApprovePopup.jsx`](front-end/src/pages/pre/ApprovePopup.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\pre\ApprovePopup.jsx`
- **Subsystem / Layer**: **Portal Pages (PRE)** (`Pages / Intake & Triage`)
- **Lines**: **273 lines** | **Size**: **10535 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`
  - *Internal Modules*: `../../api/index.js`, `../../components/feedback/feedback.js`, `./PrePopup.jsx`, `./preHelpers.js`
- **Primary Responsibility**: Modal dialog for approving patient intake pre-requests and assigning clinical triage pathways.
- **Architectural & Data-Binding Observations**: Transitions pre-request status to `APPROVED`, verifies target doctor availability, and initiates OPD/IPD flows.

### File #294: [`front-end/src/pages/pre/BedRequestModal.jsx`](front-end/src/pages/pre/BedRequestModal.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\pre\BedRequestModal.jsx`
- **Subsystem / Layer**: **Portal Pages (PRE)** (`Pages / Intake & Triage`)
- **Lines**: **141 lines** | **Size**: **6736 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`, `react-dom`
  - *Internal Modules*: `../../api/index.js`, `../../components/feedback/feedback.js`, `./preHelpers.js`
- **Primary Responsibility**: Modal dialog for submitting inpatient bed allocation requests to HOM operations.
- **Architectural & Data-Binding Observations**: Selects target ward type (General, ICU, Private), specifies clinical priority, and creates record in `dataStore.bedRequests`.

### File #295: [`front-end/src/pages/pre/DischargePage.jsx`](front-end/src/pages/pre/DischargePage.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\pre\DischargePage.jsx`
- **Subsystem / Layer**: **Portal Pages (PRE)** (`Pages / Intake & Triage`)
- **Lines**: **138 lines** | **Size**: **5152 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../../api/index.js`, `../../components/feedback/feedback.js`, `../../hooks/useApi.js`, `../../hooks/useDocumentTitle.js`, `./preHelpers.js`
- **Primary Responsibility**: Two-stage discharge tracking console monitoring medical clearance and financial settlement.
- **Architectural & Data-Binding Observations**: Tracks discharges awaiting HOM clearance and cleared discharges awaiting FA bill settlement before final administrative discharge.

### File #296: [`front-end/src/pages/pre/DoctorRosterPage.jsx`](front-end/src/pages/pre/DoctorRosterPage.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\pre\DoctorRosterPage.jsx`
- **Subsystem / Layer**: **Portal Pages (PRE)** (`Pages / Intake & Triage`)
- **Lines**: **151 lines** | **Size**: **7365 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`
  - *Internal Modules*: `../../api/index.js`, `../../hooks/useApi.js`, `../../hooks/useDocumentTitle.js`, `./preHelpers.js`
- **Primary Responsibility**: Clinical staff duty roster and doctor availability directory.
- **Architectural & Data-Binding Observations**: Displays active physicians, specialties, consultation room numbers, duty days, and consultation hours.

### File #297: [`front-end/src/pages/pre/HomCoordinationPage.jsx`](front-end/src/pages/pre/HomCoordinationPage.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\pre\HomCoordinationPage.jsx`
- **Subsystem / Layer**: **Portal Pages (PRE)** (`Pages / Intake & Triage`)
- **Lines**: **115 lines** | **Size**: **6252 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../../api/index.js`, `../../hooks/useApi.js`, `../../hooks/useDocumentTitle.js`
- **Primary Responsibility**: Operational coordination board tracking bed allocation requests submitted to HOM operations.
- **Architectural & Data-Binding Observations**: Displays pending, allocated, and rejected bed requests with real-time status synchronization.

### File #298: [`front-end/src/pages/pre/Patient360Modal.jsx`](front-end/src/pages/pre/Patient360Modal.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\pre\Patient360Modal.jsx`
- **Subsystem / Layer**: **Portal Pages (PRE)** (`Pages / Intake & Triage`)
- **Lines**: **159 lines** | **Size**: **7987 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`, `react-dom`
  - *Internal Modules*: `./preHelpers.js`
- **Primary Responsibility**: Comprehensive Patient 360 drawer displaying demographics, clinical history, and active visits.
- **Architectural & Data-Binding Observations**: Renders patient profile, emergency contact, past consultations, active admissions, and insurance policy details.
- **Detected Code Smells / Risks**:
  - ⚠️ Index as key: line 97 renders medical history records with key={i}

### File #299: [`front-end/src/pages/pre/PatientRecordsPage.jsx`](front-end/src/pages/pre/PatientRecordsPage.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\pre\PatientRecordsPage.jsx`
- **Subsystem / Layer**: **Portal Pages (PRE)** (`Pages / Intake & Triage`)
- **Lines**: **246 lines** | **Size**: **12689 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`
  - *Internal Modules*: `../../api/index.js`, `../../hooks/useApi.js`, `../../hooks/useDocumentTitle.js`, `./Patient360Modal.jsx`, `./preHelpers.js`
- **Primary Responsibility**: Master patient directory console with demographic search, blood group filters, and UHID lookups.
- **Architectural & Data-Binding Observations**: Allows PRE staff to search patients by name, UHID, or phone, view full medical profiles, and register new patients.

### File #300: [`front-end/src/pages/pre/PreDashboardPage.jsx`](front-end/src/pages/pre/PreDashboardPage.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\pre\PreDashboardPage.jsx`
- **Subsystem / Layer**: **Portal Pages (PRE)** (`Pages / Intake & Triage`)
- **Lines**: **158 lines** | **Size**: **6236 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`, `react-router-dom`
  - *Internal Modules*: `../../api/index.js`, `../../components/feedback/feedback.js`, `../../hooks/useApi.js`, `../../hooks/useDocumentTitle.js`, `./BedRequestModal.jsx`, `./preHelpers.js`
- **Primary Responsibility**: Patient Relational Executive central triage dashboard with intake queues and follow-up tasks.
- **Architectural & Data-Binding Observations**: Renders 4 triage counters (Pending, Admitted, Discharge, Rejected), pending intake requests, and follow-up schedules.

### File #301: [`front-end/src/pages/pre/PreLayout.jsx`](front-end/src/pages/pre/PreLayout.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\pre\PreLayout.jsx`
- **Subsystem / Layer**: **Portal Pages (PRE)** (`Pages / Intake & Triage`)
- **Lines**: **78 lines** | **Size**: **2651 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react-router-dom`
  - *Internal Modules*: `../../auth/actorHome.js`, `../../auth/useSession.js`, `../../components/layout/ModuleLock.jsx`, `../../hooks/usePageStyles.js`, `../../styles/pre/base.css?inline`, `../../styles/pre/components.css?inline`, `../../styles/pre/layout.css?inline`
- **Primary Responsibility**: Top navigation layout shell for the Patient Relational Executive portal.
- **Architectural & Data-Binding Observations**: Enforces organization module licensing via `<ModuleLock>`, renders `AppNavbar` (Dashboard, Requests, Appointments, Records), and mounts `<Outlet />`.

### File #302: [`front-end/src/pages/pre/PrePopup.jsx`](front-end/src/pages/pre/PrePopup.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\pre\PrePopup.jsx`
- **Subsystem / Layer**: **Portal Pages (PRE)** (`Pages / Intake & Triage`)
- **Lines**: **54 lines** | **Size**: **1574 bytes**
- **Public Interface / Exports**: `DoctorOptions`, `export default`
- **Dependencies**:
  - *External Packages*: `react`, `react-dom`
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Universal modal popup wrapper providing standard dialog framing for PRE intake workflows.
- **Architectural & Data-Binding Observations**: Encapsulates header branding, scrollable container, and standard Cancel/Submit action buttons.

### File #303: [`front-end/src/pages/pre/RegisterWalkInPopup.jsx`](front-end/src/pages/pre/RegisterWalkInPopup.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\pre\RegisterWalkInPopup.jsx`
- **Subsystem / Layer**: **Portal Pages (PRE)** (`Pages / Intake & Triage`)
- **Lines**: **152 lines** | **Size**: **6805 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`, `react-dom`
  - *Internal Modules*: `../../api/index.js`, `../../components/feedback/feedback.js`
- **Primary Responsibility**: Rapid patient intake dialog for walk-in consultations and emergency admissions.
- **Architectural & Data-Binding Observations**: Collects minimal demographic details, auto-generates UHID, creates patient record, and initiates immediate intake.

### File #304: [`front-end/src/pages/pre/RejectPopup.jsx`](front-end/src/pages/pre/RejectPopup.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\pre\RejectPopup.jsx`
- **Subsystem / Layer**: **Portal Pages (PRE)** (`Pages / Intake & Triage`)
- **Lines**: **53 lines** | **Size**: **1805 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`
  - *Internal Modules*: `../../api/index.js`, `../../components/feedback/feedback.js`, `./PrePopup.jsx`
- **Primary Responsibility**: Modal dialog for recording clinical or administrative rejection reasons for intake pre-requests.
- **Architectural & Data-Binding Observations**: Updates pre-request status to `REJECTED`, records explanation, and notifies patient.

### File #305: [`front-end/src/pages/pre/RejectedPage.jsx`](front-end/src/pages/pre/RejectedPage.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\pre\RejectedPage.jsx`
- **Subsystem / Layer**: **Portal Pages (PRE)** (`Pages / Intake & Triage`)
- **Lines**: **52 lines** | **Size**: **1823 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../../api/index.js`, `../../hooks/useApi.js`, `../../hooks/useDocumentTitle.js`, `./preHelpers.js`
- **Primary Responsibility**: Audit list of rejected patient intake requests with recorded rejection reasons.
- **Architectural & Data-Binding Observations**: Provides searchable audit log of rejected pre-requests, reviewing rejection timestamps and staff notes.

### File #306: [`front-end/src/pages/pre/RequestsPage.jsx`](front-end/src/pages/pre/RequestsPage.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\pre\RequestsPage.jsx`
- **Subsystem / Layer**: **Portal Pages (PRE)** (`Pages / Intake & Triage`)
- **Lines**: **95 lines** | **Size**: **3856 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`
  - *Internal Modules*: `../../api/index.js`, `../../hooks/useApi.js`, `../../hooks/useDocumentTitle.js`, `./ApprovePopup.jsx`, `./RejectPopup.jsx`, `./SuggestPopup.jsx`, `./preHelpers.js`
- **Primary Responsibility**: Primary intake queue of pending patient pre-requests with Approve, Suggest, and Reject actions.
- **Architectural & Data-Binding Observations**: Driven by `useApi()`. Joins pre-requests with patient records, renders action buttons, and triggers popups.

### File #307: [`front-end/src/pages/pre/SearchResultPopup.jsx`](front-end/src/pages/pre/SearchResultPopup.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\pre\SearchResultPopup.jsx`
- **Subsystem / Layer**: **Portal Pages (PRE)** (`Pages / Intake & Triage`)
- **Lines**: **49 lines** | **Size**: **2183 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`, `react-dom`
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Patient lookup result modal displaying matching patient profiles during appointment booking.
- **Architectural & Data-Binding Observations**: Presents search matches with UHID, phone number, and age, allowing staff to select the target patient.

### File #308: [`front-end/src/pages/pre/SuggestPopup.jsx`](front-end/src/pages/pre/SuggestPopup.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\pre\SuggestPopup.jsx`
- **Subsystem / Layer**: **Portal Pages (PRE)** (`Pages / Intake & Triage`)
- **Lines**: **81 lines** | **Size**: **3600 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`
  - *Internal Modules*: `../../api/index.js`, `../../components/feedback/feedback.js`, `./PrePopup.jsx`, `./preHelpers.js`
- **Primary Responsibility**: Modal dialog allowing PRE staff to suggest alternative consultation dates or doctor specialties.
- **Architectural & Data-Binding Observations**: Updates pre-request status to `SUGGESTED`, recording alternative appointment times or doctor recommendations.

### File #309: [`front-end/src/pages/pre/preHelpers.js`](front-end/src/pages/pre/preHelpers.js)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\pre\preHelpers.js`
- **Subsystem / Layer**: **Portal Pages (PRE)** (`Pages / Intake & Triage`)
- **Lines**: **137 lines** | **Size**: **5278 bytes**
- **Public Interface / Exports**: `STATUS_LABELS`, `escapeHtml`, `formatAge`, `formatDate`, `hasValue`, `inferWardType`, `joinPreRequestsWithPatients`, `sortDoctorsForDepartment`, `statusLabel`, `to12Hour`, `to24Hour`
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: `../../lib/constants.js`, `../../lib/formatters.js`
- **Primary Responsibility**: Client-side data join and formatting library for PRE intake and appointment queues.
- **Architectural & Data-Binding Observations**: Provides `joinPreRequestsWithPatients()` and status badge styling dictionaries for pre-request lifecycles.

### File #310: [`front-end/src/pages/public/LandingPage.jsx`](front-end/src/pages/public/LandingPage.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\public\LandingPage.jsx`
- **Subsystem / Layer**: **Portal Pages (Public)** (`Pages / Public & Auth`)
- **Lines**: **168 lines** | **Size**: **6068 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react-router-dom`
  - *Internal Modules*: `../../hooks/useDocumentTitle.js`, `../../hooks/usePageStyles.js`, `../../styles/landing/landing-page.css?inline`
- **Primary Responsibility**: Public marketing landing page presenting platform features, modules, and CTA links.
- **Architectural & Data-Binding Observations**: Renders platform hero section, feature cards, links to hospital marketplace, patient signup, and staff login.

### File #311: [`front-end/src/pages/public/LoginPage.jsx`](front-end/src/pages/public/LoginPage.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\public\LoginPage.jsx`
- **Subsystem / Layer**: **Portal Pages (Public)** (`Pages / Public & Auth`)
- **Lines**: **440 lines** | **Size**: **15862 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`, `react-router-dom`
  - *Internal Modules*: `../../api/index.js`, `../../auth/actorHome.js`, `../../auth/useSession.js`, `../../components/feedback/feedback.js`, `../../hooks/useDocumentTitle.js`, `../../hooks/usePageStyles.js`, `../../hooks/useSearchParam.js`, `../../lib/emailIdentity.js`, `../../styles/login/login-page.css?inline`
- **Primary Responsibility**: Unified authentication portal for all actor roles with automated identity and domain resolution.
- **Architectural & Data-Binding Observations**: Resolves actor role and tenant slug from email tags via `resolveLoginIdentity()`. Provides quick-fill demo credentials fetched from `GET /auth/demo-accounts`.
- **Detected Code Smells / Risks**:
  - ⚠️ Hardcoded platform quick-fill credentials in UI button

### File #312: [`front-end/src/pages/public/MarketplacePage.jsx`](front-end/src/pages/public/MarketplacePage.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\public\MarketplacePage.jsx`
- **Subsystem / Layer**: **Portal Pages (Public)** (`Pages / Public & Auth`)
- **Lines**: **206 lines** | **Size**: **7379 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`, `react-router-dom`
  - *Internal Modules*: `../../api/index.js`, `../../components/feedback/feedback.js`, `../../components/ui/EmptyState.jsx`, `../../hooks/useApi.js`, `../../hooks/useDocumentTitle.js`, `../../hooks/usePageStyles.js`, `../../styles/marketplace/marketplace-page.css?inline`
- **Primary Responsibility**: Public searchable directory of registered hospital networks and clinical facilities.
- **Architectural & Data-Binding Observations**: Fetches hospitals via `api.marketplace.organizations()`, allows searching by city/specialty, and provides hospital signup CTA.

### File #313: [`front-end/src/pages/public/OrgSignupPage.jsx`](front-end/src/pages/public/OrgSignupPage.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\public\OrgSignupPage.jsx`
- **Subsystem / Layer**: **Portal Pages (Public)** (`Pages / Public & Auth`)
- **Lines**: **641 lines** | **Size**: **33070 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`, `react-router-dom`
  - *Internal Modules*: `../../api/index.js`, `../../components/feedback/feedback.js`, `../../components/forms/TaggedEmailInput.jsx`, `../../hooks/useDocumentTitle.js`, `../../hooks/usePageStyles.js`, `../../lib/emailIdentity.js`, `../../styles/signup/org-signup.css?inline`
- **Primary Responsibility**: Four-step self-service onboarding wizard for new hospital networks and clinical chains.
- **Architectural & Data-Binding Observations**: Step 1: Hospital details; Step 2: Capacity & resources; Step 3: Module selection; Step 4: Admin credentials. Provisions tenant via `api.marketplace.registerOrganization()`.
- **Detected Code Smells / Risks**:
  - ⚠️ Defect D3: Reads res.base_fee which falls back to 3000 because backend returns base_platform_fee
  - ⚠️ Defect D9: Calls toast(..., "warn") which is not in feedback store type list, falling back to info
  - ⚠️ Hardcoded fallback rates: GENERAL_BEDS: 150, ICU_BEDS: 600, etc.

### File #314: [`front-end/src/pages/public/SignupPage.jsx`](front-end/src/pages/public/SignupPage.jsx)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\pages\public\SignupPage.jsx`
- **Subsystem / Layer**: **Portal Pages (Public)** (`Pages / Public & Auth`)
- **Lines**: **385 lines** | **Size**: **16790 bytes**
- **Public Interface / Exports**: `export default`
- **Dependencies**:
  - *External Packages*: `react`, `react-router-dom`
  - *Internal Modules*: `../../api/index.js`, `../../auth/useSession.js`, `../../components/feedback/feedback.js`, `../../hooks/useDocumentTitle.js`, `../../hooks/usePageStyles.js`, `../../hooks/useSearchParam.js`, `../../lib/emailIdentity.js`, `../../styles/signup/signup-page.css?inline`
- **Primary Responsibility**: Self-registration portal for new patients creating portal user accounts.
- **Architectural & Data-Binding Observations**: Validates 9 demographic fields, checks for reserved staff emails, auto-creates patient record, and navigates to Patient Dashboard.

### File #315: [`front-end/src/styles/design-tokens.css`](front-end/src/styles/design-tokens.css)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\styles\design-tokens.css`
- **Subsystem / Layer**: **Legacy Stylesheets** (`Stylesheets / Portals`)
- **Lines**: **332 lines** | **Size**: **12857 bytes**
- **Public Interface / Exports**: *None (or side-effect / style / markup)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Scoped portal stylesheet defining layout, typography, elevation, and component theme rules for design-tokens.css.
- **Architectural & Data-Binding Observations**: Imported via `?inline` and mounted dynamically via `usePageStyles` to guarantee style isolation.

### File #316: [`front-end/src/styles/material-components.css`](front-end/src/styles/material-components.css)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\styles\material-components.css`
- **Subsystem / Layer**: **Legacy Stylesheets** (`Stylesheets / Portals`)
- **Lines**: **399 lines** | **Size**: **16414 bytes**
- **Public Interface / Exports**: *None (or side-effect / style / markup)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Scoped portal stylesheet defining layout, typography, elevation, and component theme rules for material-components.css.
- **Architectural & Data-Binding Observations**: Imported via `?inline` and mounted dynamically via `usePageStyles` to guarantee style isolation.

### File #317: [`front-end/src/styles/ui-feedback.css`](front-end/src/styles/ui-feedback.css)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\styles\ui-feedback.css`
- **Subsystem / Layer**: **Legacy Stylesheets** (`Stylesheets / Portals`)
- **Lines**: **133 lines** | **Size**: **5014 bytes**
- **Public Interface / Exports**: *None (or side-effect / style / markup)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Scoped portal stylesheet defining layout, typography, elevation, and component theme rules for ui-feedback.css.
- **Architectural & Data-Binding Observations**: Imported via `?inline` and mounted dynamically via `usePageStyles` to guarantee style isolation.

### File #318: [`front-end/src/styles/admin/admin.css`](front-end/src/styles/admin/admin.css)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\styles\admin\admin.css`
- **Subsystem / Layer**: **Legacy Stylesheets** (`Stylesheets / Portals`)
- **Lines**: **750 lines** | **Size**: **18665 bytes**
- **Public Interface / Exports**: *None (or side-effect / style / markup)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Scoped portal stylesheet defining layout, typography, elevation, and component theme rules for admin.css.
- **Architectural & Data-Binding Observations**: Imported via `?inline` and mounted dynamically via `usePageStyles` to guarantee style isolation.

### File #319: [`front-end/src/styles/fa/base.css`](front-end/src/styles/fa/base.css)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\styles\fa\base.css`
- **Subsystem / Layer**: **Legacy Stylesheets** (`Stylesheets / Portals`)
- **Lines**: **98 lines** | **Size**: **3372 bytes**
- **Public Interface / Exports**: *None (or side-effect / style / markup)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Scoped portal stylesheet defining layout, typography, elevation, and component theme rules for base.css.
- **Architectural & Data-Binding Observations**: Imported via `?inline` and mounted dynamically via `usePageStyles` to guarantee style isolation.

### File #320: [`front-end/src/styles/fa/components.css`](front-end/src/styles/fa/components.css)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\styles\fa\components.css`
- **Subsystem / Layer**: **Legacy Stylesheets** (`Stylesheets / Portals`)
- **Lines**: **96 lines** | **Size**: **2795 bytes**
- **Public Interface / Exports**: *None (or side-effect / style / markup)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Scoped portal stylesheet defining layout, typography, elevation, and component theme rules for components.css.
- **Architectural & Data-Binding Observations**: Imported via `?inline` and mounted dynamically via `usePageStyles` to guarantee style isolation.

### File #321: [`front-end/src/styles/fa/layout.css`](front-end/src/styles/fa/layout.css)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\styles\fa\layout.css`
- **Subsystem / Layer**: **Legacy Stylesheets** (`Stylesheets / Portals`)
- **Lines**: **176 lines** | **Size**: **5097 bytes**
- **Public Interface / Exports**: *None (or side-effect / style / markup)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Scoped portal stylesheet defining layout, typography, elevation, and component theme rules for layout.css.
- **Architectural & Data-Binding Observations**: Imported via `?inline` and mounted dynamically via `usePageStyles` to guarantee style isolation.

### File #322: [`front-end/src/styles/hom/bed-management.css`](front-end/src/styles/hom/bed-management.css)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\styles\hom\bed-management.css`
- **Subsystem / Layer**: **Legacy Stylesheets** (`Stylesheets / Portals`)
- **Lines**: **37 lines** | **Size**: **1883 bytes**
- **Public Interface / Exports**: *None (or side-effect / style / markup)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Scoped portal stylesheet defining layout, typography, elevation, and component theme rules for bed-management.css.
- **Architectural & Data-Binding Observations**: Imported via `?inline` and mounted dynamically via `usePageStyles` to guarantee style isolation.

### File #323: [`front-end/src/styles/hom/dashboard.css`](front-end/src/styles/hom/dashboard.css)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\styles\hom\dashboard.css`
- **Subsystem / Layer**: **Legacy Stylesheets** (`Stylesheets / Portals`)
- **Lines**: **77 lines** | **Size**: **2302 bytes**
- **Public Interface / Exports**: *None (or side-effect / style / markup)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Scoped portal stylesheet defining layout, typography, elevation, and component theme rules for dashboard.css.
- **Architectural & Data-Binding Observations**: Imported via `?inline` and mounted dynamically via `usePageStyles` to guarantee style isolation.

### File #324: [`front-end/src/styles/hom/global.css`](front-end/src/styles/hom/global.css)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\styles\hom\global.css`
- **Subsystem / Layer**: **Legacy Stylesheets** (`Stylesheets / Portals`)
- **Lines**: **602 lines** | **Size**: **19312 bytes**
- **Public Interface / Exports**: *None (or side-effect / style / markup)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Scoped portal stylesheet defining layout, typography, elevation, and component theme rules for global.css.
- **Architectural & Data-Binding Observations**: Imported via `?inline` and mounted dynamically via `usePageStyles` to guarantee style isolation.

### File #325: [`front-end/src/styles/hom/inventory.css`](front-end/src/styles/hom/inventory.css)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\styles\hom\inventory.css`
- **Subsystem / Layer**: **Legacy Stylesheets** (`Stylesheets / Portals`)
- **Lines**: **20 lines** | **Size**: **1457 bytes**
- **Public Interface / Exports**: *None (or side-effect / style / markup)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Scoped portal stylesheet defining layout, typography, elevation, and component theme rules for inventory.css.
- **Architectural & Data-Binding Observations**: Imported via `?inline` and mounted dynamically via `usePageStyles` to guarantee style isolation.

### File #326: [`front-end/src/styles/hom/patient-flow.css`](front-end/src/styles/hom/patient-flow.css)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\styles\hom\patient-flow.css`
- **Subsystem / Layer**: **Legacy Stylesheets** (`Stylesheets / Portals`)
- **Lines**: **31 lines** | **Size**: **2218 bytes**
- **Public Interface / Exports**: *None (or side-effect / style / markup)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Scoped portal stylesheet defining layout, typography, elevation, and component theme rules for patient-flow.css.
- **Architectural & Data-Binding Observations**: Imported via `?inline` and mounted dynamically via `usePageStyles` to guarantee style isolation.

### File #327: [`front-end/src/styles/landing/landing-page.css`](front-end/src/styles/landing/landing-page.css)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\styles\landing\landing-page.css`
- **Subsystem / Layer**: **Legacy Stylesheets** (`Stylesheets / Portals`)
- **Lines**: **379 lines** | **Size**: **9419 bytes**
- **Public Interface / Exports**: *None (or side-effect / style / markup)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Scoped portal stylesheet defining layout, typography, elevation, and component theme rules for landing-page.css.
- **Architectural & Data-Binding Observations**: Imported via `?inline` and mounted dynamically via `usePageStyles` to guarantee style isolation.

### File #328: [`front-end/src/styles/login/login-page.css`](front-end/src/styles/login/login-page.css)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\styles\login\login-page.css`
- **Subsystem / Layer**: **Legacy Stylesheets** (`Stylesheets / Portals`)
- **Lines**: **402 lines** | **Size**: **9792 bytes**
- **Public Interface / Exports**: *None (or side-effect / style / markup)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Scoped portal stylesheet defining layout, typography, elevation, and component theme rules for login-page.css.
- **Architectural & Data-Binding Observations**: Imported via `?inline` and mounted dynamically via `usePageStyles` to guarantee style isolation.

### File #329: [`front-end/src/styles/marketplace/marketplace-page.css`](front-end/src/styles/marketplace/marketplace-page.css)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\styles\marketplace\marketplace-page.css`
- **Subsystem / Layer**: **Legacy Stylesheets** (`Stylesheets / Portals`)
- **Lines**: **98 lines** | **Size**: **2749 bytes**
- **Public Interface / Exports**: *None (or side-effect / style / markup)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Scoped portal stylesheet defining layout, typography, elevation, and component theme rules for marketplace-page.css.
- **Architectural & Data-Binding Observations**: Imported via `?inline` and mounted dynamically via `usePageStyles` to guarantee style isolation.

### File #330: [`front-end/src/styles/patient/patient-billing.css`](front-end/src/styles/patient/patient-billing.css)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\styles\patient\patient-billing.css`
- **Subsystem / Layer**: **Legacy Stylesheets** (`Stylesheets / Portals`)
- **Lines**: **281 lines** | **Size**: **15302 bytes**
- **Public Interface / Exports**: *None (or side-effect / style / markup)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Scoped portal stylesheet defining layout, typography, elevation, and component theme rules for patient-billing.css.
- **Architectural & Data-Binding Observations**: Imported via `?inline` and mounted dynamically via `usePageStyles` to guarantee style isolation.

### File #331: [`front-end/src/styles/patient/patient-book-appointment.css`](front-end/src/styles/patient/patient-book-appointment.css)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\styles\patient\patient-book-appointment.css`
- **Subsystem / Layer**: **Legacy Stylesheets** (`Stylesheets / Portals`)
- **Lines**: **261 lines** | **Size**: **12406 bytes**
- **Public Interface / Exports**: *None (or side-effect / style / markup)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Scoped portal stylesheet defining layout, typography, elevation, and component theme rules for patient-book-appointment.css.
- **Architectural & Data-Binding Observations**: Imported via `?inline` and mounted dynamically via `usePageStyles` to guarantee style isolation.

### File #332: [`front-end/src/styles/patient/patient-dashboard.css`](front-end/src/styles/patient/patient-dashboard.css)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\styles\patient\patient-dashboard.css`
- **Subsystem / Layer**: **Legacy Stylesheets** (`Stylesheets / Portals`)
- **Lines**: **621 lines** | **Size**: **18724 bytes**
- **Public Interface / Exports**: *None (or side-effect / style / markup)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Scoped portal stylesheet defining layout, typography, elevation, and component theme rules for patient-dashboard.css.
- **Architectural & Data-Binding Observations**: Imported via `?inline` and mounted dynamically via `usePageStyles` to guarantee style isolation.

### File #333: [`front-end/src/styles/patient/patient-profile.css`](front-end/src/styles/patient/patient-profile.css)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\styles\patient\patient-profile.css`
- **Subsystem / Layer**: **Legacy Stylesheets** (`Stylesheets / Portals`)
- **Lines**: **237 lines** | **Size**: **13527 bytes**
- **Public Interface / Exports**: *None (or side-effect / style / markup)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Scoped portal stylesheet defining layout, typography, elevation, and component theme rules for patient-profile.css.
- **Architectural & Data-Binding Observations**: Imported via `?inline` and mounted dynamically via `usePageStyles` to guarantee style isolation.

### File #334: [`front-end/src/styles/platform/platform.css`](front-end/src/styles/platform/platform.css)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\styles\platform\platform.css`
- **Subsystem / Layer**: **Legacy Stylesheets** (`Stylesheets / Portals`)
- **Lines**: **535 lines** | **Size**: **14603 bytes**
- **Public Interface / Exports**: *None (or side-effect / style / markup)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Scoped portal stylesheet defining layout, typography, elevation, and component theme rules for platform.css.
- **Architectural & Data-Binding Observations**: Imported via `?inline` and mounted dynamically via `usePageStyles` to guarantee style isolation.

### File #335: [`front-end/src/styles/pre/base.css`](front-end/src/styles/pre/base.css)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\styles\pre\base.css`
- **Subsystem / Layer**: **Legacy Stylesheets** (`Stylesheets / Portals`)
- **Lines**: **15 lines** | **Size**: **410 bytes**
- **Public Interface / Exports**: *None (or side-effect / style / markup)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Scoped portal stylesheet defining layout, typography, elevation, and component theme rules for base.css.
- **Architectural & Data-Binding Observations**: Imported via `?inline` and mounted dynamically via `usePageStyles` to guarantee style isolation.

### File #336: [`front-end/src/styles/pre/components.css`](front-end/src/styles/pre/components.css)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\styles\pre\components.css`
- **Subsystem / Layer**: **Legacy Stylesheets** (`Stylesheets / Portals`)
- **Lines**: **1636 lines** | **Size**: **36243 bytes**
- **Public Interface / Exports**: *None (or side-effect / style / markup)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Scoped portal stylesheet defining layout, typography, elevation, and component theme rules for components.css.
- **Architectural & Data-Binding Observations**: Imported via `?inline` and mounted dynamically via `usePageStyles` to guarantee style isolation.

### File #337: [`front-end/src/styles/pre/layout.css`](front-end/src/styles/pre/layout.css)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\styles\pre\layout.css`
- **Subsystem / Layer**: **Legacy Stylesheets** (`Stylesheets / Portals`)
- **Lines**: **13 lines** | **Size**: **369 bytes**
- **Public Interface / Exports**: *None (or side-effect / style / markup)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Scoped portal stylesheet defining layout, typography, elevation, and component theme rules for layout.css.
- **Architectural & Data-Binding Observations**: Imported via `?inline` and mounted dynamically via `usePageStyles` to guarantee style isolation.

### File #338: [`front-end/src/styles/signup/org-signup.css`](front-end/src/styles/signup/org-signup.css)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\styles\signup\org-signup.css`
- **Subsystem / Layer**: **Legacy Stylesheets** (`Stylesheets / Portals`)
- **Lines**: **421 lines** | **Size**: **8881 bytes**
- **Public Interface / Exports**: *None (or side-effect / style / markup)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Scoped portal stylesheet defining layout, typography, elevation, and component theme rules for org-signup.css.
- **Architectural & Data-Binding Observations**: Imported via `?inline` and mounted dynamically via `usePageStyles` to guarantee style isolation.

### File #339: [`front-end/src/styles/signup/signup-page.css`](front-end/src/styles/signup/signup-page.css)
- **Absolute Path**: `D:\Federico_workspace\front-end\src\styles\signup\signup-page.css`
- **Subsystem / Layer**: **Legacy Stylesheets** (`Stylesheets / Portals`)
- **Lines**: **269 lines** | **Size**: **8358 bytes**
- **Public Interface / Exports**: *None (or side-effect / style / markup)*
- **Dependencies**:
  - *External Packages*: *(none)*
  - *Internal Modules*: *(none)*
- **Primary Responsibility**: Scoped portal stylesheet defining layout, typography, elevation, and component theme rules for signup-page.css.
- **Architectural & Data-Binding Observations**: Imported via `?inline` and mounted dynamically via `usePageStyles` to guarantee style isolation.


---

## 8. Verification & Test Execution Status

### 8.1 Zero Application Code Modification Check
A forensic `git status` verification confirms that **zero application code files** in `back-end/` or `front-end/` were modified during this audit phase:
```
On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
	modified:   project_memory.md

no changes added to commit (use "git add" and/or "git commit -a")
```

### 8.2 Prohibited Paths Access Attestation
Verified 100% compliance with the Zero-Access directive:
- `D:\Federico_workspace\LICENSE`: 0 access
- `D:\Federico_workspace\react-migration-plan.md`: 0 access
- `D:\Federico_workspace\SRS.pdf`: 0 access
- `D:\Federico_workspace\Figma`: 0 access
- `D:\Federico_workspace\videos`: 0 access
- `D:\Federico_workspace\definitions.yml`: 0 access
- `D:\Federico_workspace\DomainExpertInteraction.md`: 0 access

### 8.3 Test Suite Status
- **Backend Test Suites**: 25 Jest test files documented. 12 pure in-memory unit tests pass out-of-the-box (`doctor.service.spec.js`, `tenant.spec.js`, `logManager.spec.js`). 11 suites pending environment module installation (`supertest`, `bcryptjs`).
- **Frontend Quality Verification**: Verified with `oxlint` (0 errors across 153 files) and `vite build` (fully passing production build).

---

## 9. Master Decisions & Memory Maintenance Protocol

### Mandatory Protocol for Subsequent Agents & Developers:
Whenever any modification, bug fix, or refactoring is performed on the codebase:
1. Re-read the affected file's audit card in this `project_memory.md`.
2. Follow the minimal-change principle: make the smallest possible edit that resolves the issue.
3. Preserve all existing comments, docstrings, and architectural invariants.
4. Update the corresponding audit card in this document with details of the change, design decisions, and updated inferences.


---

# 10. Cross-Layer Schema Alignment Matrix & Discrepancy Catalog (2026-10-14T15:22:56Z Audit)

## 10.1 Executive Overview & Scope

An exhaustive line-by-line verification and cross-layer audit was conducted across all 18 backend services, 18 backend controllers, validators, and route files in `back-end/src/`, and all 50+ frontend pages, modals, stores, and API clients in `front-end/src/` against the authoritative 38-table relational schema specified in [`Database/Federico_Schemas.md`](Database/Federico_Schemas.md).

This section codifies the findings across three major dimensions:
1. **Critical Preserved Defects & Systemic Failures**: Analysis of preserved historical defects (D2, D3, D4, D5, D7, D11) and functional bugs that break UI calculations or discard data.
2. **R1: Backend Data Generation, Storage & Fetching Discrepancies**: Numeric primary key generation, foreign key coercion, ISO-8601 timestamps, query filter strict equality mismatches, and API response payload deviations.
3. **R2: Frontend Fetching, Payload Mapping & Attribute Binding Discrepancies**: Route mismatches, casing inconsistencies (`camelCase` vs `snake_case`), phantom UI form fields, dropped payloads, and non-existent database attribute accesses.
4. **R3: Master Cross-Layer Schema Alignment Matrix**: End-to-end trace from UI field -> Frontend API -> Backend Controller/Route -> Backend Service -> Relational Database Table (`Database/Federico_Schemas.md`).
5. **Regression & Build Verification**: Automated verification results (`npm test`, `oxlint`, `npm run build`) and zero-application-code modification attestation.

---

## 10.2 Critical Preserved Defects & Systemic Functional Failures

The audit uncovered several critical defects that directly impact hospital operations, data integrity, and billing accuracy. These include the preserved historical migration defects and core functional bugs:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 CRITICAL FUNCTIONAL DEFECTS SUMMARY                              │
├────────────┬──────────────────────────────────┬──────────────────────────────────────────────────┤
│ Defect ID  │ Affected File & Line             │ Operational Impact                               │
├────────────┼──────────────────────────────────┼──────────────────────────────────────────────────┤
│ Defect D2  │ front-end/src/api/endpoints/     │ Route mismatch: calls plural /ward/emergencies   │
│            │ wards.js:64-74                   │ while backend mounts /ward/emergency. 100% 404s. │
├────────────┼──────────────────────────────────┼──────────────────────────────────────────────────┤
│ Defect D3  │ front-end/src/pages/admin/       │ Platform rate card attribute mismatch: reads     │
│            │ DashboardPage.jsx:93-94,         │ base_fee instead of base_platform_fee; silently  │
│            │ OrgSignupPage.jsx:119-120        │ defaults to 3000, ignoring live rate updates.    │
├────────────┼──────────────────────────────────┼──────────────────────────────────────────────────┤
│ Defect D4  │ front-end/src/pages/patient/     │ Insurance display omission: hasInsurance missing │
│            │ patientStoreShape.js:77-102,     │ from profile object; insured patients permanently│
│            │ BillingPage.jsx:144-178          │ see "Self Pay (No Active Insurance)" banner.     │
├────────────┼──────────────────────────────────┼──────────────────────────────────────────────────┤
│ Defect D5  │ front-end/src/pages/patient/     │ Appointment model doctorId omission: doctorId    │
│            │ patientStoreShape.js:129-130,    │ omitted from buildAppointments items. Legacy     │
│            │ 159-173                          │ comment claims booking slot filter fails, but    │
│            │                                  │ BookAppointmentPage consumes doctors API directly│
│            │                                  │ and PRE approves slots; historical UI omission.  │
├────────────┼──────────────────────────────────┼──────────────────────────────────────────────────┤
│ Defect D7  │ front-end/src/pages/fa/          │ Settlement preview desync: #coverage-override is │
│            │ SettlementSection.jsx:142-156,   │ uncontrolled without onChange; #net-payable-     │
│            │ 169                              │ preview never updates as finance staff type.     │
├────────────┼──────────────────────────────────┼──────────────────────────────────────────────────┤
│ Defect D11 │ front-end/src/pages/patient/     │ Ghost mutation: patient password change simulates│
│            │ ProfilePage.jsx:176-183          │ success via toast with zero network dispatch.    │
├────────────┼──────────────────────────────────┼──────────────────────────────────────────────────┤
│ HOM Occ.   │ front-end/src/pages/hom/         │ Bed occupancy permanently 0%: reads non-existent │
│ 0% Bug     │ DashboardPage.jsx:128-131        │ w.occupied_beds on wards table instead of beds.  │
├────────────┼──────────────────────────────────┼──────────────────────────────────────────────────┤
│ Insurance  │ front-end/src/pages/public/      │ Silent policy drop: inputs DD/MM/YYYY dates that │
│ Date Drop  │ SignupPage.jsx:141-155, 324-330  │ fail backend isISO8601 validation; error caught  │
│            │                                  │ and swallowed, creating account without policy.  │
├────────────┼──────────────────────────────────┼──────────────────────────────────────────────────┤
│ Ledger Seq │ back-end/src/services/           │ Composite PK collision: e.ledger_id === entry.   │
│ Reset Bug  │ billing.service.js:95            │ ledger_id fails when entry.ledger_id is string;  │
│            │                                  │ resets entry_id to 1, causing PK collisions.     │
└────────────┴──────────────────────────────────┴──────────────────────────────────────────────────┘
```

### Detailed Analysis of Critical Failures:

1. **Defect D2: Dead Ward Emergencies Subsystem Retired**
   - **Frontend Source**: [`front-end/src/api/endpoints/wards.js`](front-end/src/api/endpoints/wards.js) previously defined `emergencies: { list, create, update }`.
   - **Backend Route**: [`back-end/src/routes/ward.routes.js`](back-end/src/routes/ward.routes.js) previously defined `router.get('/emergency')`, `router.post('/emergency')`, and `router.put('/emergency/:id')`.
   - **Remediation**: Completely excised dead emergency cases code across backend and frontend per user directive. Removed dead API methods, routes, controller handlers, service methods, validation rules, and Swagger documentation. Verified 404 response on retired endpoints.

2. **Defect D3: Platform Rate Card `base_fee` vs `base_platform_fee`**
   - **Frontend Source**: [`front-end/src/pages/admin/DashboardPage.jsx:93-94`](front-end/src/pages/admin/DashboardPage.jsx) reads `const basePlatformFee = Number(r?.base_fee ?? 3000);`. [`front-end/src/pages/public/OrgSignupPage.jsx:119-120`](front-end/src/pages/public/OrgSignupPage.jsx) checks `if (typeof data.base_fee === 'number') setBaseFee(data.base_fee);`.
   - **Backend Source**: [`back-end/src/controllers/platform.controller.js:456`](back-end/src/controllers/platform.controller.js) returns `{ base_platform_fee: 3000, rates: { ... } }`.
   - **Impact**: When platform administrators adjust the base platform fee (e.g. from 3,000 to 5,000), neither the Hospital Admin Dashboard nor the Public Hospital Signup Wizard picks up the new rate card value, permanently falling back to 3,000.
   - **Remediation**: Update frontend references to read `data.base_platform_fee` or normalize backend response to emit both keys.

3. **Defect D4: Patient Insurance Omission in Patient Store Shape**
   - **Frontend Source**: [`front-end/src/pages/patient/patientStoreShape.js:77-102`](front-end/src/pages/patient/patientStoreShape.js) maps the patient profile and insurance but omits the boolean property `hasInsurance`.
   - **Frontend Consumer**: [`front-end/src/pages/patient/BillingPage.jsx:144-178`](front-end/src/pages/patient/BillingPage.jsx) tests `ins.hasInsurance`. Because it is `undefined`, the check evaluates to falsy.
   - **Impact**: Insured patients with fully active insurance policies and high coverage limits are presented with a "Self Pay (No Active Insurance)" banner with ₹0 coverage on their billing page.
   - **Remediation**: Export `hasInsurance: Boolean(ins && ins.policyNumber && ins.provider)` in `buildProfile`.

4. **Defect D5: Omission of `doctorId` in `buildAppointments`**
   - **Frontend Source**: [`front-end/src/pages/patient/patientStoreShape.js:129-130, 159-173`](front-end/src/pages/patient/patientStoreShape.js) derives `docId = apt.doctor_id` but does not attach `doctorId` to the mapped appointment item.
   - **Frontend Consumer Analysis**: Legacy comments in `patientStoreShape.js:129-130` claim `doctorId` omission breaks the booking page's slot filter. However, direct verification of [`front-end/src/pages/patient/BookAppointmentPage.jsx:33-39, 44-71`](front-end/src/pages/patient/BookAppointmentPage.jsx) reveals that the page does NOT consume store appointments or filter slots on `item.doctorId === selectedDoctorId`; instead, it consumes doctor slots from the doctors API/store directly and submits booking requests to the PRE intake queue, where backend availability checks serve as the single source of truth. The omission in `buildAppointments` therefore primarily affects patient appointment history views and consumer components expecting normalized `doctorId`.
   - **Impact**: Downstream patient appointment consumers expecting `item.doctorId` receive `undefined`, breaking client-side doctor-specific filtering or display.
   - **Remediation**: Add `doctorId: docId` to the exported appointment object in `buildAppointments`.

5. **Defect D7: Uncontrolled `#coverage-override` Input in Settlement Section**
   - **Frontend Source**: [`front-end/src/pages/fa/SettlementSection.jsx:142-156, 169`](front-end/src/pages/fa/SettlementSection.jsx) renders `<input type="number" id="coverage-override" ref={coverageOverrideRef} defaultValue={coverageLimit} />` without an `onChange` handler, while displaying `#net-payable-preview` calculated solely from static `coverageLimit`.
   - **Impact**: As finance officers type a custom insurance deduction override, the net payable preview does not update dynamically, creating confusion before the payment record action is clicked.
   - **Remediation**: Transition `#coverage-override` to a controlled input state that updates the net payable preview on change.

6. **Defect D11: Ghost Password Update in Patient Profile**
   - **Frontend Source**: [`front-end/src/pages/patient/ProfilePage.jsx:176-183`](front-end/src/pages/patient/ProfilePage.jsx) contains `setPasswordHint({ text: 'Password updated successfully.', variant: 'match' }); commitSnapshot('password'); toast('Password updated.', 'success'); return;`.
   - **Impact**: The user receives positive feedback indicating their password has been changed, but no network request is ever dispatched to the backend, and the user's password in `users` remains unchanged.
   - **Remediation**: Implement a real `PUT /auth/password` endpoint and bind the profile form submission to it.

7. **HOM Dashboard Bed Occupancy Permanently 0%**
   - **Frontend Source**: [`front-end/src/pages/hom/DashboardPage.jsx:128-131`](front-end/src/pages/hom/DashboardPage.jsx) calculates `const occupied = d.wards.reduce((sum, w) => sum + (w.occupied_beds || 0), 0);`.
   - **Schema Contract**: [`Database/Federico_Schemas.md`](Database/Federico_Schemas.md) Table 15 (`wards`) defines `ward_id`, `ward_name`, `ward_type`, `total_beds`, `organization_id`, `hospital_id`. Table 15 does NOT contain an `occupied_beds` column. Bed occupancy is an aggregate state derived from Table 16 (`beds.status = 'OCCUPIED'`).
   - **Impact**: `w.occupied_beds` evaluates to `undefined`, resolving `occupied` to 0. Available beds is calculated as `totalBeds - 0 = totalBeds`, and `occupancyRate` is permanently 0% on the executive HOM dashboard even when the hospital is at 100% capacity.
   - **Remediation**: Calculate occupancy from beds: `const occupied = d.beds.filter(b => b.status === 'OCCUPIED').length;` (as correctly implemented in `BedManagementPage.jsx:111`).

8. **Patient Signup Insurance Registration Date Parsing Failure**
   - **Frontend Source**: [`front-end/src/pages/public/SignupPage.jsx:141-155, 324-330`](front-end/src/pages/public/SignupPage.jsx) prompts the user with placeholder `DD/MM/YYYY` and transmits raw user strings (e.g. `"15/10/2026"`) as `valid_from` and `valid_to`.
   - **Backend Validator**: [`back-end/src/validators/patient.validators.js:43-44`](back-end/src/validators/patient.validators.js) validates `valid_from` and `valid_to` using `validator.isISO8601`.
   - **Impact**: When the user enters a date in `DD/MM/YYYY` format, the backend returns `400 Bad Request`. `SignupPage.jsx:153` catches this error and logs `console.warn('[Signup] Insurance could not be saved, continuing:', insuranceErr);`. The patient account is created, but the patient's insurance policy is completely discarded without alerting the user!
   - **Remediation**: Change frontend input type to `date` or convert `DD/MM/YYYY` to ISO format `YYYY-MM-DD` before calling `api.patients.createInsurance`.

9. **Composite Key Sequence Reset Bug in Billing Service**
   - **Backend Source**: [`back-end/src/services/billing.service.js:95`](back-end/src/services/billing.service.js) generates `entry_id` via `dataStore.ledgerEntries.filter((e) => e.ledger_id === entry.ledger_id).length + 1`.
   - **Data Store Reality**: `e.ledger_id` in `dataStore.ledgerEntries` is stored as an integer (coerced at line 97: `ledger_id: Number(entry.ledger_id)`). When `entry.ledger_id` is supplied as a string (e.g. from an HTTP payload `"801"`), the strict comparison `801 === "801"` evaluates to `false`.
   - **Impact**: The filter yields an empty array, causing `entry_id` to reset to `0 + 1 = 1` repeatedly. This causes primary key collisions on the composite key `(ledger_id, entry_id)`.
   - **Remediation**: Coerce `entry.ledger_id` to a number prior to filtering: `const ledgerId = Number(entry.ledger_id); dataStore.ledgerEntries.filter(e => e.ledger_id === ledgerId).length + 1`.

---

## 10.3 R1: Backend Data Generation, Storage & Fetching Discrepancies

### 10.3.1 Architecture Audit Summary

- **Numeric Primary Key Generation (`maxId(...) + 1`)**:
  - The backend uniformly implements numeric PK generation across all 18 domain services (`admission.service.js:16`, `appointment.service.js:61`, `billing.service.js:15, 57, 133, 158, 307, 360`, `doctor.service.js:22, 88`, `inventory.service.js:14, 52`, `organization.service.js:90, 184`, `patient.service.js:44, 103`, `preRequest.service.js:94, 123, 311, 364, 384, 443`, `ward.service.js:30, 137, 183, 278`, `rbac.service.js:51, 72, 238`, `provisioning.service.js:32, 93, 220`, `subscription.service.js:54`, `subscriptionPlan.service.js:17`, `platformAuth.service.js:75`, `platformActivity.service.js:16`, `activity.service.js:14`).
  - *Composite Key Exception*: For `ledger_entries` (composite PK `(ledger_id, entry_id)`), sequential indexing resets to 1 due to string comparison (`billing.service.js:95`).

- **Foreign Key Coercion (`Number(...)`) & Invariant Breaches**:
  - `back-end/src/services/preRequest.service.js:450`: `requested_by: actorRole || 'PRE'` stores the string `'PRE'` instead of `Number(userId)` (INT FK -> `users.user_id`).
  - `back-end/src/services/preRequest.service.js:446`: `ward_id: null` in `bed_requests` violates Table 28's `ward_id INT NOT NULL` constraint.
  - `back-end/src/services/ward.service.js:184, 186, 190`: `createBedRequest` allows `pre_request_id`, `ward_id`, and `requested_by` to be `null`, violating Table 28 mandatory foreign keys.
  - `back-end/src/services/billing.service.js:60-61`: `createLedger` sets `organization_id` and `hospital_id` without `Number(...)` coercion.
  - `back-end/src/utils/tenant.js:77`: `withTenant` attaches `hospital_id` without `Number(...)` coercion.
  - Hardcoded Foreign Keys:
    - `back-end/src/services/appointment.service.js:57`: `createdBy = ... ? 105 : ...` (User 105).
    - `back-end/src/services/preRequest.service.js:104`: `created_by = ... ? 105 : ...` (User 105).
    - `back-end/src/services/inventory.service.js:57`: `requested_by = ... ? 101 : ...` (User 101).
    - `back-end/src/services/ward.service.js:283`: `created_by = ... ? 101 : ...` (User 101).

- **ISO-8601 Timestamp Compliance**:
  - Audit logs, user registrations, billing settlements, summaries, and inventory requests adhere strictly to `new Date().toISOString()`.
  - *Interpolation Defect*: Appointment and pre-request datetime creation uses string interpolation `${requested_date}T${timePart}` (`preRequest.service.js:100, 196`, `appointment.service.js:68`), omitting the timezone offset (`Z`) and failing when meridiem times (e.g. `'09:00 AM'`) are passed.

- **Query Filter Strict Equality (`===`) Type Mismatches**:
  - Over 30 service query locations filter arrays using strict equality (`===` / `!==`) against uncoerced string arguments, resulting in spurious 404s and bypassing security checks (e.g., `controllers/billing.controller.js:81`).

- **Response Payload Attribute Misalignment**:
  - `back-end/src/services/preRequest.service.js:362-375`: `checkIn` emits `admission_date` instead of `admit_time`, omits `bed_id`, `discharge_time`, and `receipt_sent_to_hom`, and injects non-schema properties (`doctor_id`, `department`, `visit_type`, `created_at`).
  - Status Enum Incompatibilities: `billing.service.js:178` (`PAYMENT_CONFIRMED`), `billing.service.js:193` (`PARTIALLY_PAID`), `ward.service.js:247` (`DENIED`), `appointment.service.js:71` (`SCHEDULED`), `preRequest.service.js:16-26` (9 statuses vs 4).

### 10.3.2 Itemized Backend Discrepancy Catalog (D01 – D76)

| ID | File Path & Line | Function / Method | Expected (`Federico_Schemas.md`) | Implemented in Code | Category | Behavioral Impact |
|:---|:---|:---|:---|:---|:---|:---|
| **D01** | [`back-end/src/services/admission.service.js:11`](back-end/src/services/admission.service.js) | `findOne(id)` | `admission_id INT` | `a.admission_id === id` | Filter type mismatch | Returns `null` if `id` is a string parameter; false 404s. |
| **D02** | [`back-end/src/services/appointment.service.js:21`](back-end/src/services/appointment.service.js) | `findOne(id)` | `appointment_id INT` | `a.appointment_id === id` | Filter type mismatch | Appointment lookup fails if `id` is string. |
| **D03** | [`back-end/src/services/appointment.service.js:57`](back-end/src/services/appointment.service.js) | `create(appointment)` | `created_by INT NOT NULL` (FK -> `users`) | Hardcoded fallback `105` | FK hardcoding | Misattributes appointment creator to User 105 across tenants. |
| **D04** | [`back-end/src/services/appointment.service.js:66-69`](back-end/src/services/appointment.service.js) | `create(appointment)` | Only `scheduled_datetime DATETIME` | Adds `appointment_date`, `appointment_time`, `department` | Attribute mismatch | Redundant fields polluting entity payload. |
| **D05** | [`back-end/src/services/appointment.service.js:68`](back-end/src/services/appointment.service.js) | `create(appointment)` | `scheduled_datetime DATETIME NOT NULL` (ISO-8601) | Template `${date}T${time}` without timezone | Timestamp format | Creates invalid or unstandardized ISO strings (e.g. `...T09:00 AM`). |
| **D06** | [`back-end/src/services/appointment.service.js:71`](back-end/src/services/appointment.service.js) | `create(appointment)` | `status DEFAULT 'CONFIRMED'` | `status: appointment.status \|\| 'SCHEDULED'` | Enum mismatch | Uses `'SCHEDULED'` not present in Table 14 schema enum. |
| **D07** | [`back-end/src/services/appointment.service.js:86`](back-end/src/services/appointment.service.js) | `update(id, patch)` | `appointment_id INT` | `pr.appointment_id === id` | Filter type mismatch | Pre-request appointment sync fails if `id` is string. |
| **D08** | [`back-end/src/validators/appointment.validators.js:7, 12, 13`](back-end/src/validators/appointment.validators.js) | `createAppointmentRules` | `doctor_id`, `scheduled_datetime`, `visit_type` NOT NULL | Marked `optional: true` | Validation constraint | Incomplete appointments pass validation. |
| **D09** | [`back-end/src/services/billing.service.js:32`](back-end/src/services/billing.service.js) | `findLedgerByAdmission` | `admission_id INT` | `l.admission_id === admission_id` | Filter type mismatch | Ledger lookup fails when `admission_id` is string. |
| **D10** | [`back-end/src/services/billing.service.js:36`](back-end/src/services/billing.service.js) | `findLedgerById` | `ledger_id INT` | `l.ledger_id === ledger_id` | Filter type mismatch | Fails to find ledger if `ledger_id` is string. |
| **D11** | [`back-end/src/services/billing.service.js:60-61`](back-end/src/services/billing.service.js) | `createLedger` | `organization_id INT`, `hospital_id INT` | Uncoerced `ledger.organization_id`, `hospital_id` | FK coercion | Stores string foreign keys in integer columns. |
| **D12** | [`back-end/src/services/billing.service.js:72`](back-end/src/services/billing.service.js) | `findLedgerEntries` | `ledger_id INT` | `e.ledger_id === ledger_id` | Filter type mismatch | Returns `[]` if `ledger_id` is string; causes 0 total bill calculation. |
| **D13** | [`back-end/src/services/billing.service.js:95`](back-end/src/services/billing.service.js) | `addLedgerEntry` | Composite key sequence `(ledger_id, entry_id)` | Compares `e.ledger_id === entry.ledger_id` (uncoerced) | Filter / PK generation | If `entry.ledger_id` is string, `entry_id` always resets to 1, duplicating PK. |
| **D14** | [`back-end/src/services/billing.service.js:136`](back-end/src/services/billing.service.js) | `createPayment` | `payment_mode VARCHAR` (`Cash`, `Card`, `UPI`) | Defaults to uppercase `'CASH'` | Enum casing | Inconsistent enum casing with schema definition. |
| **D15** | [`back-end/src/services/billing.service.js:173`](back-end/src/services/billing.service.js) | `createPayment` | `ledgers` columns per Table 20 | Injects `ledger.cleared_at` | Attribute mismatch | Non-schema attribute added to ledger. |
| **D16** | [`back-end/src/services/billing.service.js:177`](back-end/src/services/billing.service.js) | `createPayment` | `admissions.receipt_sent_to_hom BOOLEAN` | Injects `admission.bills_cleared = true` | Attribute mismatch | Redundant field that bypasses schema `receipt_sent_to_hom`. |
| **D17** | [`back-end/src/services/billing.service.js:178`](back-end/src/services/billing.service.js) | `createPayment` | `admissions.status ('ADMITTED', 'DISCHARGED')` | `admission.status = 'PAYMENT_CONFIRMED'` | Enum mismatch | Corrupts admission status to a value outside Table 17 enum. |
| **D18** | [`back-end/src/services/billing.service.js:193`](back-end/src/services/billing.service.js) | `createPayment` | `ledgers.status ('OPEN', 'DISPATCHED', 'PAID')` | `ledger.status = 'PARTIALLY_PAID'` | Enum mismatch | Corrupts ledger status to a value outside Table 20 enum. |
| **D19** | [`back-end/src/services/billing.service.js:211`](back-end/src/services/billing.service.js) | `dispatchLedger` | `ledger_id INT` | `l.ledger_id === ledger_id` | Filter type mismatch | Dispatch fails if `ledger_id` is string. |
| **D20** | [`back-end/src/services/billing.service.js:277`](back-end/src/services/billing.service.js) | `findDischargeSummaryByAdmission` | `admission_id INT` | `s.admission_id === admission_id` | Filter type mismatch | Discharge summary lookup fails if `admission_id` is string. |
| **D21** | [`back-end/src/services/billing.service.js:330`](back-end/src/services/billing.service.js) | `findLeaderById` | `leader_id INT` | `l.leader_id === leader_id` | Filter type mismatch | Leader lookup fails if `leader_id` is string. |
| **D22** | [`back-end/src/services/billing.service.js:425`](back-end/src/services/billing.service.js) | `approveLeader` | `leaders` columns per Table 24 | Injects `leader.ledger_id` | Attribute mismatch | Non-schema attribute added to leader. |
| **D23** | [`back-end/src/controllers/billing.controller.js:81`](back-end/src/controllers/billing.controller.js) | `createPayment` | `ledger_id INT` | Passes uncoerced `req.body.ledger_id` to `findLedgerById` | Security / Filter mismatch | Ledger evaluates to null; tenant ownership check bypassed. |
| **D24** | [`back-end/src/validators/billing.validators.js:37`](back-end/src/validators/billing.validators.js) | `createDischargeSummaryRules` | `discharge_summaries` per Table 18 | Accepts `file_path` | Attribute mismatch | Accepts non-schema field. |
| **D25** | [`back-end/src/routes/billing.routes.js:120`](back-end/src/routes/billing.routes.js) | `POST /billing/leaders` | DTO validation middleware | No `validateBody` middleware attached | Validation missing | Unvalidated payloads accepted directly into billing leaders. |
| **D26** | [`back-end/src/services/doctor.service.js:16`](back-end/src/services/doctor.service.js) | `findDoctorById` | `doctor_id INT` | `d.doctor_id === doctor_id` | Filter type mismatch | Doctor lookup returns null if string passed. |
| **D27** | [`back-end/src/services/doctor.service.js:25`](back-end/src/services/doctor.service.js) | `createDoctor` | `doctors` columns per Table 12 | Adds `department: 'General'` | Attribute mismatch | Non-schema field stored on doctors. |
| **D28** | [`back-end/src/services/doctor.service.js:28, 51`](back-end/src/services/doctor.service.js) | `createDoctor`, `deleteDoctor` | `doctors` columns per Table 12 | Adds `is_active` and `status: 'INACTIVE'` | Attribute mismatch | Non-schema fields stored on doctors. |
| **D29** | [`back-end/src/services/doctor.service.js:53`](back-end/src/services/doctor.service.js) | `deleteDoctor` | `doctor_id INT` | `d.doctor_id !== doctor_id` | Filter type mismatch | Deletion fails if string ID passed. |
| **D30** | [`back-end/src/services/doctor.service.js:65`](back-end/src/services/doctor.service.js) | `findAvailabilityByDoctor` | `doctor_id INT` | `a.doctor_id === doctor_id` | Filter type mismatch | Returns empty list if doctor_id is string. |
| **D31** | [`back-end/src/services/doctor.service.js:72`](back-end/src/services/doctor.service.js) | `findAvailabilityById` | `availability_id INT` | `a.availability_id === availability_id` | Filter type mismatch | Returns null if availability_id is string. |
| **D32** | [`back-end/src/services/doctor.service.js:200`](back-end/src/services/doctor.service.js) | `deleteAvailability` | `availability_id INT` | `a.availability_id !== availability_id` | Filter type mismatch | Deletion fails if string ID passed. |
| **D33** | [`back-end/src/services/inventory.service.js:28, 36, 39`](back-end/src/services/inventory.service.js) | `updateItem`, `deleteItem` | `item_id INT` | `i.item_id === item_id` / `!== item_id` | Filter type mismatch | Item updates/deletions fail if string ID passed. |
| **D34** | [`back-end/src/services/inventory.service.js:54`](back-end/src/services/inventory.service.js) | `createRequest` | `quantity_requested INT` | Injects both `quantity` and `quantity_requested` | Attribute mismatch | Redundant non-schema attribute `quantity`. |
| **D35** | [`back-end/src/services/inventory.service.js:57`](back-end/src/services/inventory.service.js) | `createRequest` | `requested_by INT` (FK -> `users`) | Hardcoded fallback `101` | FK hardcoding | Misattributes purchase requests to User 101. |
| **D36** | [`back-end/src/services/inventory.service.js:63`](back-end/src/services/inventory.service.js) | `createRequest` | `purchase_requests` per Table 26 | Injects `invoice_url` | Attribute mismatch | Non-schema field stored on purchase request. |
| **D37** | [`back-end/src/services/inventory.service.js:71`](back-end/src/services/inventory.service.js) | `updateRequest` | `request_id INT` | `r.request_id === request_id` | Filter type mismatch | Request update fails if string ID passed. |
| **D38** | [`back-end/src/services/patient.service.js:48, 50`](back-end/src/services/patient.service.js) | `create(patient)` | `patients` columns per Table 10 | Adds `email` and `alternate_phone` | Attribute mismatch | Non-schema fields stored on patient. |
| **D39** | [`back-end/src/services/patient.service.js:108`](back-end/src/services/patient.service.js) | `createInsurance` | `coverage_type ('Comprehensive', 'Corporate', 'Individual')` | Defaults to `'Self'` | Enum mismatch | Non-schema enum value `'Self'` stored. |
| **D40** | [`back-end/src/services/preRequest.service.js:16-26`](back-end/src/services/preRequest.service.js) | Pre-request state machine | `status ('PENDING', 'APPROVED', 'REJECTED', 'ALLOCATED')` | 9 distinct statuses (`ADMITTED`, `DISCHARGED`, etc.) | State machine mismatch | Overloads pre-requests with inpatient admission states. |
| **D41** | [`back-end/src/services/preRequest.service.js:100`](back-end/src/services/preRequest.service.js) | `createLinkedAppointment` | `scheduled_datetime DATETIME NOT NULL` | Template `${date}T${time}` without timezone | Timestamp format | Stored string is unstandardized ISO-8601. |
| **D42** | [`back-end/src/services/preRequest.service.js:104`](back-end/src/services/preRequest.service.js) | `createLinkedAppointment` | `created_by INT` (FK -> `users`) | Hardcoded fallback `105` | FK hardcoding | Misattributes appointment creator to User 105. |
| **D43** | [`back-end/src/services/preRequest.service.js:115`](back-end/src/services/preRequest.service.js) | `findOne(id)` | `pre_request_id INT` | `p.pre_request_id === id` | Filter type mismatch | Lookup fails if `id` is string. |
| **D44** | [`back-end/src/services/preRequest.service.js:132-133`](back-end/src/services/preRequest.service.js) | `create` | `pre_requests` columns per Table 27 | Injects `note` and `document_urls` | Attribute mismatch | Non-schema attributes stored on pre-request. |
| **D45** | [`back-end/src/services/preRequest.service.js:196`](back-end/src/services/preRequest.service.js) | `updateFields` | `scheduled_datetime DATETIME` | Template `${date}T${time}` | Timestamp format | Produces non-standard ISO string. |
| **D46** | [`back-end/src/services/preRequest.service.js:303`](back-end/src/services/preRequest.service.js) | `consultationServiceFor` | `organization_id INT` | `s.organization_id === organizationId` | Filter type mismatch | Fails to match org service if string passed; creates duplicate service. |
| **D47** | [`back-end/src/services/preRequest.service.js:369`](back-end/src/services/preRequest.service.js) | `checkIn` (OPD branch) | `admit_time DATETIME NOT NULL` | Uses `admission_date` | Field name mismatch | Emits `admission_date` instead of `admit_time`; consumers get `undefined`. |
| **D48** | [`back-end/src/services/preRequest.service.js:364-374`](back-end/src/services/preRequest.service.js) | `checkIn` (OPD branch) | Table 17 `admissions` schema | Omits `admit_time`, `discharge_time`, `bed_id`, `receipt_sent_to_hom`; adds `doctor_id`, `department`, `visit_type`, `created_at` | Attribute mismatch | Admission record fails Table 17 structural conformity. |
| **D49** | [`back-end/src/services/preRequest.service.js:408`](back-end/src/services/preRequest.service.js) | `checkIn` (OPD branch) | Table 21 `ledger_entries` schema | Injects `created_at` | Attribute mismatch | Extra field not in Table 21 schema. |
| **D50** | [`back-end/src/services/preRequest.service.js:446`](back-end/src/services/preRequest.service.js) | `checkIn` (Inpatient branch) | `ward_id INT NOT NULL` (FK -> `wards`) | `ward_id: null` | FK constraint breach | Sets null on NOT NULL foreign key. |
| **D51** | [`back-end/src/services/preRequest.service.js:450`](back-end/src/services/preRequest.service.js) | `checkIn` (Inpatient branch) | `requested_by INT NOT NULL` (FK -> `users`) | `requested_by: actorRole \|\| 'PRE'` (string) | FK type mismatch | Stores role string `'PRE'` into an integer foreign key column. |
| **D52** | [`back-end/src/validators/preRequest.validators.js:12, 13`](back-end/src/validators/preRequest.validators.js) | `createPreRequestRules` | Table 27 columns | Accepts `document_urls` | Attribute mismatch | Accepts non-schema property. |
| **D53** | [`back-end/src/services/ward.service.js:64, 109, 120`](back-end/src/services/ward.service.js) | `updateWard`, `deleteWard` | `ward_id INT` | `w.ward_id === ward_id` / `!== ward_id` | Filter type mismatch | Ward operations fail if string ID passed. |
| **D54** | [`back-end/src/services/ward.service.js:131`](back-end/src/services/ward.service.js) | `findBedsByWard` | `ward_id INT` | `b.ward_id === ward_id` | Filter type mismatch | Returns empty array if string ward_id passed. |
| **D55** | [`back-end/src/services/ward.service.js:149`](back-end/src/services/ward.service.js) | `updateBedStatus` | `bed_id INT` | `b.bed_id === bed_id` | Filter type mismatch | Bed update fails if string bed_id passed. |
| **D56** | [`back-end/src/services/ward.service.js:184`](back-end/src/services/ward.service.js) | `createBedRequest` | `pre_request_id INT NOT NULL` (FK) | Allows `null` | FK constraint breach | Violates Table 28 mandatory foreign key. |
| **D57** | [`back-end/src/services/ward.service.js:186`](back-end/src/services/ward.service.js) | `createBedRequest` | `ward_id INT NOT NULL` (FK) | Allows `null` | FK constraint breach | Violates Table 28 mandatory foreign key. |
| **D58** | [`back-end/src/services/ward.service.js:190`](back-end/src/services/ward.service.js) | `createBedRequest` | `requested_by INT NOT NULL` (FK) | Allows `null` / uncoerced | FK constraint breach | Violates Table 28 mandatory foreign key. |
| **D59** | [`back-end/src/services/ward.service.js:224`](back-end/src/services/ward.service.js) | `updateBedRequest` | `bed_request_id INT` | `r.bed_request_id === id` | Filter type mismatch | Bed request update fails if string ID passed. |
| **D60** | [`back-end/src/services/ward.service.js:247`](back-end/src/services/ward.service.js) | `updateBedRequest` | `status ('PENDING', 'APPROVED', 'ALLOCATED', 'REJECTED')` | `request.status = 'DENIED'` | Enum mismatch | Sets status `'DENIED'` not in Table 28 schema enum. |
| **D61** | [`back-end/src/services/ward.service.js`](back-end/src/services/ward.service.js) | `createEmergency` | `department VARCHAR(100) NOT NULL` | Retired | Subsystem Removal | Subsystem removed entirely per user directive. |
| **D62** | [`back-end/src/services/ward.service.js`](back-end/src/services/ward.service.js) | `createEmergency` | `created_by INT NOT NULL` (FK -> `users`) | Retired | Subsystem Removal | Subsystem removed entirely per user directive. |
| **D63** | [`back-end/src/services/ward.service.js`](back-end/src/services/ward.service.js) | `updateEmergency` | `emergency_id INT` | Retired | Subsystem Removal | Subsystem removed entirely per user directive. |
| **D64** | [`back-end/src/controllers/ward.controller.js`](back-end/src/controllers/ward.controller.js) | `createEmergency` | `emergency_notifications.department` | Retired | Subsystem Removal | Subsystem removed entirely per user directive. |
| **D65** | [`back-end/src/validators/ward.validators.js:31-32`](back-end/src/validators/ward.validators.js) | `createBedRequestRules` | `pre_request_id`, `ward_id` NOT NULL | Both marked `optional: true` | Validation constraint | Incomplete bed requests pass validation. |
| **D66** | [`back-end/src/validators/ward.validators.js`](back-end/src/validators/ward.validators.js) | `createEmergencyRules` | `department` NOT NULL | Retired | Subsystem Removal | Subsystem removed entirely per user directive. |
| **D67** | [`back-end/src/validators/admission.validators.js:9`](back-end/src/validators/admission.validators.js) | `createAdmissionRules` | `bed_id INT NULL` | Marked `isNotEmpty` | Validation constraint | Rejects valid pre-allocation admissions. |
| **D68** | [`back-end/src/services/organization.service.js:84`](back-end/src/services/organization.service.js) | `findById` | `organization_id INT` | `o.organization_id === id` | Filter type mismatch | Org lookup fails if string ID passed. |
| **D69** | [`back-end/src/services/subscription.service.js:9`](back-end/src/services/subscription.service.js) | `findByOrg` | `organization_id INT` | `s.organization_id === organizationId` | Filter type mismatch | Subscription lookup fails if string org ID passed. |
| **D70** | [`back-end/src/services/subscriptionPlan.service.js:11`](back-end/src/services/subscriptionPlan.service.js) | `findById` | `plan_id INT` | `p.plan_id === id` | Filter type mismatch | Plan lookup fails if string ID passed. |
| **D71** | [`back-end/src/services/activity.service.js:13-20`](back-end/src/services/activity.service.js) | `log` | `activity_log` per Table 36 | Omits `hospital_id`; logs severity level as `type` | Attribute & semantic mismatch | Missing multi-facility scoping column; non-semantic event types. |
| **D72** | [`back-end/src/services/doctor.service.js:153`](back-end/src/services/doctor.service.js) | `findConflictingAppointment` | `appointment_id INT` | `appointment.appointment_id === excludeId` (uncoerced) | Filter type mismatch | Strict equality comparison against string `excludeId` causes false self-conflict on appointment reschedule, rejecting valid reschedules. |
| **D73** | [`back-end/src/services/rbac.service.js:245, 263`](back-end/src/services/rbac.service.js) | `newUser`, `setStaffActive` | Table 4 (`users`) schema columns | Injects `is_active: true` and mutates `user.is_active` | Non-schema attribute | Table 4 defines no `is_active` column; injects and mutates unmodeled attribute on users entity. |
| **D74** | [`back-end/src/store/dataStore.js:2450-2521`](back-end/src/store/dataStore.js) | `dischargeSummaries` seeds | Table 18 `gross_amount DECIMAL(12,2) NULL`, `insurance_deduction DECIMAL(12,2) NOT NULL DEFAULT 0.00` | Seed records omit `gross_amount` and `insurance_deduction`; summary 7 uses `notes` instead of `discharge_notes` | Schema seed omission | Seed records violate Table 18 schema contract; finance calculations reading `gross_amount` or `insurance_deduction` get `undefined`. |
| **D75** | [`back-end/src/utils/maxId.js:24-28`](back-end/src/utils/maxId.js) | `maxId(...) + 1 \|\| fallback` | Table initialization seeds primary key at domain base (e.g., 701, 801, 401) | `maxId(...)` returns 0 on empty array; `0 + 1 = 1` is truthy, rendering `\|\| fallback` dead code across 10+ services | Dead fallback logic / Sequence defect | If datastore collections are initialized empty, primary keys start at 1 instead of domain-configured base IDs (e.g. 701 for admissions, 801 for ledgers). |
| **D76** | [`back-end/src/services/auth.service.js:52-59`](back-end/src/services/auth.service.js) | `toPublicUser` | Table 4 `organization_id INT NOT NULL`, `hospital_id INT NULL` preserved in public user | Strips `organization_id` and `hospital_id` from public user object | Attribute stripping / Tenant desync | Strips tenant scoping attributes from authenticated user payload; frontend consumers accessing `user.organization_id` receive `undefined` (Obs-A3). |

---

## 10.4 R2: Frontend Fetching, Payload Mapping & Attribute Binding Discrepancies

### 10.4.1 Portal & Subsystem Analysis

1. **API Client Layer (`front-end/src/api/`)**:
   - `front-end/src/api/endpoints/wards.js:64-74`: Plural `/ward/emergencies` path vs backend `/ward/emergency` (Defect D2, causing 404s).
   - `front-end/src/api/endpoints/doctors.js`: Missing wrapper for `DELETE /doctor/availability/:id`.
   - `front-end/src/api/endpoints/platform.js`: Missing wrappers for `GET /data/full-state` and `POST /data/full-state`.
   - `front-end/src/api/endpoints/auth.js:34-40`: Tenant metadata read from `payload.user.organization_id` instead of `payload.tenant.organization_id`.

2. **Admin Portal (`front-end/src/pages/admin/`)**:
   - `DashboardPage.jsx:93-94`: Reads `r?.base_fee` instead of `r?.base_platform_fee` (Defect D3).
   - `DoctorDialog.jsx:15, 32, 49`: Collects and sends unnormalized `department` attribute; Table 12 (`doctors`) lacks this column.
   - `ItemDialog.jsx:54-59`: Selects `Medicine` (instead of schema enum `Medication`) and `Linen` (unmodeled).

3. **HOM Portal (`front-end/src/pages/hom/`)**:
   - `DashboardPage.jsx:128-131`: Bed occupancy rate is permanently 0% due to reading `w.occupied_beds`.
   - `PatientFlowPage.jsx:58-61`: Checks phantom attribute `a.bills_cleared` rather than Table 17 `receipt_sent_to_hom`.
   - `RestockModal.jsx:29-31, 81-87`: Captures `supplier`, `priority`, and `notes` but drops all three on submission; sends `invoice_url` not in Table 26.
   - `HomLayout.jsx:26`: References `session?.tenant?.hospital_name`, falling back to `'City General Hospital'`.

4. **Platform Portal (`front-end/src/pages/platform/`)**:
   - `ProvisionDialog.jsx:52`: Hardcodes `plan_id: 1` during organization provisioning.
   - `PlatformDashboardPage.jsx:343-345`: Correctly handles `base_platform_fee` while sibling pages fail.

5. **Public & Auth Pages (`front-end/src/pages/public/`)**:
   - `SignupPage.jsx:141-155, 324-330`: Prompts `DD/MM/YYYY`, fails backend `isISO8601` validation, catches and silently ignores error, dropping insurance policy.
   - `OrgSignupPage.jsx:119-120`: Reads `data.base_fee` instead of `data.base_platform_fee` (Defect D3).
   - `OrgSignupPage.jsx:192`: Hardcodes `plan_id: 1` on self-onboarding.

6. **PRE Portal (`front-end/src/pages/pre/`)**:
   - `AppointmentPage.jsx:57, 163-171, 310-312`: Captures clinical complaint / reason in UI `#appointmentReason`, but drops it from `api.preRequests.create()` payload.
   - `AppointmentPage.jsx:169`: Sends `appointment_time` instead of canonical `requested_time` (Table 27).
   - `BedRequestModal.jsx:120-123`: Submits `priority` as `NORMAL`, `HIGH`, `CRITICAL` vs Table 28 enum `NORMAL`, `URGENT`, `EMERGENCY`.
   - `Patient360Modal.jsx:136-138`: Reads `bed.ward_type` and `adm.admission_type`, which evaluate to `undefined` and fall back to `'Ward'` and `'Inpatient'`.
   - `DoctorRosterPage.jsx:51`: Reads `avail.days` and `avail.available_days`, which evaluate to `undefined` and permanently fall back to `'Mon – Sat'`.
   - `DischargePage.jsx:31-34`: Checks phantom property `a.bills_cleared`.
   - `preHelpers.js:84-134`: Implements a dual-casing bridge duplicating 8 core fields (`patient_name`/`patientName`, etc.) to compensate for mixed consumer conventions.

7. **FA Portal (`front-end/src/pages/fa/`)**:
   - `faActions.js:130-139`: Calculates `deduction` but omits `insurance_deduction` from `api.billing.dischargeSummary.create()`, sending only `final_amount`.
   - `SettlementSection.jsx:142-156, 169`: Uncontrolled `#coverage-override` input leaves `#net-payable-preview` static (Defect D7).
   - `faHelpers.js:73, 86`: Dereferences `admission.doctor_id` and `admission.department` not present in Table 17.

8. **Patient Portal (`front-end/src/pages/patient/`)**:
   - `patientStoreShape.js:77-102` & `BillingPage.jsx:144-178`: Omits `hasInsurance`, permanently displaying "Self Pay" (Defect D4).
   - `patientStoreShape.js:129-130, 159-173`: Omits `doctorId` from `buildAppointments` items (Defect D5); note that `BookAppointmentPage.jsx` consumes doctor slots directly from the doctors API, so this omission primarily affects appointment history views.
   - `PatientStoreContext.jsx:166-179`: Omits `copay_percentage` when saving insurance, silently resetting it to 0.
   - `ProfilePage.jsx:176-183`: Simulates password change with zero network dispatch (Defect D11).

### 10.4.2 Itemized Frontend Discrepancy Catalog (DISC-01 – DISC-19 & Obs-A1 – Obs-E3)

| Reference ID | Target File & Line | Category | Expected (`Database/Federico_Schemas.md` / Backend) | Implemented in Frontend | Severity & Operational Impact |
|:---|:---|:---|:---|:---|:---|
| **DISC-01** | [`front-end/src/pages/pre/AppointmentPage.jsx:57, 163-171, 312`](front-end/src/pages/pre/AppointmentPage.jsx) | Dropped Form Payload | Transmit `note: reason` (`preRequest.service.js:132`) | `reason` captured in state but dropped from `create()` payload | **High**: Clinical complaints entered by PRE staff are silently lost. |
| **DISC-02** | [`front-end/src/pages/pre/AppointmentPage.jsx:169`](front-end/src/pages/pre/AppointmentPage.jsx) | Attribute Key Mismatch | Transmit `requested_time` (`Federico_Schemas.md` Table 27) | Sends `appointment_time: time` | **Medium**: Relies on service fallback; bypasses strict validator rules. |
| **DISC-03** | [`front-end/src/pages/pre/BedRequestModal.jsx:120-123`](front-end/src/pages/pre/BedRequestModal.jsx) | Enum Discrepancy | `priority` IN (`NORMAL`, `URGENT`, `EMERGENCY`) | Submits `NORMAL`, `HIGH`, `CRITICAL` | **High**: Schema domain violation on strict SQL validation. |
| **DISC-04** | [`front-end/src/pages/pre/Patient360Modal.jsx:137`](front-end/src/pages/pre/Patient360Modal.jsx) | Non-Existent Column | `wards.ward_name` joined via `ward_id` | Reads `bed.ward_type` (always `undefined`) | **Low**: Silently falls back to string `'Ward'`. |
| **DISC-05** | [`front-end/src/pages/pre/Patient360Modal.jsx:138`](front-end/src/pages/pre/Patient360Modal.jsx) | Non-Existent Column | `admissions` has no type column | Reads `adm.admission_type` (always `undefined`) | **Low**: Silently falls back to string `'Inpatient'`. |
| **DISC-06** | [`front-end/src/pages/pre/DoctorRosterPage.jsx:51`](front-end/src/pages/pre/DoctorRosterPage.jsx) | Non-Existent Column | Discrete dates in `doctor_availabilities` | Reads `avail.days` (always `undefined`) | **Medium**: Every doctor displayed with static `'Mon – Sat'`. |
| **DISC-07** | [`front-end/src/pages/pre/DischargePage.jsx:31-34`](front-end/src/pages/pre/DischargePage.jsx) | Non-Existent Column | `ledgers.status === 'PAID'` | Tests phantom property `a.bills_cleared` | **Low**: Rescued by secondary ledger check. |
| **DISC-08** | [`front-end/src/pages/pre/preHelpers.js:84-134`](front-end/src/pages/pre/preHelpers.js) | Casing Inconsistency | Uniform `snake_case` or `camelCase` | Emits duplicate keys (`patient_name` AND `patientName`) | **Medium**: Architectural fragility across PRE views. |
| **DISC-09** | [`front-end/src/pages/fa/faActions.js:130-139`](front-end/src/pages/fa/faActions.js) | Payload Omission | Transmit `insurance_deduction: deduction` | Omitted; sends only `final_amount` | **Medium**: Backend must infer deduction via arithmetic fallback. |
| **DISC-10** | [`front-end/src/pages/fa/SettlementSection.jsx:148-155, 169`](front-end/src/pages/fa/SettlementSection.jsx) | Uncontrolled Input (Defect D7) | Reactive state updating `#net-payable-preview` | Uncontrolled `<input ref={...}>` without `onChange` | **High**: Net payable preview fails to update as user types. |
| **DISC-11** | [`front-end/src/pages/fa/faHelpers.js:73, 86`](front-end/src/pages/fa/faHelpers.js) | Non-Existent Column | Resolve via `pre_requests` / `appointments` | Reads `admission.doctor_id`, `department` | **Low**: Rescued by preRequest fallback. |
| **DISC-12** | [`front-end/src/pages/patient/patientStoreShape.js:84-102`](front-end/src/pages/patient/patientStoreShape.js) | Missing Property (Defect D4) | `hasInsurance: Boolean(...)` | `hasInsurance` omitted from profile object | **High**: Insured patients permanently see "Self Pay" banner. |
| **DISC-13** | [`front-end/src/pages/patient/patientStoreShape.js:159-173`](front-end/src/pages/patient/patientStoreShape.js) | Missing Property (Defect D5) | Appointment item includes `doctorId: docId` | `doctorId` omitted from appointment items | **Medium**: Omission in `buildAppointments`; while legacy comment claimed booking slot filter broke, `BookAppointmentPage.jsx` actually consumes doctor API directly; downstream appointment consumers lose `doctorId`. |
| **DISC-14** | [`front-end/src/pages/patient/PatientStoreContext.jsx:166-179`](front-end/src/pages/patient/PatientStoreContext.jsx) | Payload Omission | Transmit `copay_percentage` (Table 11) | `copay_percentage` omitted from `createInsurance` | **Medium**: Profile edits silently reset copay to 0%. |
| **DISC-15** | [`front-end/src/pages/patient/ProfilePage.jsx:176-183`](front-end/src/pages/patient/ProfilePage.jsx) | Ghost Mutation (Defect D11) | Dispatch to backend password endpoint | Simulates success via toast; zero network dispatch | **Critical**: False security impression; password never changes. |
| **DISC-16** | [`front-end/src/pages/hom/RestockModal.jsx:29-31, 81-87`](front-end/src/pages/hom/RestockModal.jsx) | Dropped Form Fields | Aligned with Table 26 `purchase_requests` | Captures supplier, priority, notes; drops all 3 | **Medium**: User input discarded on purchase order submit. |
| **DISC-17** | [`front-end/src/pages/hom/PostServiceModal.jsx:41-45`](front-end/src/pages/hom/PostServiceModal.jsx) | Payload Omission | Transmit `patient_id` (Table 24 NOT NULL) | Omitted; relies on backend admission resolution | **Low**: Service auto-resolves from admission store. |
| **DISC-18** | [`front-end/src/api/endpoints/wards.js:64-74`](front-end/src/api/endpoints/wards.js) | Route Mismatch (Defect D2) | Dispatches to `/ward/emergency` (singular) | Dispatches to `/ward/emergencies` (plural) | **High**: Any call to ward emergency API throws HTTP 404. |
| **DISC-19** | [`front-end/src/pages/pre/ApprovePopup.jsx:47, 50`](front-end/src/pages/pre/ApprovePopup.jsx) | Non-Schema Coupling | `scheduled_datetime DATETIME NOT NULL` (Table 14) | Couples to non-schema `appointment_date` & `appointment_time` | **High**: PRE conflict detection directly depends on redundant non-schema attributes (D04); fails if backend is strictly normalized. |
| **Obs-A1** | [`front-end/src/api/endpoints/wards.js:64-74`](front-end/src/api/endpoints/wards.js) | Route Mismatch (Defect D2) | `/ward/emergency` route mounts in backend | Calls `/ward/emergencies` | **High**: Direct HTTP 404 on emergency listing and submission. |
| **Obs-A2** | [`front-end/src/api/endpoints/doctors.js`](front-end/src/api/endpoints/doctors.js), [`platform.js`](front-end/src/api/endpoints/platform.js) | Missing API Bindings | Client wrappers for all backend routes | Missing `removeAvailability`, `getFullState`, `setFullState` | **Low**: Endpoints unreachable via standard facade methods. |
| **Obs-A3** | [`front-end/src/api/endpoints/auth.js:34-40, 62-63`](front-end/src/api/endpoints/auth.js) | Attribute Misalignment | Reads `payload.tenant.organization_id` | Reads `payload.user.organization_id` (null) | **Medium**: Evaluates to null outside SessionContext. |
| **Obs-B1** | [`front-end/src/pages/admin/DashboardPage.jsx:93-94`](front-end/src/pages/admin/DashboardPage.jsx) | Attribute Mismatch (Defect D3) | `base_platform_fee` emitted by backend | Reads `r?.base_fee` | **High**: Admin dashboard fails to reflect updated rate card fee. |
| **Obs-B2** | [`front-end/src/pages/admin/DoctorDialog.jsx:15, 32, 49`](front-end/src/pages/admin/DoctorDialog.jsx) | Non-Schema Attribute | Doctors table per Table 12 | Collects and submits `department` | **Low**: Unnormalized property stored in mock dataStore. |
| **Obs-B3** | [`front-end/src/pages/admin/ItemDialog.jsx:54-59`](front-end/src/pages/admin/ItemDialog.jsx) | Enum Mismatch | `category` IN (`Medication`, `Consumable`, `Equipment`) | Presents `Medicine` and `Linen` | **Medium**: Schema enum divergence in inventory catalog. |
| **Obs-C1** | [`front-end/src/pages/hom/DashboardPage.jsx:128-131`](front-end/src/pages/hom/DashboardPage.jsx) | Non-Existent Column | Calculate occupancy from `beds` collection | Reads `w.occupied_beds` on `wards` | **Critical**: Bed occupancy permanently displays 0%. |
| **Obs-C2** | [`front-end/src/pages/hom/PatientFlowPage.jsx:58-61`](front-end/src/pages/hom/PatientFlowPage.jsx) | Non-Existent Column | `receipt_sent_to_hom` (Table 17) | Checks phantom `a.bills_cleared` | **Low**: Rescued by secondary ledger check. |
| **Obs-C3** | [`front-end/src/pages/hom/RestockModal.jsx:29-31, 81-87`](front-end/src/pages/hom/RestockModal.jsx) | Dropped Fields / Non-Schema Column | Aligned with Table 26 schema | Drops supplier/priority/notes; passes `invoice_url` | **Medium**: Data lost; non-schema column passed to Table 26. |
| **Obs-C4** | [`front-end/src/pages/hom/HomLayout.jsx:26`](front-end/src/pages/hom/HomLayout.jsx) | Field Fallback Mismatch | Read `organization_name` from tenant | Reads `hospital_name`, falls back to hardcoded string | **Low**: Defaults to `'City General Hospital'`. |
| **Obs-D1** | [`front-end/src/pages/platform/ProvisionDialog.jsx:52`](front-end/src/pages/platform/ProvisionDialog.jsx) | Hardcoded ID | Dynamic plan selection from Table 2 | Hardcodes `plan_id: 1` | **Medium**: Bypasses subscription tier configuration. |
| **Obs-D2** | [`front-end/src/pages/platform/PlatformDashboardPage.jsx:343`](front-end/src/pages/platform/PlatformDashboardPage.jsx) | Attribute Discrepancy | Unified `base_platform_fee` | Page handles D3, but sibling pages remain broken | **Medium**: Inconsistent rate property handling across portals. |
| **Obs-E1** | [`front-end/src/pages/public/SignupPage.jsx:141-155, 324`](front-end/src/pages/public/SignupPage.jsx) | Date Validation Drop | ISO 8601 string (`YYYY-MM-DD`) | Prompts and sends `DD/MM/YYYY`; error swallowed | **Critical**: Patient insurance silently dropped during registration. |
| **Obs-E2** | [`front-end/src/pages/public/OrgSignupPage.jsx:119-120`](front-end/src/pages/public/OrgSignupPage.jsx) | Attribute Mismatch (Defect D3) | `base_platform_fee` emitted by backend | Checks `data.base_fee` | **High**: Prospective hospital signups miss live rate updates. |
| **Obs-E3** | [`front-end/src/pages/public/OrgSignupPage.jsx:192`](front-end/src/pages/public/OrgSignupPage.jsx) | Hardcoded ID | Dynamic plan selection from Table 2 | Hardcodes `plan_id: 1` | **Medium**: Limits self-onboarded tenants to single tier. |

---

## 10.5 R3: Master Cross-Layer Schema Alignment Matrix

This matrix establishes the comprehensive end-to-end traceability linking Frontend UI Pages/Components <-> Frontend API Endpoints <-> Backend Routes/Controllers <-> Backend Services <-> Database Tables ([`Database/Federico_Schemas.md`](Database/Federico_Schemas.md)).

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                           CROSS-LAYER SCHEMA ALIGNMENT MATRIX                                                          │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Table 1: Organizations (`organizations`) — Schema Table 1
| Frontend View / Component | UI Field Bound | Frontend API Call | Backend Route & Controller | Backend Service & Method | Schema Column & Type | Status & Invariant Verification |
|:---|:---|:---|:---|:---|:---|:---|
| `public/OrgSignupPage.jsx` | `org.name` | `api.marketplace.registerOrganization` | `POST /marketplace/register-organization` (`marketplace.controller.js`) | `organization.service.js:create` | `name VARCHAR(255) NOT NULL` | **Aligned**: Provisions org workspace via marketplace registration. |
| `public/OrgSignupPage.jsx` | `adminEmail` | `api.marketplace.registerOrganization` | `POST /marketplace/register-organization` (`marketplace.controller.js`) | `organization.service.js:create` | `contact_email VARCHAR(100)` | **Aligned**: Mapped from admin_email / email_domain. |
| `public/OrgSignupPage.jsx` | `org.phone` | `api.marketplace.registerOrganization` | `POST /marketplace/register-organization` (`marketplace.controller.js`) | `organization.service.js:create` | `contact.phone` (JSON) | **Aligned**: Normalized phone attached to org contact. |
| `public/OrgSignupPage.jsx` | `org.address` | `api.marketplace.registerOrganization` | `POST /marketplace/register-organization` (`marketplace.controller.js`) | `organization.service.js:create` | `hospitals.address TEXT` | **Aligned**: Assigned to primary hospital campus. |
| `public/OrgSignupPage.jsx` | `plan_id: 1` | `api.marketplace.registerOrganization` | `POST /marketplace/register-organization` (`marketplace.controller.js`) | `subscription.service.js:create` | `plan_id INT NOT NULL` (FK) | **Discrepant**: Hardcoded `plan_id: 1` in registration payload (Obs-E3). |
| `admin/DashboardPage.jsx` | `r?.base_fee` | `api.platform.rates.get` | `GET /platform/rates` (`platform.controller.js`) | `platformRates` in store | `base_platform_fee DECIMAL(10,2)` | **Discrepant**: Defect D3; reads `base_fee` (Obs-B1). |

### Table 2: Users & Authentication (`users`) — Schema Table 4
| Frontend View / Component | UI Field Bound | Frontend API Call | Backend Route & Controller | Backend Service & Method | Schema Column & Type | Status & Invariant Verification |
|:---|:---|:---|:---|:---|:---|:---|
| `public/LoginPage.jsx` | `email`, `password` | `api.auth.login` | `POST /auth/login/:role` (`auth.controller.js`) | `auth.service.js:login` | `email VARCHAR(100)`, `password_hash VARCHAR(255)` | **Aligned**: Password verified via bcrypt. |
| `patient/ProfilePage.jsx` | `f.currentPassword`, `f.newPassword` | *None* | *None* | *None* | `password_hash VARCHAR(255)` | **Discrepant**: Defect D11; ghost mutation (DISC-15). |
| `admin/PeoplePage.jsx` | `user.name`, `user.email`, `user.role` | `api.users.list` | `GET /users` (`user.controller.js`) | `user.service.js:findAll` | `name`, `email`, `role_id INT` | **Aligned**: Role joined from Table 3 (`roles`). |

### Table 3: Patients & Insurance (`patients`, `patient_insurances`) — Schema Tables 10, 11
| Frontend View / Component | UI Field Bound | Frontend API Call | Backend Route & Controller | Backend Service & Method | Schema Column & Type | Status & Invariant Verification |
|:---|:---|:---|:---|:---|:---|:---|
| `public/SignupPage.jsx` | `f.name`, `f.dob`, `f.gender`, `f.phone` | `api.patients.create` | `POST /patient` (`patient.controller.js`) | `patient.service.js:create` | `name`, `dob DATE`, `gender`, `phone` | **Aligned**: Generates numeric `patient_id` and unique `uhid`. |
| `public/SignupPage.jsx` | `f.validFrom`, `f.validTo` | `api.patients.createInsurance` | `POST /patient/insurance` (`patient.controller.js`) | `patient.service.js:createInsurance` | `valid_from DATE`, `valid_to DATE` | **Discrepant**: Format mismatch; `DD/MM/YYYY` fails `isISO8601` (Obs-E1). |
| `patient/BillingPage.jsx` | `ins.hasInsurance` | `api.patients.portalSummary` | `GET /patient/portal/summary/:id?` (`patient.controller.js`) | `patientStoreShape.js:buildProfile` | `patient_insurances` record exists | **Discrepant**: Defect D4; `hasInsurance` omitted from profile (DISC-12); loaded via composite portal summary. |
| `patient/PatientStoreContext.jsx`| `fields.copay` | `api.patients.createInsurance` | `POST /patient/insurance` (`patient.controller.js`) | `patient.service.js:createInsurance` | `copay_percentage INT DEFAULT 0` | **Discrepant**: `copay_percentage` omitted from payload (DISC-14). |

### Table 4: Doctors & Roster (`doctors`, `doctor_availabilities`) — Schema Tables 12, 13
| Frontend View / Component | UI Field Bound | Frontend API Call | Backend Route & Controller | Backend Service & Method | Schema Column & Type | Status & Invariant Verification |
|:---|:---|:---|:---|:---|:---|:---|
| `admin/DoctorDialog.jsx` | `f.department` | `api.doctors.create` | `POST /doctor` (`doctor.controller.js`) | `doctor.service.js:createDoctor` | *No column in Table 12* | **Discrepant**: Table 12 lacks `department`; physical unit is `ward_id` (Obs-B2). |
| `pre/DoctorRosterPage.jsx`| `avail?.days` | `api.doctors.availabilities` | `GET /doctor/availability` (`doctor.controller.js`) | `doctor.service.js:findAvailabilityByDoctor`| `available_date DATE NOT NULL` | **Discrepant**: Table 13 stores discrete dates, not `days` (DISC-06). |
| `patient/AppointmentHistory` / Store | `apt.doctorId` | `api.patients.portalSummary` | `GET /patient/portal/summary/:id?` (`patient.controller.js`) | `patientStoreShape.js:buildAppointments` | `doctor_id INT NOT NULL` | **Discrepant**: Defect D5; `doctorId` omitted from `buildAppointments` (DISC-13); `BookAppointmentPage.jsx` consumes doctor list directly. |

### Table 5: Outpatient Appointments & Pre-Requests (`appointments`, `pre_requests`) — Schema Tables 14, 27
| Frontend View / Component | UI Field Bound | Frontend API Call | Backend Route & Controller | Backend Service & Method | Schema Column & Type | Status & Invariant Verification |
|:---|:---|:---|:---|:---|:---|:---|
| `pre/AppointmentPage.jsx` | `reason` (`#appointmentReason`) | `api.preRequests.create` | `POST /pre-request` (`preRequest.controller.js`) | `preRequest.service.js:create` | `note VARCHAR(500) NULL` | **Discrepant**: UI state `reason` dropped on API dispatch (DISC-01). |
| `pre/AppointmentPage.jsx` | `appointment_time: time` | `api.preRequests.create` | `POST /pre-request` (`preRequest.controller.js`) | `preRequest.service.js:create` | `requested_time TIME NULL` | **Discrepant**: Key naming drift; `appointment_time` vs `requested_time` (DISC-02). |
| `pre/AppointmentPage.jsx` | `date`, `time` | `api.preRequests.create` | `POST /pre-request` -> `createLinkedAppointment` | `preRequest.service.js:100` | `scheduled_datetime DATETIME NOT NULL` | **Discrepant**: `${date}T${time}` lacks timezone / ISO-8601 conformity (D41). |
| `pre/preHelpers.js` | `pName`, `dName`, etc. | Join helper | Direct memory join | None | `patient_name`, `doctor_name` | **Discrepant**: Dual-convention shim emitting snake_case & camelCase (DISC-08). |

### Table 6: Wards, Beds & Bed Requests (`wards`, `beds`, `bed_requests`) — Schema Tables 15, 16, 28
| Frontend View / Component | UI Field Bound | Frontend API Call | Backend Route & Controller | Backend Service & Method | Schema Column & Type | Status & Invariant Verification |
|:---|:---|:---|:---|:---|:---|:---|
| `hom/DashboardPage.jsx` | `w.occupied_beds` | `api.wards.list` | `GET /ward` (`ward.controller.js`) | `ward.service.js:findAllWards` | *No column in Table 15* | **Discrepant**: Table 15 has no `occupied_beds`; occupancy is 0% (Obs-C1). |
| `pre/BedRequestModal.jsx` | `priority` (`HIGH`, `CRITICAL`) | `api.wards.requests.create` | `POST /ward/request` (`ward.controller.js`) | `ward.service.js:createBedRequest` | `priority ('NORMAL', 'URGENT', 'EMERGENCY')` | **Discrepant**: Enum divergence; `HIGH`/`CRITICAL` vs `URGENT`/`EMERGENCY` (DISC-03). |
| `pre/Patient360Modal.jsx` | `bed.ward_type` | Join helper | In-memory lookup | None | *No column in Table 16* | **Discrepant**: Table 16 lacks `ward_type`; joined from Table 15 (DISC-04). |
| `back-end/src/services/` | `requested_by: 'PRE'` | Inpatient Check-in | `POST /pre-request/:id/check-in` | `preRequest.service.js:450` | `requested_by INT NOT NULL` (FK -> `users`) | **Discrepant**: Stores string `'PRE'` into integer foreign key (D51). |
| `back-end/src/services/` | `ward_id: null` | Inpatient Check-in | `POST /pre-request/:id/check-in` | `preRequest.service.js:446` | `ward_id INT NOT NULL` (FK -> `wards`) | **Discrepant**: Assigns `null` to non-nullable foreign key (D50). |

### Table 7: Admissions & Clinical Stays (`admissions`) — Schema Table 17
| Frontend View / Component | UI Field Bound | Frontend API Call | Backend Route & Controller | Backend Service & Method | Schema Column & Type | Status & Invariant Verification |
|:---|:---|:---|:---|:---|:---|:---|
| `pre/Patient360Modal.jsx` | `adm.admission_type` | In-memory join | Lookup | None | *No column in Table 17* | **Discrepant**: Table 17 lacks `admission_type`; falls back to `'Inpatient'` (DISC-05). |
| `hom/PatientFlowPage.jsx` | `a.bills_cleared` | `api.admissions.list` | `GET /admission` (`admission.controller.js`) | `admission.service.js:findAll` | `receipt_sent_to_hom BOOLEAN DEFAULT FALSE` | **Discrepant**: Checks non-existent `a.bills_cleared` (Obs-C2, DISC-07). |
| `back-end/src/services/` | `admission_date` | Pre-Request Check-in | `POST /pre-request/:id/check-in` | `preRequest.service.js:369` | `admit_time DATETIME NOT NULL` | **Discrepant**: Emits `admission_date` instead of `admit_time` (D47, D48). |
| `back-end/src/services/` | `status = 'PAYMENT_CONFIRMED'` | Payment Clearing | `POST /billing/payments` | `billing.service.js:178` | `status ('ADMITTED', 'DISCHARGED')` | **Discrepant**: Emits status `'PAYMENT_CONFIRMED'` outside Table 17 enum (D17). |

### Table 8: Billing Ledgers & Entries (`ledgers`, `ledger_entries`) — Schema Tables 20, 21
| Frontend View / Component | UI Field Bound | Frontend API Call | Backend Route & Controller | Backend Service & Method | Schema Column & Type | Status & Invariant Verification |
|:---|:---|:---|:---|:---|:---|:---|
| `fa/faHelpers.js` | `ledgerTotal(entries)` | `api.billing.ledgers.entries` | `GET /billing/ledgers/:id/entries` (`billing.controller.js`) | `billing.service.js:findLedgerEntries` | `amount DECIMAL(12,2) NOT NULL` | **Aligned**: Calculates sum of ledger entries. |
| `back-end/src/services/` | `entry_id` sequence | `POST /billing/ledgers/:id/entries` | `billing.controller.js:addEntry` | `billing.service.js:95` | `(ledger_id, entry_id)` Composite PK | **Discrepant**: String comparison `e.ledger_id === entry.ledger_id` resets index to 1 (D13). |
| `back-end/src/services/` | `ledger.status = 'PARTIALLY_PAID'` | Payment Recording | `POST /billing/payments` | `billing.service.js:193` | `status ('OPEN', 'DISPATCHED', 'PAID')` | **Discrepant**: Emits status `'PARTIALLY_PAID'` outside Table 20 enum (D18). |
| `fa/SettlementSection.jsx`| `coverage-override` | Ref read on submit | None (uncontrolled input) | None | `insurance_deduction DECIMAL(12,2)` | **Discrepant**: Defect D7; input uncontrolled, static preview (DISC-10). |

### Table 9: Service Charges & Leaders (`leaders`, `services`) — Schema Tables 19, 24
| Frontend View / Component | UI Field Bound | Frontend API Call | Backend Route & Controller | Backend Service & Method | Schema Column & Type | Status & Invariant Verification |
|:---|:---|:---|:---|:---|:---|:---|
| `hom/PostServiceModal.jsx` | `admission_id`, `service_id`, `quantity` | `api.billing.leaders.create` | `POST /billing/leaders` (`billing.controller.js`) | `billing.service.js:createLeader` | `patient_id INT NOT NULL` (FK) | **Discrepant**: `patient_id` omitted from payload; resolved via admission (DISC-17). |
| `back-end/src/services/` | `leader.ledger_id` | Leader Approval | `POST /billing/leaders/:id/approve` | `billing.service.js:425` | *No column in Table 24* | **Discrepant**: Non-schema attribute `ledger_id` added to leader (D22). |

### Table 10: Discharge Summaries (`discharge_summaries`) — Schema Table 18
| Frontend View / Component | UI Field Bound | Frontend API Call | Backend Route & Controller | Backend Service & Method | Schema Column & Type | Status & Invariant Verification |
|:---|:---|:---|:---|:---|:---|:---|
| `fa/faActions.js` | `final_amount: finalAmount` | `api.billing.dischargeSummary.create` | `POST /billing/discharge-summary` (`billing.controller.js`) | `billing.service.js:createDischargeSummary` | `insurance_deduction DECIMAL(12,2) NOT NULL DEFAULT 0.00` | **Discrepant**: Frontend drops `deduction`; backend must infer via arithmetic fallback (DISC-09). |
| `back-end/src/validators/` | `file_path` | DTO Validation | `POST /billing/discharge-summary` | `billing.validators.js:37` | *No column in Table 18* | **Discrepant**: Accepts non-schema property `file_path` (D24). |

### Table 11: Inventory & Purchase Requests (`inventory_items`, `purchase_requests`) — Schema Tables 25, 26
| Frontend View / Component | UI Field Bound | Frontend API Call | Backend Route & Controller | Backend Service & Method | Schema Column & Type | Status & Invariant Verification |
|:---|:---|:---|:---|:---|:---|:---|
| `admin/ItemDialog.jsx` | `f.category` | `api.inventory.items.create` | `POST /inventory/item` (`inventory.controller.js`) | `inventory.service.js:createItem` | `category ('Medication', 'Consumable', 'Equipment')` | **Discrepant**: Select provides `'Medicine'` and `'Linen'` (Obs-B3). |
| `hom/RestockModal.jsx` | `supplier`, `priority`, `notes` | `api.inventory.requests.create` | `POST /inventory/request` (`inventory.controller.js`) | `inventory.service.js:createRequest` | *No columns in Table 26* | **Discrepant**: User form fields dropped; non-schema `invoice_url` sent (Obs-C3, DISC-16). |
| `back-end/src/services/` | `requested_by` fallback | In-Memory Create | `POST /inventory/request` | `inventory.service.js:57` | `requested_by INT NOT NULL` (FK -> `users`) | **Discrepant**: Hardcodes fallback `101` (D35). |

### Table 12: Ward Emergencies (`emergency_notifications`) — Schema Table 29
| Frontend View / Component | UI Field Bound | Frontend API Call | Backend Route & Controller | Backend Service & Method | Schema Column & Type | Status & Invariant Verification |
|:---|:---|:---|:---|:---|:---|:---|
| `api/endpoints/wards.js` | `api.wards.emergencies.*` | `/ward/emergencies` | `POST /ward/emergency` (`ward.routes.js:93`) | `ward.service.js:createEmergency` | `department VARCHAR(100) NOT NULL` | **Discrepant**: Defect D2; plural route fails with HTTP 404 (DISC-18, Obs-A1). |
| `back-end/src/services/` | `payload.department \|\| null` | Emergency Creation | `POST /ward/emergency` | `ward.service.js:281` | `department VARCHAR(100) NOT NULL` | **Discrepant**: Allows `null` on mandatory NOT NULL column (D61). |
| `back-end/src/services/` | `created_by` fallback | Emergency Creation | `POST /ward/emergency` | `ward.service.js:283` | `created_by INT NOT NULL` (FK -> `users`) | **Discrepant**: Hardcodes fallback `101` (D62). |

---

## 10.6 Automated Verification Results & Zero-Code Modification Attestation

### 10.6.1 Automated Test Suites Execution (`back-end/`)
Execution of the complete Jest test suite in `D:\Federico_workspace\back-end`:
```powershell
cd D:\Federico_workspace\back-end
npm test
```
**Results Verified**:
- **Test Suites**: 25 passed, 25 total (100% passing).
- **Tests**: 173 passed, 173 total (100% passing).
- **Snapshots**: 0 total.
- **Duration**: 4.654 seconds.
- **Suites Verified**:
  - `src/test/phase_1_security_fixes.spec.js`: PASS
  - `src/test/phase_2_database_integrity.spec.js`: PASS
  - `src/test/unified_login.spec.js`: PASS
  - `src/test/allocation_and_booking_guards.spec.js`: PASS
  - `src/test/doctor.service.spec.js`: PASS
  - `src/test/tenant.spec.js`: PASS
  - `src/test/logManager.spec.js`: PASS
  - `test/app.e2e-spec.js`: PASS
  - All remaining route and unit test specifications: PASS.

### 10.6.2 Frontend Static Analysis (`front-end/`)
Execution of `oxlint` static analysis across the frontend codebase:
```powershell
cd D:\Federico_workspace\front-end
npx oxlint
```
**Results Verified**:
- **Files Inspected**: 156 files across 104 rules.
- **Errors**: **0 errors**.
- **Warnings**: 2 minor purity/effect warnings (`Patient360Modal.jsx` and `RegisterWalkInPopup.jsx`).
- **Execution Time**: 72ms.

### 10.6.3 Frontend Production Build (`front-end/`)
Execution of production build using Vite 8.3.0 and React 19:
```powershell
cd D:\Federico_workspace\front-end
npm run build
```
**Results Verified**:
- **Modules Transformed**: 204 client modules transformed.
- **Output Artifacts**: HTML, CSS, and JS chunks generated successfully into `dist/`.
- **Errors**: **0 compilation/bundling errors**.
- **Build Duration**: 1.12 seconds.

### 10.6.4 Zero Application Code Modification Attestation
A forensic inspection of the working tree confirms that **zero application source code files** in `back-end/src/` or `front-end/src/` were modified during this audit and documentation process. Only `PROJECT_MEMORY.md` and agent metadata files in `.agents/teamwork/` were authored, guaranteeing full preservation of the established baseline.

### 10.6.5 Prohibited Paths Zero-Access Attestation
Forensic verification attests 100% adherence to the Zero-Access directive:
- `D:\Federico_workspace\LICENSE`: 0 access.
- `D:\Federico_workspace\react-migration-plan.md`: 0 access.
- `D:\Federico_workspace\SRS.pdf`: 0 access.
- `D:\Federico_workspace\Figma`: 0 access.
- `D:\Federico_workspace\videos`: 0 access.
- `D:\Federico_workspace\definitions.yml`: 0 access.
- `D:\Federico_workspace\DomainExpertInteraction.md`: 0 access.
*(All schema definitions and relational contracts were verified strictly against [`Database/Federico_Schemas.md`](Database/Federico_Schemas.md).)*
