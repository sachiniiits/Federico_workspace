'use strict';

import { api } from '../../api/index.js';
import { useApi } from '../../hooks/useApi.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { Link } from 'react-router-dom';
import { toast } from '../../components/feedback/feedback.js';
import { joinPreRequestsWithPatients, formatDate, to12Hour } from './preHelpers.js';

/**
 * Ported from PRE/pages/PRE.html + PRE.js.
 *
 * The visit-type <select> per row calls POST /pre-requests/:id/check-in, which
 * is what actually creates the OPD ledger or dispatches the bed request.
 */
export default function PreDashboardPage() {
  useDocumentTitle('Dashboard');

  const { data, reload } = useApi(async () => {
    const [preRequests, patients, doctors, admissions] = await Promise.all([
      api.preRequests.list().catch(() => []),
      api.patients.list().catch(() => []),
      api.doctors.list().catch(() => []),
      api.admissions.list().catch(() => []),
    ]);

    const doctorsById = {};
    (doctors || []).forEach((d) => (doctorsById[d.doctor_id] = d));
    const joined = joinPreRequestsWithPatients(preRequests, patients, doctorsById);

    const admissionById = {};
    (admissions || []).forEach((a) => (admissionById[a.admission_id] = a));

    const rows = joined.map((r) => {
      const adm = r.admission_id
        ? admissionById[r.admission_id]
        : (admissions || []).find(
            (a) => a.patient_id === r.patient_id && (a.visit_type === 'OPD' || a.appointment_id === r.appointment_id),
          );
      return { ...r, isPaid: Boolean(adm && (adm.status === 'PAYMENT_CONFIRMED' || adm.bills_cleared === true)) };
    });

    return { rows, all: preRequests || [] };
  }, []);

  const rows = data?.rows || [];
  const all = data?.all || [];

  const counters = {
    pending: all.filter((r) => r.status === 'PENDING').length,
    rejected: all.filter((r) => r.status === 'REJECTED').length,
    admitted: all.filter((r) => r.status === 'ADMITTED').length,
    discharge: all.filter((r) => r.status === 'DISCHARGE_APPROVED' || r.status === 'DISCHARGE_REQUESTED').length,
  };

  // Approved queue: everything still awaiting PRE action.
  const approved = rows.filter((r) => {
    if (['REJECTED', 'DISCHARGED'].includes(r.status)) return false;
    if (r.status === 'ADMITTED') return false;
    if (r.status === 'CONSULTATION_DONE' && r.isPaid) return false;
    return ['APPROVED', 'CONSULTATION_DONE', 'EMERGENCY'].includes(r.status);
  });

  async function setVisitType(id, value) {
    if (!value) return;
    try {
      await api.preRequests.checkIn(id, { visit_type: value });
      if (value === 'OPD' || value === 'Consultation') {
        toast('Patient checked in for Outpatient Consultation. Ledger created in FA.', 'success');
      } else if (value === 'Admit') {
        toast('Marked for Inpatient Admission — Bed request dispatched to HOM.', 'success');
      } else if (value === 'Emergency') {
        toast('Marked for Emergency Triage — Bed request dispatched to HOM.', 'success');
      }
    } catch (err) {
      toast(err.message || 'Could not update visit type', 'error');
    }
    await reload();
  }

  const card = (to, title, value) => (
    <Link to={to} className="card">
      <h3>{title}</h3>
      <p>{value}</p>
    </Link>
  );

  return (
    <>
      <div className="cards">
        {card('/PRE/pages/request.html', 'Pending Requests', counters.pending + ' Requests')}
        {card('/PRE/pages/rejected.html', 'Rejected Requests', counters.rejected + ' Requests')}
        {card('/PRE/pages/admitted.html', 'Admitted Patients', counters.admitted + ' Patients')}
        {card('/PRE/pages/discharge.html', 'Discharge Approvals', counters.discharge + ' In Queue')}
      </div>

      <div className="table-container">
        <h2>Approved Patients</h2>
        <table>
          <thead>
            <tr>
              <th>Patient ID</th><th>Name</th><th>Age</th><th>Gender</th><th>Department</th>
              <th>Doctor</th><th>Appointment Date</th><th>Appointment Time</th><th>Visit Type</th><th>Set Visit</th>
            </tr>
          </thead>
          <tbody id="approvedTable">
            {approved.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: 24, color: 'var(--text-secondary)' }}>
                  No Scheduled Patients Awaiting Check-in
                </td>
              </tr>
            ) : (
              approved.map((r) => {
                const isAdmitRequested = r.visit_type === 'Admit' || r.visit_type === 'Inpatient';
                const isEmergency = r.status === 'EMERGENCY' || r.visit_type === 'Emergency';

                let statusBadge = <span className="badge badge-neutral">Scheduled</span>;
                if (r.status === 'CONSULTATION_DONE') {
                  statusBadge = r.isPaid ? (
                    <span className="badge badge-success">Completed &amp; Paid</span>
                  ) : (
                    <span className="badge badge-warning" style={{ background: '#fff3e0', color: '#e65100' }}>
                      OPD Checked-In (Awaiting Payment)
                    </span>
                  );
                } else if (isAdmitRequested) {
                  statusBadge = <span className="badge badge-info">IPD Bed Requested</span>;
                } else if (isEmergency) {
                  statusBadge = <span className="badge badge-warning">Emergency</span>;
                }

                const selectedValue =
                  r.status === 'CONSULTATION_DONE' ? 'OPD' : isAdmitRequested ? 'Admit' : isEmergency ? 'Emergency' : '';

                return (
                  <tr key={r.pre_request_id}>
                    <td><strong>{r.patientUhid}</strong></td>
                    <td>{r.patientName}</td>
                    <td>{r.patientAge}</td>
                    <td>{r.patientGender}</td>
                    <td>{r.department}</td>
                    <td>{r.doctorName}</td>
                    <td>{formatDate(r.requested_date)}</td>
                    <td>{to12Hour(r.requested_time) || '-'}</td>
                    <td>{statusBadge}</td>
                    <td>
                      <select
                        className="custom-select"
                        value={selectedValue}
                        onChange={(e) => setVisitType(r.pre_request_id, e.target.value)}
                        style={{ padding: '6px 10px', fontSize: 12, borderRadius: 6, border: '1px solid var(--color-border)', background: '#fff', minWidth: 170 }}
                      >
                        <option value="">-- Set / Change Visit --</option>
                        <option value="OPD">Consultation (OPD)</option>
                        <option value="Admit">Admit (Request Bed {'→'} HOM)</option>
                        <option value="Emergency">Emergency Triage</option>
                      </select>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

