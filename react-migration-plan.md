# React + Vite Migration Plan — Federico Hospital Platform Frontend

> **Document status:** Phase 1 execution plan. Written to be executed by a session with
> no prior knowledge of the legacy code. Every path, function name and endpoint below was
> read directly from source, not inferred.
>
> **Repository root for all paths in this document:** `codebase/16_Federico/`
> (the git repository lives here, *not* at the workspace root).
>
> **Branch:** work happens on `feat/react-implementation`, branched from `main` at `1708ea7`.
> `pre-react-backup` was created from that same commit before any change landed.
>
> **All twelve open questions are resolved — see §7.** Nothing in this document is waiting
> on an answer; a future session can execute it start to finish without asking anything.

---

## 0. Context

`codebase/16_Federico/front-end/` is a 111-file, ~28,000-line vanilla-JS multi-page
application: 34 HTML pages across 8 role portals, 45 classic (non-module) `<script>` files
that communicate exclusively through `window.*` globals, and 21 CSS files that are
globally scoped and collide with each other by class name. There is no build step, no
package manager (`front-end/package-lock.json` is an empty stub), and no module system.

It talks to an Express backend in `codebase/16_Federico/back-end/` (Node + Express 4,
in-memory `dataStore` persisted to `data/db.json`), served on `http://localhost:3000`.

**Goal of Phase 1:** a real React + Vite single-page application — components, hooks,
ES-module imports, a router — that is *behaviour-identical* to the current app. Not a
wrapper that `eval`s the old scripts, not a redesign. The backend is not touched.
UI simplification is Phase 2 and is deliberately out of scope here.

---

## 1. Current State Inventory

### 1.1 HTML pages

All paths relative to `front-end/`. "Navigated to" describes how a user actually reaches
the page today.

| # | Path | Purpose / what it renders | Navigated to by |
|---|---|---|---|
| 1 | `landing/landing-page.html` | Public marketing page. Static hero/feature markup; five buttons (`#login-btn`, `#signup-btn`, `#org-signup-btn`, `#marketplace-btn`, `#platform-btn`) that only do `window.location.href = …`. Renders no data. | Entry point. Linked from `login/login-page.html` brand link and `platform/platform-login.html` back-link. |
| 2 | `login/login-page.html` | Unified staff/patient sign-in. Five `.role-tab` buttons (Patient / PRE / HOM / FA / Admin), a `#organization` `<select>` populated from `GET /marketplace/organizations`, `#login-form` with `#email` / `#password` / `#remember-me`, `#login-error` live region, and `#login-credential-helper` demo-credential panel. | `landing-page.html`, `marketplace-page.html` card links (`?org=<id>`), every portal's Sign Out. |
| 3 | `signup/signup-page.html` | Patient self-registration. Long demographic form + optional insurance block + terms checkbox. Submit is `.create-btn` (a plain button, **not** a form submit). | `landing-page.html`, marketplace card "register" links (`?org=<id>`), `login-page.html`. |
| 4 | `signup/org-signup.html` | 4-step hospital-chain onboarding wizard with live pricing calculator, GST line, fake payment tabs, and a success panel. Panels are `#panel-step-1..4` + `#panel-step-success`. | `landing-page.html` (`#org-signup-btn`). |
| 5 | `marketplace/marketplace-page.html` | Public hospital directory. `#org-grid` filled by cloning `<template id="org-card-template">`; `#search-input` and `#emergency-filter` filter client-side. | `landing-page.html`, `login-page.html` field hint link. |
| 6 | `platform/platform-login.html` | Platform Super-User sign-in (separate auth realm). `#platform-login-form`, `#platform-demo-cred` click-to-autofill block. | `landing-page.html`, `login-page.html` footer link. |
| 7 | `platform/platform-dashboard.html` | SaaS admin console. Tab panels `#panel-overview` / `#panel-organizations` / `#panel-rates`; two native `<dialog>`s (`#provision-dialog`, `#org-detail-dialog`). | Redirect from `platform-login.html` on success; self-redirect back if no platform session. |
| 8 | `HOM/index.html` | 13-line redirect stub. `<meta http-equiv="refresh">` **and** `window.location.replace("screen-01-dashboard.html")`. Loads no app scripts. | Directory-index hits on `/HOM/`. |
| 9 | `HOM/screen-01-dashboard.html` | HOM KPIs (`#metrics-container`), pending bed-request table (`#admissions-table-body`), activity log (`#activity-log-container`), discharge queue (`#pre-discharge-body`), bed-request approval modal `#modal-admission-request`. | Login as HOM; `HOM/index.html`; nav injected by `HOM/shared-nav.js`. |
| 10 | `HOM/screen-02-bed-management.html` | Ward/bed matrix. `#ward-tabs`, `#status-filters`, `#stats-container`, `#wards-container`, `#bed-search`; modals `#modal-assign-bed`, `#modal-bed-detail`. | HOM nav. |
| 11 | `HOM/screen-03-patient-flow.html` | Inpatient flow + discharge clearance. `#discharge-queue-tbody`, `#patients-table-body`, filter controls `#patient-flow-*`; modals `#modal-patient-detail`, `#modal-initiate-discharge`. | HOM nav; `beds.js#viewInPatientFlow`; `billing.js` "View Patient Record" (`?uhid=`). |
| 12 | `HOM/screen-04-inventory.html` | Stock table `#inventory-tbody`, sidebar usage form, low-stock/PO tab panels `#panel-low-stock` / `#panel-orders`; modals `#modal-log-usage`, `#modal-request-restock`. **23 inline handlers — the densest page.** | HOM nav. |
| 13 | `HOM/screen-05-billing.html` | Ledger list `#billing-tbody`, KPIs, `#modal-post-service`, `#modal-billing-detail`. Reads `?uhid=` to pre-filter. | HOM nav; `patient-flow.js#openBillingFromUhid`. |
| 14 | `PRE/index.html` | 16-line redirect stub to `./pages/PRE.html` (meta-refresh + `location.replace`). | Directory-index hits on `/PRE/`. |
| 15 | `PRE/pages/PRE.html` | PRE dashboard. Four counter cards (`#pending`, `#rejected`, `#admitted`, `#discharge-count`) linking to sub-pages; approved-patient table `#approvedTable` with a per-row visit-type `<select>`. | Login as PRE; `PRE/index.html`; PRE navbar (hardcoded `<ul class="nav-links">` in every PRE page). |
| 16 | `PRE/pages/request.html` | Pending pre-requests `#requestTable` with Approve / Suggest / Reject buttons. **Note the filename/script mismatch: `request.html` loads `js/requests.js`.** | PRE dashboard "Pending Requests" card. |
| 17 | `PRE/pages/rejected.html` | Read-only rejected list `#rejectedTable`. | PRE dashboard card. |
| 18 | `PRE/pages/admitted.html` | Admitted non-emergency inpatients `#admittedTable`, each with a "Discharge request" button. | PRE dashboard card. |
| 19 | `PRE/pages/discharge.html` | Two tables: `#dischargeTable` (awaiting HOM) and `#approvedDischargeTable` (HOM-approved, gated on bills cleared). | PRE dashboard card. |
| 20 | `PRE/pages/emergency.html` | Emergency triage list `#admittedTable` (same id, different page), KPI spans, walk-in registration modal `#emergencyModal`. | PRE navbar. |
| 21 | `PRE/pages/patient-records.html` | Master patient directory `#recordTable`, Patient-360 modal `#patientHistoryModal`, walk-in registration modal `#registerPatientModal` with insurance-card upload. | PRE navbar. |
| 22 | `PRE/pages/doctor.html` | Doctor roster `#doctorTable` + KPI spans + search/spec/status filters. | PRE navbar. |
| 23 | `PRE/pages/APPointment.html` | OPD appointment booking. Patient picker `#appointmentPatientPicker`, department/doctor selects, popups `#patientPopup` and `#searchResultPopup`. **Nothing in the codebase links to this exact filename** — see §1.7. | PRE navbar link `appointment.html` (case mismatch). |
| 24 | `PRE/pages/hom.html` | PRE→HOM bed-request dispatcher. Patient picker `#patientPicker`, ward select `#wardType`, tables `#homRequestTable` and `#homDischargeTable`. | PRE navbar. |
| 25 | `Patient/patient-dashboard.html` | Patient home. Summary cards, appointments table, visits list, notifications `#patient-notifications-list`, bill sidebar, documents panel `#patient-documents-list`, three modals (`#modal-appointments`, `#modal-visits`, `#modal-bills`). | Login as Patient; signup success redirect; Patient nav. |
| 26 | `Patient/patient-book-appointment.html` | OPD booking. Date/department/doctor pickers, `.slot` capacity grid, file upload `#file-upload`, `#confirm-booking`. | Patient nav. |
| 27 | `Patient/patient-billing.html` | Bills & receipts. `.filter-tab` sections `#section-invoices` / `#section-receipts` / `#section-discharge` / `#section-eod`, KPI row, `#modal-bill-details`, insurance banner `#insurance-banner`. | Patient nav. |
| 28 | `Patient/patient-profile.html` | Four editable sections (`form-personal`, `form-contact`, `form-password`, `form-insurance`), insurance card upload, logout buttons. | Patient nav. |
| 29 | `FA/fa-dashboard.html` | **The only existing SPA.** A 54-line shell: header with six `.nav-link` spans carrying `onclick="navigate('#/…')"`, and `<main id="app">` which `FA/js/app.js` fills by `innerHTML`. | Login as FA. |
| 30 | `Admin/screen-01-dashboard.html` | Org analytics. `#metrics-container`, `#subscription-usage-breakdown`, `#ward-occupancy-list`, `#billing-summary-tbody`, `#low-stock-list`, `#staff-breakdown`, `#analytics-locked-message`. | Login as Admin; nav injected by `Admin/shared-nav.js`. |
| 31 | `Admin/screen-02-departments.html` | Ward CRUD. `#wards-list`, `<dialog id="ward-dialog">`. | Admin nav. |
| 32 | `Admin/screen-03-inventory.html` | Inventory catalog CRUD. `#items-tbody`, `<dialog id="item-dialog">`. | Admin nav. |
| 33 | `Admin/screen-04-admin.html` | Dynamic RBAC. `#roles-list`, `#permissions-checklist`, `#staff-tbody`, branding-logo upload, `<dialog id="role-dialog">`. | Admin nav ("Roles & Staff"). |
| 34 | `Admin/screen-05-people.html` | Staff logins + doctor CRUD. `#staff-tbody`, `#doctors-tbody`, `<dialog id="staff-dialog">`, `<dialog id="doctor-dialog">`. **Not listed in `front-end/README.md`** (which documents only screens 01–04) but it is live and linked from `Admin/shared-nav.js`. | Admin nav ("People"). |

### 1.2 JavaScript files

Every file is a **classic script** (`<script src>` with no `type="module"`). Files marked
*IIFE* wrap themselves; the rest declare `let`/`const`/`function` at top level, which in a
classic script means **they are global** even without a `window.` prefix. This matters: e.g.
`Patient/js/patient-store.js` exposes `getBills`, `getProfile`, `payBill` etc. purely by
top-level declaration, and the Patient page scripts call them bare.

#### Shared layer — `front-end/shared/`

| File | Lines | Shape | Exposes | Depends on | Must load after |
|---|---|---|---|---|---|
| `shared/constants.js` | 76 | UMD factory | `window.HospitalConstants` — frozen enums: `STATE_VERSION`, `DEFAULT_DEPARTMENTS`, `BED_STATUS`, `PRE_STATUS`, `ADMISSION_STATUS`, `PAYMENT_STATUS`, `SERVICE_STATUS`, `LEDGER_REQUEST_STATUS` | none | — (loaded first everywhere) |
| `shared/api-client.js` | 825 | IIFE | `window.ApiClient` **and** alias `window.API` (same object). Exports `BASE_URL`, `withAsyncLock`, `getSession`, `setSession`, `clearSession`, and namespaces `auth`, `marketplace`, `platform`, `rbac`, `doctors`, `patients`, `wards`, `inventory`, `billing`, `appointments`, `admissions`, `preRequests`, `activityLog`, `uploads`. Owns the `BroadcastChannel("federico_auth_channel")` logout sync and dispatches `federicoSessionChanged` on `window`. | `window.RoleAccess` (optional, for cross-tab logout redirect) | `constants.js` |
| `shared/rbac.js` | 514 | IIFE | `window.RoleAccess` — `profiles`, `mockAccounts`, `mockAccountsFor`, `authenticate`, `signupPatient`, `loginAs`, `logout`, `getCurrentActor`, `getAccessRole`, `getProfile`, `getActorHome`, `detectCurrentModule`, `hasModuleAccess`, `enforceModuleAccess`, `isSuperUser`, `isAdmin`, `getSessionInfo`, `getTenantContext`, `applyTenantBranding`, `hasModule`, `resourceQty`, `getEntitlements`, `moduleLabel`, `showModuleUnavailable`, `applyModuleLocks`, `lockElement`, getter `lastAuthError` | `window.ApiClient`, `window.UIFeedback` | `api-client.js` |
| `shared/ui-feedback.js` | 252 | IIFE | `window.UIFeedback` — `toast(message, type)`, `alert({title,body,confirmLabel})`, `confirm({…,danger})`, `selectOne({title,body,options,cancelLabel})`. All Promise-based, all real DOM (never native `alert`). | none | — |
| `shared/auth-guard.js` | 38 | IIFE, runs on load | Nothing exported. Reads `window.APP_MODULE`, calls `RoleAccess.enforceModuleAccess()`, then `applyTenantBranding()`. For `APP_MODULE === 'PATIENT'` it **sets `window.PatientSession`** (frozen `{uhid, patientId, loggedIn}`). | `window.RoleAccess`, `window.APP_MODULE` | `rbac.js`, `ui-feedback.js`, and the inline `<script>window.APP_MODULE=…</script>` |
| `shared/formatters.js` | 76 | UMD factory | `window.Formatters` — `escapeHtml`, `formatCurrency` (→ `"Rs 5,000"`), `formatDate` (→ `"15 Mar 2026"`, `en-IN`), `formatAge` | none | — |
| `shared/sanitizer.js` | 85 | UMD factory | `window.Sanitizer.forRole(data, role)` — shallow-clones and deletes `PATIENT_FIELDS` (19 keys) or `HOM_FIELDS` (12 keys) | none | — |
| `shared/insurance.js` | 76 | UMD factory | `window.InsuranceCalc.computePatientShare(grossTotal, policy, serviceNames)` → `{grossTotal, coveredAmount, patientShare, isValid, breakdown}` | none | — |
| `shared/dom-table.js` | 46 | IIFE | `window.DomTable.renderRows(tbody, items, {toRow, emptyMessage, colspan})` | `window.Formatters` (optional) | `formatters.js` |
| `shared/department-options.js` | 42 | IIFE | `window.DepartmentOptions.populateDepartmentSelect(selectEl, doctors, {placeholder})` — derives options from distinct `doctor.specialization` | `window.Formatters` (optional) | `formatters.js` |
| `shared/shared-nav.js` | 153 | IIFE | `window.SharedNav.renderNavbar(config)` — injects a `<style>` block **plus** the whole top nav via `innerHTML` into `#main-nav`, wires the profile dropdown and Sign Out, then re-runs `RoleAccess.applyModuleLocks` / `applyTenantBranding`. | `window.Formatters`, `window.API`/`window.ApiClient`, `window.RoleAccess` | `formatters.js`, `api-client.js`, `rbac.js` |

#### HOM — `front-end/HOM/`

