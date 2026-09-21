'use strict';

/** Shared bits of platform-dashboard.js. */

export const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

export function statusChipClass(status) {
  if (status === 'ACTIVE') return 'md-chip-success';
  if (status === 'SUSPENDED') return 'md-chip-warning';
  return 'md-chip-error';
}

/**
 * The nine module codes the provision dialog sends. The legacy file kept the
 * display names too, but only the codes were ever used.
 */
export const MODULE_CATALOG = [
  { code: 'APPOINTMENTS', name: 'Appointments' },
  { code: 'ADMISSIONS', name: 'Admissions & Bed Management' },
  { code: 'INVENTORY', name: 'Inventory & Procurement' },
  { code: 'BILLING', name: 'Billing' },
  { code: 'INSURANCE', name: 'Insurance' },
  { code: 'ANALYTICS', name: 'Administrative Analytics' },
  { code: 'DOCTOR', name: 'Doctor Management' },
  { code: 'PATIENT', name: 'Patient Management' },
  { code: 'LEADERSHIP', name: 'Service Charge Approvals' },
];

