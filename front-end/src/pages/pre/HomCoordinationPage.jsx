'use strict';

import { useState } from 'react';
import { api } from '../../api/index.js';
import { useApi } from '../../hooks/useApi.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { toast } from '../../components/feedback/feedback.js';
import { joinPreRequestsWithPatients } from './preHelpers.js';

/** Ported from PRE/pages/hom.html + hom.js. */
export default function HomCoordinationPage() {
  useDocumentTitle('HOM Coordination – Federico PRE');

  const [query, setQuery] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [wardId, setWardId] = useState('');
  const [priority, setPriority] = useState('NORMAL');

  const { data, reload } = useApi(async () => {
    const [preRequests, patients, bedRequests, admissions, wards, beds, doctors] = await Promise.all([
      api.preRequests.list().catch(() => []),
      api.patients.list().catch(() => []),
      api.wards.bedRequests.list().catch(() => []),
      api.admissions.list().catch(() => []),
      api.wards.list().catch(() => []),
      api.wards.beds().catch(() => []),
      api.doctors.list().catch(() => []),
    ]);

    const preRequestsByPatient = {};
    (preRequests || []).forEach((r) => (preRequestsByPatient[r.patient_id] = r));
    const admissionsByPatient = {};
    (admissions || []).forEach((a) => {
      if (a.status !== 'DISCHARGED') admissionsByPatient[a.patient_id] = a;
    });

    const activeBedReqPatientIds = new Set(
      (bedRequests || []).filter((r) => r.status === 'PENDING' || r.status === 'ALLOCATED').map((r) => r.patient_id),
    );
    const activePatientsWithBeds = new Set(
      (admissions || []).filter((a) => a.bed_id && a.status !== 'DISCHARGED').map((a) => a.patient_id),
    );

    const candidates = (patients || [])
      .filter((p) => !activePatientsWithBeds.has(p.patient_id))
      .map((p) => {
        const preReq = preRequestsByPatient[p.patient_id];
        const adm = admissionsByPatient[p.patient_id];
        const hasPendingReq = activeBedReqPatientIds.has(p.patient_id);
        const isOpd = adm?.visit_type === 'OPD' || preReq?.visit_type === 'OPD' || preReq?.status === 'CONSULTATION_DONE';
        const isEmergency = preReq?.visit_type === 'Emergency' || preReq?.status === 'EMERGENCY';

        let visitType = 'Inpatient Admission';
        if (hasPendingReq) visitType = 'Bed Request Pending in HOM';
        else if (isOpd) visitType = 'OPD (Escalate to Admit)';
        else if (isEmergency) visitType = 'Emergency Triage';
        else if (preReq?.visit_type) visitType = preReq.visit_type;

        return {
          preRequestId: preReq ? preReq.pre_request_id : null,
          patientId: p.patient_id,
          uhid: p.uhid || 'UHID-' + p.patient_id,
          name: p.name || 'Unknown Patient',
          department: adm?.department || preReq?.department || 'General Medicine',
          visitType,
          priority: isEmergency ? 'CRITICAL' : 'NORMAL',
        };
      });

    const patientsById = {};
    (patients || []).forEach((p) => (patientsById[p.patient_id] = p));
    const wardsById = {};
    (wards || []).forEach((w) => (wardsById[w.ward_id] = w));
    const bedsById = {};
    (beds || []).forEach((b) => (bedsById[b.bed_id] = b));
    const doctorsById = {};
    (doctors || []).forEach((d) => (doctorsById[d.doctor_id] = d));

    const dischargeList = joinPreRequestsWithPatients(preRequests, patients, doctorsById).filter(
      (r) => r.status === 'DISCHARGE_REQUESTED' || r.status === 'DISCHARGE_APPROVED',
    );

    return { candidates, bedRequests: bedRequests || [], patientsById, wardsById, bedsById, wards: wards || [], dischargeList };
  }, []);

  const d = data || { candidates: [], bedRequests: [], patientsById: {}, wardsById: {}, bedsById: {}, wards: [], dischargeList: [] };

  const q = query.trim().toLowerCase();
  const matches = d.candidates.filter((c) =>
    !q ? true : (c.uhid + ' ' + c.name + ' ' + c.department + ' ' + c.visitType).toLowerCase().includes(q),
  );

  /** Auto-picks a ward whose name matches the patient's department keywords. */
  function autoMatchWard(department) {
    const deptLower = String(department || '').toLowerCase();
    const matched = d.wards.find((w) => {
      const wName = String(w.ward_name).toLowerCase();
      if (deptLower.includes('pediatr') && wName.includes('pediatr')) return true;
      if ((deptLower.includes('cardio') || deptLower.includes('heart')) && (wName.includes('cardiac') || wName.includes('icu'))) return true;
      if ((deptLower.includes('matern') || deptLower.includes('gynec') || deptLower.includes('obstet')) && wName.includes('matern')) return true;
      if (deptLower.includes('icu') && wName.includes('icu')) return true;
      return false;
    });
    return matched ? String(matched.ward_id) : '';
  }

  function pick(candidate) {
    setSelected(candidate);
    setQuery(candidate.name + ' (' + candidate.uhid + ')');
    setPriority(candidate.priority);
    setWardId(autoMatchWard(candidate.department));
    setPickerOpen(false);
  }

  function clearForm() {
    setSelected(null);
    setQuery('');
    setWardId('');
    setPriority('NORMAL');
    setPickerOpen(false);
  }

  async function sendRequest() {
    if (!selected) {
      toast('Please select a verified patient from the queue first', 'error');
      return;
    }
    try {
      await api.wards.bedRequests.create({
        patient_id: selected.patientId,
        pre_request_id: selected.preRequestId,
        ward_id: wardId ? Number(wardId) : undefined,
        priority,
      });
      toast('Bed request dispatched to HOM for ' + selected.name, 'success');
    } catch (err) {
      toast(err.message || 'Could not dispatch bed request', 'error');
      return;
    }
    clearForm();
    await reload();
  }

  async function finalizeDischarge(preRequestId) {
    try {
      await api.preRequests.update(preRequestId, { status: 'DISCHARGED' });
      toast('Patient discharge finalized and released successfully', 'success');
    } catch (err) {
      toast(err.message || 'Could not finalize discharge', 'error');
      return;
    }
    await reload();
  }

  const pill = (bg, border, color, weight, text) => (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 12, border: '1px solid ' + border, background: bg, fontSize: 11, fontWeight: weight, color }}>
      {text}
    </span>
  );

  return (
    <div className="container" style={{ margin: '24px 20px' }}>
      <div className="directory-header">
        <div className="directory-title-group">
          <h2>Hospital Operations Management (HOM) Coordination</h2>
          <p>Dispatch bed allocation requests, monitor inpatient ward capacity, and process finalized patient discharges.</p>
        </div>
      </div>

      <div className="appointment-card-section" style={{ marginBottom: 24 }}>
        <h3 className="appointment-section-title">1. Dispatch Bed Allocation Request</h3>

        <div className="appointment-grid">
          <div>
            <div className="appointment-form-group">
              <label className="emergency-form-label" htmlFor="name">Select Admitted / Emergency Patient *</label>
              <div className={'appointment-patient-picker' + (pickerOpen ? ' is-open' : '')} id="patientPicker" style={{ position: 'relative' }}>
                <input type="text" id="name" className="emergency-form-control" placeholder="Click to choose or search patient..." autoComplete="off" style={{ cursor: 'pointer' }}
                  value={query}
                  onFocus={() => setPickerOpen(true)}
                  onClick={() => setPickerOpen(true)}
                  onChange={(e) => { setQuery(e.target.value); setSelected(null); setPickerOpen(true); }}
                  onKeyDown={(e) => { if (e.key === 'Escape') setPickerOpen(false); }}
                  onBlur={() => setTimeout(() => setPickerOpen(false), 150)}
                />
                <div className="appointment-picker-dropdown" id="patientListDropdown" hidden={!pickerOpen}
                  style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000, maxHeight: 260, overflowY: 'auto', background: '#fff', border: '1px solid var(--border, #e2e8f0)', borderRadius: 8, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: 6, marginTop: 4 }}>
                  {matches.length === 0 ? (
                    <div className="appointment-picker-empty" style={{ padding: 16, textAlign: 'center', color: 'var(--text-secondary, #64748b)' }}>
                      <strong style={{ display: 'block', fontSize: 13, color: 'var(--text-primary, #1e293b)' }}>No matching patients</strong>
                      <span style={{ fontSize: 11 }}>All registered patients currently have beds assigned or pending requests.</span>
                    </div>
                  ) : (
                    matches.map((c) => (
                      <div key={c.patientId} className="appointment-picker-option" data-patient-id={c.patientId}
                        style={{ padding: '10px 14px', borderRadius: 6, cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                        onMouseDown={(e) => { e.preventDefault(); pick(c); }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: 13, color: '#1e293b' }}>{c.name}</strong>
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary, #0D9488)' }}>{c.uhid}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, fontSize: 11, color: '#64748b' }}>
                          <span>Dept: {c.department}</span>
                          <span style={{ fontWeight: 600, color: c.priority === 'CRITICAL' ? '#dc2626' : '#0284c7' }}>{c.visitType}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="appointment-picker-helper" style={{ marginTop: 6 }}>
                Select from verified patients marked for Admission, OPD escalation, or Emergency Triage awaiting a bed.
              </div>
            </div>

            <div id="homSelectedPatientBox" className="quick-patient-box" style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <strong id="homCardPatientName" style={{ fontSize: 14 }}>{selected ? selected.name : 'No Patient Selected'}</strong>
                <span id="homCardPatientUhid" className="status pending" style={{ background: '#f1f5f9', color: '#475569', fontSize: 11, padding: '2px 8px', borderRadius: 12 }}>
                  {selected ? selected.uhid : '—'}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-muted-fg)' }}>
                Department: <strong id="homCardDept" style={{ color: 'var(--color-fg)' }}>{selected ? selected.department : '—'}</strong> {'•'}{' '}
                Visit: <strong id="homCardVisit" style={{ color: 'var(--color-fg)' }}>{selected ? selected.visitType : '—'}</strong>
              </div>
            </div>
          </div>

          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="appointment-form-group">
                <label className="emergency-form-label" htmlFor="wardType">Preferred Ward Category</label>
                <select id="wardType" className="emergency-form-control" value={wardId} onChange={(e) => setWardId(e.target.value)}>
                  <option value="">HOM Decides Best Ward</option>
                  {d.wards.map((w) => (
                    <option key={w.ward_id} value={w.ward_id}>{w.ward_name} ({w.total_beds || 0} Beds)</option>
                  ))}
                </select>
              </div>

              <div className="appointment-form-group">
                <label className="emergency-form-label" htmlFor="priority">Triage Priority *</label>
                <select id="priority" className="emergency-form-control" value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="NORMAL">Normal Priority</option>
                  <option value="HIGH">High Priority</option>
                  <option value="CRITICAL">Critical Emergency</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn green" type="button" onClick={sendRequest} style={{ height: 44, padding: '0 24px', fontSize: 12, fontWeight: 600 }}>
                Dispatch Bed Request to HOM
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>2. Inpatient Bed Allocation Queue</h3>
          <span style={{ fontSize: 12, color: 'var(--color-muted-fg)' }}>Synchronized with HOM Operations Rota</span>
        </div>
        <div className="table-container" style={{ margin: 0 }}>
          <table>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Patient UHID</th>
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Patient Name</th>
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Requested Ward</th>
                <th style={{ textAlign: 'center', padding: '12px 14px' }}>Priority</th>
                <th style={{ textAlign: 'center', padding: '12px 14px' }}>Status / Bed Allocation</th>
              </tr>
            </thead>
            <tbody id="homRequestTable">
              {d.bedRequests.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: 28, color: 'var(--color-muted-fg)' }}>No active bed allocation requests</td></tr>
              ) : (
                d.bedRequests.map((r) => {
                  const patient = d.patientsById[r.patient_id] || {};
                  const wardName = r.ward_id ? d.wardsById[r.ward_id]?.ward_name || 'Ward Assigned' : 'HOM Decides';
                  const allocatedBed = r.bed_id ? d.bedsById[r.bed_id] : null;

                  const priorityBadge =
                    r.priority === 'CRITICAL' ? pill('#fef2f2', '#fecaca', '#991b1b', 700, 'Critical')
                    : r.priority === 'HIGH' ? pill('#fef3c7', '#fde68a', '#b45309', 700, 'High')
                    : pill('#f8fafc', '#e2e8f0', '#475569', 600, 'Normal');

                  const statusBadge = r.status === 'ALLOCATED' ? (
                    <span className="status confirmed" style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', fontWeight: 600, fontSize: 11, padding: '3px 8px', borderRadius: 12 }}>
                      Allocated: {allocatedBed ? allocatedBed.bed_number : 'Bed #' + r.bed_id}
                    </span>
                  ) : (
                    <span className="status pending" style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', fontSize: 11, padding: '3px 8px', borderRadius: 12 }}>
                      Awaiting Allocation
                    </span>
                  );

                  return (
                    <tr key={r.bed_request_id}>
                      <td style={{ textAlign: 'left', padding: '12px 16px' }}>
                        <strong style={{ color: 'var(--md-primary, #0f766e)' }}>{patient.uhid || 'UHID-' + r.patient_id}</strong>
                      </td>
                      <td style={{ textAlign: 'left', padding: '12px 16px' }}><strong>{patient.name || '—'}</strong></td>
                      <td style={{ textAlign: 'left', padding: '12px 16px' }}>{wardName}</td>
                      <td style={{ textAlign: 'center', padding: '12px 14px' }}>{priorityBadge}</td>
                      <td style={{ textAlign: 'center', padding: '12px 14px' }}>{statusBadge}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>3. Inpatient Discharge Clearance &amp; Final Release</h3>
          <span style={{ fontSize: 12, color: 'var(--color-muted-fg)' }}>Clearances processed through HOM and verified by PRE</span>
        </div>
        <div className="table-container" style={{ margin: 0 }}>
          <table>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Patient UHID</th>
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Patient Name</th>
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Department</th>
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Attending Doctor</th>
                <th style={{ textAlign: 'center', padding: '12px 14px' }}>Assigned Bed</th>
                <th style={{ textAlign: 'center', padding: '12px 14px' }}>HOM Clearance Status</th>
                <th style={{ textAlign: 'center', padding: '12px 16px' }}>PRE Action</th>
              </tr>
            </thead>
            <tbody id="homDischargeTable">
              {d.dischargeList.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 28, color: 'var(--color-muted-fg)' }}>No pending discharge clearance requests</td></tr>
              ) : (
                d.dischargeList.map((r) => {
                  const bedNumber = r.bed_id && d.bedsById[r.bed_id] ? d.bedsById[r.bed_id].bed_number : 'Bed Assigned';
                  const approved = r.status === 'DISCHARGE_APPROVED';
                  return (
                    <tr key={r.pre_request_id}>
                      <td style={{ textAlign: 'left', padding: '12px 16px' }}>
                        <strong style={{ color: 'var(--md-primary, #0f766e)' }}>{r.patientUhid}</strong>
                      </td>
                      <td style={{ textAlign: 'left', padding: '12px 16px' }}><strong>{r.patientName}</strong></td>
                      <td style={{ textAlign: 'left', padding: '12px 16px' }}>{r.department}</td>
                      <td style={{ textAlign: 'left', padding: '12px 16px' }}>{r.doctorName}</td>
                      <td style={{ textAlign: 'center', padding: '12px 14px' }}>
                        <span className="hom-ward-pill">{bedNumber}</span>
                      </td>
                      <td style={{ textAlign: 'center', padding: '12px 14px' }}>
                        {approved ? (
                          <span className="status confirmed" style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', fontSize: 11, padding: '3px 8px', borderRadius: 12 }}>
                            Discharge Approved by HOM
                          </span>
                        ) : (
                          <span className="status pending" style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', fontSize: 11, padding: '3px 8px', borderRadius: 12 }}>
                            Pending HOM Inspection
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', padding: '12px 16px' }}>
                        {approved ? (
                          <button className="btn green" type="button" style={{ padding: '6px 12px', fontSize: 11, borderRadius: 4 }} onClick={() => finalizeDischarge(r.pre_request_id)}>
                            Finalize Release
                          </button>
                        ) : (
                          <span style={{ color: 'var(--color-muted-fg)', fontSize: 12 }}>Awaiting HOM</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
