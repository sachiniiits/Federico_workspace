'use strict';

import { useApi } from '../../hooks/useApi.js';
import { useFa } from './FaContext.jsx';
import { loadBillingOverview, loadLedgerEntries, ledgerTotal, formatCurrency } from './faHelpers.js';
import { useSelectedRow } from './useSelectedRow.js';
import * as actions from './faActions.js';
import PatientPicker from './PatientPicker.jsx';
import ViewFrame from './ViewFrame.jsx';
import * as S from './faStyles.js';

export default function EodBillingView() {
  const ctx = useFa();

  const { data, error, loading } = useApi(async () => {
    const overview = await loadBillingOverview();
    return overview;
  }, [ctx.version]);

  const rows = data?.rows;
  const { selectedId, row } = useSelectedRow(ctx, rows);

  const { data: entries } = useApi(
    () => (row?.ledger ? loadLedgerEntries(row.ledger.ledger_id) : Promise.resolve([])),
    [ctx.version, row?.ledger?.ledger_id],
  );

  return (
    <ViewFrame loading={loading} error={error}>
      {data ? (
        !row ? (
          <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
            <h2>No patient selected.</h2>
          </div>
        ) : (
          <Body ctx={ctx} row={row} rows={rows} selectedId={selectedId} servicesById={data.servicesById} entries={entries || []} />
        )
      ) : null}
    </ViewFrame>
  );
}

function Body({ ctx, row, rows, selectedId, servicesById, entries }) {
  const total = ledgerTotal(entries);
  const canDispatch = Boolean(row.ledger) && row.ledger.status !== 'PAID' && total > 0;

  const dispatchedElsewhere = rows.filter(
    (r) =>
      r.ledger &&
      (r.ledger.status === 'DISPATCHED' || r.ledger.status === 'PAID') &&
      r.admission.admission_id !== row.admission.admission_id,
  );

  return (
    <>
      <PatientPicker rows={rows} currentAdmissionId={selectedId} />
      <h2 style={S.pageTitle}>
        EOD Billing | <span style={{ color: 'var(--color-muted-fg)' }}>{row.patient.name || '-'}</span>
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div
          className="card"
          style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: 'var(--color-fg)' }}>
              Current Ledger Total
            </h3>
            <div
              style={{
                fontSize: '32px',
                fontWeight: 800,
                color: 'var(--color-accent)',
                marginBottom: '20px',
              }}
            >
              {formatCurrency(total)}
            </div>
            {row.ledger && entries.length ? (
              <div
                style={{
                  marginBottom: '24px',
                  padding: '16px',
                  background: 'var(--color-muted-bg)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    marginBottom: '8px',
                  }}
                >
                  Included in this bill:
                </div>
                {entries.map((e) => (
                  <div
                    key={e.entry_id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '13px',
                      padding: '6px 0',
                      color: 'var(--color-muted-fg)',
                    }}
                  >
                    <span>
                      {servicesById[e.service_id]?.service_name || '-'} (x{e.quantity})
                    </span>
                    <span>{formatCurrency(e.amount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
                {row.ledger ? 'No charges recorded yet.' : 'No ledger exists for this admission yet.'}
              </p>
            )}
          </div>
          <button
            onClick={() => actions.dispatchCurrent(ctx, row.ledger ? row.ledger.ledger_id : null)}
            disabled={!canDispatch}
            style={{
              width: '100%',
              background: canDispatch ? 'var(--md-primary)' : 'var(--md-surface-container-high)',
              color: canDispatch ? 'var(--md-on-primary)' : 'var(--md-on-surface-variant)',
              border: 'none',
              padding: '14px',
              borderRadius: 'var(--radius-full)',
              fontWeight: 700,
              cursor: canDispatch ? 'pointer' : 'not-allowed',
              fontSize: '14px',
            }}
          >
            {!row.ledger
              ? 'No Ledger Yet'
              : row.ledger.status === 'PAID'
                ? 'Ledger Settled & Paid'
                : total === 0
                  ? 'Nothing to Bill'
                  : 'Send EOD Bill to Patient'}
          </button>
        </div>

        <div className="card" style={{ padding: '24px', height: 'fit-content' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: 'var(--color-fg)' }}>
            Recently Billed
          </h3>
          <div>
            {dispatchedElsewhere.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                No other bills have been sent yet.
              </p>
            ) : (
              dispatchedElsewhere.slice(0, 8).map((r) => (
                <div
                  key={r.admission.admission_id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 0',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--color-fg)', fontSize: '14px' }}>
                      {r.patient.name || '-'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-accent)', marginTop: '4px' }}>
                      {r.ledger.status === 'PAID' ? 'Paid' : 'Billed — awaiting payment'}
                    </div>
                  </div>
                  <div
                    style={{ fontWeight: 600, color: 'var(--color-muted-fg)', cursor: 'pointer' }}
                    onClick={() => {
                      ctx.setCurrentAdmissionId(r.admission.admission_id);
                      ctx.navigate('#/ledger', r.admission.admission_id);
                    }}
                  >
                    View →
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
