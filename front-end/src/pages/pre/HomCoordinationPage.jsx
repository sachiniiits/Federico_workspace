'use strict';

import { useState } from 'react';
import { api } from '../../api/index.js';
import { useApi } from '../../hooks/useApi.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';

/** PRE read-only coordination view for HOM bed assignment status. */
export default function HomCoordinationPage() {
  useDocumentTitle('HOM Coordination - Federico PRE');
  const [search, setSearch] = useState('');

  const { data } = useApi(async () => {
    const [patients, bedRequests, wards, beds] = await Promise.all([
      api.patients.list().catch(() => []),
      api.wards.bedRequests.list().catch(() => []),
      api.wards.list().catch(() => []),
      api.wards.beds().catch(() => []),
    ]);

    const patientsById = {};
    (patients || []).forEach((p) => (patientsById[p.patient_id] = p));
    const wardsById = {};
    (wards || []).forEach((w) => (wardsById[w.ward_id] = w));
    const bedsById = {};
    (beds || []).forEach((b) => (bedsById[b.bed_id] = b));

    // Show PENDING + ALLOCATED + DENIED so PRE can see the full HOM response.
    const allBedRequests = (bedRequests || []).filter((r) =>
      r.status === 'PENDING' || r.status === 'ALLOCATED' || r.status === 'DENIED',
    );

    return { allBedRequests, patientsById, wardsById, bedsById };
  }, []);

  const d = data || { allBedRequests: [], patientsById: {}, wardsById: {}, bedsById: {} };

  // Filter by patient name, UHID, or phone — matching by the patient lookup object
  const q = search.trim().toLowerCase();
  const visibleRequests = q
    ? d.allBedRequests.filter((r) => {
        const patient = d.patientsById[r.patient_id] || {};
        const name  = String(patient.name  || '').toLowerCase();
        const uhid  = String(patient.uhid  || '').toLowerCase();
        const phone = String(patient.phone || '').toLowerCase();
        return name.includes(q) || uhid.includes(q) || phone.includes(q);
      })
    : d.allBedRequests;

  return (
    <div className="container hom-coord-container">
      <div className="directory-header">
        <div className="directory-title-group">
          <h2>Hospital Operations Management (HOM) Coordination</h2>
          <p>Monitor bed allocation requests submitted from PRE. Discharge approvals are managed in the PRE Dashboard.</p>
        </div>
      </div>

      <div>
        <div className="pre-section-header">
          <h3 className="hom-queue-title">Inpatient Bed Allocation Queue</h3>
          <div className="hom-queue-controls">
            <span className="hom-queue-hint">Bed assignment is handled in HOM</span>
            <input
              type="search"
              className="pre-search-input"
              placeholder="Search by name, UHID or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search HOM bed requests"
            />
          </div>
        </div>
        <div className="table-container hom-table-wrapper">
          <table>
            <thead>
              <tr>
                <th className="col-left">Patient UHID</th>
                <th className="col-left">Patient Name</th>
                <th className="col-left">Requested Ward</th>
                <th className="col-center">Priority</th>
                <th className="col-center">Bed</th>
                <th className="col-center">Status</th>
              </tr>
            </thead>
            <tbody id="homRequestTable">
              {visibleRequests.length === 0 ? (
                <tr>
                  <td colSpan="6" className="pre-empty-state">
                    {q ? 'No bed requests match your search.' : 'No bed allocation requests'}
                  </td>
                </tr>
              ) : (
                visibleRequests.map((r) => {
                  const patient  = d.patientsById[r.patient_id] || {};
                  const wardName = r.ward_id ? d.wardsById[r.ward_id]?.ward_name || 'Ward Requested' : 'HOM Decides';

                  let priorityClass = 'hom-priority-normal';
                  let priorityText  = 'Normal';
                  if (r.priority === 'CRITICAL') { priorityClass = 'hom-priority-critical'; priorityText = 'Critical'; }
                  else if (r.priority === 'HIGH') { priorityClass = 'hom-priority-high';    priorityText = 'High'; }

                  let bedCell;
                  if (r.status === 'ALLOCATED' && r.bed_id && d.bedsById[r.bed_id]) {
                    bedCell = <strong className="hom-bed-allocated">{d.bedsById[r.bed_id].bed_number}</strong>;
                  } else if (r.status === 'DENIED') {
                    bedCell = <span className="hom-bed-na">N/A</span>;
                  } else {
                    bedCell = <span className="hom-bed-empty">—</span>;
                  }

                  let statusClass = 'hom-status-pending';
                  let statusText  = 'Pending';
                  if (r.status === 'ALLOCATED') { statusClass = 'hom-status-allocated'; statusText = 'Allocated'; }
                  else if (r.status === 'DENIED') { statusClass = 'hom-status-denied';  statusText = 'Rejected'; }

                  return (
                    <tr key={r.bed_request_id}>
                      <td className="col-left">
                        <strong className="hom-uhid-text">{patient.uhid || 'UHID-' + r.patient_id}</strong>
                      </td>
                      <td className="col-left"><strong>{patient.name || '-'}</strong></td>
                      <td className="col-left">{wardName}</td>
                      <td className="col-center"><span className={`hom-priority-pill ${priorityClass}`}>{priorityText}</span></td>
                      <td className="col-center">{bedCell}</td>
                      <td className="col-center"><span className={`hom-status-badge ${statusClass}`}>{statusText}</span></td>
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
