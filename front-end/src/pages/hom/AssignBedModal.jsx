'use strict';

import { useEffect, useState } from 'react';
import Modal from '../../components/layout/Modal.jsx';
import { api } from '../../api/index.js';
import { toast } from '../../components/feedback/feedback.js';

/** Ported from #modal-assign-bed plus openAssignModal / confirmBedAllocation in HOM/beds.js. */
export default function AssignBedModal({ bedId, data, onClose, onChanged }) {
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setSelectedRequestId(null);
    setError('');
  }, [bedId]);

  if (bedId === null) return null;

  const bed = (data.beds || []).find((b) => b.bed_id === bedId);
  if (!bed) return null;

  const patientsById = {};
  (data.patients || []).forEach((p) => (patientsById[p.patient_id] = p));
  const preRequestsById = {};
  (data.preRequests || []).forEach((r) => (preRequestsById[r.pre_request_id] = r));

  const compatible = (data.bedRequests || []).filter(
    (r) => r.status === 'PENDING' && (!r.ward_id || r.ward_id === bed.ward_id),
  );

  async function confirm() {
    if (!selectedRequestId) {
      setError('Please select a pending patient bed request before confirming.');
      return;
    }
    try {
      await api.wards.bedRequests.allocate(selectedRequestId, bed.bed_id);
      toast('Bed allocated and patient admitted successfully.', 'success');
    } catch (err) {
      setError(err.message || 'Unable to allocate this bed.');
      return;
    }
    onClose();
    await onChanged();
  }

  return (
    <Modal open onClose={onClose}>
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="h2" style={{ fontSize: 20 }}>Assign Bed to Patient</h2>
          <button className="btn btn-outline btn-sm" style={{ border: 'none', padding: '4px 8px' }} onClick={onClose}>{'✕'}</button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div id="assign-patient-hint" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Assigning Bed {bed.bed_number}. Select an incoming patient request:
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 12 }}>Pending Bed Requests</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }} id="modal-available-beds">
              {compatible.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', margin: 0, padding: '12px 0' }}>
                  No pending bed requests queued for this ward.
                </p>
              ) : (
                compatible.map((r) => {
                  const patient = patientsById[r.patient_id] || {};
                  const dept = r.pre_request_id ? preRequestsById[r.pre_request_id]?.department : null;
                  const selected = selectedRequestId === r.bed_request_id;
                  return (
                    <button
                      key={r.bed_request_id}
                      type="button"
                      className="modal-bed-btn"
                      id={'modal-req-' + r.bed_request_id}
                      onClick={() => setSelectedRequestId(r.bed_request_id)}
                      style={{
                        padding: '14px 16px',
                        borderRadius: 'var(--radius-base)',
                        border: '1px solid ' + (selected ? 'var(--primary)' : 'var(--border)'),
                        background: selected ? 'var(--primary-light)' : 'var(--surface)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{patient.name || '-'}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                        {patient.uhid || '-'} {'•'} {dept || 'General'} {'•'} Priority: {r.priority || 'NORMAL'}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
          <div id="assign-bed-error" style={{ display: error ? 'block' : 'none', fontSize: 12, color: 'var(--error)', fontWeight: 500 }}>
            {error}
          </div>
        </div>
        <div className="modal-footer" style={{ justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn btn-secondary btn-default" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-default" onClick={confirm}>Confirm Admission</button>
        </div>
      </div>
    </Modal>
  );
}

