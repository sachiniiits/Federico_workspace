'use strict';

import { StatusBadge, DoctorLine } from './patientDashboardHelpers.jsx';

/**
 * The appointments <tbody> is rendered twice with the same markup: once in the
 * dashboard's "Upcoming Appointments" panel (upcoming only) and once in the
 * All Appointments modal (everything). Only the empty-state copy differs.
 */
export default function AppointmentRows({ appointments, emptyMessage }) {
  if (appointments.length === 0) {
    return (
      <tr>
        <td colSpan="4" style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px' }}>
          {emptyMessage}
        </td>
      </tr>
    );
  }

  return appointments.map((a) => (
    <tr key={a.id}>
      <td>
        <strong>{a.displayDate}</strong>
      </td>
      <td>{a.time}</td>
      <td>
        <strong>{a.department}</strong>
        <DoctorLine doctorName={a.doctorName} />
      </td>
      <td>
        <StatusBadge status={a.status} />
      </td>
    </tr>
  ));
}

