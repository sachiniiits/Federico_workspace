'use strict';

/** MAX_PATIENTS_PER_SLOT, ported unchanged from patient-book-appointment.js. */
export const MAX_PATIENTS_PER_SLOT = 3;

/** Mirrors the backend caps (fileUpload.js): 5 MB, pdf/jpg/jpeg/png only. */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const ALLOWED_UPLOAD_EXT = ['.pdf', '.jpg', '.jpeg', '.png'];

/** Standardises e.g. "9:00 AM" -> "09:00 AM". */
export function normalizeSlotTime(t) {
  if (!t) return '';
  const clean = t.trim().toUpperCase();
  const match = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (match) {
    let hour = parseInt(match[1], 10);
    const min = match[2];
    const ampm = match[3] || (hour >= 12 ? 'PM' : 'AM');
    if (hour > 12) hour -= 12;
    if (hour === 0) hour = 12;
    return String(hour).padStart(2, '0') + ':' + min + ' ' + ampm;
  }
  return clean;
}

/** The page's own date formatter - not lib/formatters.js#formatDate. */
export function formatSlotDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const SLOT_BLOCKS = [
  {
    id: 'morning-slots',
    period: '🌅 Morning (09:00 AM – 01:00 PM)',
    times: [
      '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
      '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
    ],
  },
  {
    id: 'afternoon-slots',
    period: '☀️ Afternoon (02:00 PM – 05:00 PM)',
    times: ['02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'],
  },
  {
    id: 'evening-slots',
    period: '🌆 Evening (05:00 PM – 07:00 PM)',
    times: ['05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM'],
  },
];

/**
 * Counts booked appointments per normalised slot time for the current filters.
 *
 * DEFECT D5 is preserved on the `docMatch` line: store appointments never carry
 * a `doctorId`, so picking a doctor can only ever match when no doctor is
 * selected. The per-doctor capacity filter has therefore never narrowed
 * anything. Constraint 1 keeps it that way.
 */
export function countBookedByTime(appointments, selectedDate, selectedDept, selectedDoctorId) {
  const relevant = appointments.filter((apt) => {
    const dateMatch = apt.date === selectedDate;
    const deptMatch =
      !selectedDept ||
      selectedDept === 'none' ||
      (apt.department && apt.department.toLowerCase() === selectedDept.toLowerCase());
    const docMatch = !selectedDoctorId || apt.doctorId === selectedDoctorId;
    const activeMatch = !['Cancelled', 'Rejected'].includes(apt.status);
    return dateMatch && deptMatch && docMatch && activeMatch;
  });

  const counts = {};
  relevant.forEach((apt) => {
    const normalized = normalizeSlotTime(apt.time);
    if (normalized) counts[normalized] = (counts[normalized] || 0) + 1;
  });
  return counts;
}

/** The Available / "N Left" / Booked ladder each slot button renders. */
export function slotState(time, counts, selectedDate, selectedDept) {
  const booked = counts[normalizeSlotTime(time)] || 0;
  if (!selectedDate || !selectedDept || selectedDept === 'none') {
    return { className: 'available', label: 'Available', disabled: false };
  }
  if (booked >= MAX_PATIENTS_PER_SLOT) {
    return { className: 'booked', label: 'Booked', disabled: true };
  }
  if (booked > 0) {
    return {
      className: 'limited',
      label: MAX_PATIENTS_PER_SLOT - booked + ' Left',
      disabled: false,
    };
  }
  return { className: 'available', label: 'Available', disabled: false };
}

