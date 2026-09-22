'use strict';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';

/** Ported from #searchResultPopup in PRE/pages/APPointment.html. */
export default function SearchResultPopup({ patient, onClose }) {
  useEffect(() => {
    if (!patient) return undefined;
    function onKeydown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeydown);
    return () => document.removeEventListener('keydown', onKeydown);
  }, [patient, onClose]);

  if (!patient) return null;

  return createPortal(
    <div id="searchResultPopup" className="popup active" role="dialog" aria-modal="true" style={{ display: 'flex' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="emergency-modal-content" style={{ maxWidth: 440 }}>
        <div className="emergency-modal-head">
          <div>
            <h2 id="searchFoundTitle" style={{ color: 'var(--md-primary, #0f766e)' }}>Patient Record Found</h2>
            <p>Verified profile linked to this contact number.</p>
          </div>
          <button className="emergency-modal-close" type="button" onClick={onClose} aria-label="Close modal">{'✕'}</button>
        </div>

        <div className="quick-patient-box" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: 'var(--color-muted-fg)', fontSize: 12 }}>Patient UHID:</span>
            <strong id="searchResultPatientId" style={{ color: 'var(--md-primary, #0f766e)' }}>{patient.patientId || '-'}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-muted-fg)', fontSize: 12 }}>Full Name:</span>
            <strong id="searchResultPatientName">{patient.name || '-'}</strong>
          </div>
        </div>

        <div className="emergency-modal-actions">
          <button className="btn green" type="button" onClick={onClose}>Continue Booking</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
