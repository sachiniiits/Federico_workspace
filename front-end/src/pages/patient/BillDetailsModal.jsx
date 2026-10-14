'use strict';

import { useState } from 'react';
import DialogShell from '../../components/layout/DialogShell.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { forRole } from '../../lib/sanitizer.js';
import { BillStatusBadge } from './patientDashboardHelpers.jsx';
import { getEffectiveStatus } from './patientDashboardUtils.js';

/**
 * The patient's bill dialogs & multi-method payment modal:
 *  - BillSummaryModal: Dashboard list of all bills.
 *  - BillDetailsModal: Itemized invoice details with clinical discharge summary.
 *  - PatientPaymentModal: Presents discharge summary and payment info together
 *    with UPI/QR, payment link, Card, and Net Banking options.
 */
export function BillSummaryModal({ open, onClose, bills, onOpenBill, onGoToBilling }) {
  const unpaid = bills.filter((b) => getEffectiveStatus(b) !== 'paid');
  const totalOwed = unpaid.reduce((sum, b) => sum + b.youPay, 0);

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      size="lg"
      title="Bill Summary"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div className="modal-bill-total" style={{ margin: 0 }}>
            <span style={{ marginRight: 8 }}>Total Outstanding:</span>
            <strong>₹{totalOwed.toLocaleString('en-IN')}</strong>
          </div>
          <button className="btn-primary" type="button" id="modal-go-bills" onClick={onGoToBilling}>
            View Full Billing Page →
          </button>
        </div>
      }
    >
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Bill No</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Due Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {bills.length === 0 ? (
              <EmptyState asTableRow colSpan={5} title="No bills found." />
            ) : (
              bills.map((bill) => {
                const safeBill = forRole(bill, 'PATIENT');
                return (
                  <tr
                    key={bill.id}
                    style={{ cursor: 'pointer' }}
                    tabIndex={0}
                    title="View itemized invoice"
                    onClick={() => onOpenBill(bill)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onOpenBill(bill);
                    }}
                  >
                    <td className="bill-id-cell">{safeBill.billNo}</td>
                    <td>{safeBill.description}</td>
                    <td>
                      <strong>₹{bill.youPay.toLocaleString('en-IN')}</strong>
                    </td>
                    <td>{safeBill.dueDate}</td>
                    <td>
                      <BillStatusBadge status={getEffectiveStatus(bill)} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </DialogShell>
  );
}

export function PatientPaymentModal({ open, onClose, bill, profile, onConfirmPay }) {
  const [method, setMethod] = useState('UPI'); // 'UPI', 'LINK', 'CARD', 'NETBANKING'
  const [copiedLink, setCopiedLink] = useState(false);
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvv: '', name: profile?.name || '' });
  const [selectedBank, setSelectedBank] = useState('HDFC');
  const [processing, setProcessing] = useState(false);

  if (!open || !bill) return null;

  const payableAmount = Number(bill.youPay || 0);
  const paymentLink = `https://pay.hospital.org/settle/${bill.ledgerId || '001'}?auth=live`;

  async function handlePay() {
    setProcessing(true);
    try {
      const refId =
        method === 'UPI'
          ? 'UPI' + Date.now().toString().slice(-8)
          : method === 'LINK'
            ? 'LNK' + Date.now().toString().slice(-8)
            : method === 'CARD'
              ? 'CRD' + Date.now().toString().slice(-8)
              : 'NET' + Date.now().toString().slice(-8);

      await onConfirmPay(bill, method, refId);
      onClose();
    } finally {
      setProcessing(false);
    }
  }

  function copyLink() {
    navigator.clipboard?.writeText(paymentLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  return (
    <DialogShell
      open
      onClose={onClose}
      size="lg"
      title="Discharge Settlement &amp; Payment Options"
      subtitle={`Invoice ${bill.billNo || '#' + bill.ledgerId} · Admission #${bill.admissionId || '-'}`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, width: '100%' }}>
          <button className="btn-secondary" type="button" onClick={onClose} disabled={processing}>
            Cancel
          </button>
          <button
            className="btn-primary"
            type="button"
            disabled={processing || payableAmount <= 0}
            onClick={handlePay}
          >
            {processing ? 'Processing Payment...' : `Pay ₹${payableAmount.toLocaleString('en-IN')}`}
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Discharge Summary & Bill Info presented together */}
        <div
          style={{
            background: 'var(--color-muted-bg, #f8fafc)',
            border: '1px solid var(--color-border, #e2e8f0)',
            borderRadius: 8,
            padding: 16,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong style={{ fontSize: 14, color: 'var(--color-fg, #1e293b)' }}>
              📋 Final Discharge Summary &amp; Bill Details
            </strong>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 4,
                background: '#e0f2fe',
                color: '#0369a1',
              }}
            >
              DISCHARGE CLEARANCE ATTACHED
            </span>
          </div>
          <p style={{ margin: '0 0 12px 0', fontSize: 13, color: 'var(--color-muted-fg, #64748b)', lineHeight: 1.5 }}>
            <strong>Attending Physician Assessment:</strong> Patient treated and stabilized for the condition requiring admission; certified fit for formal discharge.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
              paddingTop: 10,
              borderTop: '1px dashed var(--color-border, #cbd5e1)',
              fontSize: 13,
            }}
          >
            <div>
              <span style={{ color: 'var(--color-muted-fg, #64748b)', display: 'block', fontSize: 11 }}>Gross Total Charges</span>
              <strong>₹{Number(bill.total || 0).toLocaleString('en-IN')}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--color-muted-fg, #64748b)', display: 'block', fontSize: 11 }}>Insurance Covered</span>
              <strong style={{ color: '#16a34a' }}>-₹{Number(bill.insuranceCovered || 0).toLocaleString('en-IN')}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--color-muted-fg, #64748b)', display: 'block', fontSize: 11 }}>Amount Payable</span>
              <strong style={{ color: 'var(--color-accent, #9c7a1e)', fontSize: 15 }}>
                ₹{payableAmount.toLocaleString('en-IN')}
              </strong>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 10, color: 'var(--color-fg, #1e293b)' }}>
            Choose Payment Method:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
            {[
              { id: 'UPI', label: '📱 UPI / QR Code', desc: 'GPay, PhonePe, Paytm' },
              { id: 'LINK', label: '🔗 Payment Link', desc: 'Online Checkout Link' },
              { id: 'CARD', label: '💳 Card Payment', desc: 'Debit / Credit Card' },
              { id: 'NETBANKING', label: '🏦 Net Banking', desc: 'Direct Bank Transfer' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                style={{
                  padding: '12px 8px',
                  borderRadius: 6,
                  border: method === m.id ? '2px solid var(--color-accent, #9c7a1e)' : '1px solid var(--color-border, #cbd5e1)',
                  background: method === m.id ? 'var(--color-muted-bg, #f8fafc)' : '#ffffff',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-fg, #1e293b)' }}>{m.label}</div>
                <div style={{ fontSize: 11, color: 'var(--color-muted-fg, #64748b)', marginTop: 2 }}>{m.desc}</div>
              </button>
            ))}
          </div>

          {/* UPI Method Tab */}
          {method === 'UPI' && (
            <div
              style={{
                display: 'flex',
                gap: 20,
                alignItems: 'center',
                padding: 16,
                border: '1px solid var(--color-border, #e2e8f0)',
                borderRadius: 8,
                background: '#ffffff',
              }}
            >
              <svg width="120" height="120" viewBox="0 0 100 100" style={{ background: '#fff', padding: 4, borderRadius: 6, border: '1px solid #cbd5e1', flexShrink: 0 }}>
                <rect x="0" y="0" width="100" height="100" fill="#ffffff" />
                <rect x="5" y="5" width="26" height="26" fill="#1e293b" />
                <rect x="9" y="9" width="18" height="18" fill="#ffffff" />
                <rect x="13" y="13" width="10" height="10" fill="#1e293b" />
                <rect x="69" y="5" width="26" height="26" fill="#1e293b" />
                <rect x="73" y="9" width="18" height="18" fill="#ffffff" />
                <rect x="77" y="13" width="10" height="10" fill="#1e293b" />
                <rect x="5" y="69" width="26" height="26" fill="#1e293b" />
                <rect x="9" y="73" width="18" height="18" fill="#ffffff" />
                <rect x="13" y="77" width="10" height="10" fill="#1e293b" />
                <rect x="36" y="8" width="6" height="6" fill="#1e293b" />
                <rect x="46" y="8" width="6" height="6" fill="#1e293b" />
                <rect x="56" y="8" width="6" height="6" fill="#1e293b" />
                <rect x="36" y="18" width="6" height="6" fill="#1e293b" />
                <rect x="46" y="24" width="6" height="6" fill="#1e293b" />
                <rect x="56" y="18" width="6" height="6" fill="#1e293b" />
                <rect x="8" y="36" width="6" height="6" fill="#1e293b" />
                <rect x="18" y="44" width="6" height="6" fill="#1e293b" />
                <rect x="28" y="36" width="6" height="6" fill="#1e293b" />
                <rect x="36" y="36" width="8" height="8" fill="#0f766e" />
                <rect x="48" y="40" width="6" height="6" fill="#1e293b" />
                <rect x="58" y="36" width="6" height="6" fill="#1e293b" />
                <rect x="70" y="36" width="6" height="6" fill="#1e293b" />
                <rect x="82" y="44" width="6" height="6" fill="#1e293b" />
                <rect x="40" y="52" width="6" height="6" fill="#1e293b" />
                <rect x="50" y="58" width="6" height="6" fill="#1e293b" />
                <rect x="62" y="52" width="6" height="6" fill="#1e293b" />
                <rect x="36" y="68" width="6" height="6" fill="#1e293b" />
                <rect x="46" y="76" width="6" height="6" fill="#1e293b" />
                <rect x="56" y="68" width="6" height="6" fill="#1e293b" />
                <rect x="70" y="68" width="6" height="6" fill="#1e293b" />
                <rect x="80" y="74" width="8" height="8" fill="#1e293b" />
                <rect x="72" y="86" width="6" height="6" fill="#1e293b" />
              </svg>
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: 14, color: 'var(--color-fg, #1e293b)' }}>Scan QR Code with any UPI App</strong>
                <p style={{ fontSize: 12, color: 'var(--color-muted-fg, #64748b)', margin: '4px 0 10px 0' }}>
                  Open Google Pay, PhonePe, Paytm, or BHIM and scan this code to complete payment of ₹{payableAmount.toLocaleString('en-IN')}.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <span style={{ color: 'var(--color-muted-fg, #64748b)' }}>Hospital UPI ID:</span>
                  <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>federico.hospital@okhdfcbank</code>
                </div>
              </div>
            </div>
          )}

          {/* Payment Link Tab */}
          {method === 'LINK' && (
            <div style={{ padding: 16, border: '1px solid var(--color-border, #e2e8f0)', borderRadius: 8, background: '#ffffff' }}>
              <strong style={{ fontSize: 14, color: 'var(--color-fg, #1e293b)' }}>Instant Online Payment Link</strong>
              <p style={{ fontSize: 12, color: 'var(--color-muted-fg, #64748b)', margin: '4px 0 12px 0' }}>
                Use this secure direct checkout link to pay via browser or share with a family member.
              </p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="text"
                  readOnly
                  value={paymentLink}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    fontSize: 13,
                    background: '#f8fafc',
                    fontFamily: 'monospace',
                  }}
                />
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={copyLink}
                  style={{ padding: '8px 14px', fontSize: 12 }}
                >
                  {copiedLink ? '✓ Copied' : 'Copy Link'}
                </button>
              </div>
            </div>
          )}

          {/* Card Method Tab */}
          {method === 'CARD' && (
            <div style={{ padding: 16, border: '1px solid var(--color-border, #e2e8f0)', borderRadius: 8, background: '#ffffff', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="md-field" style={{ margin: 0 }}>
                <label>Card Number</label>
                <input
                  type="text"
                  placeholder="4532 •••• •••• 8821"
                  value={cardData.number}
                  onChange={(e) => setCardData((c) => ({ ...c, number: e.target.value }))}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="md-field" style={{ margin: 0 }}>
                  <label>Expiry (MM/YY)</label>
                  <input
                    type="text"
                    placeholder="12/28"
                    value={cardData.expiry}
                    onChange={(e) => setCardData((c) => ({ ...c, expiry: e.target.value }))}
                  />
                </div>
                <div className="md-field" style={{ margin: 0 }}>
                  <label>CVV</label>
                  <input
                    type="password"
                    placeholder="•••"
                    maxLength={4}
                    value={cardData.cvv}
                    onChange={(e) => setCardData((c) => ({ ...c, cvv: e.target.value }))}
                  />
                </div>
              </div>
              <div className="md-field" style={{ margin: 0 }}>
                <label>Cardholder Name</label>
                <input
                  type="text"
                  placeholder="Name as on card"
                  value={cardData.name}
                  onChange={(e) => setCardData((c) => ({ ...c, name: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* Net Banking Method Tab */}
          {method === 'NETBANKING' && (
            <div style={{ padding: 16, border: '1px solid var(--color-border, #e2e8f0)', borderRadius: 8, background: '#ffffff' }}>
              <strong style={{ fontSize: 14, color: 'var(--color-fg, #1e293b)' }}>Select Your Bank</strong>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, margin: '12px 0' }}>
                {['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra', 'Punjab National Bank'].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setSelectedBank(b)}
                    style={{
                      padding: 10,
                      borderRadius: 6,
                      border: selectedBank === b ? '2px solid var(--color-accent, #9c7a1e)' : '1px solid #cbd5e1',
                      background: selectedBank === b ? '#fef3c7' : '#ffffff',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DialogShell>
  );
}

export default function BillDetailsModal({ open, onClose, bill, onPay, onPrint }) {
  if (!bill) return null;

  const statusText =
    bill.status === 'paid'
      ? 'PAID'
      : bill.hasDischargeSummary
        ? 'PENDING PAYMENT (DISCHARGED)'
        : 'INTERIM EOD STATEMENT';
  const statusColor =
    bill.status === 'paid'
      ? 'var(--success)'
      : bill.hasDischargeSummary
        ? 'var(--warn)'
        : 'var(--muted)';

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      size="lg"
      title="Itemized Invoice Details"
      subtitle={`Invoice ${bill.billNo || '#' + bill.ledgerId}`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, width: '100%' }}>
          <button
            className="btn-secondary"
            type="button"
            id="modal-btn-print"
            onClick={() => onPrint(bill)}
          >
            Print / Download
          </button>
          {bill.status === 'paid' ? null : !bill.hasDischargeSummary ? (
            <button
              className="btn-primary"
              type="button"
              id="modal-btn-pay"
              disabled
              style={{ opacity: '0.6', cursor: 'not-allowed' }}
            >
              Payment Opens on Discharge
            </button>
          ) : (
            <button
              className="btn-primary"
              type="button"
              id="modal-btn-pay"
              onClick={() => onPay(bill)}
            >
              Pay Now
            </button>
          )}
        </div>
      }
    >
      {bill.hasDischargeSummary && (
        <div
          style={{
            background: 'var(--color-muted-bg, #f8fafc)',
            border: '1px solid var(--color-border, #e2e8f0)',
            borderRadius: 8,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <strong style={{ fontSize: 14, color: 'var(--color-fg, #1e293b)' }}>
              📋 Official Clinical Discharge Summary
            </strong>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 4,
                background: '#e0f2fe',
                color: '#0369a1',
              }}
            >
              DISCHARGE CLEARANCE ATTACHED
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--color-muted-fg, #64748b)', lineHeight: 1.5 }}>
            <strong>Discharge Assessment:</strong> Patient treated and stabilized for the condition requiring admission; certified fit for discharge by attending physician.
          </p>
        </div>
      )}

      <div className="modal-meta-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        <div className="modal-meta">
          <span style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)' }}>Invoice No</span>
          <strong id="modal-invoice-no">{bill.billNo || '#' + bill.ledgerId}</strong>
        </div>
        <div className="modal-meta">
          <span style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)' }}>Admission</span>
          <strong id="modal-admission-id">
            {bill.admissionId ? '#' + bill.admissionId : 'N/A'}
          </strong>
        </div>
        <div className="modal-meta">
          <span style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)' }}>Billing Date</span>
          <strong id="modal-bill-date">{bill.date || 'N/A'}</strong>
        </div>
        <div className="modal-meta">
          <span style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)' }}>Status</span>
          <strong id="modal-bill-status" style={{ color: statusColor }}>
            {statusText}
          </strong>
        </div>
      </div>

      <div className="table-wrap itemized-table">
        <table>
          <thead>
            <tr>
              <th>Service / Item</th>
              <th style={{ textAlign: 'center' }}>Qty</th>
              <th style={{ textAlign: 'right' }}>Unit Price</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody id="modal-items-tbody">
            {bill.items && bill.items.length ? (
              bill.items.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <strong>{item.name || 'Hospital Service'}</strong>
                  </td>
                  <td style={{ textAlign: 'center' }}>{item.qty || 1}</td>
                  <td style={{ textAlign: 'right' }}>
                    ₹{Number(item.unitPrice || 0).toLocaleString('en-IN')}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    ₹{Number(item.total || 0).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))
            ) : (
              <EmptyState asTableRow colSpan={4} title="No line items recorded." />
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="3">Gross Total</td>
              <td style={{ textAlign: 'right' }} id="modal-gross-total">
                ₹{Number(bill.total || 0).toLocaleString('en-IN')}
              </td>
            </tr>
            <tr className="ins-row">
              <td colSpan="3">Insurance Covered Amount</td>
              <td style={{ textAlign: 'right' }} id="modal-ins-deduction">
                -₹{Number(bill.insuranceCovered || 0).toLocaleString('en-IN')}
              </td>
            </tr>
            <tr className="total-row">
              <td colSpan="3">Net Patient Share (You Pay)</td>
              <td style={{ textAlign: 'right' }} id="modal-net-payable">
                ₹{Number(bill.youPay || 0).toLocaleString('en-IN')}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </DialogShell>
  );
}
