'use strict';

import { useEffect, useState } from 'react';
import Modal from '../../components/layout/Modal.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { api } from '../../api/index.js';
import { formatDateTime } from './homHelpers.js';

/**
 * Ported from the #modal-admission-request markup plus openAdmissionModal /
 * approveAdmission / rejectAdmissionRequest in HOM/dashboard.js.
 *
 * Like the dashboard, the two failure paths here called the undefined
 * `showMessage` (defect D1) and are preserved as such - see DashboardPage.jsx.
 */
export default function AdmissionRequestModal({ bedRequestId, data, onClose, onChanged }) {
  const [selectedBedId, setSelectedBedId] = useState(null);

  useEffect(() => {
    setSelectedBedId(null);
  }, [bedRequestId]);

  if (bedRequestId === null) return null;

  const request = (data.bedRequests || []).find((r) => r.bed_request_id === bedRequestId);
  if (!request) return null;

  const patient = (data.patients || []).find((p) => p.patient_id === request.patient_id) || {};
  const preRequest = request.pre_request_id
    ? (data.preRequests || []).find((r) => r.pre_request_id === request.pre_request_id)
    : null;
  const ward = request.ward_id ? (data.wards || []).find((w) => w.ward_id === request.ward_id) : null;

  const wardsById = {};
  (data.wards || []).forEach((w) => (wardsById[w.ward_id] = w));

  const availableBeds = (data.beds || []).filter(
    (b) => b.status === 'AVAILABLE' && (!request.ward_id || b.ward_id === request.ward_id),
  );

  async function approve() {
    if (!selectedBedId) {
      // eslint-disable-next-line no-undef
      showMessage('Select a bed before approving.', 'warning');
      return;
    }
    try {
      await api.wards.bedRequests.allocate(bedRequestId, selectedBedId);
    } catch (err) {
      // eslint-disable-next-line no-undef
      showMessage(err.message || 'Unable to allocate bed.');
      return;
    }
    onClose();
    await onChanged();
  }

  async function reject() {
    try {
      await api.wards.bedRequests.deny(bedRequestId);
    } catch (err) {
      // eslint-disable-next-line no-undef
      showMessage(err.message || 'Unable to deny this bed request.');
      return;
    }
    onClose();
    await onChanged();
  }

  const field = (label, value) => (
    <div>
      <div className="label">{label}</div>
      <div style={{ fontWeight: 500 }}>{value}</div>
    </div>
  );

  return (
    <Modal open onClose={onClose}>
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="h2" style={{ fontSize: 20 }} id="modal-admit-title">
            Bed Request {'—'} {patient.name || 'Patient'}
          </h2>
          <button className="btn btn-outline btn-sm" style={{ border: 'none', padding: '4px 8px' }} onClick={onClose}>
            {'✕'}
          </button>
        </div>

        <div className="modal-body" style={{ gap: 24, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {field('Name', patient.name || '-')}
            {field('UHID', patient.uhid || '-')}
          </div>

          <div style={{ background: 'var(--neutral-bg)', padding: 16, borderRadius: 'var(--radius-base)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div className="label">Department</div>
              <div style={{ marginTop: 4 }}><Badge variant="info">{preRequest?.department || 'General'}</Badge></div>
            </div>
            <div>
              <div className="label">Priority</div>
              <div style={{ marginTop: 4 }}>
                <Badge variant={request.priority === 'CRITICAL' ? 'error' : request.priority === 'HIGH' ? 'warning' : 'info'}>
                  {request.priority || 'NORMAL'}
                </Badge>
              </div>
            </div>
            {field('Time Waiting', formatDateTime(request.requested_at))}
            {field('Requested By', preRequest ? 'PRE' : 'HOM')}
            <div>
              <div className="label">Suggested Ward</div>
              <div style={{ marginTop: 4 }}>
                {ward ? <Badge variant="success">{ward.ward_name}</Badge> : <span style={{ color: 'var(--text-secondary)' }}>Any ward</span>}
              </div>
            </div>
          </div>

          <div>
            <div className="label" style={{ marginBottom: 12, fontSize: 14, textTransform: 'none' }}>Available Beds</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} id="modal-admit-beds">
              {availableBeds.length === 0 ? (
                <div style={{ padding: 16, border: '1px dashed var(--border)', borderRadius: 8, color: 'var(--text-secondary)' }}>
                  No available beds for this request.
                </div>
              ) : (
                availableBeds.map((bed) => (
                  <button
                    key={bed.bed_id}
                    type="button"
                    className="bed-option-btn"
                    id={'bed-opt-' + bed.bed_id}
                    onClick={() => setSelectedBedId(bed.bed_id)}
                    style={{
                      padding: 16,
                      borderRadius: 8,
                      border: '2px solid ' + (selectedBedId === bed.bed_id ? 'var(--primary)' : 'var(--border)'),
                      background: selectedBedId === bed.bed_id ? 'var(--primary-light)' : 'white',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{bed.bed_number}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                      {wardsById[bed.ward_id]?.ward_name || ''}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button className="btn btn-secondary btn-default" onClick={onClose}>Cancel</button>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-danger btn-default" data-flow="reject-request" onClick={reject}>Reject Request</button>
            <button className="btn btn-primary btn-default" data-flow="approve-assign" id="btn-approve-admit" onClick={approve}>
              Approve &amp; Assign Bed
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
