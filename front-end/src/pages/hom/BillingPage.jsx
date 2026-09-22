'use strict';

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/index.js';
import { useApi } from '../../hooks/useApi.js';
import { usePolling } from '../../hooks/usePolling.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useSearchParam } from '../../hooks/useSearchParam.js';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import DataTable from '../../components/ui/DataTable.jsx';
import { csvEscape, downloadCsv } from '../../lib/csv.js';
import { toast } from '../../components/feedback/feedback.js';
import { formatCurrency, formatDate } from './homHelpers.js';
import PostServiceModal from './PostServiceModal.jsx';
import BillingDetailModal from './BillingDetailModal.jsx';
import { usePageStyles } from '../../hooks/usePageStyles.js';
import billingCss from '../../styles/hom/billing.css?inline';

function ledgerStatusVariant(status) {
  if (status === 'PAID') return 'success';
  if (status === 'DISPATCHED') return 'warning';
  if (status === 'OPEN') return 'info';
  return 'neutral';
}

/** Ported from HOM/screen-05-billing.html + billing.js. */
export default function HomBillingPage() {
  usePageStyles(billingCss);
  useDocumentTitle('Billing Ledger | Federico Hospital HOM');
  const navigate = useNavigate();
  const uhidParam = useSearchParam('uhid');

  const [search, setSearch] = useState(uhidParam || '');
  const [statusFilter, setStatusFilter] = useState('');
  const [postOpen, setPostOpen] = useState(false);
  const [detailLedgerId, setDetailLedgerId] = useState(null);

  // loadBillingData() wrapped the whole load in a try/catch that toasted
  // `Failed to load billing data: <message>`. Every endpoint below has its own
  // .catch(() => []), so that only fires when the shaping code throws - but it
  // is this page's one load-failure signal, so it is reproduced.
  const { data, error, reload } = useApi(async () => {
    const [ledgers, admissions, patients, beds, preRequests, services] = await Promise.all([
      api.billing.ledger.listAll().catch(() => []),
      api.admissions.list().catch(() => []),
      api.patients.list().catch(() => []),
      api.wards.beds().catch(() => []),
      api.preRequests.list().catch(() => []),
      api.billing.services.list().catch(() => []),
    ]);

    const admissionsById = Object.fromEntries((admissions || []).map((a) => [a.admission_id, a]));
    const patientsById = Object.fromEntries((patients || []).map((p) => [p.patient_id, p]));
    const bedsById = Object.fromEntries((beds || []).map((b) => [b.bed_id, b]));
    const servicesById = Object.fromEntries((services || []).map((s) => [s.service_id, s]));

    // Only active (non-discharged) admissions appear in the Post Service dropdown.
    const availableAdmissions = (admissions || [])
      .filter((a) => a.status !== 'DISCHARGED')
      .map((a) => {
        const patient = patientsById[a.patient_id] || {};
        return {
          admission_id: a.admission_id,
          patient_id: a.patient_id,
          patientName: patient.name || 'Patient',
          uhid: patient.uhid || '',
        };
      });

    // One entries request per ledger, fanned out concurrently.
    const entriesByLedger = {};
    await Promise.all(
      (ledgers || []).map(async (ledger) => {
        entriesByLedger[ledger.ledger_id] = await api.billing.ledger.entries(ledger.ledger_id).catch(() => []);
      }),
    );

    const rows = (ledgers || []).map((ledger) => {
      const admission = admissionsById[ledger.admission_id] || null;
      const patient = admission ? patientsById[admission.patient_id] || null : null;
      const bed = admission ? bedsById[admission.bed_id] || null : null;
      const preRequest = admission ? (preRequests || []).find((r) => r.patient_id === admission.patient_id) : null;
      const entries = entriesByLedger[ledger.ledger_id] || [];
      return {
        ledger,
        admission,
        patient,
        bed,
        department: preRequest?.department || admission?.department || '—',
        entries,
        total: entries.reduce((sum, e) => sum + Number(e.amount || 0), 0),
      };
    });

    return { rows, servicesById, availableServices: services || [], availableAdmissions };
  }, []);

  // Reported once per distinct failure so the 15s poll cannot stack duplicates.
  const reportedErrorRef = useRef(null);
  useEffect(() => {
    if (!error || reportedErrorRef.current === error) return;
    reportedErrorRef.current = error;
    toast('Failed to load billing data: ' + (error.message || 'Unknown error'), 'error');
  }, [error]);

  usePolling(reload, 15000);

  const d = data || { rows: [], servicesById: {}, availableServices: [], availableAdmissions: [] };
  const q = search.trim().toLowerCase();

  const filtered = d.rows.filter((row) => {
    if (statusFilter && row.ledger.status !== statusFilter) return false;
    if (q) {
      const haystack = [row.patient?.name, row.patient?.uhid, row.department, row.bed?.bed_number, row.ledger.status]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const totalBilled = d.rows.reduce((s, r) => s + r.total, 0);
  const pendingCount = d.rows.filter((r) => r.ledger.status === 'OPEN' || r.ledger.status === 'DISPATCHED').length;
  const paidCount = d.rows.filter((r) => r.ledger.status === 'PAID').length;
  const avgVisible = filtered.length ? Math.round(filtered.reduce((s, r) => s + r.total, 0) / filtered.length) : 0;

  function exportRows() {
    if (!filtered.length) {
      toast('No ledgers to export for the current filter.', 'warning');
      return;
    }
    const csv = [
      ['Patient', 'UHID', 'Department', 'Bed', 'Admission Date', 'Total Billed', 'Status'].join(','),
      ...filtered.map((r) =>
        [r.patient?.name, r.patient?.uhid, r.department, r.bed?.bed_number, r.admission?.admitted_at || r.admission?.created_at, r.total, r.ledger.status]
          .map(csvEscape)
          .join(','),
      ),
    ].join('\n');
    downloadCsv('hom-billing-ledger-' + new Date().toISOString().slice(0, 10) + '.csv', csv);
  }

  const kpi = (label, value, footer, color) => (
    <div className="kpi-card">
      <div>
        <div className="kpi-label">{label}</div>
        <div className="kpi-value" style={color ? { color } : undefined}>{value}</div>
      </div>
      <div className="kpi-footer">{footer}</div>
    </div>
  );

  return (
    <>
      <main className="dashboard-container">
        <div className="header-section">
          <div>
            <h1 className="h1" style={{ marginBottom: 8 }}>Patient Billing Ledger</h1>
            <p className="body-text">Administrative billing overview {'—'} room charges, services, and supply costs</p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button className="btn btn-secondary btn-default" id="billing-export" onClick={exportRows}>Export CSV</button>
            <button className="btn btn-primary btn-default" id="btn-open-post-service" onClick={() => setPostOpen(true)}>+ Post Service</button>
          </div>
        </div>

        <div className="info-banner">
          <strong>View-Only Notice:</strong> HOM may post a service charge for review by Finance
          Associate (FA). Once submitted, FA processes final approval and ledger dispatch.
        </div>

        <div className="metrics-grid" id="metrics-container">
          {kpi('Total Ledgers', d.rows.length, <Badge variant="info">{filtered.length + ' Visible'}</Badge>)}
          {kpi('Gross Billed', formatCurrency(totalBilled), <Badge variant="success">All Time</Badge>, 'var(--status-success-fg, #1b5e20)')}
          {kpi('Pending Finalization', pendingCount,
            <Badge variant={pendingCount > 0 ? 'warning' : 'success'}>
              {pendingCount > 0 ? pendingCount + ' Open/Dispatched' : 'All Settled'}
            </Badge>,
            pendingCount > 0 ? 'var(--status-warning-fg, #7a5300)' : undefined)}
          {kpi('Paid Ledgers', paidCount,
            <Badge variant={paidCount > 0 ? 'success' : 'neutral'}>{'Avg ' + formatCurrency(avgVisible)}</Badge>)}
        </div>

        <div className="filter-bar" style={{ borderRadius: 'var(--radius-lg)', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
          <input type="text" className="input" placeholder="Search by patient name or UHID..." style={{ flex: 2, minWidth: 220 }} id="billing-search"
            value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="input" id="billing-status-filter" style={{ flex: 1, minWidth: 150, appearance: 'auto' }}
            value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="DISPATCHED">Dispatched</option>
            <option value="PAID">Paid</option>
          </select>
          <button className="btn btn-outline btn-default" style={{ height: 44 }} id="billing-clear-filters"
            onClick={() => { setSearch(''); setStatusFilter(''); }}>
            Clear
          </button>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px 16px 24px', borderBottom: '1px solid var(--border)', background: 'var(--md-surface-container)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 className="h2" style={{ fontSize: 18, margin: 0 }}>Active Patient Ledgers</h2>
              <p className="body-text" style={{ fontSize: 13, marginTop: 2 }}>Real-time billing status for all inpatient admissions</p>
            </div>
          </div>
          <div className="table-scroll-container" style={{ maxHeight: 540, minHeight: 320, border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr><th>Patient</th><th>UHID</th><th>Department</th><th>Bed</th><th>Admission Date</th><th>Total Billed</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody id="billing-tbody">
                <DataTable
                  items={filtered}
                  colspan={8}
                  emptyMessage="No billing ledgers match the current search or filter."
                  renderRow={(row) => (
                    <tr key={row.ledger.ledger_id}>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{row.patient?.name || '—'}</td>
                      <td style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: 12 }}>{row.patient?.uhid || '—'}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{row.department}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{row.bed?.bed_number || '—'}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{formatDate(row.admission?.admitted_at || row.admission?.created_at)}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(row.total)}</td>
                      <td><Badge variant={ledgerStatusVariant(row.ledger.status)}>{row.ledger.status}</Badge></td>
                      <td>
                        <Button variant="secondary" size="sm" onClick={() => setDetailLedgerId(row.ledger.ledger_id)}>View Detail</Button>
                      </td>
                    </tr>
                  )}
                />
              </tbody>
            </table>
          </div>

          <div style={{ padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', background: 'var(--md-surface-container)' }}>
            <p className="text-small" id="pagination-text">
              {!data
                ? 'Loading ledgers...'
                : filtered.length === d.rows.length
                  ? 'Showing all ' + filtered.length + ' ledger' + (filtered.length === 1 ? '' : 's')
                  : 'Showing ' + filtered.length + ' of ' + d.rows.length + ' ledgers (filtered)'}
            </p>
          </div>
        </div>
      </main>

      <PostServiceModal
        open={postOpen}
        admissions={d.availableAdmissions}
        services={d.availableServices}
        onClose={() => setPostOpen(false)}
        onChanged={reload}
      />

      <BillingDetailModal
        row={d.rows.find((r) => r.ledger.ledger_id === detailLedgerId) || null}
        servicesById={d.servicesById}
        onClose={() => setDetailLedgerId(null)}
        onViewPatient={(uhid) => navigate('/HOM/screen-03-patient-flow.html?uhid=' + encodeURIComponent(uhid))}
      />
    </>
  );
}