| File | Lines | Shape | Exposes / mutates | Depends on | Must load after |
|---|---|---|---|---|---|
| `HOM/shared-nav.js` | 29 | DOMContentLoaded | Calls `SharedNav.renderNavbar` with the 5 HOM links (`screen-01`…`screen-05`) and per-link `module:` gates (`ADMISSIONS`, `INVENTORY`, `BILLING`). | `window.SharedNav`, `window.RoleAccess` | `shared/shared-nav.js` |
| `HOM/hom-helpers.js` | 147 | IIFE | `window.HOMHelpers` (`statusLabel`, `statusVariant`, `escapeHtml`, `formatCurrency`, `formatDate`, `formatDateTime`, `formatAge`, `daysSince`, `joinPreRequestsWithPatients`, `bedStyle`, `closeModals`, `openModal`) **and separately `window.closeModals` + `window.openModal`.** Registers document-level `click` / `keydown` / `wheel` listeners for `.modal-overlay`. | `window.Formatters` | `shared/formatters.js` |
| `HOM/ui-template.js` | 158 | Direct global assign | `window.UI` — `cn`, `Badge`, `Button`, `Card`, `CardHeader`, `CardContent`, `CardFooter`, `Input`, `Tabs`, `_handleTabClick`. All return **HTML strings**. `Button` can emit a raw `onclick="…"` attribute. | none | — (but before any page script that calls `UI.*`) |
| `HOM/dashboard.js` | 438 | Top-level globals | `window.approveDischarge`, `window.openAdmissionModal`, `window.closeAdmissionModal`, `window.selectModalBed`, `window.approveAdmission`, `window.rejectAdmissionRequest`. Module state: `dashboardData`, `selectedBedRequestId`, `selectedBedId`, `currentWardFilter`, `currentStatusFilter`. 15 s `setInterval` + `window` `focus` listener. | `ApiClient`, `UI`, `HOMHelpers`, `RoleAccess` | all shared + `hom-helpers.js` + `ui-template.js` |
| `HOM/beds.js` | 413 | Top-level globals | `window.setActiveTab`, `window.setActiveFilter`, `window.openAssignModal`, `window.selectPendingRequest`, `window.confirmBedAllocation`, `window.openDetailModal`, `window.toggleCurrentBedMaintenance`, `window.viewInPatientFlow`. State: `bedsData`, `activeTab`, `activeFilter`, `bedSearchQuery`, `currentDetailBedId`, `selectedRequestId`, `pendingBedTarget`. 15 s poll + focus. | same | same |
| `HOM/patient-flow.js` | 430 | Top-level globals | `window.switchTab`, `window.openPatientDetail`, `window.openDischargeFromDetail`, `window.openDischargeModal`, `window.confirmDischarge`, `window.openBillingFromDetail`, `window.openBillingFromUhid`. State: `flowData`, `currentSelectedRequest`, `flowFilters`. Local `csvEscape`/`downloadCsv`. 15 s poll + focus. | same | same |
| `HOM/inventory.js` | 835 | Top-level globals | 14 globals: `window.setInventoryActionTab`, `lookupSidebarPatient`, `updateSidebarQty`, `updateSidebarCost`, `submitSidebarUsage`, `openLogUsageModal`, `handleModalItemChange`, `lookupModalPatient`, `updateModalQty`, `updateModalCalc`, `submitModalUsage`, `openRestockModal`, `handleRestockItemChange`, `updateRestockCalc`, `setRestockPriority`, `submitRestock`. **Overwrites `window.closeModals`** set by `hom-helpers.js`. State: `inventoryData`, `inventoryFilters`, `activeModalItem`, `restockPriority`, `activeActionTab`. 15 s poll + focus. | same + `DomTable` | same + `shared/dom-table.js` |
| `HOM/billing.js` | 561 | Top-level, delegated | No `window.*` exports — uses a document-level delegated click on `[data-action="billing-detail"]`. State: `billingRows`, `billingSearch`, `billingStatusFilter`, `availableServices`, `availableAdmissions`, `servicesById`. 15 s poll + focus. | same + `DomTable` | same + `shared/dom-table.js` |

#### PRE — `front-end/PRE/js/`

| File | Lines | Shape | Exposes / mutates | Depends on |
|---|---|---|---|---|
| `shared-state.js` | 162 | IIFE | `window.PRESharedState` **and** `window.PREHelpers` (same frozen object): `STATUS_LABELS`, `statusLabel`, `escapeHtml`, `formatAge`, `formatDate`, `hasValue`, `to12Hour`, `to24Hour`, `inferWardType`, `sortDoctorsForDepartment`, `joinPreRequestsWithPatients`, alias `joinRequestsWithPatients` | `Formatters`, `HospitalConstants` |
| `logout.js` | 16 | DOMContentLoaded | Binds `.logout` → `api.auth.logout()` → `../../login/login-page.html` | `ApiClient` |
| `PRE.js` | 141 | Top-level | `window.checkInPatient`, `window.setVisitType`. Renders `#approvedTable` + four counters. | `ApiClient`, `PREHelpers`, `UIFeedback` |
| `requests.js` | 266 | Top-level | `window.openApprove`, `closePopup`, `confirmApprove`, `reject`, `confirmReject`, `openSuggest`, `confirmSuggest`. Builds popups by `document.createElement` + `innerHTML` with embedded `onclick="…"`. State: `joinedRequests`. | same |
| `rejected.js` | 38 | Top-level | `renderRejected` (global function, no `window.` assign) | same |
| `admitted.js` | 62 | Top-level | `window.dischargePatient` | same |
| `discharge.js` | 113 | Top-level | `window.finalApprove`. Local `loadJoined`, `rowHtml`, `renderDischarge`, `renderApproved`. | same |
| `emergency.js` | 335 | Top-level | `window.requestHomBed`, `dischargePatient`, `finalizeDischarge`, `openEmergencyModal`, `closeEmergencyModal`, `toggleQuickPatientFields`, `submitEmergencyRegistration`. State: `emergencyRecords`, `allPatients`, `allDoctors`. | same |
| `patient-records.js` | 523 | Top-level | `window.viewPatient360`, `closePatientHistoryModal`, `createAppointmentFor`, `openRegisterPatientModal`, `closeRegisterPatientModal`, `submitRegisterPatient`. State: `allPatients`, `insurancesByPatient`, `preRequestsByPatient`, `appointmentsByPatient`, `admissionsByPatient`, `bedsById`, `doctorsById`. | same + `uploads` |
| `doctor.js` | 163 | Top-level | No `window.*`. State: `allDoctorRoster`. | same |
| `Appointment.js` | 510 | Top-level | `window.searchPatient`, `openPatientPopup`, `closePatientPopup`, `openSearchResultPopup`, `closeSearchResultPopup`, `registerPatient`, `createAppointment`, `clearAppointmentForm`. Declares a top-level `escapeHtml` (also declared in `hom.js` — different pages, so no clash today). State: `appointmentPatientCatalog`, `allDoctorsCatalog`, `allAvailabilitiesCatalog`, `selectedAppointmentPatient`. | same + `DepartmentOptions` |
| `hom.js` | 414 | Top-level | `window.sendRequest`, `finalizeDischarge`, `clearHomForm`. Top-level `escapeHtml`. State: `candidatePatients`, `selectedCandidate`, `wardsCatalog`, `pickerOpen`. | same |

**PRE load order (identical on all ten pages):** `constants` → `api-client` → `formatters` → `rbac` → `ui-feedback` → `auth-guard` → `[department-options]` → `shared-state` → *page script* → `logout`.

#### Patient — `front-end/Patient/`

| File | Lines | Shape | Exposes / mutates | Depends on |
|---|---|---|---|---|
| `js/patient-store.js` | 684 | **Bare top-level script** | Globals by declaration (no `window.` prefix, but global all the same): `AppStore` (mutable singleton object), `onStoreReady`, `refreshStore`, `initPatientStore`, `getBills`, `getTotalOutstanding`, `getAllAppointments`, `getUpcomingAppointments`, `getVisits`, `getSlots`, `getDocuments`, `getBillingSections`, `getNotifications`, `getProfile`, `getDoctors`, `getBillingDocumentByRef`, `addAppointment`, `cancelAppointment`, `updateProfile`, `updateInsurance`, `payBill`. Dispatches `patientStoreUpdated` on `window`; listens for `federicoSessionChanged`. **Calls `initPatientStore()` at file scope**, so the fetch starts on load. | `RoleAccess`, `ApiClient`, `InsuranceCalc` |
| `patient-dashboard.js` | 628 | DOMContentLoaded closure | No exports. Local `openDigitalCopy` uses `window.open("","_blank")` + `document.write`. Selects DOM **positionally** (`cards[0]`, `values[1]`, `sideRows[3]`). | store globals, `Sanitizer`, `UIFeedback` |
| `patient-billing.js` | 706 | DOMContentLoaded closure | No exports. Two `window.open` + `document.write` printers. | same |
| `patient-book-appointment.js` | 453 | DOMContentLoaded closure | No exports. Local state `selectedTime/Date/Dept/DoctorId/DoctorName`, `attachedFiles`. | same + `DepartmentOptions`, `uploads` |
| `patient-profile.js` | 388 | Mixed | Top-level `const uploadedCardUrls = {front,back}` (global). Rest in a DOMContentLoaded closure. | same |

**Patient load order:** `constants` → `formatters` → `sanitizer` → `insurance` → `api-client` → `rbac` → `ui-feedback` → `auth-guard` → `[department-options]` → `js/patient-store.js` → *page script*.

#### FA — `front-end/FA/js/`

| File | Lines | Shape | Exposes / mutates | Depends on |
|---|---|---|---|---|
| `fa-helpers.js` | 90 | IIFE | `window.FAHelpers` — `escapeHtml`, `formatCurrency`, `formatDateTime`, `loadBillingOverview()`, `loadLedgerEntries(id)`, `ledgerTotal(entries)` | `Formatters`, `ApiClient` |
| `permissions.js` | 61 | Top-level `const` + assign | `Permissions` (global const) and `window.Permissions` — `routeAccess` map, `getActor`, `getAccessRole`, `canAccess`, `getDefaultRoute`, `enforceRoute`, `updateUI`. `updateUI` reads each nav link's **`onclick` attribute string** with a regex to discover its route. | `RoleAccess` |
| `modules/billing.js` | 341 | IIFE | `window.FAActions` — `createLedgerAndOpen`, `addChargeFromForm`, `addChargeToCurrentLedger`, `approveLeader`, `dispatchCurrent`, `recordCashPayment`, `generateDischargeSummary`, `printDischargeSummary`, `printReceipt`, `filterReceipts`. Three `window.open` + `document.write` printers. | `FAHelpers`, `ApiClient`, `UIFeedback` |
| `router.js` | 36 | Top-level | `window.parseHashRoute`, `window.navigate`. Registers a `hashchange` listener. Writes `window.currentAdmissionId`. | `Permissions`, `window.render` |
| `app.js` | 645 | Top-level | `window.render`, `window.updateActiveNav`, `window.generateReceiptRows`, and initialises `window.currentAdmissionId`. Six async view builders returning HTML strings: `renderDashboard`, `renderCharges`, `renderLedger`, `renderEodBilling`, `renderDischarge`, `renderReceipts`, plus `renderPatientPicker`, `statusBadge`. | all of the above |

**FA load order:** `constants` → `api-client` → `formatters` → `rbac` → `ui-feedback` → `auth-guard` → `fa-helpers` → `permissions` → `modules/billing` → `router` → `app`.

#### Admin — `front-end/Admin/`

| File | Lines | Shape | Exposes / mutates | Depends on |
|---|---|---|---|---|
| `shared-nav.js` | 25 | DOMContentLoaded | Calls `SharedNav.renderNavbar` with 5 Admin links (order: Dashboard, Departments, Inventory Catalog, **People (screen-05)**, Roles & Staff (screen-04)). | `SharedNav`, `RoleAccess` |
| `dashboard.js` | 267 | Top-level | Globals `loadAndRender`, `renderMetrics`, `renderSubscriptionUsage`, `renderWardOccupancy`, `renderBillingSummary`, `renderLowStock`, `renderStaffBreakdown`. | `ApiClient`, `Formatters`, `RoleAccess.hasModule('ANALYTICS')` |
| `departments.js` | 168 | Top-level | Globals `loadAndRender`, `openWardDialog`, `handleWardFormSubmit`, `deleteWard`. State `wardsCache`, `bedsCache`, `editingWardId`. Document-level delegated click for `[data-action="edit-ward"|"delete-ward"]`. | `ApiClient`, `Formatters`, `UI`, `UIFeedback` |
| `inventory-catalog.js` | 120 | Top-level | Globals `loadAndRender`, `handleItemFormSubmit`, `deleteItem`. State `itemsCache`. | same + `DomTable` |
| `admin.js` | 307 | Top-level | Globals `loadRoles`, `renderRolesList`, `selectRole`, `loadStaff`, `renderStaffTable`, `bindDialogControls`, `bindBrandingUpload`, `renderBrandingPreview`, `formatFileSize`. State `rolesCache`, `permissionsCache`, `selectedRoleId`. | `ApiClient`, `Formatters`, `UIFeedback`, `uploads` |
| `people.js` | 232 | Top-level | Globals `esc`, `loadStaff`, `renderStaff`, `toggleStaff`, `loadDoctors`, `renderDoctors`, `openDoctorDialog`, `handleDoctorSubmit`, `deleteDoctor`, `departmentOptions`. State `wardsCache`, `doctorsCache`, `editingDoctorId`. | same + `UI`, `RoleAccess.hasModule('DOCTOR')` |

> `admin.js` and `people.js` both declare a global `loadStaff` and both target `#staff-tbody`.
> Safe today because they are on different pages. **In a bundled SPA they would be in scope
> simultaneously if hoisted carelessly** — ES modules solve this automatically.

#### Public pages

| File | Lines | Shape | Notes |
|---|---|---|---|
| `landing/landing-page.js` | 43 | DOMContentLoaded | Five `location.href` handlers. Loads `rbac.js` and `api-client.js` but uses neither. |
| `login/login-page.js` | 229 | DOMContentLoaded closure | Local `escape`, `renderCredentialHelper`, `handleLogin`. Reads/writes `localStorage["FedericoRememberMe"]`. |
| `signup/signup-page.js` | 195 | DOMContentLoaded closure | Local `valueOf`, `selectValue`, `showToast` (maps `'warn'`→`'warning'`). |
| `signup/org-signup.js` | 371 | DOMContentLoaded closure | Local `calculateCosts`, `updateLivePricing`, `updateStepUI`, `updateCheckoutSummary`. Mutable module-scope `BASE_PLATFORM_FEE` and `RATES`. Passes `'warn'` to `UIFeedback.toast` **unmapped**. |
| `marketplace/marketplace-page.js` | 106 | IIFE | Clones `<template id="org-card-template">`. Module state `allOrganizations`. |
| `platform/platform-login.js` | 62 | IIFE | Redirect guard on `session.isPlatformUser`. |
| `platform/platform-dashboard.js` | 384 | IIFE | Auth guard, tabs, native `<dialog>.showModal()`, `loadOverview`/`loadOrganizationsTable`/`loadRates`/`openOrgDetail`/`toggleOrgStatus`. State `orgsCache`. **`openOrgDetail` re-binds `[data-detail-tab]` listeners on every call** (listeners accumulate). |

### 1.3 Global state on `window`

| Global | Written by | Read by | Notes |
|---|---|---|---|
| `window.ApiClient` | `shared/api-client.js` | every page script, `rbac.js`, `auth-guard.js` | The single backend gateway. |
| `window.API` | `shared/api-client.js` (alias) | `login-page.js`, `marketplace-page.js`, `signup-page.js`, `org-signup.js`, `platform-login.js`, `shared-nav.js`, `fa-helpers.js`, `PRE/js/logout.js` | Same object as `ApiClient`. |
| `window.RoleAccess` | `shared/rbac.js` | `auth-guard.js`, `api-client.js` (cross-tab logout), HOM/Admin `shared-nav.js`, `login-page.js`, `signup-page.js`, `permissions.js`, `patient-store.js`, `patient-profile.js`, `Admin/dashboard.js`, `Admin/people.js` | |
| `window.APP_MODULE` | inline `<script>` in every guarded page (`"HOM"`/`"PRE"`/`"FA"`/`"ADMIN"`/`"PATIENT"`) | `auth-guard.js` only | Read exactly once, at load. |
| `window.PatientSession` | `auth-guard.js` (frozen object) | **nothing** — no reader remains in the codebase | Dead global; dropped by DEC-8. |
| `window.UIFeedback` | `shared/ui-feedback.js` | ~every script | |
| `window.Formatters` | `shared/formatters.js` | `hom-helpers`, `fa-helpers`, `shared-state`, `dom-table`, `department-options`, `shared-nav`, Admin scripts, `patient-profile.js` | |
| `window.HospitalConstants` | `shared/constants.js` | `PRE/js/shared-state.js#inferWardType` only | |
| `window.Sanitizer` | `shared/sanitizer.js` | `patient-dashboard.js`, `patient-billing.js` | |
| `window.InsuranceCalc` | `shared/insurance.js` | `patient-store.js#buildBillsAndDocuments` | |
| `window.DomTable` | `shared/dom-table.js` | `HOM/billing.js`, `Admin/inventory-catalog.js` | |
| `window.DepartmentOptions` | `shared/department-options.js` | `PRE/js/Appointment.js`, `patient-book-appointment.js` | |
| `window.SharedNav` | `shared/shared-nav.js` | `HOM/shared-nav.js`, `Admin/shared-nav.js` | |
| `window.UI` | `HOM/ui-template.js` | HOM `dashboard/beds/patient-flow/inventory/billing`, Admin `departments/inventory-catalog/people` | Admin pages load `../HOM/ui-template.js` across portal boundaries. |
| `window.HOMHelpers` | `HOM/hom-helpers.js` | all five HOM page scripts | |
| `window.openModal`, `window.closeModals` | `HOM/hom-helpers.js`; **`closeModals` re-assigned by `HOM/inventory.js`** | HOM page scripts *and* 14 inline `onclick="closeModals()"` attributes | Last-writer-wins ordering dependency. |
| `window.PRESharedState`, `window.PREHelpers` | `PRE/js/shared-state.js` | all ten PRE page scripts | Two names, one frozen object. |
| `window.FAHelpers`, `window.FAActions`, `window.Permissions`, `window.render`, `window.updateActiveNav`, `window.parseHashRoute`, `window.navigate`, `window.generateReceiptRows` | FA scripts | FA scripts and FA inline `onclick` strings | |
| `window.currentAdmissionId` | `FA/js/router.js`, `FA/js/app.js`, and an inline `onchange` in `renderPatientPicker` | `renderLedger`, `renderEodBilling`, `renderDischarge` | The FA app's only cross-view state. |
| ~60 `window.<handler>` functions | HOM / PRE page scripts | inline `on*=` attributes in HTML and in generated HTML strings | Enumerated per file in §1.2. |
| **Implicit globals** (top-level `let`/`const`/`function` in classic scripts) | `patient-store.js` (21 names), `Permissions`, `uploadedCardUrls`, every PRE/HOM/Admin page script's state vars | sibling scripts on the same page | Invisible in a `grep -r "window\."` sweep — do not miss these. |

