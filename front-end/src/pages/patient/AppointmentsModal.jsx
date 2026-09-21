'use strict';

import Modal from '../../components/layout/Modal.jsx';
import AppointmentRows from './AppointmentRows.jsx';

export default function AppointmentsModal({ open, onClose, appointments, onBookNew }) {
  return (
    <Modal open={open} onClose={onClose} labelledBy="modal-appt-title">
      <div className="dash-modal" role="dialog" aria-modal="true" aria-labelledby="modal-appt-title">
        <div className="modal-head">
          <h2 id="modal-appt-title">All Appointments</h2>
          <button className="modal-close" type="button" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Department / Doctor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <AppointmentRows appointments={appointments} emptyMessage="No appointments found." />
              </tbody>
            </table>
          </div>
          <div className="modal-footer-action">
            <button className="modal-book-btn" type="button" id="modal-book-new" onClick={onBookNew}>
              + Book New Appointment
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

