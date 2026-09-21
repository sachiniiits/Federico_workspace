'use strict';

import { api } from '../../api/index.js';
import { useApi } from '../../hooks/useApi.js';
import { useFa } from './FaContext.jsx';
import { loadBillingOverview, loadLedgerEntries, ledgerTotal, formatCurrency } from './faHelpers.js';
import { useSelectedRow } from './useSelectedRow.js';
import * as actions from './faActions.js';
import PatientPicker from './PatientPicker.jsx';
import ViewFrame from './ViewFrame.jsx';
import * as S from './faStyles.js';

export default function DischargeView() {
  const ctx = useFa();

  const { data, error, loading } = useApi(() => loadBillingOverview(), [ctx.version]);
  const rows = data?.rows;
  const { selectedId, row } = useSelectedRow(ctx, rows);

  const { data: extra } = useApi(async () => {
    if (!row) return null;
    const entries = row.ledger ? await loadLedgerEntries(row.ledger.ledger_id) : [];
    let insurance = null;
    try {
      const list = await api.patients.insuranceForPatient(row.patient.patient_id);
      insurance = list && list[0] ? list[0] : null;
    } catch {
      insurance = null;
    }
    return { entries, insurance };
  }, [ctx.version, row?.admission.admission_id, row?.ledger?.ledger_id]);

  return (
    <ViewFrame loading={loading} error={error}>
      {data ? (
        !row ? (
          <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
            <h2>No patient selected for discharge.</h2>
          </div>
        ) : (
          <>
            <PatientPicker rows={rows} currentAdmissionId={selectedId} />
            {!row.dischargeApproved ? (
              <>
                <h2 style={S.pageTitle}>
                  Final Discharge Summary |{' '}
                  <span style={{ color: 'var(--color-muted-fg)' }}>{row.patient.name || '-'}</span>
                </h2>
                <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
                  <h2 style={{ color: 'var(--color-fg)' }}>Awaiting HOM discharge approval</h2>
                  <p style={{ color: 'var(--color-muted-fg)' }}>
                    FA can finalize billing only after HOM approves this patient&apos;s discharge
                    request.
                  </p>
                </div>
              </>
            ) : row.ledger && row.ledger.status === 'PAID' ? (
              <>
                <h2 style={S.pageTitle}>
                  Final Discharge Summary |{' '}
                  <span style={{ color: 'var(--color-muted-fg)' }}>{row.patient.name || '-'}</span>
                </h2>
                <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
                  <h2 style={{ color: 'var(--color-accent)' }}>Payment Received</h2>
                  <p>
                    Billing is finalized.{' '}
                    <a href="#/receipts" style={{ color: 'var(--color-accent)' }}>
                      View Receipt
                    </a>
                  </p>
                  <div
                    style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '20px' }}
                  >
                    <button
                      className="btn-primary"
                      style={{ padding: '12px 20px' }}
                      onClick={() =>
                        actions.printDischargeSummary(ctx, row.admission.admission_id, ctx.hospitalName)
                      }
                    >
                      Print Discharge Summary
                    </button>
                  </div>
                </div>
              </>
            ) : extra ? (
              <Settlement ctx={ctx} row={row} entries={extra.entries} insurance={extra.insurance} />
            ) : null}
          </>
        )
      ) : null}
    </ViewFrame>
  );
}

function Settlement({ ctx, row, entries, insurance }) {
  const grossTotal = ledgerTotal(entries);
  const coverageLimit = insurance ? Math.min(Number(insurance.coverage_limit || 0), grossTotal) : 0;
  const dispatched = Boolean(row.ledger) && row.ledger.status === 'DISPATCHED';

  const isOpdDischarge = row.admission.visit_type === 'OPD';
  const pageTitleText = isOpdDischarge ? 'OPD Bill Summary & Settlement' : 'Final Discharge Summary';
  const actionButtonLabel = isOpdDischarge ? 'Finalize & Settle Bill' : 'Discharge Patient';

  const paymentError = ctx.formErrors['discharge-payment-error'];

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
            Bill Summary
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
            {/*
              DEFECT D7, preserved: nothing listens to this field, so
              #net-payable-preview below never updates as you type. The value is
              still read at click time by Record Cash Payment and by the
              discharge-summary generator, which is why it is uncontrolled.
            */}
            <input
              type="number"
              id="coverage-override"
              ref={ctx.coverageOverrideRef}
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
            <span id="net-payable-preview">{formatCurrency(Math.max(0, grossTotal - coverageLimit))}</span>
          </div>
          <button
            className="btn-primary"
            style={{ width: '100%', padding: '14px', fontWeight: 700, fontSize: '13px' }}
            onClick={() => actions.generateDischargeSummary(ctx, row.admission.admission_id)}
          >
            {actionButtonLabel}
          </button>
        </div>

        <div>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: 'var(--color-fg)' }}>Payment</h3>
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
                Send the bill so the patient can pay online, or record a manual payment for a walk-in.
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
                  background: 'var(--md-secondary-container)',
                  color: 'var(--md-on-secondary-container)',
                }}
                onClick={() => actions.recordCashPayment(ctx, row.ledger.ledger_id)}
              >
                Record Cash Payment
              </button>
            </>
          ) : (
            <>
              <div
                style={{
                  marginBottom: '16px',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-muted-bg)',
                  color: 'var(--color-muted-fg)',
                  fontSize: '13px',
                }}
              >
                Bill sent — the patient can pay from their own billing page. You can also record cash
                collected in person below.
              </div>
              <button
                className="btn-primary"
                style={{ width: '100%', padding: '14px', fontWeight: 700 }}
                onClick={() => actions.recordCashPayment(ctx, row.ledger.ledger_id)}
              >
                Record Cash Payment
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
    </>
  );
}

