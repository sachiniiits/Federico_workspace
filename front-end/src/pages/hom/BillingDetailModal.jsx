'use strict';

import { useEffect, useState } from 'react';
import Modal from '../../components/layout/Modal.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { api } from '../../api/index.js';
import { formatCurrency, formatDate, formatDateTime } from './homHelpers.js';

function ledgerStatusVariant(status) {
  if (status === 'PAID') return 'success';
  if (status === 'DISPATCHED') return 'warning';
  if (status === 'OPEN') return 'info';
  return 'neutral';
}

/**
 * Ported from #modal-billing-detail plus openBillingDetail / loadPaymentHistory
 * in HOM/billing.js. Payment history loads after the modal is already visible,
 * as it did before.
 */
export default function BillingDetailModal({ row, servicesById, onClose, onViewPatient }) {
  const [payments, setPayments] = useState(null); // null = loading, false = error

  useEffect(() => {
    if (!row) return;
    setPayments(null);
    let cancelled = false;
    (async () => {
      try {
        const all = await api.billing.payments.list().catch(() => []);
        if (cancelled) return;
        setPayments(all.filter((p) => p.ledger_id === row.ledger.ledger_id));
      } catch {
        if (!cancelled) setPayments(false);
      }
    })();
    return () => { cancelled = true; };
  }, [row]);

  if (!row) return null;

  const summaryField = (label, value) => (
    <>
      <div className="summary-field">
        <div className="summary-field-label">{label}</div>
        <div className="summary-field-value">{value}</div>
      </div>
      <div className="summary-divider" />
    </>
  );

  return (
    <Modal open onClose={onClose}>
      <div className="modal-content" style={{ maxWidth: 760 }}>
        <div className="modal-header">
          <h2 className="h2" style={{ fontSize: 18 }} id="bd-title">
            Billing Detail {'—'} {row.patient?.name || 'Patient'}
          </h2>
          <button className="modal-close-btn" onClick={onClose}>{'✕'}</button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="summary-bar">
            {summaryField('UHID', row.patient?.uhid || '—')}
            {summaryField('Department', row.department)}
            {summaryField('Bed', row.bed?.bed_number || '—')}
            {summaryField('Admission Date', formatDate(row.admission?.admitted_at || row.admission?.created_at))}
            <div className="summary-field">
              <div className="summary-field-label">Ledger Status</div>
              <div id="bd-status"><Badge variant={ledgerStatusVariant(row.ledger.status)}>{row.ledger.status}</Badge></div>
            </div>
          </div>

          <div>
            <h3 className="h3" style={{ fontSize: 15, marginBottom: 12 }}>Charges Breakdown</h3>
            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-base)', overflow: 'hidden' }}>
              <table className="w-full breakdown-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>Service</th>
                    <th style={{ textAlign: 'right' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Unit Price</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody id="bd-entries-tbody">
                  {row.entries.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: 16, color: 'var(--text-secondary)', fontSize: 13 }}>
                        No charge line items recorded yet.
                      </td>
                    </tr>
                  ) : (
                    row.entries.map((e) => (
                      <tr key={e.entry_id}>
                        <td>{servicesById[e.service_id]?.service_name || 'Service #' + e.service_id}</td>
                        <td style={{ textAlign: 'right' }}>{e.quantity}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(e.unit_price)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 500 }}>{formatCurrency(e.amount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="total-bar">
            <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Total Billed</span>
            <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary)' }} id="bd-total">{formatCurrency(row.total)}</span>
          </div>

          <div>
            <h3 className="h3" style={{ fontSize: 15, marginBottom: 10 }}>Payment History</h3>
            <div style={{ background: 'var(--neutral-bg)', padding: '14px 16px', borderRadius: 'var(--radius-base)' }} id="bd-payments">
              {payments === null ? (
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Loading...</p>
              ) : payments === false ? (
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Could not load payment history.</p>
              ) : payments.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>No payments recorded yet.</p>
              ) : (
                payments.map((p) => (
                  <p key={p.payment_id} style={{ fontSize: 13, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                    <strong>{formatCurrency(p.amount_paid)}</strong> via{' '}
                    <span style={{ color: 'var(--text-secondary)' }}>{p.payment_mode}</span> {'—'}{' '}
                    {formatDateTime(p.payment_time)}
                  </p>
                ))
              )}
            </div>
          </div>

          <div style={{ background: 'var(--status-info-bg, #e0f2fe)', borderRadius: 'var(--radius-sm)', padding: '10px 14px' }}>
            <p style={{ fontSize: 13, color: 'var(--status-info-fg, #075985)', margin: 0 }}>
              <strong>Note:</strong> Ledger creation, dispatch, and final settlement are handled by
              Finance Associate.
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary btn-default" onClick={onClose}>Close</button>
          <button className="btn btn-outline btn-default" id="bd-view-patient-btn" disabled={!row.patient?.uhid}
            onClick={() => row.patient?.uhid && onViewPatient(row.patient.uhid)}>
            View Patient Record
          </button>
        </div>
      </div>
    </Modal>
  );
}
