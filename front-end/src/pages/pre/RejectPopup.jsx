'use strict';

import { useState } from 'react';
import { api } from '../../api/index.js';
import { toast } from '../../components/feedback/feedback.js';
import PrePopup from './PrePopup.jsx';

/** Ported from reject / confirmReject in PRE/js/requests.js. */
export default function RejectPopup({ request, onClose, onDone }) {
  const [reason, setReason] = useState('');

  if (!request) return null;

  async function confirm() {
    const trimmed = reason.trim();
    if (!trimmed) {
      toast('Enter reason', 'error');
      return;
    }
    try {
      await api.preRequests.update(request.pre_request_id, { status: 'REJECTED', reject_reason: trimmed });
      onClose();
      toast('Rejected successfully', 'success');
      await onDone();
    } catch (err) {
      toast(err.message || 'Could not reject this request', 'error');
    }
  }

  return (
    <PrePopup className="reject-popup" id="rejectPopup" onClose={onClose}>
      <div className="reject-box">
        <div className="popup-header-block">
          <span className="popup-kicker popup-kicker-reject">Reject</span>
          <h2>Reject Request</h2>
          <p>Add a clear reason so the patient sees why.</p>
        </div>
        <div className="popup-form-layout">
          <div className="form-group">
            <label htmlFor="rejectReason">Reason</label>
            <textarea id="rejectReason" className="popup-textarea" placeholder="Enter reason..." rows="4"
              value={reason} onChange={(e) => setReason(e.target.value)} />
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