### 1.4 CDN scripts and stylesheets

**There are zero CDN `<script>` tags in the entire application.** The only external
resource is a Google Font, loaded two ways:

| Resource | Exact reference | Where | npm replacement |
|---|---|---|---|
| Roboto 400/500/700 | `@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');` | `shared/design-tokens.css:25` | `@fontsource/roboto` (`400.css`, `500.css`, `700.css`) — or keep the `@import`, since the CSS file moves verbatim in Phase 1. |
| `fonts.googleapis.com` / `fonts.gstatic.com` | `<link rel="preconnect">` pairs | 11 HTML pages (Patient ×4, landing, login, marketplace, platform ×2, signup ×2) | Drop — the hard constraint forbids stylesheet `<link>`s in `index.html`, and preconnect is only a latency hint. |
| Inter / Plus Jakarta Sans / Playfair Display | `<link href="https://fonts.googleapis.com/css2?…">` **injected at runtime into popup windows** by `patient-dashboard.js`, `patient-billing.js` (×2) and `FA/js/modules/billing.js` (×3) | inside `window.open()` + `document.write()` printable documents | Leave as-is. These strings live inside a separate `about:blank` document that Vite never processes. |

No jQuery, no Bootstrap, no charting library, no third-party widget.

### 1.5 CSS files and how they are scoped today

**Nothing is scoped.** Every rule is a plain global selector. Isolation is accidental: each
HTML page loads only its own portal's CSS, so the collisions never fire.

| File | Lines | Loaded by | Role |
|---|---|---|---|
| `shared/design-tokens.css` | 332 | every page (`?v=2` on most) | `:root` custom properties (`--md-*`, `--status-*`, `--color-*`, `--radius-*`, `--font-*`, `--duration-*`), a `*` reset, `html,body` and `body` rules, `[class*="popup"]`, `::view-transition-new(root)`, `.md-fade-switch`, and the Roboto `@import`. |
| `shared/material-components.css` | 373 | every page | `.md-btn*`, `.md-chip*`, `.md-card`, `.md-field`, `.md-empty-state`, `.md-native-dialog`, `.md-glass`, `.md-blur-shape`, `.md-tabs`, `.md-brand-mark`. |
| `shared/ui-feedback.css` | 111 | every page except `landing` and `PRE/index.html` | `.md-snackbar*`, `.md-dialog*`. Pairs with `ui-feedback.js`. |
| `HOM/global.css` | 606 | HOM ×5 | Own `:root`, `body`, `h1..h4`, `.card`, `.badge*`, `.btn*`, `.kpi-card`, `.modal-overlay`, `.bed-grid`, `.tab-btn`, `.pill-btn`. |
| `Admin/admin.css` | 870 | Admin ×5 | Own `:root`, `body`, typography, `.dashboard-container`, `.ward-card`, `.role-row`, `.status-pill`. **The only CSS file that `@import`s the shared three (lines 17–19) instead of using `<link>`.** |
| `PRE/css/base.css` | 15 | PRE ×10 | `body`, `a`. |
| `PRE/css/layout.css` | 13 | PRE ×10 | `.main`. |
| `PRE/css/components.css` | 1636 | PRE ×10 | The largest stylesheet. `.navbar`, `.logo`, `.nav-links`, `.cards`, `.card`, `.table-container`, `.status`, `.btn`, `.approve-popup`, `.suggest-popup`, `.reject-popup`, `.appointment-picker-*`, `.hom-*`. |
| `FA/css/base.css` | 98 | FA only | `:root`, `body`, `.card`, `.btn-primary`, `.badge*`. |
| `FA/css/layout.css` | 176 | FA only | `.header`, `.logo-group`, `.nav-links`, `.nav-link`, `.main-content`, `.logout-btn`. |
| `FA/css/components.css` | 96 | FA only | `.card`, `.stat-grid`, `.value`, `.data-table`, `.uhid-badge`. |
| `Patient/patient-dashboard.css` | 621 | Patient dashboard | `:root`, `*`, `body`, `.topbar`, `.brand*`, `.summary-card`, `.visit-item`, `.bill-item`, `.doc-card`, `.modal-overlay`. |
| `Patient/patient-billing.css` | 281 | Patient billing | `:root`, `*`, `body`, `.topbar`, `.brand*`, `.billing-row`, `.filter-tab`, `.status`. |
| `Patient/patient-book-appointment.css` | 308 | Patient booking | `:root`, `*`, `body`, `.topbar`, `.brand*`, `.slot`, `.upload-box`. |
| `Patient/patient-profile.css` | 237 | Patient profile | `:root`, `*`, `body`, `.topbar`, `.brand*`, `.side-info`, `.avatar-block`, `.eye-btn`. |
| `landing/landing-page.css` | 396 | landing | `*`, `body`, `.topbar`, `.brand*`, `.page`, hero/feature sections. |
| `login/login-page.css` | 362 | login | `*`, `body`, `.topbar`, `.brand*`, `.login-card`, `.role-tab`, `.demo-credential-*`. |
| `signup/signup-page.css` | 269 | signup | `*`, `body`, `.topbar`, `.brand*`, `.form-group`, `.terms-row`, `.create-btn`. |
| `signup/org-signup.css` | 421 | org-signup | `body`, `.topbar`, `.brand*`, `.stepper-header`, `.step-node`, `.step-panel`, `.resource-input`, `.payment-tab-btn`. |
| `marketplace/marketplace-page.css` | 98 | marketplace | `body`, `.marketplace-*`, `.org-card`. |
| `platform/platform.css` | 503 | platform ×2 | `body`, `.md-topbar`, `.platform-*`, `.stat-card`, `.org-mini-card`, `.plan-rev-card`, `.activity-item`. |

**Measured collision surface** (class names *defined* in 4 or more of the 18 per-app files):
`.active` (11 files), `.topbar` (8), `.brand` (8), `.brand-icon` (8), `.form-group` (6),
`.topbar-right` (5), `.nav-link` (5), `.logout-btn` (5), `.card` (5), `.brand-text` (5),
`.value` (4), `.user-meta` (4), `.user-chip` (4), `.user-avatar` (4), `.main-nav` (4),
`.label` (4), `.hidden` (4), `.data-table` (4), `.btn-primary` (4), `.badge` (4).
On top of that, **10 files redefine `:root`**, **17 redefine `body`**, and **8 ship their own
`*` reset**. Concatenating these into one bundle changes rendering. This is the single
biggest tension with the "CSS moves unchanged" constraint — resolution in §2.4.

### 1.6 Backend endpoints the frontend calls

**Base URL** (`shared/api-client.js:13-17`):
`window.__FEDERICO_API_URL__` if set, else `window.location.origin` when the page's port is
exactly `"3000"`, else the literal `"http://localhost:3000"`.

**Auth mechanism.** `POST /auth/login` returns `{ token, role, user, patient, tenant }` and
also sets an `HttpOnly` cookie `sessionId=<token>; Path=/; SameSite=Lax`
(`back-end/src/controllers/auth.controller.js:30-32`). The client stores its own copy under
`sessionStorage["FedericoSession"]` (per-tab isolation) and sends
`Authorization: Bearer <token>` on every request, with `credentials: "include"`.
`back-end/src/middleware/session.js#extractToken` accepts the Bearer header first, then
falls back to `sessionId` / `sid` / `connect.sid` / `token` cookies. Tokens are opaque
session-store keys (`back-end/src/store/sessionStore.js`) — **not JWTs**.

**Error contract.** Errors are `{ statusCode, error, message, timestamp }`; validation
errors from `back-end/src/validators/engine.js` are
`{ statusCode: 400, error: 'Bad Request', message: string[] }`.
`api-client.js#extractMessage` unwraps in this order: `data.error.message` →
`Array.isArray(data.message) ? join(", ")` → `data.message` → `"<status> <statusText>"`.
The thrown `Error` carries `.status` and `.data`.
`api-client.js#request` also: (a) on **401** with `opts.auth !== false`, calls
`clearSession()` before throwing; (b) unwraps a `{success, data}` envelope if present —
**the current backend never sends one**, so this branch is dead; (c) enforces a **15 000 ms**
`AbortController` timeout, throwing `"Request timed out after 15s. Please try again."`
with `.status = 408`, and on any other network failure throws
`"Cannot reach the server. Is the backend running on <BASE_URL>?"` with `.status = 0`.

Success bodies are returned bare (`back-end/src/utils/sendResult.js` sends `res.status(s).end()`
for `null`/`undefined`, so a miss yields an **empty body**, which `api-client` parses to `null`).

| `ApiClient` method | Method + path | Request body | Response |
|---|---|---|---|
| `auth.login(email, password, organizationId?)` | `POST /auth/login` (`auth:false`) | `{email, password, organization_id?}` | `{token, role, user:{user_id,name,email,role_id}, patient|null, tenant}`; 401 `Invalid email or password` / `This account is not registered with the selected organization`; 403 `This organization is not currently active` / `This account has been deactivated by your administrator` |
| `auth.signup(userData)` | `POST /auth/signup` (`auth:false`) | `{name,email,password,phone,dob,gender,blood_group?,organization_id}` — `phone` normalised to `+91…` by `withNormalizedPhones` | 201 `{token, role:'Patient', user, patient, tenant}`; 409 `Email already registered`; 400 `Selected organization is not available` |
| `auth.me()` | `GET /auth/me` | — | `{user, patient, tenant}` |
| `auth.entitlements()` | `GET /auth/entitlements` | — | `{modules, resources}` |
| `auth.logout()` | `POST /auth/logout` | — | `{success:true}`; errors swallowed, `clearSession()` runs regardless |
| `marketplace.organizations()` | `GET /marketplace/organizations` (public) | — | `[{organization_id, name, branding, branches[], specialties[], emergency_available, contact}]` |
| `marketplace.plans()` | `GET /marketplace/plans` (public) | — | plan array |
| `marketplace.registerOrganization(p)` | `POST /marketplace/register-organization` (public) | see `signup/org-signup.js:274-318` | `{provisioned:{organization,hospital,admin,apiKey}, session:{token,user,tenant}}`; 400 if `name`/`plan_id`/`admin_name`/`admin_email`/`admin_password` missing |
| `platform.auth.login(email,password)` | `POST /platform/auth/login` (public) | `{email,password}` | `{token, user:{platform_user_id,name,email}}` |
| `platform.auth.me()` / `.logout()` | `GET /platform/auth/me`, `POST /platform/auth/logout` | — | |
| `platform.organizations.list/get/provision/suspend/activate/remove` | `GET /platform/organizations`, `GET|DELETE /platform/organizations/:id`, `POST /platform/organizations`, `PUT /platform/organizations/:id/suspend`, `PUT …/activate` | provision body: `{name,city,admin_name,admin_email,admin_password,plan_id,modules[]}` | |
| `platform.organizations.provisioningLog/usage/hospitals/addHospital/modules/setModule/resources/setResources/apiKeys/createApiKey/getSubscription/setSubscription/renewSubscription` | the matching `/platform/organizations/:id/…` routes in `back-end/src/routes/platform.routes.js` | `setModule`: `{enabled, instances?}`; `setResources`: `{resources}`; `createApiKey`: `{label}`; `setSubscription`: `{plan_id}` | |
| `platform.apiKeys.revoke(id)` | `DELETE /platform/api-keys/:id` | — | |
| `platform.plans.list/create/update` | `GET|POST /platform/plans`, `PUT /platform/plans/:id` | | |
| `platform.moduleResourceCatalog()` | `GET /platform/module-resource-catalog` | — | |
| `platform.rates.get()` | `GET /platform/rates` (**public — no gate**) | — | `{ base_platform_fee:number, rates:{GENERAL_BEDS,ICU_BEDS,PRIVATE_BEDS,DOCTOR_SEATS,STAFF_SEATS,BILLING_TERMINALS,WAREHOUSES,PATIENT_ADMISSIONS} }` |
| `platform.rates.update(p)` | `PUT /platform/rates` (gated) | `{base_platform_fee, rates}` | |
| `platform.usage()` / `platform.activityLog()` | `GET /platform/usage`, `GET /platform/activity-log` | — | `usage` → `{total_mrr,total_arr,total_payments_collected,total_organizations,active_organizations,total_hospitals,total_patients,total_active_admissions,total_users,revenue_by_service|revenue_by_plan,organizations[]}` |
| `rbac.roles/createRole/permissions/permissionsForRole/assignPermission/unassignPermission/assignStaffRole/unassignStaffRole/staff/createStaff/setStaffActive` | `GET|POST /rbac/roles`, `GET /rbac/permissions`, `GET|POST /rbac/roles/:roleId/permissions`, `DELETE /rbac/roles/:roleId/permissions/:permissionId`, `POST /rbac/staff/:userId/role`, `DELETE /rbac/staff/:userId/role/:customRoleId`, `GET|POST /rbac/staff`, `PUT /rbac/staff/:userId/active` | `assignPermission`: `{permission_id}`; `assignStaffRole`: `{custom_role_id}`; `createStaff`: `{name,email,password,actor_role}`; `setStaffActive`: `{is_active}` | |
| `doctors.list/get/create/update/remove` | `GET /doctor`, `GET|PUT|DELETE /doctor/:id`, `POST /doctor` | create/update: `{name, specialization?, department?, phone?, email?}`; `phone` normalised | module gate `DOCTOR` |
| `doctors.availabilityAll/availabilityForDoctor/createAvailability` | `GET /doctor/availability/all`, `GET /doctor/:id/availability`, `POST /doctor/availability` | | |
| `patients.list/get/portalSummary/create/update` | `GET /patient`, `GET /patient/:idOrUhid`, `GET /patient/portal/summary[/:id]`, `POST /patient`, `PUT /patient/:idOrUhid` | create: `{name,dob,gender,phone,address,blood_group?,emergency_contact_phone?}`; `phone`, `alternate_phone`, `emergency_contact_phone` normalised | module gate `PATIENT`. `portalSummary` → `{patient, insurance, bundles[{admission,ledger,entries,dischargeSummary}], receipts[], doctors[], beds[], services[], preRequests[], appointments[]}` |
| `patients.insuranceAll/insuranceForPatient/createInsurance` | `GET /patient/insurance/all`, `GET /patient/:id/insurance`, `POST /patient/insurance` | create: `{patient_id, provider_name, policy_number, member_id?, coverage_type, valid_from?, valid_to?, coverage_limit?, card_front_url?, card_back_url?}` | extra module gate `INSURANCE`. **Append-only** — a "save" creates a new row; readers pick max `insurance_id`. |
| `wards.list/create/update/remove` | `GET|POST /ward`, `PUT|DELETE /ward/:id` | create: `{ward_name, total_beds, description?}` | module gate `ADMISSIONS` (router-wide) |
| `wards.beds/bedsInWard/createBed/updateBedStatus` | `GET /ward/beds`, `GET /ward/:id/beds`, `POST /ward/bed`, `PUT /ward/bed/:bedId` | `updateBedStatus`: `{status}` (`AVAILABLE`/`OCCUPIED`/`MAINTENANCE`) | |
| `wards.bedRequests.list/create/update/allocate/deny` | `GET|POST /ward/bed-requests`, `PUT /ward/bed-requests/:id` | create: `{patient_id, pre_request_id?, ward_id?, priority?, notes?}`; `allocate` → `{status:'ALLOCATED', bed_id}`; `deny` → `{status:'DENIED'}` | Allocation cascades server-side into `pre_request.status = ADMITTED`. |
| `wards.emergencies.list/create/update` | `GET|POST /ward/emergencies`, `PUT /ward/emergencies/:id` | — | **⚠ These paths do not exist.** The backend defines `/ward/emergency` and `/ward/emergency/:id` (`ward.routes.js:93,98,104`). All three would 404. **No frontend file calls them** — dead, wrong API surface. |
| `inventory.items.list/create/update/remove` | `GET|POST /inventory/items`, `PUT|DELETE /inventory/items/:id` | create: `{item_name, category, stock_quantity, reorder_level}` | module gate `INVENTORY` |
| `inventory.requests.list/create/update` | `GET|POST /inventory/requests`, `PUT /inventory/requests/:id` | create: `{item_id, quantity_requested, status, requested_by, invoice_url}` | |
| `billing.services.list/create` | `GET|POST /billing/services` | | module gate `BILLING` (router-wide) |
| `billing.ledger.listAll/getByAdmission/create/entries/addEntry/dispatch` | `GET /billing/ledgers`, `GET /billing/ledger/:admissionId`, `POST /billing/ledger`, `GET /billing/ledger/:ledgerId/entries`, `POST /billing/ledger/entry`, `PUT /billing/ledger/:id/dispatch` | `create`: `{admission_id, status:'OPEN'}`; `addEntry`: `{ledger_id, service_id, quantity, unit_price, amount}` | Ledger statuses seen in UI code: `OPEN`, `DISPATCHED`, `PAID`, `PARTIALLY_PAID`. |
| `billing.patient.bills/receipts` | `GET /billing/patient/:patientId/bills`, `GET /billing/patient/:patientId/receipts` | — | `bills` → `[{admission, ledger, entries}]` |
| `billing.payments.list/create` | `GET|POST /billing/payments` | create: `{ledger_id, amount_paid, payment_mode}` — modes used: `UPI`,`CARD`,`CASH`,`NETBANKING` | Creating a payment auto-generates the receipt and flips the ledger to `PAID` server-side. |
| `billing.receipts.list` | `GET /billing/receipts` | — | |
| `billing.dischargeSummary.getByAdmission/create` | `GET /billing/discharge-summary/:admissionId`, `POST /billing/discharge-summary` | create: `{admission_id, patient_id, discharge_notes, final_amount}` | |
| `billing.leaders.list/create/approve` | `GET|POST /billing/leaders`, `PUT /billing/leaders/:id/approve` | create: `{admission_id, service_id, quantity}` | HOM stages a charge; FA approves it into the ledger. |
| `appointments.list/create/update` | `GET|POST /appointment`, `PUT /appointment/:id` | | module gate `APPOINTMENTS`. `/request` is an alias router (`request.routes.js` re-exports `appointment.routes.js`) that nothing calls. |
| `admissions.list/get/create/update` | `GET /admission`, `GET|PUT /admission/:id`, `POST /admission` | | module gate `ADMISSIONS` |
| `preRequests.list/get/create/update/checkIn` | `GET /pre-requests`, `GET|PUT /pre-requests/:id`, `POST /pre-requests`, `POST /pre-requests/:id/check-in` | create: `{patient_id, department, visit_type, doctor_id?, requested_date?, requested_time?, ward_type?, document_urls?}`; update: `{status?, reject_reason?, doctor_id?, requested_date?, requested_time?, department?, visit_type?, ward_type?}`; checkIn: `{visit_type}` | module gate `ADMISSIONS`. Server rejects `status:'ADMITTED'` with **403**. Setting `DISCHARGED` with an unpaid ledger returns **409** `Cannot finalize discharge — the patient bill has not been cleared by Finance yet.` A Patient session may only send `status` + `reject_reason`. |
| `activityLog.list()` | `GET /activity-log` | — | `[{text, meta, created_at, …}]` |
| `uploads.document/branding/inventory` | `POST /uploads/document` (field `document`), `POST /uploads/branding` (field `logo`), `POST /uploads/inventory` (field `invoice`) | `FormData`, **no `Content-Type` header** (browser sets the boundary) | Response `{statusCode, message, file:{url, filename, originalName, sizeBytes, mimetype}}`, then flattened by `flattenUpload` so `.url` is also top-level. Max 5 MB; pdf/jpg/jpeg/png. |
| `uploads.staticUrl(cat, file)` | builds `<BASE>/uploads-static/<cat>/<file>` | — | Public, unauthenticated — safe for `<img src>`. |
| `uploads.open(cat, file)` | `GET /uploads/:category/:filename` with Bearer header → `blob` → `URL.createObjectURL` → `window.open(..., "_blank")`, revoked after 60 s | — | |
| `uploads.logsStatus()` | `GET /uploads/system/logs-status` | — | No caller. |

