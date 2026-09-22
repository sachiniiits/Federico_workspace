'use strict';

/**
 * The three small pure helpers patient-dashboard.js declared inside its
 * DOMContentLoaded closure, plus the "latest past appointment" derivation the
 * summary cards and the last-visit card each computed separately (identically).
 */

export function getEffectiveStatus(bill) {
  if (bill.status === 'paid') return 'paid';
  const today = new Date().toISOString().split('T')[0];
  return bill.dueDateISO < today ? 'overdue' : 'pending';
}

const STATUS_MAP = {
  confirmed: 'confirmed',
  scheduled: 'scheduled',
  pending: 'pending',
  cancelled: 'pending',
  completed: 'confirmed',
};

export function StatusBadge({ status }) {
  const s = String(status || '').toLowerCase();
  if (s === 'emergency') {
    return (
      <span className="status overdue" style={{ background: '#fee2e2', color: '#b91c1c', fontWeight: 700 }}>
        Emergency
      </span>
    );
  }
  return <span className={'status ' + (STATUS_MAP[s] || 'pending')}>{status}</span>;
}

export function BillStatusBadge({ status }) {
  if (status === 'paid') return <span className="status confirmed">Paid</span>;
  if (status === 'overdue') {
    return (
      <span className="status pending" style={{ background: '#fde8e8', color: '#c0392b' }}>
        Overdue
      </span>
    );
  }
  return <span className="status pending">Pending</span>;
}

/** Visits whose date is in the past. */
export function pastVisits(visits) {
  const now = Date.now();
  return visits.filter((item) => {
    const ts = new Date(item.isoDate || item.date || '').getTime();
    return Number.isFinite(ts) && ts < now;
  });
}

/** The most recent appointment that has already happened, or null. */
export function latestPastAppointment(appointments) {
  const now = Date.now();
  return (
    appointments
      .filter((item) => item && item.displayDate)
      .sort((left, right) => {
        const l = new Date((left.date || '') + ' ' + (left.time || '')).getTime();
        const r = new Date((right.date || '') + ' ' + (right.time || '')).getTime();
        return r - l;
      })
      .find((item) => {
        const ts = new Date((item.date || '') + ' ' + (item.time || '')).getTime();
        return Number.isFinite(ts) && ts < now;
      }) || null
  );
}

/** The one place the dashboard renders a doctor's name under a department. */
export function DoctorLine({ doctorName }) {
  if (!doctorName) return null;
  return (
    <div style={{ color: 'var(--muted)', fontSize: '11px' }}>
      Dr. {doctorName.replace(/^Dr\.\s*/i, '')}
    </div>
  );
}

