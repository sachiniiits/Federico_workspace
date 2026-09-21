'use strict';

import { useState } from 'react';
import { api } from '../../api/index.js';
import { useApi } from '../../hooks/useApi.js';
import { useFa } from './FaContext.jsx';
import { loadBillingOverview, formatCurrency, formatDateTime } from './faHelpers.js';
import * as actions from './faActions.js';
import ViewFrame from './ViewFrame.jsx';
import * as S from './faStyles.js';

const FILTER_STYLE = {
  padding: '10px 16px',
  border: 'none',
  borderRadius: 'var(--radius-full)',
  fontSize: '13px',
  outline: 'none',
  fontFamily: 'inherit',
  background: 'var(--md-surface-container-high)',
  color: 'var(--md-on-background)',
};

export default function ReceiptsView() {
  const ctx = useFa();
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('ALL');

  const { data, error, loading } = useApi(async () => {
    const [receipts, { patientsById }] = await Promise.all([
      api.billing.receipts.list().catch(() => []),
      loadBillingOverview(),
    ]);
    const sorted = [...receipts].sort(
      (a, b) => new Date(b.generated_at) - new Date(a.generated_at),
    );
    return { sorted, patientsById };
  }, [ctx.version]);

  return (
    <ViewFrame loading={loading} error={error}>
      {data ? (
        <>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              marginBottom: '24px',
            }}
          >
            <h2 style={{ margin: 0, color: 'var(--color-fg)', fontWeight: 700 }}>Payment Receipts</h2>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text"
                id="receipt-search"
                placeholder="Search Patient or UHID..."
                style={{ ...FILTER_STYLE, width: '250px' }}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <select
                id="receipt-filter"
                style={FILTER_STYLE}
                value={mode}
                onChange={(e) => setMode(e.target.value)}
              >
                <option value="ALL">All Payment Methods</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
                <option value="CASH">Cash</option>
                <option value="NETBANKING">Netbanking</option>
              </select>
            </div>
          </div>

          <div className="card" style={S.cardFlush}>
            <table className="data-table" style={S.tableStyle}>
              <thead style={S.theadStyle}>
                <tr>
                  <th style={S.th}>Receipt ID</th>
                  <th style={S.th}>Date &amp; Time</th>
                  <th style={S.th}>Patient Name</th>
                  <th style={S.th}>Amount</th>
                  <th style={S.th}>Mode</th>
                  <th style={S.th}>Action</th>
                </tr>
              </thead>
              <tbody id="receipts-tbody">
                <Rows rows={data.sorted} patientsById={data.patientsById} query={query} mode={mode} />
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </ViewFrame>
  );
}

/**
 * filterReceipts() hid non-matching rows with `style.display = 'none'` rather
 * than removing them, and matched on the row's own data-patient / data-id /
 * data-mode attributes. Both are kept: same attributes, same display toggle.
 */
function Rows({ rows, patientsById, query, mode }) {
  if (!rows.length) {
    return (
      <tr>
        <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          No receipts found.
        </td>
      </tr>
    );
  }

  const q = query.toLowerCase();

  return rows.map((r) => {
    const patient = patientsById[r.patient_id] || {};
    const rowMode = (r.payment_mode || 'UNKNOWN').toUpperCase();
    const dataPatient = (patient.name || '').toLowerCase();
    const dataId = 'PAY' + r.receipt_id;
    const matches =
      (dataPatient.includes(q) || dataId.toLowerCase().includes(q)) &&
      (mode === 'ALL' || rowMode === mode);

    return (
      <tr
        key={r.receipt_id}
        className="receipt-row"
        style={{ borderBottom: '1px solid var(--color-border)', display: matches ? '' : 'none' }}
        data-patient={dataPatient}
        data-id={dataId}
        data-mode={rowMode}
      >
        <td style={{ ...S.td, color: 'var(--color-fg)', fontWeight: 600 }}>PAY{r.receipt_id}</td>
        <td style={{ ...S.td, color: 'var(--color-muted-fg)', fontSize: '13px' }}>
          {formatDateTime(r.generated_at)}
        </td>
        <td style={{ ...S.td, color: 'var(--color-fg)', fontWeight: 600 }}>{patient.name || '-'}</td>
        <td style={{ ...S.td, fontWeight: 800, color: 'var(--color-accent)' }}>
          {formatCurrency(r.amount)}
        </td>
        <td style={S.td}>
          <span className="badge">{rowMode}</span>
        </td>
        <td style={S.td}>
          <button
            className="btn-primary"
            style={S.tinyBtn}
            onClick={() => actions.printReceipt(r.receipt_id)}
          >
            🖨️ Print
          </button>
        </td>
      </tr>
    );
  });
}