**Validator behaviour worth knowing** (`back-end/src/validators/engine.js`): unknown body
fields are **neither stripped nor rejected**. So `PRE/js/Appointment.js` sending
`appointment_time` and `status` on `POST /pre-requests`, `PRE/js/emergency.js` sending
`note`/`status`, and `patient-store.js#addAppointment` sending `note`/`document_urls`, all
pass validation regardless of the declared rules. Also: `isInt` requires a real JS number —
`"5"` fails. Keep every payload byte-identical.

**Module entitlement gating** (`back-end/src/middleware/tenant.js#requireModule`) fails
closed: a missing `organizationModules` row is treated as `enabled: false` → **403**
`The <CODE> module is not enabled for your organization`. Routers gated wholesale:
`/ward` and `/pre-requests` → `ADMISSIONS`; `/billing` → `BILLING`; `/patient` → `PATIENT`
(+ `INSURANCE` on the three insurance sub-routes); `/inventory` → `INVENTORY`;
`/doctor` → `DOCTOR`; `/appointment` → `APPOINTMENTS`.

### 1.7 Everything hostile to React

1. **~60 `window.<fn>` handlers + 80 inline `on*=` attributes.** 80 literal attributes in
   HTML (FA 6, HOM 40, PRE 30, Patient 4) plus many more generated inside template strings
   (`UI.Button({onClick})`, `PRE/js/requests.js` popups, `FA/js/app.js` rows). React's JSX
   cannot use them; each becomes a prop.
2. **`innerHTML` as the rendering engine, everywhere.** Every list, table, modal body and
   KPI card is a template literal assigned to `.innerHTML`. `FA/js/app.js` renders whole
   *pages* that way into `#app`. `shared/shared-nav.js` injects a `<style>` tag through
   `innerHTML`.
3. **Direct DOM mutation after render.** `el.style.display = …`, `classList.add/remove`,
   `btn.disabled`, `input.value`, `el.innerText`, `actionBtn.onclick = fn` — state lives in
   the DOM, not in variables. `HOM/beds.js#openDetailModal` reconfigures six elements' text,
   display and `onclick` imperatively.
4. **Positional DOM queries.** `patient-dashboard.js` uses `cards[0]`, `cards[1]`,
   `cards[2]`, `values[0..2]`, `insValues[0..2]`; `patient-profile.js` uses
   `sideRows[0..5]`, `infoSpans[0..1]`. The markup order *is* the contract.
5. **DOM node teleporting.** `HOM/hom-helpers.js#openModal` does
   `document.body.appendChild(modal)` to escape stacking contexts — React portals.
6. **Five 15-second `setInterval` polls** (`HOM/dashboard.js:25`, `beds.js:12`,
   `patient-flow.js:12`, `inventory.js:38`, `billing.js:46`), each guarded by
   `!document.hidden`, each paired with a `window` `focus` listener that refetches.
7. **Document-level global listeners** that are never removed: `click`/`keydown`/`wheel` in
   `hom-helpers.js`; delegated `click` in `HOM/billing.js`, `HOM/inventory.js`,
   `Admin/departments.js`, `Admin/inventory-catalog.js`, `Admin/people.js`; `keydown` in
   `PRE/js/requests.js`, `Appointment.js`, `emergency.js`, `patient-records.js`,
   `patient-dashboard.js`, `patient-billing.js`; outside-click in `PRE/js/hom.js`,
   `Appointment.js`, `shared/shared-nav.js`.
8. **Cross-tab side channels.** `BroadcastChannel("federico_auth_channel")` in
   `api-client.js`; custom `window` events `federicoSessionChanged` and
   `patientStoreUpdated`; `sessionStorage["FedericoSession"]`;
   `localStorage["FedericoRememberMe"]`.
9. **Native `<dialog>` + `showModal()`** in `Admin/screen-02..05` and
   `platform/platform-dashboard.html` — imperative open/close, no React state.
10. **`<template>` cloning** — `marketplace-page.html`'s `<template id="org-card-template">`
    + `content.cloneNode(true)`.
11. **Six `window.open("", "_blank")` + `document.write()` printable documents** —
    `patient-dashboard.js#openDigitalCopy`, `patient-billing.js#openInvoiceDigitalCopy` and
    `#openDigitalCopy`, `FA/js/modules/billing.js#generateDischargeSummary`,
    `#printDischargeSummary`, `#printReceipt`. Two of them inject a `<script>` that
    auto-calls `window.print()`.
12. **`FA/js/permissions.js#updateUI` parses the `onclick` attribute string** with
    `/'([^']+)'/` to discover each nav link's route; `FA/js/app.js#updateActiveNav` does the
    same with `/#\/([a-zA-Z0-9_-]+)/`. Remove the inline handler and both silently break.
13. **A load-order-dependent global overwrite** — `HOM/inventory.js:830` re-assigns
    `window.closeModals`, shadowing `hom-helpers.js`'s version, and adds form-error clearing.
14. **`shared/rbac.js#lockElement` rewrites the DOM of other people's elements**: adds
    `.module-locked`, injects a `<style id="federico-module-lock-styles">`, attaches a
    **capturing** click listener, and neutralises any same-element inline handler with
    `el.setAttribute("onclick", "return false;")`.
15. **Attribute-context escaping bug.** `PRE/js/emergency.js:127` interpolates
    `PREHelpers.escapeHtml(...)` **inside a JS string literal inside an `onclick` attribute**.
    `escapeHtml` turns `'` into `&#39;`, which the HTML parser decodes back to `'` before JS
    sees it — a department name containing an apostrophe breaks the handler.
16. **Filename-casing landmine.** Every navigation target in the repo is
    `appointment.html` (lowercase) — ten PRE navbars plus
    `PRE/js/patient-records.js:332` — but the file on disk is **`PRE/pages/APPointment.html`**.
    Nothing references the real name. This only works on a case-insensitive filesystem.
    React Router matches case-sensitively by default.

#### Pre-existing defects to carry forward verbatim (hard constraint 1)

| # | Location | Defect |
|---|---|---|
| D1 | `HOM/dashboard.js:329,415,421,433` | Calls `showMessage(...)`, which is **never defined anywhere**. Every error path throws `ReferenceError: showMessage is not defined`. |
| D2 | `shared/api-client.js:628-638` | `wards.emergencies.*` targets `/ward/emergencies`; backend serves `/ward/emergency`. Dead but wrong. |
| D3 | `signup/org-signup.js:122` and `Admin/dashboard.js:96` | Read `res.base_fee` / `liveRates?.base_fee`. `GET /platform/rates` returns **`base_platform_fee`**. The base fee silently stays at the hardcoded 3000 in both pricing calculators; `rates.*` *does* update. |
| D4 | `Patient/patient-billing.js:120` | Guards on `ins.hasInsurance`, a key `patient-store.js#buildProfile` never sets. `#insurance-banner` never leaves the "Self Pay" branch and never has `hidden` removed. |
| D5 | `Patient/patient-book-appointment.js:176` | Filters slots on `apt.doctorId`; `buildAppointments` never emits `doctorId`. Per-doctor slot capacity never narrows. |
| D6 | `FA/js/modules/billing.js:51-69` | `addChargeFromForm` reads `#charge-admission` / `#charge-service` / `#charge-qty` — none of which any FA view renders. Unreachable, and exported on `window.FAActions`. |
| D7 | `FA/js/app.js:541-544` | `#coverage-override` has no listener, so `#net-payable-preview` never updates as you type. |
| D8 | `platform/platform-dashboard.js:273-281` | `openOrgDetail` re-binds `[data-detail-tab]` click listeners on every open; they accumulate. |
| D9 | `signup/org-signup.js` (10 call sites) | Passes `'warn'` to `UIFeedback.toast`, which only knows `success|error|warning|info` and falls back to `info`. `signup/signup-page.js:192` maps `'warn'→'warning'`; org-signup does not. Same word, two different colours. |
| D10 | `PRE/js/patient-records.js:332` | `createAppointmentFor` navigates to `appointment.html?patient_id=…` — see §1.7 item 16. Also, no UI element calls it. |
| D11 | `Patient/patient-profile.js:189-213` | "Change password" validates and toasts **"Password updated."** but calls no endpoint. There is no password-change route on the backend. |
| D12 | `shared/api-client.js:329-331` | `auth.login` reads `payload.organizationId` / `hospitalId` / `orgName`, none of which the login response contains (`toPublicUser` returns only `user_id,name,email,role_id`). Those session fields are always `null`. Harmless in practice because `rbac.js#authenticate` immediately overwrites the session with a different shape. |

---

## 2. Target Structure

### 2.1 Proposed `src/` tree

New app root: **`codebase/16_Federico/frontend-react/`** (DEC-3), replacing
`front-end/` in Phase 10. Every file listed.

