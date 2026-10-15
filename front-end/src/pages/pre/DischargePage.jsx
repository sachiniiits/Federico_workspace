'use strict';

import { useState } from 'react';
import { api } from '../../api/index.js';
import { useApi } from '../../hooks/useApi.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { toast } from '../../components/feedback/feedback.js';
import { joinPreRequestsWithPatients, formatDate, to12Hour, filterBySearch } from './preHelpers.js';

/**
 * Discharge Approvals — tab-style single-section view.
 *
 * Two tabs sit in one header bar:
 *   • Pending Discharge Requests   (default, 'pending')
 *   • Approved Discharge Requests  ('approved')
 *
 * Only the active tab's table is rendered. State is managed locally;
 * no routing changes required. All data is fetched once and shared.
 */
export default function DischargePage() {
  useDocumentTitle('Discharge Requests');

  /** Active tab: 'pending' | 'approved' */
  const [activeTab, setActiveTab] = useState('pending');
  const [searchPending,  setSearchPending]  = useState('');
  const [searchApproved, setSearchApproved] = useState('');

  const { data, reload } = useApi(async () => {
    const [preRequests, patients, doctors, beds, admissions, ledgers] = await Promise.all([
      api.preRequests.list(),
      api.patients.list(),
      api.doctors.list(),
      api.wards.beds(),
      api.admissions.list().catch(() => []),
      api.billing.ledger.listAll().catch(() => []),
    ]);

    const doctorsById = {};
    doctors.forEach((d) => (doctorsById[d.doctor_id] = d));
    const bedsById = {};
    beds.forEach((b) => (bedsById[b.bed_id] = b));

    const ledgerByAdmission = {};
    (Array.isArray(ledgers) ? ledgers : []).forEach((l) => (ledgerByAdmission[l.admission_id] = l));
    const billsClearedByPatient = {};
    (Array.isArray(admissions) ? admissions : []).forEach((a) => {
      const ledger = ledgerByAdmission[a.admission_id];
      if (a.bills_cleared || (ledger && ledger.status === 'PAID')) billsClearedByPatient[a.patient_id] = true;
    });

    return joinPreRequestsWithPatients(preRequests, patients, doctorsById).map((r) => ({
      ...r,
      bedNumber:    bedsById[r.bed_id]?.bed_number || '-',
      billsCleared: Boolean(billsClearedByPatient[r.patient_id]),
    }));
  }, []);

  const joined   = data || [];
  const pending  = joined.filter((r) => r.status === 'DISCHARGE_REQUESTED');
  const approved = joined.filter((r) => r.status === 'DISCHARGE_APPROVED');

  /* Independent filtered lists — each search only touches its own section */
  const visiblePending  = filterBySearch(pending,  searchPending);
  const visibleApproved = filterBySearch(approved, searchApproved);

  async function finalApprove(id) {
    try {
      await api.preRequests.update(id, { status: 'DISCHARGED' });
      toast('Discharge finalized — bed released.', 'success');
      await reload();
    } catch (err) {
      toast(err.message || 'Could not finalize discharge', 'error');
    }
  }

  /** Shared patient data cells used in both tables */
  const baseCells = (r) => (
    <>
      <td>{r.patientUhid}</td>
      <td>{r.patientName}</td>
      <td>{r.patientAge}</td>
      <td>{r.patientGender}</td>
      <td>{r.department}</td>
      <td>{r.doctorName}</td>
      <td>{formatDate(r.requested_date)}</td>
      <td>{to12Hour(r.requested_time) || '-'}</td>
      <td>{r.bedNumber}</td>
      <td>{r.status === 'CONSULTATION_DONE' && r.visit_type === 'Follow-Up' ? 'Follow Up' : r.status}</td>
    </>
  );

  return (
    <div className="disch-tab-page">

      {/* ── Tab bar ── */}
      <div className="disch-tab-bar" role="tablist" aria-label="Discharge Approvals">
        <button
          role="tab"
          type="button"
          className={`disch-tab${activeTab === 'pending' ? ' disch-tab--active' : ''}`}
          aria-selected={activeTab === 'pending'}
          onClick={() => setActiveTab('pending')}
        >
          Pending Discharge Requests
          <span className={`disch-tab-badge${activeTab === 'pending' ? ' disch-tab-badge--active' : ''}`}>
            {pending.length}
          </span>
        </button>

        <span className="disch-tab-divider" aria-hidden="true">|</span>

        <button
          role="tab"
          type="button"
          className={`disch-tab${activeTab === 'approved' ? ' disch-tab--active' : ''}`}
          aria-selected={activeTab === 'approved'}
          onClick={() => setActiveTab('approved')}
        >
          Approved Discharge Requests
          <span className={`disch-tab-badge${activeTab === 'approved' ? ' disch-tab-badge--active disch-tab-badge--approved' : ''}`}>
            {approved.length}
          </span>
        </button>
      </div>

      {/* ── Tab panel: Pending Discharge Requests ── */}
      {activeTab === 'pending' && (
        <div className="disch-tab-panel" role="tabpanel" id="panel-pending">
          <div className="pre-section-header">
            <h2 className="pre-section-title">Pending Discharge Requests</h2>
            <input
              type="search"
              className="pre-search-input"
              placeholder="Search by name, UHID or phone…"
              value={searchPending}
              onChange={(e) => setSearchPending(e.target.value)}
              aria-label="Search pending discharge requests"
            />
          </div>
          <div className="table-container disch-table-inner">
            <table>
              <thead>
                <tr>
                  <th>Patient ID</th><th>Name</th><th>Age</th><th>Gender</th><th>Department</th>
                  <th>Doctor</th><th>Appointment Date</th><th>Appointment Time</th><th>Bed No</th>
                  <th>Patient Status</th><th>HOM Status</th>
                </tr>
              </thead>
              <tbody id="dischargeTable">
                {visiblePending.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="pre-empty-state">
                      {searchPending.trim() ? 'No requests match your search.' : 'No pending discharge requests.'}
                    </td>
                  </tr>
                ) : (
                  visiblePending.map((r) => (
                    <tr key={r.pre_request_id}>
                      {baseCells(r)}
                      <td className="discharge-hom-awaiting">{r.hom_status || 'Awaiting HOM'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab panel: Approved Discharge Requests ── */}
      {activeTab === 'approved' && (
        <div className="disch-tab-panel" role="tabpanel" id="panel-approved">
          <div className="pre-section-header">
            <h2 className="pre-section-title">Approved Discharge Requests</h2>
            <input
              type="search"
              className="pre-search-input"
              placeholder="Search by name, UHID or phone…"
              value={searchApproved}
              onChange={(e) => setSearchApproved(e.target.value)}
              aria-label="Search approved discharge requests"
            />
          </div>
          <div className="table-container disch-table-inner">
            <table>
              <thead>
                <tr>
                  <th>Patient ID</th><th>Name</th><th>Age</th><th>Gender</th><th>Department</th>
                  <th>Doctor</th><th>Appointment Date</th><th>Appointment Time</th><th>Bed No</th>
                  <th>Patient Status</th><th>Clearance</th><th>Action</th>
                </tr>
              </thead>
              <tbody id="approvedDischargeTable">
                {visibleApproved.length === 0 ? (
                  <tr>
                    <td colSpan="12" className="pre-empty-state">
                      {searchApproved.trim() ? 'No requests match your search.' : 'No approved discharge requests.'}
                    </td>
                  </tr>
                ) : (
                  visibleApproved.map((r) => (
                    <tr key={r.pre_request_id}>
                      {baseCells(r)}
                      <td className={r.billsCleared ? 'discharge-bills-cleared' : 'discharge-bills-pending'}>
                        {r.billsCleared ? 'Bills cleared by Finance' : 'Awaiting Finance payment'}
                      </td>
                      <td>
                        <button
                          className="btn approve"
                          onClick={r.billsCleared ? () => finalApprove(r.pre_request_id) : undefined}
                          disabled={!r.billsCleared}
                          title={r.billsCleared ? undefined : 'Patient bill not cleared yet'}
                          aria-disabled={!r.billsCleared}
                        >
                          Discharge &amp; release bed
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
