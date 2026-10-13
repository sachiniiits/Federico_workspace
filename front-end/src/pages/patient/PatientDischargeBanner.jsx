'use strict';

/**
 * Patient-facing banner reflecting the 3 stages of the discharge lifecycle:
 * 1. Before payment:
 *    Discharge Status: PAYMENT PENDING
 *    [View Discharge Summary]  [Pay Now]
 * 2. After payment:
 *    Payment Status: ✓ PAID
 *    Discharge Status: DISCHARGE PENDING FINAL APPROVAL
 *    [View Discharge Summary]  [View Receipt]
 * 3. After HOM approves:
 *    ✓ PATIENT DISCHARGED
 *    [View Final Discharge Summary]  [Download Receipt]
 */
export default function PatientDischargeBanner({
  bills = [],
  raw = null,
  billingSections = {},
  onPay,
  onViewSummary,
  onViewReceipt,
}) {
  const dischargeBill = (bills || []).find((b) => b.hasDischargeSummary);
  const dischargeDoc = (billingSections?.discharge || [])[0] || null;
  const receiptDoc = (billingSections?.receipts || [])[0] || null;

  const rawPre = (raw?.preRequests || []).find((p) =>
    ['DISCHARGE_REQUESTED', 'DISCHARGE_APPROVED', 'DISCHARGED'].includes(p.status),
  );
  const rawAdmission = (raw?.bundles || [])
    .map((b) => b.admission)
    .find(
      (a) =>
        a &&
        (a.status === 'PAYMENT_CONFIRMED' ||
          a.status === 'DISCHARGED' ||
          a.status === 'DISCHARGE_PENDING_APPROVAL' ||
          Boolean(a.receipt_sent_to_hom) ||
          Boolean(a.fa_discharge_submitted)),
    );

  if (!dischargeBill && !dischargeDoc && !rawPre) {
    return null;
  }

  const isFinalDischarged =
    rawPre?.status === 'DISCHARGED' || rawAdmission?.status === 'DISCHARGED';
  const isPaid = dischargeBill ? dischargeBill.status === 'paid' : Boolean(receiptDoc);

  let banner = null;

  if (!isPaid && dischargeBill) {
    // Stage 1: Before Payment
    banner = {
      type: 'PAYMENT_PENDING',
      borderColor: '#fde68a',
      bgColor: '#fffbeb',
      badgeBg: '#fef3c7',
      badgeColor: '#92400e',
      badgeText: 'DISCHARGE STATUS: PAYMENT PENDING',
      title: `Final Discharge Summary & Bill Ready (Amount Due: ₹${Number(dischargeBill.youPay || 0).toLocaleString('en-IN')})`,
      message:
        'The finance department has finalized your discharge summary and bill. Please review your summary and complete payment using UPI / QR code, Payment Link, Card, or Net Banking.',
      actions: (
        <>
          {dischargeDoc ? (
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '8px 14px', fontSize: '13px' }}
              onClick={() => onViewSummary(dischargeDoc)}
            >
              View Discharge Summary
            </button>
          ) : null}
          <button
            type="button"
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 600 }}
            onClick={() => onPay(dischargeBill)}
          >
            Pay Now
          </button>
        </>
      ),
    };
  } else if (isPaid && !isFinalDischarged) {
    // Stage 2: After Payment, awaiting HOM
    banner = {
      type: 'AWAITING_HOM',
      borderColor: '#bbf7d0',
      bgColor: '#f0fdf4',
      badgeBg: '#dcfce7',
      badgeColor: '#15803d',
      badgeText: 'DISCHARGE STATUS: DISCHARGE PENDING FINAL APPROVAL',
      paymentBadge: '✓ PAID',
      title: 'Payment Confirmed · Awaiting HOM Final Clearance',
      message:
        'Your payment has been successfully recorded and the receipt is issued. Your file has been submitted for final clearance from Hospital Operations Management (HOM).',
      actions: (
        <>
          {dischargeDoc ? (
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '8px 14px', fontSize: '13px' }}
              onClick={() => onViewSummary(dischargeDoc)}
            >
              View Discharge Summary
            </button>
          ) : null}
          {receiptDoc ? (
            <button
              type="button"
              className="btn-primary"
              style={{ padding: '8px 14px', fontSize: '13px', fontWeight: 600 }}
              onClick={() => onViewReceipt(receiptDoc)}
            >
              View Receipt
            </button>
          ) : null}
        </>
      ),
    };
  } else if (isFinalDischarged) {
    // Stage 3: After HOM approves
    banner = {
      type: 'DISCHARGED',
      borderColor: '#bae6fd',
      bgColor: '#f0f9ff',
      badgeBg: '#e0f2fe',
      badgeColor: '#0369a1',
      badgeText: '✓ PATIENT DISCHARGED',
      title: 'Discharge Completed · Inpatient Formalities Closed',
      message:
        'Hospital Operations Management (HOM) has granted final discharge approval and your bed has been released. You may access your official documents below.',
      actions: (
        <>
          {dischargeDoc ? (
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '8px 14px', fontSize: '13px' }}
              onClick={() => onViewSummary(dischargeDoc)}
            >
              View Final Discharge Summary
            </button>
          ) : null}
          {receiptDoc ? (
            <button
              type="button"
              className="btn-primary"
              style={{ padding: '8px 14px', fontSize: '13px', fontWeight: 600 }}
              onClick={() => onViewReceipt(receiptDoc)}
            >
              Download Receipt
            </button>
          ) : null}
        </>
      ),
    };
  }

  if (!banner) return null;

  return (
    <div
      className="discharge-status-banner"
      style={{
        marginBottom: '24px',
        padding: '18px 22px',
        borderRadius: 'var(--radius-lg, 10px)',
        border: `1px solid ${banner.borderColor}`,
        background: banner.bgColor,
        boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 14,
        }}
      >
        <div style={{ flex: '1 1 300px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            {banner.paymentBadge ? (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  padding: '3px 8px',
                  borderRadius: 4,
                  background: '#dcfce7',
                  color: '#15803d',
                }}
              >
                Payment Status: {banner.paymentBadge}
              </span>
            ) : null}
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.05em',
                padding: '3px 8px',
                borderRadius: 4,
                background: banner.badgeBg,
                color: banner.badgeColor,
              }}
            >
              {banner.badgeText}
            </span>
          </div>
          <strong style={{ display: 'block', fontSize: 15, color: '#1e293b', marginBottom: 4 }}>
            {banner.title}
          </strong>
          <p style={{ margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.45 }}>
            {banner.message}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {banner.actions}
        </div>
      </div>
    </div>
  );
}