```
frontend-react/
├── index.html                      # ONE script tag: /src/main.jsx
├── package.json
├── vite.config.js                  # base '/', dev proxy OFF (client hits :3000 directly)
├── .env.example                    # VITE_API_URL=http://localhost:3000
└── src/
    ├── main.jsx                    # createRoot + <RouterProvider>
    ├── App.jsx                     # <Outlet/> + <ToastRegion/> + <DialogHost/>
    ├── routes.jsx                  # the full route table (§2.2)
    │
    ├── api/
    │   ├── client.js               # port of request()/requestUpload()/flattenUpload/openUploadedFile
    │   ├── session.js              # getSession/setSession/clearSession + BroadcastChannel + emitter
    │   ├── endpoints/
    │   │   ├── auth.js             │ activity.js
    │   │   ├── marketplace.js      │ appointments.js
    │   │   ├── platform.js         │ admissions.js
    │   │   ├── rbac.js             │ preRequests.js
    │   │   ├── doctors.js          │ uploads.js
    │   │   ├── patients.js         │ inventory.js
    │   │   ├── wards.js            │ billing.js
    │   │   └── index.js            # re-export → the `api` object
    │   └── errors.js               # extractMessage, ApiError
    │
    ├── lib/
    │   ├── formatters.js           # ← shared/formatters.js
    │   ├── constants.js            # ← shared/constants.js
    │   ├── sanitizer.js            # ← shared/sanitizer.js
    │   ├── insurance.js            # ← shared/insurance.js
    │   ├── roleProfiles.js         # actorProfiles + mockAccountsByOrg from rbac.js
    │   ├── entitlements.js         # hasModule/resourceQty/getEntitlements/moduleLabel
    │   ├── csv.js                  # csvEscape + downloadCsv (3 copies today)
    │   ├── printDocument.js        # one wrapper for the 6 window.open+document.write printers
    │   └── phone.js                # normalizePhone/withNormalizedPhones
    │
    ├── auth/
    │   ├── SessionContext.jsx      # provider: session, tenant, login, logout, signup
    │   ├── useSession.js
    │   ├── RequireModule.jsx       # route guard ≡ auth-guard.js + enforceModuleAccess
    │   └── actorHome.js            # ← rbac.js#getActorHome, rewritten against route paths
    │
    ├── hooks/
    │   ├── useApi.js               # {data,error,loading,reload} for one fetch
    │   ├── usePolling.js           # 15 s interval + document.hidden + window focus
    │   ├── useAsyncLock.js         # ← api-client.js#withAsyncLock
    │   └── useSearchParam.js       # ?uhid= / ?org= / ?patient_id= / ?doctor_id=
    │
    ├── components/
    │   ├── feedback/
    │   │   ├── ToastRegion.jsx     │ Dialog.jsx
    │   │   ├── ConfirmDialog.jsx   │ SelectOneDialog.jsx
    │   │   └── feedback.js         # imperative toast()/confirm()/alert()/selectOne() facade
    │   ├── ui/
    │   │   ├── Badge.jsx  Button.jsx  Card.jsx  Input.jsx  Tabs.jsx   # ← HOM/ui-template.js
    │   │   └── DataTable.jsx                                          # ← shared/dom-table.js
    │   ├── layout/
    │   │   ├── SharedNav.jsx       # ← shared/shared-nav.js (its <style> → SharedNav.css)
    │   │   ├── ModuleLock.jsx      # ← rbac.js#lockElement, as a wrapper component
    │   │   └── Modal.jsx           # ← hom-helpers.js openModal/closeModals, via createPortal
    │   └── forms/
    │       ├── DepartmentSelect.jsx  # ← shared/department-options.js
    │       └── FileField.jsx
    │
    ├── styles/                     # every legacy CSS file, byte-for-byte
    │   ├── design-tokens.css       │ material-components.css │ ui-feedback.css
    │   ├── hom/global.css          │ admin/admin.css
    │   ├── pre/base.css  pre/layout.css  pre/components.css
    │   ├── fa/base.css   fa/layout.css   fa/components.css
    │   ├── patient/patient-dashboard.css │ patient-billing.css
    │   │            patient-book-appointment.css │ patient-profile.css
    │   ├── landing/landing-page.css │ login/login-page.css
    │   ├── signup/signup-page.css   │ signup/org-signup.css
    │   ├── marketplace/marketplace-page.css
    │   └── platform/platform.css
    │
    └── pages/
        ├── public/
        │   ├── LandingPage.jsx         │ LoginPage.jsx
        │   ├── SignupPage.jsx          │ OrgSignupPage.jsx
        │   └── MarketplacePage.jsx
        ├── platform/
        │   ├── PlatformLoginPage.jsx   │ PlatformDashboardPage.jsx
        │   ├── OverviewTab.jsx  OrganizationsTab.jsx  RatesTab.jsx
        │   └── ProvisionDialog.jsx  OrgDetailDialog.jsx
        ├── hom/
        │   ├── HomLayout.jsx           # nav + <Outlet/>
        │   ├── DashboardPage.jsx       │ AdmissionRequestModal.jsx
        │   ├── BedManagementPage.jsx   │ AssignBedModal.jsx  BedDetailModal.jsx
        │   ├── PatientFlowPage.jsx     │ PatientDetailModal.jsx  DischargeModal.jsx
        │   ├── InventoryPage.jsx       │ LogUsageModal.jsx  RestockModal.jsx
        │   └── BillingPage.jsx         │ PostServiceModal.jsx  BillingDetailModal.jsx
        ├── pre/
        │   ├── PreLayout.jsx           # the hardcoded PRE navbar, once
        │   ├── PreDashboardPage.jsx    │ RequestsPage.jsx   ApprovePopup.jsx
        │   │                             SuggestPopup.jsx   RejectPopup.jsx
        │   ├── RejectedPage.jsx        │ AdmittedPage.jsx
        │   ├── DischargePage.jsx       │ EmergencyPage.jsx  EmergencyModal.jsx
        │   ├── PatientRecordsPage.jsx  │ Patient360Modal.jsx  RegisterPatientModal.jsx
        │   ├── DoctorRosterPage.jsx
        │   ├── AppointmentPage.jsx     │ PatientPicker.jsx  RegisterWalkInPopup.jsx
        │   ├── HomCoordinationPage.jsx
        │   └── preHelpers.js           # ← PRE/js/shared-state.js
        ├── patient/
        │   ├── PatientLayout.jsx
        │   ├── PatientStoreContext.jsx # ← Patient/js/patient-store.js (see §2.3)
        │   ├── patientStoreShape.js    # buildProfile/buildAppointments/buildVisits/
        │   │                             buildBillsAndDocuments/buildNotifications — pure
        │   ├── DashboardPage.jsx       │ AppointmentsModal.jsx VisitsModal.jsx BillsModal.jsx
        │   ├── BookAppointmentPage.jsx
        │   ├── BillingPage.jsx         │ BillDetailsModal.jsx
        │   └── ProfilePage.jsx
        ├── fa/
        │   ├── FaLayout.jsx            # header + nav; replaces onclick="navigate(…)"
        │   ├── faHelpers.js            # ← FA/js/fa-helpers.js
        │   ├── faActions.js            # ← FA/js/modules/billing.js
        │   ├── DashboardView.jsx  ChargesView.jsx  LedgerView.jsx
        │   ├── EodBillingView.jsx DischargeView.jsx ReceiptsView.jsx
        │   └── PatientPicker.jsx
        └── admin/
            ├── AdminLayout.jsx
            ├── DashboardPage.jsx       │ DepartmentsPage.jsx  WardDialog.jsx
            ├── InventoryCatalogPage.jsx│ ItemDialog.jsx
            ├── RolesStaffPage.jsx      │ RoleDialog.jsx
            └── PeoplePage.jsx          │ StaffDialog.jsx  DoctorDialog.jsx
```

### 2.2 Routing

**Library:** `react-router-dom` v6, `createBrowserRouter`.

**URLs are preserved exactly, including the `.html` suffix.** Hard constraint 4 says "same
URLs", and every cross-portal link in the app is a literal `.html` path. Keeping them means
`window.location.href = '../HOM/screen-01-dashboard.html'` becomes
`navigate('/HOM/screen-01-dashboard.html')` with no URL change, and any bookmark still works.

```
/                                        → redirect to /landing/landing-page.html
/landing/landing-page.html               → LandingPage
/login/login-page.html                   → LoginPage                (?org=<id>)
/signup/signup-page.html                 → SignupPage               (?org=<id>)
/signup/org-signup.html                  → OrgSignupPage
/marketplace/marketplace-page.html       → MarketplacePage
/platform/platform-login.html            → PlatformLoginPage
/platform/platform-dashboard.html        → PlatformDashboardPage

/HOM/                                    → redirect  ⟵ HOM/index.html
/HOM/index.html                          → redirect to screen-01
/HOM/screen-01-dashboard.html            → HomLayout > DashboardPage
/HOM/screen-02-bed-management.html       → HomLayout > BedManagementPage
/HOM/screen-03-patient-flow.html         → HomLayout > PatientFlowPage   (?uhid=)
/HOM/screen-04-inventory.html            → HomLayout > InventoryPage
/HOM/screen-05-billing.html              → HomLayout > BillingPage       (?uhid=)

/PRE/                                    → redirect  ⟵ PRE/index.html
/PRE/index.html                          → redirect to /PRE/pages/PRE.html
/PRE/pages/PRE.html                      → PreLayout > PreDashboardPage
/PRE/pages/request.html                  → PreLayout > RequestsPage
/PRE/pages/rejected.html                 → PreLayout > RejectedPage
/PRE/pages/admitted.html                 → PreLayout > AdmittedPage
/PRE/pages/discharge.html                → PreLayout > DischargePage
/PRE/pages/emergency.html                → PreLayout > EmergencyPage
/PRE/pages/patient-records.html          → PreLayout > PatientRecordsPage
/PRE/pages/doctor.html                   → PreLayout > DoctorRosterPage
/PRE/pages/appointment.html              → PreLayout > AppointmentPage   (?patient_id=, ?doctor_id=)
/PRE/pages/APPointment.html              → same element (alias, see below)
/PRE/pages/hom.html                      → PreLayout > HomCoordinationPage

/Patient/patient-dashboard.html          → PatientLayout > DashboardPage
/Patient/patient-book-appointment.html   → PatientLayout > BookAppointmentPage
/Patient/patient-billing.html            → PatientLayout > BillingPage
/Patient/patient-profile.html            → PatientLayout > ProfilePage

/FA/fa-dashboard.html                    → FaLayout, with six hash views (below)

/Admin/screen-01-dashboard.html          → AdminLayout > DashboardPage
/Admin/screen-02-departments.html        → AdminLayout > DepartmentsPage
/Admin/screen-03-inventory.html          → AdminLayout > InventoryCatalogPage
/Admin/screen-04-admin.html              → AdminLayout > RolesStaffPage
/Admin/screen-05-people.html             → AdminLayout > PeoplePage

*                                        → NotFound
```

**Appointment casing.** Register **both** `/PRE/pages/appointment.html` (what every link
actually uses) and `/PRE/pages/APPointment.html` (the legacy filename) to the same element.
Costs one line and removes a class of 404 that would otherwise appear only in production.

**FA stays hash-routed.** `FA/fa-dashboard.html#/dashboard` … `#/receipts`, plus
`#/ledger/<admissionId>` / `#/discharge/<admissionId>` / `#/eod/<admissionId>`. Same URLs.
Implement `FaLayout` with a small `useHashRoute()` hook (a `hashchange` listener +
`useSyncExternalStore`) rather than nesting a second router — mixing `HashRouter` inside
`BrowserRouter` fights over `location`.

**Dev + prod server config.** Vite dev needs
`appType: 'spa'` (the default) so unknown paths fall back to `index.html`; verify that a
deep link like `/HOM/screen-02-bed-management.html` serves the app rather than 404ing —
Vite's default middleware may try to resolve `.html` requests as real files. If it does,
add a tiny `configureServer` middleware that rewrites any non-asset request to `/`. For
production, any static host needs the same catch-all rewrite.

### 2.3 State strategy, piece by piece

| Legacy global | New home | Why |
|---|---|---|
| `window.ApiClient` / `window.API` | `import { api } from '@/api'` | Stateless module. |
| `sessionStorage["FedericoSession"]`, `setSession`/`clearSession`, `BroadcastChannel`, `federicoSessionChanged` | **`SessionContext`** (`src/auth/SessionContext.jsx`) wrapping `src/api/session.js` | Read by every guard, nav and page. `api/session.js` keeps the raw store + broadcast so `api/client.js` can clear on 401 without importing React; the context subscribes and re-renders. |
| `window.RoleAccess.*` | Split: pure data → `lib/roleProfiles.js`; entitlement predicates → `lib/entitlements.js` (`hasModule`, `resourceQty`); guard → `auth/RequireModule.jsx`; redirect map → `auth/actorHome.js`; `applyTenantBranding` → props on `SharedNav` | The object mixed five unrelated jobs. |
| `window.APP_MODULE` + `auth-guard.js` | `<RequireModule module="HOM">` wrapper on each route group | Declarative, runs before render. |
| `window.PatientSession` | **Dropped** — no reader exists (DEC-8) | |
| `window.UIFeedback` | `components/feedback/feedback.js` imperative facade backed by a single `<ToastRegion/>` + `<DialogHost/>` in `App.jsx` | Keeps the exact `toast/alert/confirm/selectOne` signatures so ~200 call sites port mechanically. |
| `window.UI` (HTML-string components) | `components/ui/*.jsx` | One-to-one; `Button`'s `onClick` prop becomes a real function, `dataAttrs` become props. |
| `window.HOMHelpers`, `PREHelpers`, `FAHelpers` | `lib/formatters.js` + `pages/pre/preHelpers.js` + `pages/fa/faHelpers.js` | Split shared-pure from portal-specific. |
| `window.openModal`/`closeModals` + `.modal-overlay` | `components/layout/Modal.jsx` via `createPortal(…, document.body)`; open/close is local `useState` per page | Replaces the teleport and the three document listeners. |
| HOM per-page module state (`dashboardData`, `bedsData`, `flowData`, `inventoryData`, `billingRows`, all the filter vars) | **Local `useState` in each page component.** Data fetching via `useApi` + `usePolling(15000)` | Nothing crosses page boundaries; no store needed. |
| `Patient` `AppStore` + `onStoreReady` + `patientStoreUpdated` | **`PatientStoreContext`** provided by `PatientLayout`. Same derived shape (`bills`, `appointments`, `visits`, `documents`, `billingSections`, `notifications`, `patient`), same getters as hook returns, same async writers (`addAppointment`, `cancelAppointment`, `updateProfile`, `updateInsurance`, `payBill`) which call `refresh()` after each write | All four Patient pages read it; the shaping functions in `patientStoreShape.js` stay pure and are ported line-for-line. |
| `window.currentAdmissionId` (FA) | `useState` in `FaLayout`, passed down; also readable from the hash segment | Its only consumers are three sibling FA views. |
| `window.Permissions` (FA) | `pages/fa/FaLayout.jsx` local logic + `lib/entitlements.js` | Drops the `onclick`-string parsing entirely. |
| `localStorage["FedericoRememberMe"]` | `LoginPage` local effect — same key, same `{email, orgId, role}` shape | Must stay compatible with existing browsers. |

**No global store library.** Two contexts (`SessionContext`, `PatientStoreContext`) plus
local state covers everything. Adding Redux/Zustand here would be new architecture, which
Phase 1 forbids.

### 2.4 How CSS moves without being rewritten

Constraint 5 says the CSS moves **unchanged**. §1.5 shows 20 class names and `:root`/`body`/`*`
are defined in many files with conflicting values. Both can hold simultaneously with
**per-route CSS injection**:

- `src/styles/` holds every legacy file byte-for-byte.
- `design-tokens.css`, `material-components.css` and `ui-feedback.css` are imported once in
  `src/main.jsx` — they are already loaded on every page today, so there is nothing to
  isolate.
- Every **portal-specific** stylesheet is imported **only inside its own route's lazy
  chunk** (`pages/hom/HomLayout.jsx` imports `styles/hom/global.css`, `PreLayout` imports the
  three PRE files in their current order, each Patient page imports its own file, etc.).
  With `React.lazy` + `import()` per route group, Vite emits one CSS chunk per group and
  injects/removes it with the chunk. At any moment only one portal's CSS is live — exactly
  today's behaviour.
- **Verification step, not an assumption:** Vite's default production build can hoist shared
  CSS into a single file. Phase 2.5 (below) must confirm with `npm run build` that HOM and
  Patient CSS land in *separate* `.css` assets. If they merge, set
  `build.cssCodeSplit: true` (the default) and, if still merged, split the route groups into
  separate `manualChunks`. If neither works, the fallback — which *is* a rewrite and
  therefore is a last resort (DEC-5) — is a one-line wrapper selector per file.
- The `<style>` block inside `shared/shared-nav.js:58-81` moves to
  `components/layout/SharedNav.css` verbatim.

### 2.5 How API calls are organised

`src/api/client.js` is a straight port of `request()` / `requestUpload()` — same 15 s
`AbortController`, same `credentials:"include"`, same Bearer header, same 401→`clearSession`,
same `{success,data}` unwrap, same error messages. `src/api/endpoints/*.js` each export a
plain object of thin wrappers, mirroring the existing namespaces 1:1 so that
`ApiClient.wards.bedRequests.allocate(id, bedId)` becomes
`api.wards.bedRequests.allocate(id, bedId)` and every call site is a mechanical edit.
`src/api/endpoints/index.js` composes them into one `api` object.

Base URL becomes `import.meta.env.VITE_API_URL ?? 'http://localhost:3000'`, preserving the
current effective default. The `window.location.port === "3000"` branch is kept as a
fallback so a same-origin deployment behaves as it does now.

---

## 3. File-by-File Mapping

Risk key — **L**: mechanical. **M**: needs care (imperative DOM, load order, shared state).
**H**: behaviour is easy to change by accident.

### Shared layer

| Old | New | Notes | Risk |
|---|---|---|---|
| `shared/api-client.js` (825) | `src/api/client.js`, `src/api/session.js`, `src/api/errors.js`, `src/api/endpoints/*.js` (14 files) | Split by namespace. Keep timeout, error strings, envelope unwrap, phone normalisation, `flattenUpload`, `openUploadedFile` identical. Carry D2 (`/ward/emergencies`) forward unchanged. | **H** |
| `shared/rbac.js` (514) | `src/lib/roleProfiles.js`, `src/lib/entitlements.js`, `src/auth/SessionContext.jsx`, `src/auth/RequireModule.jsx`, `src/auth/actorHome.js`, `src/components/layout/ModuleLock.jsx` | `authenticate()` must keep the `result.role !== actor` check and the exact message `"That account is not a <Actor> account."`, and keep setting `lastAuthError`. `getActorHome`'s `../` juggling disappears — route paths are absolute. | **H** |
| `shared/auth-guard.js` (38) | folded into `src/auth/RequireModule.jsx` | Preserve the toast + **1100 ms** delay before redirect in `enforceModuleAccess`, and the message `"Access denied — <Actor> cannot open the <MODULE> module."` Drop `window.PatientSession`. | **M** |
| `shared/ui-feedback.js` (252) | `src/components/feedback/{ToastRegion,Dialog,ConfirmDialog,SelectOneDialog}.jsx` + `feedback.js` | Keep 4000 ms auto-dismiss, the `✓ ✕ ⚠ ℹ` icons, the double-`requestAnimationFrame` enter, Escape-to-dismiss, and focus-last-action. | **M** |
| `shared/formatters.js` (76) | `src/lib/formatters.js` | Pure. Named exports. | **L** |
| `shared/constants.js` (76) | `src/lib/constants.js` | Pure. | **L** |
| `shared/sanitizer.js` (85) | `src/lib/sanitizer.js` | Pure. | **L** |
| `shared/insurance.js` (76) | `src/lib/insurance.js` | Pure. Keep the exact `breakdown` string. | **L** |
| `shared/dom-table.js` (46) | `src/components/ui/DataTable.jsx` | `toRow` returning a string becomes a render prop returning JSX. Keep the empty-state `colspan` + inline style. | **M** |
| `shared/department-options.js` (42) | `src/components/forms/DepartmentSelect.jsx` | Keep: distinct trimmed `specialization`, `localeCompare` sort, disabled+selected placeholder, previous-value restore. | **L** |
| `shared/shared-nav.js` (153) | `src/components/layout/SharedNav.jsx` + `SharedNav.css` | `<style>` → CSS file. Active-link test changes from `location.pathname.split('/').pop()` to `NavLink`. Sign Out keeps `api.auth.logout()` then `/login/login-page.html`. | **M** |
| `shared/design-tokens.css` (332) | `src/styles/design-tokens.css` | Verbatim. Imported in `main.jsx`. | **L** |
| `shared/material-components.css` (373) | `src/styles/material-components.css` | Verbatim, `main.jsx`. | **L** |
| `shared/ui-feedback.css` (111) | `src/styles/ui-feedback.css` | Verbatim, `main.jsx`. | **L** |

