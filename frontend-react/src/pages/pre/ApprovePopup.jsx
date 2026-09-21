'use strict';

import { useState } from 'react';
import { api } from '../../api/index.js';
import { toast } from '../../components/feedback/feedback.js';
import { sortDoctorsForDepartment, to12Hour, to24Hour } from './preHelpers.js';
import PrePopup, { DoctorOptions } from './PrePopup.jsx';

/** Ported from openApprove / confirmApprove in PRE/js/requests.js. */
export default function ApprovePopup({ request, doctors, onClose, onDone }) {
  const [doctorId, setDoctorId] = useState(request?.doctor_id ? String(request.doctor_id) : '');
  const [time, setTime] = useState(to24Hour(request?.requested_time));

  if (!request) return null;

  async function confirm() {
    if (!doctorId) {
      toast('Select a doctor', 'error');
      return;
    }
    try {
      const payload = { status: 'APPROVED', doctor_id: Number(doctorId) };
      // An empty time keeps the patient's originally requested slot.
      if (time) payload.requested_time = to12Hour(time);
      await api.preRequests.update(request.pre_request_id, payload);
      onClose();
      toast('Approved', 'success');
      await onDone();
    } catch (err) {
      toast(err.message || 'Could not approve this request', 'error');
    }
  }

  return (
    <PrePopup className="approve-popup" id="approvePopup" onClose={onClose}>
      <div className="approve-box">
        <div className="popup-header-block">
          <span className="popup-kicker popup-kicker-approve">Approval</span>
          <h2>Approve Appointment</h2>
          <p>Assign a doctor. Leave time empty to keep the patient&apos;s requested slot.</p>
        </div>
        <div className="popup-form-layout">
          <div className="popup-summary-row">
            <span className="popup-summary-pill">{request.patientName || 'Patient'}</span>
            <span className="popup-summary-pill">{request.department || 'General'}</span>
          </div>
          <div className="form-group">
            <label htmlFor="doctorSelect">Doctor</label>
            <select id="doctorSelect" className="custom-select popup-input" value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
              <DoctorOptions doctors={doctors} department={request.department} sortFn={sortDoctorsForDepartment} />
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="appointTime">Appointment Time</label>
            <input type="time" id="appointTime" className="popup-input" value={time} onChange={(e) => setTime(e.target.value)} />
            <small className="popup-helper">Optional. Leave blank to keep the requested time.</small>
          </div>
        </div>
        <div className="popup-buttons">
          <button onClick={confirm}>Submit</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </PrePopup>
  );
}

