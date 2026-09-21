'use strict';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * The PRE popup shell. The legacy code appended a div with class
 * approve-popup / suggest-popup / reject-popup straight to document.body and
 * toggled body.modal-open; this does the same through a portal, and closes on
 * backdrop click or Escape exactly as before.
 */
export default function PrePopup({ className, id, onClose, children }) {
  useEffect(() => {
    document.body.classList.add('modal-open');
    function onKeydown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeydown);
    return () => {
      document.body.classList.remove('modal-open');
      document.removeEventListener('keydown', onKeydown);
    };
  }, [onClose]);

  return createPortal(
    <div
      className={className}
      id={id}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {children}
    </div>,
    document.body,
  );
}

/** Shared doctor <option> list, ranked by department match then availability. */
export function DoctorOptions({ doctors, department, sortFn }) {
  const sorted = sortFn(doctors, department);
  if (sorted.length === 0) return <option value="">No doctors available</option>;
  return (
    <>
      <option value="">Select doctor</option>
      {sorted.map((d) => (
        <option key={d.doctor_id} value={d.doctor_id}>
          {d.name} - {d.specialization}
        </option>
      ))}
    </>
  );
}