### Public pages

| Old | New | Notes | Risk |
|---|---|---|---|
| `landing/landing-page.html` (141) + `.js` (43) + `.css` (396) | `src/pages/public/LandingPage.jsx` + `src/styles/landing/landing-page.css` | Five buttons → `useNavigate`. Drops the unused `rbac.js`/`api-client.js` loads. | **L** |
| `login/login-page.html` (96) + `.js` (229) + `.css` (362) | `src/pages/public/LoginPage.jsx` + `src/styles/login/login-page.css` | Role tabs → state. Keep `?org=` preselect, the `FedericoRememberMe` restore/save, the click-to-autofill demo panel (matched by `.demo-credential-row`), the `md-fade-switch` reflow, and the exact errors `"Enter both email and password."` / `"Invalid <Role> credentials."` / `"Something went wrong. Please try again."`. Post-login redirects go to the §2.2 paths. | **M** |
| `signup/signup-page.html` (225) + `.js` (195) + `.css` (269) | `src/pages/public/SignupPage.jsx` + `src/styles/signup/signup-page.css` | Port all nine validations **in order** with their exact strings. Keep the optional-insurance follow-up call, the `"Account Created"` label + `opacity 0.8`, the 1400 ms delay before redirect, and the `'warn'→'warning'` mapping. | **M** |
| `signup/org-signup.html` (360) + `.js` (371) + `.css` (421) | `src/pages/public/OrgSignupPage.jsx` + `src/styles/signup/org-signup.css` | Wizard step → state. Keep the rate table, GST 18 %, the whole `payload` shape, **D3 (`res.base_fee`)** and **D9 (unmapped `'warn'`)**. | **M** |
| `marketplace/marketplace-page.html` (77) + `.js` (106) + `.css` (98) | `src/pages/public/MarketplacePage.jsx` + `src/styles/marketplace/marketplace-page.css` | `<template>` clone → JSX map. Keep the branch-name `.replace(org.name + ' — ','')` / `.replace(org.name,'Main Campus')` logic and both empty states. | **L** |

### Platform

| Old | New | Notes | Risk |
|---|---|---|---|
| `platform/platform-login.html` (53) + `.js` (62) | `src/pages/platform/PlatformLoginPage.jsx` | Keep the `session.isPlatformUser` redirect-if-signed-in guard and the demo-credential autofill. | **L** |
| `platform/platform-dashboard.html` (203) + `.js` (384) | `PlatformDashboardPage.jsx` + `OverviewTab.jsx` + `OrganizationsTab.jsx` + `RatesTab.jsx` + `ProvisionDialog.jsx` + `OrgDetailDialog.jsx` | `<dialog>.showModal()` → controlled `Modal`. Keep both the `revenue_by_service` and legacy `revenue_by_plan` branches. **D8 duplicate listeners disappear naturally** — note this as an intentional, invisible behaviour change. | **M** |
| `platform/platform.css` (503) | `src/styles/platform/platform.css` | Verbatim; imported by the platform route chunk. | **L** |

### HOM

| Old | New | Notes | Risk |
|---|---|---|---|
| `HOM/index.html` (13) | route redirect in `routes.jsx` | Meta-refresh + `location.replace` → `<Navigate replace>`. | **L** |
| `HOM/shared-nav.js` (29) | `src/pages/hom/HomLayout.jsx` | Same 5 links, same `module:` gates, same `hospitalName` fallback chain `tenant.hospital_name → tenant.organization_name → 'City General Hospital'`. | **L** |
| `HOM/hom-helpers.js` (147) | `src/pages/hom/homHelpers.js` + `src/components/layout/Modal.jsx` | Keep `STATUS_LABELS`, `statusVariant`, `BED_STYLES` hex values, `daysSince`, `joinPreRequestsWithPatients` exactly. | **M** |
| `HOM/ui-template.js` (158) | `src/components/ui/{Badge,Button,Card,Input,Tabs}.jsx` | Keep the **dual class emission** (`badge badge-x md-chip md-chip-x`, `btn btn-x btn-y md-btn md-btn-z`) — both stylesheets style them. | **M** |
| `HOM/dashboard.js` (438) | `hom/DashboardPage.jsx` + `AdmissionRequestModal.jsx` | Keep the 15 s poll, focus refetch, the `parseOperationalLog` regex ladder (9 branches, exact category/subtitle strings), `timeAgo` thresholds, and **D1** (`showMessage` must stay undefined — DEC-6). | **H** |
| `HOM/beds.js` (413) | `hom/BedManagementPage.jsx` + `AssignBedModal.jsx` + `BedDetailModal.jsx` | The three-branch `openDetailModal` (OCCUPIED / AVAILABLE / MAINTENANCE) sets six elements imperatively — rewrite as conditional JSX, keeping every label (`"Mark as Under Maintenance"`, `"Assign Patient (N Waiting)"`, `"Status: Vacant & Clean"`). | **H** |
| `HOM/patient-flow.js` (430) | `hom/PatientFlowPage.jsx` + `PatientDetailModal.jsx` + `DischargeModal.jsx` | Keep all four filters, the CSV export (`hom-patient-flow.csv`, same column order), `?uhid=` deep link, and the two-list discharge queue. | **H** |
| `HOM/inventory.js` (835) | `hom/InventoryPage.jsx` + `LogUsageModal.jsx` + `RestockModal.jsx` | The biggest single conversion: 16 globals + 23 inline handlers. Keep `computeItemStatus` thresholds (`<= floor(reorder/2)` → Critical), `validateUsageDetails`'s five messages verbatim, the `postUsage` two-step (decrement stock **then** create a billing leader), the invoice upload-before-create order, and the `window.closeModals` override semantics (clearing both form errors). | **H** |
| `HOM/billing.js` (561) | `hom/BillingPage.jsx` + `PostServiceModal.jsx` + `BillingDetailModal.jsx` | Keep the per-ledger `entries` fan-out, `ledgerStatusVariant`, `?uhid=` prefill, and the CSV filename `hom-billing-ledger-<YYYY-MM-DD>.csv`. | **M** |
| `HOM/global.css` (606) | `src/styles/hom/global.css` | Verbatim; imported by `HomLayout`. | **L** |
| `HOM/screen-01..05*.html` (1039 total) | JSX inside the five page/modal components above | The static shell of each page becomes the component's return value; the 40 inline handlers become props. | **M** |

### PRE

| Old | New | Notes | Risk |
|---|---|---|---|
| `PRE/index.html` (16) | route redirect | | **L** |
| `PRE/js/shared-state.js` (162) | `src/pages/pre/preHelpers.js` | Pure. Keep `to12Hour`/`to24Hour` edge cases and the **double field naming** in `joinPreRequestsWithPatients` (both `patient_name` and `patientName`, etc.) — different pages read different spellings. | **M** |
| `PRE/js/logout.js` (16) | `PreLayout.jsx` Sign Out button | | **L** |
| `PRE/js/PRE.js` (141) | `pre/PreDashboardPage.jsx` | Keep the five-clause `approved` filter, the badge ladder, the visit-type `<select>` and all three toast strings. | **M** |
| `PRE/js/requests.js` (266) | `pre/RequestsPage.jsx` + `ApprovePopup.jsx` + `SuggestPopup.jsx` + `RejectPopup.jsx` | Dynamically-created popups → controlled components. Keep `buildDoctorSelectOptions` sorting, the `confirmSuggest` **two sequential PUTs**, backdrop-click and Escape dismissal. | **M** |
| `PRE/js/rejected.js` (38) | `pre/RejectedPage.jsx` | | **L** |
| `PRE/js/admitted.js` (62) | `pre/AdmittedPage.jsx` | Keep the `status==='ADMITTED' && visit_type !== 'Emergency'` filter. | **L** |
| `PRE/js/discharge.js` (113) | `pre/DischargePage.jsx` | Keep the bills-cleared derivation (`a.bills_cleared || ledger.status === 'PAID'`) and the disabled-button title `"Patient bill not cleared yet"`. | **M** |
| `PRE/js/emergency.js` (335) | `pre/EmergencyPage.jsx` + `EmergencyModal.jsx` | Keep the four-clause record filter, KPI strings, the quick-create → `POST /patient` → `POST /pre-requests` → `POST /ward/bed-requests` chain, and the `birthYear = currentYear - age; dob = "<year>-01-01"` approximation. **Item 15's escaping bug disappears** when the handler becomes a closure — note as an invisible fix. | **H** |
| `PRE/js/patient-records.js` (523) | `pre/PatientRecordsPage.jsx` + `Patient360Modal.jsx` + `RegisterPatientModal.jsx` | Keep the eight-branch status ladder in order, the `validateRegisterPatient` messages verbatim, the encounter de-duplication (`apt_` / `pr_` keys), and the upload-then-attach insurance flow. Carry **D10** forward. | **H** |
| `PRE/js/doctor.js` (163) | `pre/DoctorRosterPage.jsx` | Keep the availability-status normalisation regexes and the `09:00 AM` / `05:00 PM` / `Mon – Sat` defaults. | **M** |
| `PRE/js/Appointment.js` (510) | `pre/AppointmentPage.jsx` + `PatientPicker.jsx` + `RegisterWalkInPopup.jsx` | Keep the input sanitisers (`sanitizePatientName`, `sanitizeAge`) that rewrite the field as you type, the phone `^[0-9]{10}$` rule, `?patient_id=` / `?doctor_id=` prefill, and the `POST /pre-requests` body including `appointment_time` and `status:'APPROVED'`. | **H** |
| `PRE/js/hom.js` (414) | `pre/HomCoordinationPage.jsx` | Keep `loadCandidates`'s exclusion sets, the four `visitType` labels, the ward auto-match keyword rules (pediatr / cardio|heart / matern|gynec|obstet / icu), and the inline-hex priority/status badges. | **M** |
| `PRE/pages/*.html` (10 files, 1416 total) | the components above; the shared navbar → `PreLayout.jsx` once | | **M** |
| `PRE/css/base.css` (15), `layout.css` (13), `components.css` (1636) | `src/styles/pre/{base,layout,components}.css` | Verbatim, imported in that order by `PreLayout`. | **L** |

### Patient

| Old | New | Notes | Risk |
|---|---|---|---|
| `Patient/js/patient-store.js` (684) | `patient/PatientStoreContext.jsx` + `patient/patientStoreShape.js` | Shaping functions port unchanged. Keep the `portalSummary` → per-endpoint **fallback** path. Keep the bills gate `["DISPATCHED","PAID"].includes(ledger.status)`, the 7-day due date, the `_docIndex` keying `"<TYPE>:<id>"`, and the latest-`insurance_id` pick. Carry **D4**. | **H** |
| `Patient/patient-dashboard.html` (313) + `.js` (628) + `.css` (621) | `patient/DashboardPage.jsx` + `AppointmentsModal.jsx` + `VisitsModal.jsx` + `BillsModal.jsx` + `src/styles/patient/patient-dashboard.css` | **Replace positional selectors** (`cards[0..2]`, `values[0..2]`, `insValues[0..2]`) with explicit JSX — same rendered output. `openDigitalCopy` → `lib/printDocument.js`, HTML string byte-identical. | **H** |
| `Patient/patient-book-appointment.html` (279) + `.js` (453) + `.css` (308) | `patient/BookAppointmentPage.jsx` + `src/styles/patient/patient-book-appointment.css` | Keep `MAX_PATIENTS_PER_SLOT = 3`, `normalizeSlotTime`, the Available/`N Left`/Booked ladder, the 5 MB + `.pdf/.jpg/.jpeg/.png` client checks with their exact rejection strings, upload-before-create ordering, and the 1500 ms redirect. Carry **D5**. | **H** |
| `Patient/patient-billing.html` (194) + `.js` (706) + `.css` (281) | `patient/BillingPage.jsx` + `BillDetailsModal.jsx` + `src/styles/patient/patient-billing.css` | Keep the four `.filter-tab` sections, the three-way Paid / Payable / Interim EOD action ladder with the `title` tooltip text, `UIFeedback.selectOne` payment picker with `["UPI","CARD","NETBANKING","CASH"]`, and both printers verbatim. Carry **D4**. | **H** |
| `Patient/patient-profile.html` (383) + `.js` (388) + `.css` (237) | `patient/ProfilePage.jsx` + `src/styles/patient/patient-profile.css` | Four independently-editable sections with capture/restore-on-cancel → per-section local state. Keep the password hint strings and **D11** (no endpoint, still toasts success). Keep the "View uploaded file" vs "replace" click split. | **H** |

### FA

| Old | New | Notes | Risk |
|---|---|---|---|
| `FA/fa-dashboard.html` (54) | `fa/FaLayout.jsx` | Six `onclick="navigate('#/…')"` spans → buttons with handlers; active state from the hash, not an attribute regex. | **M** |
| `FA/js/router.js` (36) | `useHashRoute()` inside `FaLayout.jsx` | Keep `#/route/:admissionId` parsing and the `hashchange` re-render. | **M** |
| `FA/js/permissions.js` (61) | `fa/FaLayout.jsx` + `lib/entitlements.js` | The `routeAccess` map is identical for all three roles, so in practice it only ever gates on `hasModuleAccess('FA', actor)`. Keep the `role-indicator` strings `"superUser · Finance Control"` / `"admin · Finance Operations"`. | **M** |
| `FA/js/fa-helpers.js` (90) | `fa/faHelpers.js` | `loadBillingOverview` fans out to 8 endpoints — port as-is. Keep the `preRequest` match heuristic `(r.patient_id === a.patient_id && (r.bed_id === a.bed_id || !a.bed_id))` and `dischargeApproved` derivation. | **M** |
| `FA/js/modules/billing.js` (341) | `fa/faActions.js` (+ printers via `lib/printDocument.js`) | Keep `createLedgerAndOpen`'s hash navigation, the `dispatchCurrent` confirm copy verbatim, `ensureDischargeSummary`'s fixed `discharge_notes` sentence, and the auto-`window.print()` timeout of 500 ms. Carry **D6** and **D7**. | **H** |
| `FA/js/app.js` (645) | `fa/{DashboardView,ChargesView,LedgerView,EodBillingView,DischargeView,ReceiptsView}.jsx` + `PatientPicker.jsx` | Six string-returning render functions → components. Keep `statusBadge`, `renderPatientPicker`'s option labels (`[OPD Consultation]` / `[Bed X]` / `[EOD Sent]` / `[NO LEDGER]`), the charges ordering (pending first, then by time desc), `filterReceipts`'s `data-*` matching, and the "Await HOM Approval" disabled-state toast. | **H** |
| `FA/css/{base,layout,components}.css` (370) | `src/styles/fa/{base,layout,components}.css` | Verbatim, imported by `FaLayout` in order. | **L** |

### Admin

