'use strict';

import { useState } from 'react';
import { api } from '../../api/index.js';
import { useApi } from '../../hooks/useApi.js';
import DialogShell from '../../components/layout/DialogShell.jsx';
import { loadLedgerEntries, ledgerTotal, formatCurrency, formatDateTime } from './faHelpers.js';
import * as actions from './faActions.js';
import * as S from './faStyles.js';

/**
 * Cashier & discharge settlement for the selected admission:
 * 1. Waits for HOM's initial discharge clearance request.
 * 2. Displays the bill summary with insurance deductions and allows FA to
 *    generate the summary and send the bill to the patient.
 * 3. Supports in-person counter payment (Cash, UPI, Card) or online payment by patient.
 * 4. Once payment is PAID:
 *    - Displays payment details and receipt access.
 *    - Allows FA to click "Discharge Patient" to submit to HOM for final approval.
 *    - Keeps the bed occupied until HOM gives final approval.
 */
export default function SettlementSection({ ctx, row }) {
  const { data: extra } = useApi(async () => {
    const [entries, receiptsList, insuranceList] = await Promise.all([
      row.ledger ? loadLedgerEntries(row.ledger.ledger_id) : [],
      api.billing.receipts.list().catch(() => []),
      api.patients.insuranceForPatient(row.patient.patient_id).catch(() => []),
    ]);
    const insurance = insuranceList && insuranceList[0] ? insuranceList[0] : null;
    const receipt =
      (receiptsList || []).find(
        (r) =>
          r.ledger_id === row.ledger?.ledger_id ||
          (row.admission?.admission_id && r.admission_id === row.admission.admission_id),
      ) || null;
    return { entries, insurance, receipt };
  }, [ctx.version, row.admission.admission_id, row.ledger?.ledger_id]);

  if (!row.dischargeApproved) {
    return (
      <>
        <h2 style={S.pageTitle}>
          Final Discharge Summary |{' '}
          <span style={{ color: 'var(--color-muted-fg)' }}>{row.patient.name || '-'}</span>
        </h2>
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--color-fg)' }}>Awaiting HOM discharge clearance</h2>
          <p style={{ color: 'var(--color-muted-fg)' }}>
            FA can finalize billing only after HOM approves this patient&apos;s discharge clearance request.
          </p>
        </div>
      </>
    );
  }

  const isPaid = row.ledger && row.ledger.status === 'PAID';
  const isDischarged = row.preRequest?.status === 'DISCHARGED' || row.admission.status === 'DISCHARGED';
  const isSubmittedToHom =
    Boolean(row.admission.fa_discharge_submitted) || row.admission.status === 'DISCHARGE_PENDING_APPROVAL';

  if (isPaid) {
    const entries = extra?.entries || [];
    const grossTotal = ledgerTotal(entries);
    const receipt = extra?.receipt;

    return (
      <>
        <h2 style={S.pageTitle}>
          Final Discharge Summary |{' '}
          <span style={{ color: 'var(--color-muted-fg)' }}>{row.patient.name || '-'}</span>
        </h2>
        <div className="card" style={{ padding: '32px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid var(--color-border)',
              paddingBottom: '20px',
              marginBottom: '24px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    background: '#e6f4ea',
                    color: '#137333',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm, 4px)',
                    fontSize: '12px',
                    letterSpacing: '0.05em',
                  }}
                >
                  ✓ PAYMENT CONFIRMED (PAID)
                </span>
                <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--color-fg)' }}>
                  Financial Clearance Complete
                </h3>
              </div>
              <p style={{ color: 'var(--color-muted-fg)', margin: '6px 0 0', fontSize: '13px' }}>
                Patient bill is fully settled. Official payment receipt and discharge summary are ready.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {receipt ? (
                <button
                  className="btn-primary"
                  style={{ padding: '10px 16px', fontSize: '13px' }}
                  onClick={() => actions.printReceipt(receipt.receipt_id)}
                >
                  🧾 View / Print Receipt
                </button>
              ) : null}
              <button
                className="btn-primary"
                style={{
                  padding: '10px 16px',
                  fontSize: '13px',
                  background: 'var(--md-secondary-container, #e2e8f0)',
                  color: 'var(--md-on-secondary-container, #1e293b)',
                }}
                onClick={() => actions.printDischargeSummary(ctx, row.admission.admission_id, ctx.hospitalName)}
              >
                📄 Print Discharge Summary
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '28px' }}>
            <div
              style={{
                background: 'var(--color-muted-bg)',
                padding: '20px',
                borderRadius: 'var(--radius-md, 8px)',
              }}
            >
              <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-muted-fg)' }}>
                Payment &amp; Transaction Details
              </h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed var(--color-border)', fontSize: '14px' }}>
                <span style={{ color: 'var(--color-muted-fg)' }}>Payment Status</span>
                <strong style={{ color: '#137333' }}>PAID</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed var(--color-border)', fontSize: '14px' }}>
                <span style={{ color: 'var(--color-muted-fg)' }}>Amount Paid</span>
                <strong style={{ color: 'var(--color-accent)' }}>
                  {formatCurrency(receipt?.amount || grossTotal)}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed var(--color-border)', fontSize: '14px' }}>
                <span style={{ color: 'var(--color-muted-fg)' }}>Payment Method</span>
                <strong>{(receipt?.payment_mode || 'COUNTER / ONLINE').toUpperCase()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed var(--color-border)', fontSize: '14px' }}>
                <span style={{ color: 'var(--color-muted-fg)' }}>Transaction / Ref ID</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                  {receipt?.reference_id || receipt?.transaction_id || ('PAY' + (receipt?.receipt_id || row.ledger.ledger_id))}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '14px' }}>
                <span style={{ color: 'var(--color-muted-fg)' }}>Timestamp</span>
                <span>{receipt?.generated_at ? formatDateTime(receipt.generated_at) : 'Completed'}</span>
              </div>
            </div>

            <div
              style={{
                background: 'var(--color-muted-bg)',
                padding: '20px',
                borderRadius: 'var(--radius-md, 8px)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-muted-fg)' }}>
                  Discharge Processing Stage
                </h4>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--color-muted-fg)' }}>Physical Bed Status</div>
                  <strong style={{ fontSize: '15px' }}>
                    {isDischarged ? 'Bed Released (AVAILABLE)' : `Bed Occupied (${row.bed?.bed_number || 'Inpatient Bed'})`}
                  </strong>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--color-muted-fg)' }}>Discharge Approval Workflow</div>
                  <div style={{ marginTop: '4px' }}>
                    {isDischarged ? (
                      <span style={{ color: '#137333', fontWeight: 600 }}>
                        ✓ Final discharge approved by HOM. Patient marked as discharged.
                      </span>
                    ) : isSubmittedToHom ? (
                      <span style={{ color: '#b45309', fontWeight: 600 }}>
                        ⏳ Discharge submitted by FA. Awaiting HOM&apos;s final discharge acceptance.
                      </span>
                    ) : (
                      <span style={{ color: 'var(--color-fg)', fontWeight: 600 }}>
                        Payment settled. Ready to submit patient for HOM&apos;s final discharge clearance.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                {isDischarged ? (
                  <div
                    style={{
                      padding: '12px 16px',
                      background: '#e6f4ea',
                      borderRadius: 'var(--radius-sm, 4px)',
                      color: '#137333',
                      fontSize: '13px',
                      fontWeight: 600,
                      textAlign: 'center',
                    }}
                  >
                    ✓ Complete: Patient Discharged &amp; Bed Released
                  </div>
                ) : isSubmittedToHom ? (
                  <div
                    style={{
                      padding: '12px 16px',
                      background: '#fef3c7',
                      borderRadius: 'var(--radius-sm, 4px)',
                      color: '#92400e',
                      fontSize: '13px',
                      fontWeight: 600,
                      textAlign: 'center',
                    }}
                  >
                    ⏳ Submitted to HOM — Waiting for Final Approval
                  </div>
                ) : (
                  <button
                    className="btn-primary"
                    style={{ width: '100%', padding: '14px', fontWeight: 700, fontSize: '14px' }}
                    onClick={() => actions.submitPatientForDischargeApproval(ctx, row.admission.admission_id)}
                  >
                    Discharge Patient (Submit for HOM Final Approval)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return extra ? (
    <Settlement
      ctx={ctx}
      row={row}
      entries={extra.entries}
      insurance={extra.insurance}
      isSubmittedToHom={isSubmittedToHom}
      isDischarged={isDischarged}
    />
  ) : null;
}

function Settlement({ ctx, row, entries, insurance }) {
  const { coverageOverrideRef } = ctx;
  const grossTotal = ledgerTotal(entries);
  const coverageLimit = insurance ? Math.min(Number(insurance.coverage_limit || 0), grossTotal) : 0;
  const dispatched = Boolean(row.ledger) && row.ledger.status === 'DISPATCHED';

  const [inPersonModalOpen, setInPersonModalOpen] = useState(false);
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [refId, setRefId] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const isOpdDischarge = row.admission.visit_type === 'OPD';
  const pageTitleText = isOpdDischarge ? 'OPD Bill Summary & Settlement' : 'Final Discharge Summary';
  const paymentError = ctx.formErrors['discharge-payment-error'];

  const deduction = coverageLimit;
  const netPayable = Math.max(0, grossTotal - deduction);

  return (
    <>
      <h2 style={S.pageTitle}>
        {pageTitleText} |{' '}
        <span style={{ color: 'var(--color-muted-fg)' }}>{row.patient.name || '-'}</span>
      </h2>

      <div
        className="card"
        style={{ padding: '32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px' }}
      >
        <div>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: 'var(--color-fg)' }}>
            Bill Summary &amp; Discharge Preparation
          </h3>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '12px 0',
              borderBottom: '1px solid var(--color-border)',
              color: 'var(--color-muted-fg)',
              fontSize: '15px',
            }}
          >
            <span>Gross Total</span>
            <span>{formatCurrency(grossTotal)}</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '12px 0',
              borderBottom: '1px solid var(--color-border)',
              color: 'var(--status-error)',
              fontSize: '15px',
            }}
          >
            <span>Insurance Deduction ({insurance?.provider_name || 'None'})</span>
            <span>- {formatCurrency(coverageLimit)}</span>
          </div>
          <div className="md-field" style={{ margin: '12px 0 0' }}>
            <label>Override Deduction (Rs)</label>
            <input
              type="number"
              id="coverage-override"
              ref={coverageOverrideRef}
              defaultValue={coverageLimit}
              min="0"
              max={grossTotal}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '16px 0',
              color: 'var(--color-accent)',
              fontSize: '16px',
              fontWeight: 700,
              marginBottom: '20px',
            }}
          >
            <span>Net Payable</span>
            <span id="net-payable-preview">{formatCurrency(netPayable)}</span>
          </div>

          <button
            className="btn-primary"
            style={{ width: '100%', padding: '14px', fontWeight: 700, fontSize: '13px', marginBottom: '12px' }}
            onClick={() => actions.generateDischargeSummary(ctx, row.admission.admission_id)}
          >
            Generate Discharge Summary &amp; Bill
          </button>

          <div
            style={{
              padding: '12px',
              borderRadius: 'var(--radius-sm, 4px)',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: '#475569',
              fontSize: '12px',
              lineHeight: 1.5,
            }}
          >
            <strong>Note:</strong> Generating the summary prepares the final invoice and opens payment options for the patient. The bed remains occupied and final discharge submission to HOM is gated on payment clearance.
          </div>
        </div>

        <div>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: 'var(--color-fg)' }}>Payment Processing</h3>
          {!row.ledger ? (
            <>
              <p style={{ color: 'var(--color-muted-fg)', fontSize: '14px' }}>
                No ledger exists for this admission yet.
              </p>
              <button
                className="btn-primary"
                style={{ width: '100%', padding: '14px', fontWeight: 700 }}
                onClick={() => actions.createLedgerAndOpen(ctx, row.admission.admission_id)}
              >
                Create Ledger
              </button>
            </>
          ) : !dispatched ? (
            <>
              <p style={{ color: 'var(--color-muted-fg)', fontSize: '14px', marginBottom: '16px' }}>
                Send the bill so the patient can pay online, or record an in-person payment at the counter.
              </p>
              <button
                className="btn-primary"
                style={{ width: '100%', padding: '14px', fontWeight: 700, marginBottom: '12px' }}
                onClick={() => actions.dispatchCurrent(ctx, row.ledger.ledger_id)}
              >
                Send Bill to Patient
              </button>
              <button
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '14px',
                  fontWeight: 700,
                  background: 'var(--md-secondary-container, #e2e8f0)',
                  color: 'var(--md-on-secondary-container, #1e293b)',
                }}
                onClick={() => setInPersonModalOpen(true)}
              >
                Record In-Person Payment (Cash / UPI / Card)
              </button>
            </>
          ) : (
            <>
              <div
                style={{
                  marginBottom: '16px',
                  padding: '16px',
                  borderRadius: 'var(--radius-md, 8px)',
                  background: 'var(--color-muted-bg)',
                  color: 'var(--color-muted-fg)',
                  fontSize: '13px',
                }}
              >
                Bill sent to patient. They can pay online via UPI, QR code, card, or net banking. You can also record counter payment in person below.
              </div>
              <button
                className="btn-primary"
                style={{ width: '100%', padding: '14px', fontWeight: 700, marginBottom: '12px' }}
                onClick={() => setInPersonModalOpen(true)}
              >
                Record In-Person Payment (Cash / UPI / Card)
              </button>
              <button
                className="btn-secondary"
                style={{ width: '100%', padding: '12px', fontSize: '13px' }}
                onClick={() => actions.recordCashPayment(ctx, row.ledger.ledger_id)}
              >
                Quick Record Cash
              </button>
            </>
          )}

          <div
            id="discharge-payment-error"
            style={{
              display: paymentError ? 'block' : 'none',
              marginTop: '12px',
              fontSize: '12px',
              color: 'var(--status-error)',
              fontWeight: 600,
            }}
          >
            {paymentError}
          </div>
        </div>
      </div>

      {inPersonModalOpen && (
        <DialogShell
          open
          onClose={() => setInPersonModalOpen(false)}
          title={'Record In-Person Payment — ' + (row.patient.name || 'Patient')}
          subtitle="Record patient payment received at the hospital / finance counter."
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                className="btn btn-secondary btn-default"
                type="button"
                onClick={() => setInPersonModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary btn-default"
                type="button"
                disabled={submittingPayment}
                onClick={async () => {
                  setSubmittingPayment(true);
                  try {
                    await actions.recordInPersonPayment(
                      ctx,
                      row.ledger.ledger_id,
                      paymentMode,
                      refId.trim() || undefined,
                    );
                    setInPersonModalOpen(false);
                  } finally {
                    setSubmittingPayment(false);
                  }
                }}
              >
                {submittingPayment ? 'Recording...' : `Confirm Payment (${formatCurrency(netPayable)})`}
              </button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                background: 'var(--color-muted-bg)',
                padding: '16px',
                borderRadius: 'var(--radius-base, 6px)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '13px' }}>
                <span style={{ color: 'var(--color-muted-fg)' }}>Patient UHID:</span>
                <strong>{row.patient.uhid || '-'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '13px' }}>
                <span style={{ color: 'var(--color-muted-fg)' }}>Gross Total:</span>
                <span>{formatCurrency(grossTotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '13px', color: 'var(--status-error)' }}>
                <span>Insurance / Override:</span>
                <span>- {formatCurrency(coverageLimit)}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: 8,
                  borderTop: '1px solid var(--color-border)',
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--color-accent)',
                }}
              >
                <span>Net Payable:</span>
                <span>{formatCurrency(netPayable)}</span>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                Select Counter Payment Method:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {[
                  { id: 'CASH', label: '💵 Cash', desc: 'Cash payment at counter' },
                  { id: 'UPI', label: '📱 UPI', desc: 'Scanned counter QR code' },
                  { id: 'CARD', label: '💳 Card', desc: 'Counter POS card swipe' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMode(m.id)}
                    style={{
                      padding: '12px 8px',
                      borderRadius: 'var(--radius-base, 6px)',
                      border:
                        paymentMode === m.id
                          ? '2px solid var(--color-accent)'
                          : '1px solid var(--color-border)',
                      background: paymentMode === m.id ? 'var(--color-muted-bg)' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-fg)' }}>
                      {m.label}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-muted-fg)', marginTop: '3px' }}>
                      {m.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="md-field" style={{ margin: 0 }}>
              <label>Transaction / Reference ID (Optional)</label>
              <input
                type="text"
                placeholder={
                  paymentMode === 'CASH'
                    ? 'Receipt voucher #'
                    : paymentMode === 'UPI'
                      ? 'UPI Ref / UTR #'
                      : 'Card auth code #'
                }
                value={refId}
                onChange={(e) => setRefId(e.target.value)}
              />
            </div>
          </div>
        </DialogShell>
      )}
    </>
  );
}