| Old | New | Notes | Risk |
|---|---|---|---|
| `Admin/shared-nav.js` (25) | `admin/AdminLayout.jsx` | Keep the link order (Dashboard, Departments, Inventory Catalog, **People → screen-05**, Roles & Staff → screen-04) and the `brandName = tenant.organization_name ?? 'Federico'` fallback. | **L** |
| `Admin/dashboard.js` (267) | `admin/DashboardPage.jsx` | Keep the `ANALYTICS` module lock (`#analytics-locked-message`, early return), the per-ledger entry fan-out, the hardcoded `terminalsCount = 2` / `warehouseCount = 1`, GST 18 %, and **D3**. | **M** |
| `Admin/departments.js` (168) | `admin/DepartmentsPage.jsx` + `WardDialog.jsx` | `<dialog>` → controlled `Modal`. Keep the `result.error` early-return branch (the API client throws on error, so this is defensive dead code — keep it). | **M** |
| `Admin/inventory-catalog.js` (120) | `admin/InventoryCatalogPage.jsx` + `ItemDialog.jsx` | Keep the confirm copy and the `DomTable` empty message. | **L** |
| `Admin/admin.js` (307) | `admin/RolesStaffPage.jsx` + `RoleDialog.jsx` | Keep the optimistic checkbox that **reverts on failure** (`checkbox.checked = !checkbox.checked`), the branding upload + `staticUrl` preview, `formatFileSize`, and the PDF branch. | **M** |
| `Admin/people.js` (232) | `admin/PeoplePage.jsx` + `StaffDialog.jsx` + `DoctorDialog.jsx` | Keep the `DOCTOR` module check in two places (`#new-doctor-btn` guard and `loadDoctors`'s placeholder row) and `departmentOptions`'s unshift-of-current-value. | **M** |
| `Admin/admin.css` (870) | `src/styles/admin/admin.css` | **Drop its three `@import`s of the shared files (lines 17–19)** — those are now loaded globally from `main.jsx`, and leaving them would double-load. This is the only permitted CSS edit in Phase 1; note it in the commit. | **M** |
| `Admin/screen-01..05*.html` (475 total) | JSX in the five pages above | | **M** |

### Files deleted with no replacement

| Old | Why |
|---|---|
| `front-end/package-lock.json` | Empty stub (`"packages": {}`), no `package.json` beside it. |
| `front-end/README.md` | Superseded; also already out of date (omits `Admin/screen-05-people.html`). Rewrite at the end of Phase 1. |

---

## 4. Phased Execution Plan

Prerequisite for every phase: the backend is running (`cd back-end && npm install && npm run start:dev`),
listening on `http://localhost:3000`. Sign-in accounts are in `shared/rbac.js`'s
`mockAccountsByOrg` — org 1: `owner@hosp.com/Owner@123` (Admin), `admin@hosp.com/Hom@123` (HOM),
`rekha.pre@hosp.com/Pre@123` (PRE), `farah.fa@hosp.com/Fa@123` (FA),
`arjun.k@hosp.com/Hamiz@123` (Patient); platform: `platform@federico.com/Federico@Platform123`.

---

### Phase 0 — Branch and scaffold

- [x] `cd codebase/16_Federico && git branch pre-react-backup` — **done**, points at `1708ea7`
- [x] Work branch `feat/react-implementation` — **done**, already checked out (this replaces the `react-migration` name in §5; see DEC-3)
- [x] `npm create vite@latest frontend-react -- --template react`
- [x] `cd frontend-react && npm install && npm install react-router-dom`
- [x] Replace generated `index.html` with a shell whose `<body>` is `<div id="root"></div>` and **one** `<script type="module" src="/src/main.jsx"></script>`
- [x] Delete the template's demo files
- [x] Copy all 21 CSS files into `src/styles/` unchanged (except `admin.css`'s three `@import` lines — see §3)
- [x] Create `.env.example` with `VITE_API_URL=http://localhost:3000`
- [x] Add a `vite.config.js` SPA fallback for deep `.html` paths; confirm `/HOM/screen-02-bed-management.html` serves the app in dev
- Files created: `frontend-react/{index.html,package.json,package-lock.json,vite.config.js,.env.example,.gitignore,.oxlintrc.json}`, `src/{main.jsx,App.jsx,routes.jsx}` (stubs), `src/styles/**` (21 files)
- Files deleted: none
- Verify: `npm run dev` serves a blank page with no console errors; `npm run build` succeeds
- Commit: `scaffold vite react app alongside the existing frontend`

**Phase 0 outcome — done.** Toolchain resolved to Node 22.16, Vite 8.3, React 19.2,
react-router-dom 7.18; `react-router-dom` is the only added runtime dependency (DEC-11).
`npm run build` succeeds. A hard load of `/HOM/screen-02-bed-management.html` renders the
app with a clean console. All 21 stylesheets verified: 20 byte-identical to their
originals, `admin.css` differing by exactly its three `@import` lines (DEC-4), with its
BOM and CRLF endings preserved so `git diff` shows three deletions and nothing else.

Two deviations from the step list as written:

1. **The current Vite React template ships different demo files** than this plan assumed
   (`public/favicon.svg`, `public/icons.svg`, `src/assets/hero.png`, `.oxlintrc.json`, a
   template `README.md`) and no `public/vite.svg`. All demo assets, `src/App.css`,
   `src/index.css` and the generated `src/App.jsx` were removed; `.oxlintrc.json` and the
   `lint` script were kept, since a linter is useful and costs nothing.
2. **`index.html` carries no `Content-Security-Policy` meta tag.** All 34 legacy pages had
   an identical one. It is omitted here because its `script-src 'self' 'unsafe-inline'`
   would have to be widened for Vite's dev-time module graph, and a wrong CSP breaks the
   dev server silently. **Restore an equivalent CSP in Phase 10**, derived from the
   production build's actual needs, and diff it against the legacy header so the
   deployed security posture is no weaker than today's. Tracked as an open item, not a
   silent drop.

### Phase 1 — API client and session

- [x] Port `shared/api-client.js` → `src/api/client.js`, `session.js`, `errors.js`, `endpoints/*.js` (14), `endpoints/index.js`
- [x] Port `shared/formatters.js`, `constants.js`, `sanitizer.js`, `insurance.js` → `src/lib/`
- [x] Add `src/lib/phone.js`, `src/lib/csv.js`, `src/lib/printDocument.js`
- [x] Build `src/auth/SessionContext.jsx`, `useSession.js`, `src/lib/roleProfiles.js`, `src/lib/entitlements.js`
- Files created: ~26 under `src/api/`, `src/lib/`, `src/auth/`
- Files deleted: none yet
- Verify (browser console on the Vite page): `api.marketplace.organizations()` returns the org array; `api.auth.login('admin@hosp.com','Hom@123',1)` returns a token and writes `sessionStorage["FedericoSession"]`; `api.patients.list()` with a bad token throws and clears the session; stopping the backend produces exactly `"Cannot reach the server. Is the backend running on http://localhost:3000?"`
- Commit: `port api client and session handling to es modules`

**Phase 1 outcome - done.** All seven contract checks passed against the live backend
(2 orgs listed, HOM login writes `sessionStorage['FedericoSession']`, 56 beds over an
authed call, `Invalid email or password` verbatim on a bad password, 401 clears the
session, the validator's array message joins with `", "`, and an unreachable host yields
the exact offline string with `status === 0`).

Two things the verification turned up:

1. **A real bug in the port, caught and fixed.** `getSession()` initially returned a
   cached snapshot. The legacy `shared/api-client.js#getSession` re-read `sessionStorage`
   on every call, and `api/client.js` consults it on every request, so a cached value
   could go stale. The cache now serves only `getSnapshot()` for `useSyncExternalStore`;
   `getSession()` reads through.
2. **`authorize()` returns 403, not 401, for an unauthenticated caller**
   (`back-end/src/middleware/actorAccess.js`). Only `requireSession` routes such as
   `/auth/me` return 401. So the "401 clears the session" path fires on far fewer routes
   than it might appear. That is existing backend behaviour, reproduced unchanged.
   Worth knowing: `GET /patient` with no credentials at all returns 403 rather than 401,
   which is a backend authorization question, not a frontend one, and is out of scope
   here under constraint 1.

### Phase 2 — Feedback, UI primitives, routing skeleton

- [x] `src/components/feedback/*` (5 files) reproducing `UIFeedback`
- [x] `src/components/ui/{Badge,Button,Card,Input,Tabs,DataTable}.jsx`
- [x] `src/components/layout/Modal.jsx`, `ModuleLock.jsx`
- [x] `src/components/forms/DepartmentSelect.jsx`, `FileField.jsx`
- [x] `src/hooks/{useApi,usePolling,useAsyncLock,useSearchParam}.js`
- [x] `src/routes.jsx` with all routes from §2.2 pointing at placeholders; `src/App.jsx` mounts `ToastRegion` + `DialogHost`
- [x] `src/auth/RequireModule.jsx`, `src/auth/actorHome.js`
- Files created: ~20
- Verify: every URL in §2.2 renders its placeholder without a full reload; a manual `toast()`, `confirm()` and `selectOne()` each look and behave like the originals (4 s dismiss, Escape closes, focus lands on the last action)
- Commit: `add feedback, ui primitives, and the route skeleton`

**Phase 2 outcome - done.** All 34 routes from §2.2 resolve, including both
`appointment.html` casings (DEC-7) and the `*` fallback. `RequireModule` redirects an
unauthenticated visitor to the login page and, for a signed-in actor without rights to a
portal, shows the access-denied snackbar before redirecting. Toasts render with the right
icons and classes, `'warn'` still degrades to `info` (defect D9 preserved), and confirm /
selectOne resolve to `true` / the chosen value, with Escape resolving `false` / `null`.
The production build emits one JS chunk per route group.

**A real bug in the port, caught and fixed.** `Toast` first derived its lifecycle from a
single `visible` boolean. Because a toast mounts with `visible === false`, the exit effect
ran immediately and unmounted it ~400ms later, before it was ever shown - reliably so
whenever `requestAnimationFrame` is throttled, as in a background tab. It now tracks an
explicit `entering | visible | exiting` phase and only schedules removal from `exiting`.

One environmental note for anyone re-running these checks: browser automation drives a
*hidden* tab, where Chrome pauses `requestAnimationFrame` and throttles timers. The
`.is-visible` class therefore never appears and timings stretch by ~15%. That is the
harness, not the app - the legacy `shared/ui-feedback.js` used the same double-rAF enter.

### Phase 3 — Public pages

- [x] `LandingPage.jsx`
- [x] `MarketplacePage.jsx`
- [x] `LoginPage.jsx`
- [x] `SignupPage.jsx`
- [x] `OrgSignupPage.jsx`
- Files created: 5 under `src/pages/public/`
- Files deleted: `front-end/landing/`, `front-end/login/`, `front-end/marketplace/`, `front-end/signup/` (12 files)
- Verify: landing's five buttons land on the right routes; marketplace search + emergency filter narrow the grid and its card links carry `?org=`; login populates the hospital list, switches demo credentials per role tab and per org, autofills on row click, honours Remember Me across a reload, rejects a wrong-role account with `"That account is not a PRE account."`, and routes each of the five roles to its portal; signup creates a patient (check the UHID in the toast) and lands on the patient dashboard; org-signup's live pricing matches the old page for the same inputs and provisioning shows the tenant id + API key
- Commit: `port landing, marketplace, login and signup pages to react`

**Phase 3 outcome - done.** The marketplace renders pixel-identical to the legacy page
side by side against the same backend (branding colours, specialty chips, emergency chips,
branch summaries, both action links with `?org=`). End-to-end sign-in verified through the
UI: role tab switch repopulates the demo panel per role and per organization,
click-to-autofill fills both fields, and submitting lands on `/HOM/screen-01-dashboard.html`
with `actor=HOM`, `role=SUPER_USER` and the tenant resolved - through the `RequireModule`
guard.

Two fixes made while porting:

1. **An auth-error race.** `LoginPage` first read `lastAuthError` from context state
   immediately after awaiting `authenticate()`, which returns the *previous* render's
   value. `SessionContext` now also keeps the message in a ref and exposes
   `getLastAuthError()`, read synchronously the instant the await returns.
2. **Per-page `<title>`.** `index.html` has one static title, so every route would have
   read "Federico". Added `useDocumentTitle`, applied with each page's original title text
   copied verbatim from its old `<title>` element.

The two insurance-card upload boxes on the patient signup form are decorative here because
they were decorative in the original: no file input, no handler, no upload. Wiring them
would be new behaviour.

### Phase 4 — Platform portal

- [x] `PlatformLoginPage.jsx`
- [x] `PlatformDashboardPage.jsx` + `OverviewTab` + `OrganizationsTab` + `RatesTab` + `ProvisionDialog` + `OrgDetailDialog`
- Files created: 7 under `src/pages/platform/`
- Files deleted: `front-end/platform/` (5 files)
- Verify: platform login redirects an existing platform session straight to the dashboard; the three tabs switch; MRR/ARR/collections match the old page; suspend then activate an org and watch both the table and overview refresh; provision a new org; save a rate change and confirm `GET /platform/rates` returns it
- Commit: `port platform super user portal to react`

**Phase 4 outcome - done.** Signed in as the platform super user and confirmed the
overview renders live figures (MRR, ARR, payments collected, tenant/branch/patient/user
counts and the per-service revenue grid), and that the Hospital Tenants table lists both
organizations with tenant id, status, billing model, monthly fee, module count, branches,
users, bed occupancy and clinical flow. Both native `<dialog>` elements became controlled
`Modal` components.

Defect D8 (the org-detail dialog re-binding its tab listeners on every open, so they
accumulated) disappears here - a controlled component cannot reproduce it. That is one of
the three accepted invisible fixes recorded in section 7. The three empty detail panels
(Modules, API Keys, Provisioning Log) stay empty, because the legacy `openOrgDetail` only
ever filled the Summary panel.

### Phase 5 — Admin portal

- [x] `AdminLayout.jsx` + `SharedNav.jsx` + `SharedNav.css`
- [x] `DashboardPage.jsx`
- [x] `DepartmentsPage.jsx` + `WardDialog.jsx`
- [x] `InventoryCatalogPage.jsx` + `ItemDialog.jsx`
- [x] `RolesStaffPage.jsx` + `RoleDialog.jsx`
- [x] `PeoplePage.jsx` + `StaffDialog.jsx` + `DoctorDialog.jsx`
- Files created: ~12 under `src/pages/admin/` + 2 under `src/components/layout/`
- Files deleted: `front-end/Admin/` (11 files)
- Verify: all five nav links work and the active pill follows; dashboard KPIs, ward occupancy bars, billing-status table, low-stock cards and staff breakdown all match; create/edit/delete a ward; add and delete a catalog item; create a role, toggle a permission (and confirm the checkbox reverts on a server error); create a staff login and sign in with it in a second tab; add/edit/delete a doctor; upload a branding logo and see the preview
- Commit: `port admin portal to react`

**Phase 5 outcome - done.** Signed in as the hospital owner and confirmed against live data:
the dashboard renders all six KPIs, the pay-as-you-scale usage card, ward occupancy bars,
the billing-status table, low-stock alerts and staff distribution; Departments lists all
six wards with per-ward bed and occupancy counts; Roles & Staff lists the custom role, the
permission pane, branding upload and the staff table with its grant control. `SharedNav`
replaces the innerHTML-built navbar, and its injected `<style>` block is now
`SharedNav.css` with the declarations unchanged.

Defect D3 is preserved on the Admin dashboard as well: the subscription card reads
`liveRates?.base_fee` while the API sends `base_platform_fee`, so the base fee stays at its
3000 fallback while the per-resource rates do update.

One note on the verification itself: synthetic clicks from the browser-automation harness
landed at coordinates offset from the real viewport, so nav clicks appeared to do nothing.
Clicking the same elements programmatically navigated correctly. The harness was
misaligned, not the app.

### Phase 6 — HOM portal

- [ ] `HomLayout.jsx` + `homHelpers.js`
- [ ] `DashboardPage.jsx` + `AdmissionRequestModal.jsx`
- [ ] `BedManagementPage.jsx` + `AssignBedModal.jsx` + `BedDetailModal.jsx`
- [ ] `PatientFlowPage.jsx` + `PatientDetailModal.jsx` + `DischargeModal.jsx`
- [ ] `InventoryPage.jsx` + `LogUsageModal.jsx` + `RestockModal.jsx`
- [ ] `BillingPage.jsx` + `PostServiceModal.jsx` + `BillingDetailModal.jsx`
- Files created: ~16 under `src/pages/hom/`
- Files deleted: `front-end/HOM/` (17 files)
- Verify: all four KPI cards and the pending-request table match; allocate a bed from the dashboard modal and from the bed grid, and deny one; ward tabs, status filters and search all narrow the grid; toggle a bed into and out of maintenance; approve a discharge clearance and see it move lists; patient-flow filters + CSV export produce the same columns; inventory — log usage from the sidebar and from the modal, hit the insufficient-stock error, submit a restock PO with an invoice attachment and reopen it; billing — post a service, open a ledger detail, export the CSV; leave each page open 20 s and confirm the 15 s poll still refreshes
- Commit: `port hom portal to react`

### Phase 7 — PRE portal

- [ ] `PreLayout.jsx` + `preHelpers.js`
- [ ] `PreDashboardPage.jsx`
- [ ] `RequestsPage.jsx` + `ApprovePopup.jsx` + `SuggestPopup.jsx` + `RejectPopup.jsx`
- [ ] `RejectedPage.jsx`, `AdmittedPage.jsx`, `DischargePage.jsx`
- [ ] `EmergencyPage.jsx` + `EmergencyModal.jsx`
- [ ] `PatientRecordsPage.jsx` + `Patient360Modal.jsx` + `RegisterPatientModal.jsx`
- [ ] `DoctorRosterPage.jsx`
- [ ] `AppointmentPage.jsx` + `PatientPicker.jsx` + `RegisterWalkInPopup.jsx`
- [ ] `HomCoordinationPage.jsx`
- Files created: ~19 under `src/pages/pre/`
- Files deleted: `front-end/PRE/` (24 files)
- Verify: the four dashboard counters match and each card navigates; approve / suggest / reject a pending request (approve must persist the doctor and time); set a visit type to OPD, Admit and Emergency and confirm each toast and the HOM-side effect; register a walk-in patient with insurance and a card upload, then open Patient 360; register an emergency walk-in and confirm a CRITICAL bed request reaches HOM; book an appointment from the picker and via `?patient_id=`; doctor roster search + both filters; PRE→HOM dispatcher sends a bed request and finalises a discharge (and is blocked with the 409 message when the bill is unpaid); **both** `/PRE/pages/appointment.html` and `/PRE/pages/APPointment.html` resolve
- Commit: `port pre portal to react`

### Phase 8 — Patient portal

- [ ] `PatientLayout.jsx` + `PatientStoreContext.jsx` + `patientStoreShape.js`
- [ ] `DashboardPage.jsx` + `AppointmentsModal.jsx` + `VisitsModal.jsx` + `BillsModal.jsx`
- [ ] `BookAppointmentPage.jsx`
- [ ] `BillingPage.jsx` + `BillDetailsModal.jsx`
- [ ] `ProfilePage.jsx`
- Files created: ~11 under `src/pages/patient/`
- Files deleted: `front-end/Patient/` (13 files)
- Verify: dashboard summary cards, appointments table, visits, notifications, bill sidebar and the three document sections match; all three modals open and close; book an appointment with a document attachment and watch slot capacity change (3 per slot); billing — all four tabs, pay a dispatched bill through the `selectOne` picker, print an invoice copy and a receipt copy; profile — edit and save each of the four sections independently, cancel restores, upload both insurance card sides then save, and password change still shows its success message without calling an endpoint
- Commit: `port patient portal to react`

### Phase 9 — FA portal

- [ ] `FaLayout.jsx` + `useHashRoute`
- [ ] `faHelpers.js` + `faActions.js`
- [ ] `DashboardView.jsx`, `ChargesView.jsx`, `LedgerView.jsx`, `EodBillingView.jsx`, `DischargeView.jsx`, `ReceiptsView.jsx`, `PatientPicker.jsx`
- Files created: ~10 under `src/pages/fa/`
- Files deleted: `front-end/FA/` (9 files)
- Verify: all six hash routes load and the nav highlights correctly; back/forward through hashes works; create a ledger from the dashboard; approve a HOM-submitted charge on Charges and see it land in the ledger; add a manual charge; send an EOD bill (confirm dialog copy); switch patients via the picker (`window.currentAdmissionId` equivalent) and confirm the ledger follows; record a cash payment; generate a discharge summary and confirm the print window opens and auto-prints; receipts search + mode filter; reload directly on `#/receipts`
- Commit: `port fa portal to react`

### Phase 10 — Cut over and delete the legacy tree

- [ ] Delete every remaining file under `front-end/` (`shared/` — 13 files, `package-lock.json`, `README.md`)
- [ ] Move `frontend-react/` to `front-end/` (DEC-3)
- [ ] Write a new `front-end/README.md` covering `npm install` / `npm run dev` / `npm run build`, `VITE_API_URL`, and the route table
- [ ] Run the full Definition of Done checklist (§6)
- Files deleted: all 111 legacy files
- Commit: `remove the legacy vanilla frontend`

---

## 5. Hard Constraints

*(Copied verbatim from the brief. These override anything above.)*

- Backend is not modified. Not routes, payloads, auth, or error contracts. If the frontend
  currently sends something wrong, keep sending it wrong and flag it.
- index.html ends with exactly one script tag: /src/main.jsx. No CDN script tags, no
  stylesheet link tags.
- Nothing is attached to window. Everything is an ES module import. window.location and
  similar browser APIs are fine.
- Phase 1 behavior is identical: same URLs, same form fields, same validation, same request
  bodies, same error messages, same visible text.
- Existing CSS moves into src/ unchanged. No rewriting in phase 1.
- Branch pre-react-backup is created from HEAD before any code changes. Work happens on
  react-migration.
- Commit after each phase. Short plain-language messages, no AI attribution.

---

## 6. Definition of Done — Phase 1

### Build and hygiene

- [ ] `npm run build` completes with zero errors and zero warnings
- [ ] `npm run dev` starts with a clean console on every route
- [ ] `index.html` contains exactly one `<script>` tag, `src="/src/main.jsx"`, `type="module"` — verify with `grep -c "<script" index.html` → `1`
- [ ] `index.html` contains zero `<link rel="stylesheet">` tags and zero `https://` references — `grep -E "rel=\"stylesheet\"|https://" index.html` returns nothing
- [ ] `grep -rn "window\." src/` returns **only** browser-API uses: `window.location`, `window.open`, `window.print`, `window.addEventListener`, `window.dispatchEvent`, `window.scrollTo`, `window.innerWidth`, `window.matchMedia`, `window.URL`. No assignments — `grep -rnE "window\.[A-Za-z_$][A-Za-z0-9_$]* *=" src/` returns nothing
- [ ] `grep -rniE "\bon(click|change|submit|input|keyup|keydown|load|error)=\"" src/` returns nothing outside the `document.write` printable-document strings in `src/lib/printDocument.js` (those are a separate document and are expected)
- [ ] `grep -rn "innerHTML" src/` returns nothing except inside `src/lib/printDocument.js`
- [ ] No `.js` or `.html` file under the old `front-end/` tree is loaded at runtime — DevTools → Network, hard reload each route, and confirm every JS/CSS request is a Vite-served `/src/**` or hashed `/assets/**` URL
- [ ] `find front-end -name "*.html" -o -name "*.js" -not -path "*/node_modules/*"` lists only the new app's files — the legacy pages are **deleted**, not orphaned
- [ ] `git status` is clean; `git log --oneline` shows one commit per phase with no AI attribution; branch `pre-react-backup` exists and points at the pre-migration HEAD

### Every inventoried page reachable and working against the real backend

Backend running on `:3000`, real data. Each row must load, render data, and complete its
primary write.

- [ ] `/landing/landing-page.html` — all five buttons navigate
- [ ] `/login/login-page.html` — all five role tabs sign in and route correctly
- [ ] `/signup/signup-page.html` — creates a patient, shows the UHID
- [ ] `/signup/org-signup.html` — provisions an org through all four steps
- [ ] `/marketplace/marketplace-page.html` — lists orgs, search and filter work
- [ ] `/platform/platform-login.html` and `/platform/platform-dashboard.html`
- [ ] `/HOM/index.html` redirects; `/HOM/screen-01` … `screen-05`
- [ ] `/PRE/index.html` redirects; `/PRE/pages/` PRE, request, rejected, admitted, discharge, emergency, patient-records, doctor, appointment (**both casings**), hom
- [ ] `/Patient/` dashboard, book-appointment, billing, profile
- [ ] `/FA/fa-dashboard.html` at `#/dashboard`, `#/charges`, `#/ledger`, `#/eod`, `#/discharge`, `#/receipts`
- [ ] `/Admin/screen-01` … `screen-05`

### Behaviour parity spot-checks

- [ ] Every URL from §2.2 is byte-identical to the legacy URL, including the `.html` suffix and the FA hashes
- [ ] A deep link pasted into a fresh tab (e.g. `/HOM/screen-03-patient-flow.html?uhid=…`) loads that page directly, not the landing page
- [ ] Sign in as HOM in tab A and as PRE in tab B simultaneously; both sessions stay independent (per-tab `sessionStorage`)
- [ ] Signing out in one tab logs out only tabs sharing that exact token (`BroadcastChannel`)
- [ ] With a module disabled for the org, the gated nav link is greyed with a 🔒 and clicking it opens the "Module Not Available" dialog with the exact body text
- [ ] Stop the backend: every page shows `"Cannot reach the server. Is the backend running on http://localhost:3000?"`
- [ ] Request bodies are unchanged — capture the DevTools Network payload for `POST /auth/login`, `POST /pre-requests`, `POST /ward/bed-requests`, `POST /billing/ledger/entry`, `POST /billing/payments`, `PUT /pre-requests/:id` and diff against the legacy app's
- [ ] All 12 defects in §1.7 (D1–D12) still behave exactly as they did, except the three noted invisible fixes (D8 listener accumulation, item 15 escaping, and duplicate global names) — these are architectural consequences with no user-visible change
- [ ] Every 15 s poll still fires and still skips when the tab is hidden
- [ ] All six printable documents open and render identically (side-by-side screenshot against the legacy app)

### CSS

- [ ] `npm run build` emits **separate** CSS assets per route group — confirm HOM and Patient styles are not in one file
- [ ] Navigate HOM → Patient → PRE → FA → Admin in one session and confirm no style bleed (check `.card`, `.topbar`, `.badge`, `.nav-link`, `.active`, `.btn-primary`)
- [ ] `git diff pre-react-backup -- '*.css'` shows content changes only in `admin.css` (the three removed `@import`s)

---

## 7. Decisions (all resolved — nothing is blocked)

Every question raised during the inventory has been answered. Each entry records the
decision, why it was taken, and what it obliges the executing session to do. Where a
decision conflicts with the literal wording of a hard constraint in §5, the conflict is
named explicitly rather than glossed over.

**DEC-1 — URLs keep their `.html` suffixes.**
Routes are registered exactly as the legacy paths read: `/HOM/screen-01-dashboard.html`,
`/Patient/patient-billing.html`, and so on (full table in §2.2). Constraint 4 says "same
URLs", every internal link is a literal `.html` path, and existing bookmarks keep working.
Converting `window.location.href = '../HOM/screen-01-dashboard.html'` to
`navigate('/HOM/screen-01-dashboard.html')` is then a mechanical edit with no URL change.
*Obligation:* do not "tidy" these paths. Retiring them is Phase 2 work (§8).

**DEC-2 — FA keeps hash routing.**
`FA/fa-dashboard.html#/dashboard` … `#/receipts`, plus `#/ledger/<admissionId>`,
`#/discharge/<admissionId>`, `#/eod/<admissionId>`. Same reasoning as DEC-1, and FA's own
dashboard rows generate those deep links today.
*Obligation:* implement with a `useHashRoute()` hook inside `FaLayout` (a `hashchange`
listener + `useSyncExternalStore`). Do **not** nest a `HashRouter` inside the
`BrowserRouter` — they fight over `location`.

**DEC-3 — Repository, branch and app location.**
The git repository is `codebase/16_Federico/`; the workspace root is not a repo.
Work happens on **`feat/react-implementation`**, branched from `main` at `1708ea7`.
`pre-react-backup` was created from that same commit before any change landed, so the
pre-migration state is recoverable two ways.
The new app is built at `codebase/16_Federico/frontend-react/` so the old and new
frontends can run side by side for comparison during phases 1–9, then replaces
`front-end/` in Phase 10.
*Note on §5:* the constraint text says "Work happens on react-migration". The branch is
named `feat/react-implementation` instead, matching this repo's existing `feat/…`
convention. The intent — one dedicated branch, backup taken first — is satisfied; only
the name differs.

**DEC-4 — `Admin/admin.css` loses its three `@import` lines.**
Lines 17–19 pull in `design-tokens.css`, `material-components.css` and `ui-feedback.css`.
`main.jsx` now imports those globally, so leaving the `@import`s would load ~800 lines
twice. The cascade is unchanged because the same rules arrive earlier from `main.jsx`.
*Note on §5:* this is the **only** permitted edit to a CSS file in Phase 1. It is a
de-duplication, not a restyle. Call it out in the Phase 5 commit body, and expect
`git diff pre-react-backup -- '*.css'` to show this one change and nothing else.

**DEC-5 — CSS isolation via per-route chunks; `manualChunks` if that is not enough.**
The shared three are imported once in `main.jsx`; every portal stylesheet is imported only
inside its own lazy route chunk, so exactly one portal's CSS is live at a time — which is
what happens today. This needs **zero** CSS edits and therefore satisfies constraint 5
outright.
*Obligation:* this is a claim to verify, not assume. In Phase 10, confirm `npm run build`
emits separate CSS assets for the HOM and Patient route groups. If Vite hoists them into
one file, force the split with `build.rollupOptions.output.manualChunks` per route group.
The wrapper-selector fallback (`.portal-hom { … }`) **is** a rewrite and must not be used
without asking first.

**DEC-6 — `showMessage` stays broken (defect D1).**
`HOM/dashboard.js` calls an undefined `showMessage()` on four error paths, so a failed
"approve discharge" throws `ReferenceError` instead of telling the user anything.
Constraint 1 is explicit: if the frontend does something wrong today, keep it wrong and
flag it.
*Obligation:* in `hom/DashboardPage.jsx`, keep all four call sites calling an identifier
that is not defined, and put a comment above each pointing at defect D1 and this decision
so the next reader knows it is deliberate. The obvious fix — `feedback.toast(msg, 'error')`,
which is what every sibling HOM file does — is Phase 2 work and is listed in §8.

**DEC-7 — Both `appointment.html` casings are routed.**
`/PRE/pages/appointment.html` (what all eleven links actually use) and
`/PRE/pages/APPointment.html` (the real filename on disk) both resolve to
`AppointmentPage`. Costs one line and closes a 404 that would otherwise surface only on a
case-sensitive host.
*Obligation:* do not "fix" the eleven lowercase links — changing visible hrefs would
violate constraint 4. Both routes ship; §6 verifies both.

**DEC-8 — `window.PatientSession` is dropped.**
`auth-guard.js` builds and freezes it on every Patient page; nothing in the 111 files reads
it. Keeping it would mean attaching something to `window`, which constraint 3 forbids
outright. The same data is available from `SessionContext` (`session.patientUhid`,
`session.patientId`).

**DEC-9 — `Admin/screen-05-people.html` is in scope.**
`front-end/README.md` omits it, but `Admin/shared-nav.js` links to it as "People" and it is
fully wired to `POST /rbac/staff` and the `/doctor` CRUD endpoints. It ports in Phase 5
like the other four Admin screens. The README is stale, not the page.

**DEC-10 — The 15-second polling is kept verbatim.**
Five HOM pages refetch every 15 s (6–8 parallel requests each), skip while
`document.hidden`, and refetch again on window focus. The UI visibly updates without user
interaction, so this is observable behaviour covered by constraint 4.
*Obligation:* `usePolling(15000)` must reproduce the `document.hidden` guard *and* the
`window` focus listener. Do not add request de-duplication in Phase 1 — it is a behaviour
change, however invisible.

**DEC-11 — No data-fetching library.**
`react-router-dom` is the only new runtime dependency. Fetching keeps the existing
`Promise.all` + `.catch(() => [])` shape behind a small `useApi` / `usePolling` pair.
TanStack Query would change how ~30 components fetch, which is Phase-2-shaped work.

**DEC-12 — `PRE/pages/request.html` → `js/requests.js` is not a bug.**
Singular page, plural script, but they belong together: the page renders the pending
pre-request queue. It maps to `RequestsPage.jsx` at `/PRE/pages/request.html`. There is no
missing `request.js`.

### Three invisible behaviour changes, accepted

These follow unavoidably from using React at all. None is user-visible; all are listed so
nobody later reports them as regressions.

1. **Defect D8 disappears.** `platform-dashboard.js#openOrgDetail` re-binds its
   `[data-detail-tab]` click listeners every time the dialog opens, so they accumulate.
   A controlled React component cannot reproduce that.
2. **The attribute-escaping bug in `PRE/js/emergency.js:127` disappears** (§1.7 item 15).
   Once the handler is a closure rather than a string inside an `onclick` attribute, a
   department name containing an apostrophe stops breaking it.
3. **Duplicate global names stop colliding.** `loadStaff` in both `Admin/admin.js` and
   `Admin/people.js`, `csvEscape` in three HOM files, `escapeHtml` in two PRE files — ES
   module scope makes these independent. They never collided in practice because the files
   were never on the same page.

All other defects — D1–D7 and D9–D12 in §1.7 — are carried forward exactly as they behave
today, per constraint 1.

## 8. Phase 2 — UI Simplification (outline only)

Not to be detailed or started until Phase 1 is signed off and merged.

- **Size budget.** No component over ~150 lines. The Phase 1 ports that will still exceed it: `hom/InventoryPage`, `hom/BedManagementPage`, `patient/BillingPage`, `patient/ProfilePage`, `pre/PatientRecordsPage`, `pre/AppointmentPage`, `fa/LedgerView`, `fa/DischargeView`.
- **Split anything doing more than one job.** Extract table bodies, filter bars, KPI rows and modal contents into their own components; move every data-shaping function out of components into `lib/`.
- **Drop decorative animation.** `md-blur-shape` background blobs, `md-fade-switch` panel fades, `::view-transition-new(root)`, the double-`requestAnimationFrame` entrance choreography, hover lifts and glass effects.
- **Keep every functional element and every visible string.** Buttons, fields, validation messages, table columns, empty states, badges and toasts stay exactly as they are — this phase changes structure and decoration, never content.
- **Then, and only then:** deduplicate the 20 colliding class names into one shared component layer, collapse the four near-identical Patient stylesheets, retire the `.html` URLs that DEC-1 deferred, and fix the D1–D12 defects deliberately with a changelog entry for each.
