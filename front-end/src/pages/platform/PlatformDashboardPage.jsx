'use strict';

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/index.js';
import { useSession } from '../../auth/useSession.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { toast } from '../../components/feedback/feedback.js';
import { inr, statusChipClass } from './platformHelpers.js';
import ProvisionDialog from './ProvisionDialog.jsx';
import OrgDetailDialog from './OrgDetailDialog.jsx';
import { usePageStyles } from '../../hooks/usePageStyles.js';
import platformCss from '../../styles/platform/platform.css?inline';

/**
 * Ported from platform/platform-dashboard.html + platform-dashboard.js.
 *
 * Both native <dialog>.showModal() calls become controlled components, and the
 * three tab panels become state. The data flow is unchanged: one
 * GET /platform/usage feeds the overview stats, the revenue breakdown, the
 * tenant cards and the tenants table.
 */
function Stat({ value, label, revenue }) {
  return (
    <div className={'stat-card' + (revenue ? ' revenue-card' : '')}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function OverviewTab({ usage, orgs, activity, onOpenOrg }) {
  if (!usage) {
    return (
      <>
        <div className="stat-grid" id="platform-stats">
          <div className="md-empty-state"><span>Loading platform metrics&hellip;</span></div>
        </div>
      </>
    );
  }

  // The backend moved from per-plan to per-service revenue; the legacy file
  // rendered whichever it got, so both branches are kept.
  const byService = usage.revenue_by_service;
  const byPlan = usage.revenue_by_plan;

  return (
    <>
      <div className="stat-grid" id="platform-stats">
        <Stat revenue value={inr(usage.total_mrr)} label="Total MRR (Monthly Income)" />
        <Stat revenue value={inr(usage.total_arr)} label="Annual Run Rate (ARR)" />
        <Stat revenue value={inr(usage.total_payments_collected)} label="Payments Collected (All Tenants)" />
        <Stat value={usage.total_organizations || 0} label="Total Organizations" />
        <Stat value={usage.active_organizations || 0} label="Active Tenants" />
        <Stat value={usage.total_hospitals || 0} label="Hospital Branches" />
        <Stat value={usage.total_patients || 0} label="Registered Patients" />
        <Stat value={usage.total_active_admissions || 0} label="Active Inpatients (Platform-wide)" />
        <Stat value={usage.total_users || 0} label="Staff & User Accounts" />
      </div>

      <h2 className="section-heading">Platform Revenue by Service &amp; Usage</h2>
      <div className="plan-rev-grid" id="plan-revenue-grid">
        {byService && Object.keys(byService).length ? (
          Object.keys(byService).map((code) => {
            const d = byService[code];
            return (
              <div className="plan-rev-card" key={code}>
                <div className="plan-rev-title">
                  <span>{d.name || code}</span>
                  <span className="md-chip md-chip-tonal">{inr(d.price_monthly)}/mo</span>
                </div>
                <div className="plan-rev-amount">
                  {inr(d.total_income)}
                  <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--md-on-surface-variant)' }}> /mo</span>
                </div>
                <div className="plan-rev-sub">{d.active_instances || 0} branch instance(s) running</div>
              </div>
            );
          })
        ) : byPlan && Object.keys(byPlan).length ? (
          Object.keys(byPlan).map((name) => {
            const d = byPlan[name];
            return (
              <div className="plan-rev-card" key={name}>
                <div className="plan-rev-title">
                  <span>{name}</span>
                  <span className="md-chip md-chip-tonal">{inr(d.price_monthly)}/mo</span>
                </div>
                <div className="plan-rev-amount">
                  {inr(d.total_income)}
                  <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--md-on-surface-variant)' }}> /mo</span>
                </div>
                <div className="plan-rev-sub">{d.active_subscriptions || 0} active tenant(s)</div>
              </div>
            );
          })
        ) : (
          <div className="md-empty-state"><span>No active service revenue lines yet.</span></div>
        )}
      </div>

      <h2 className="section-heading">Active Hospital Tenants at a Glance</h2>
      <div className="org-mini-grid" id="overview-org-list">
        {orgs.length === 0 ? (
          <div className="md-empty-state"><span>No organizations yet.</span></div>
        ) : (
          orgs.map((org) => {
            const pf = org.patient_flow || {};
            const rev = org.revenue || {};
            const planName = org.subscription ? org.subscription.plan_name : 'Pay-As-You-Scale';
            const monthlyFee = org.subscription ? inr(org.subscription.price_monthly) + '/mo' : '—';
            return (
              <div
                className="org-mini-card"
                key={org.organization_id}
                data-org-id={org.organization_id}
                onClick={() => onOpenOrg(org.organization_id)}
              >
                <div className="org-mini-head">
                  <span className="org-mini-mark">{org.name.charAt(0).toUpperCase()}</span>
                  <div>
                    <div className="org-mini-name">{org.name}</div>
                    <span className={'md-chip ' + statusChipClass(org.status)}>{org.status}</span>
                  </div>
                </div>
                <div className="org-mini-meta">Plan: <strong>{planName}</strong> ({monthlyFee})</div>
                <div className="org-mini-meta" style={{ marginTop: 4 }}>
                  {org.hospitals} branch(es) {'·'} {org.users} users {'·'} {org.patients} patients {'·'} {org.beds_occupied}/{org.beds} beds
                </div>
                <div className="org-mini-meta" style={{ marginTop: 4 }}>
                  Clinical Flow: {pf.admitted || 0} admitted {'·'} {pf.discharge_in_progress || 0} in discharge {'·'} {pf.pre_requests_pending || 0} pending
                </div>
                <div className="org-mini-meta" style={{ marginTop: 4 }}>
                  Collections: <strong>{inr(rev.payments_collected)}</strong> {'·'} {rev.open_ledgers || 0} open / {rev.paid_ledgers || 0} settled ledgers
                </div>
                <div className="module-pill-list" style={{ marginTop: 8 }}>
                  {(org.enabled_modules || []).length ? (
                    (org.enabled_modules || []).map((m) => (
                      <span className="module-pill active" key={m}>{m}</span>
                    ))
                  ) : (
                    <span className="module-pill">All Core Modules</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <h2 className="section-heading">Recent Platform Activity Audit Log</h2>
      <div className="activity-card" id="platform-activity-feed">
        {activity === null ? (
          <div className="md-empty-state"><span>Loading activity log&hellip;</span></div>
        ) : activity === false ? (
          <div className="md-empty-state"><span>Could not load activity feed.</span></div>
        ) : activity.length === 0 ? (
          <div className="md-empty-state"><span>No platform activity recorded yet.</span></div>
        ) : (
          activity.slice(0, 10).map((item, i) => {
            const orgName = item.target_organization_id
              ? orgs.find((o) => o.organization_id === item.target_organization_id)?.name ||
                'Org #' + item.target_organization_id
              : 'Platform';
            return (
              <div className="activity-item" key={i}>
                <div className="activity-dot" />
                <div className="activity-content">
                  <div className="activity-action"><strong>{item.action}</strong> {'·'} {orgName}</div>
                  <div className="activity-meta">{item.details || ''}</div>
                </div>
                <div className="activity-time">{new Date(item.created_at).toLocaleTimeString()}</div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

function OrganizationsTab({ orgs, onOpenOrg, onToggleStatus }) {
  return (
    <>
      <div className="panel-toolbar">
        <h2 className="section-heading" style={{ margin: 0 }}>
          Hospital Organizations &amp; Multi-Tenant Workspaces
        </h2>
        <button
          className="md-btn md-btn-filled"
          id="new-org-btn"
          style={{ borderRadius: 'var(--radius-full, 9999px)', padding: '10px 22px' }}
          onClick={onOpenOrg.provision}
        >
          + Provision New Organization
        </button>
      </div>
      <div className="org-table-card" style={{ overflowX: 'auto' }}>
        <table className="md-table" id="org-table">
          <thead>
            <tr>
              <th>Organization</th><th>Tenant ID</th><th>Status</th><th>Billing Model</th>
              <th>Monthly Fee</th><th>Subscribed Modules</th><th>Branches</th><th>Users</th>
              <th>Beds</th><th>Clinical Flow</th><th>Actions</th>
            </tr>
          </thead>
          <tbody id="org-table-body">
            {orgs.length === 0 ? (
              <tr><td colSpan="11" className="empty-cell">No organizations found.</td></tr>
            ) : (
              orgs.map((org) => {
                const pf = org.patient_flow || {};
                const isSuspended = org.status === 'SUSPENDED';
                return (
                  <tr key={org.organization_id}>
                    <td><strong>{org.name}</strong></td>
                    <td><code>tenant_{org.organization_id}</code></td>
                    <td><span className={'md-chip ' + statusChipClass(org.status)}>{org.status}</span></td>
                    <td>{org.subscription ? org.subscription.plan_name : 'Pay-As-You-Scale'}</td>
                    <td><strong>{org.subscription ? inr(org.subscription.price_monthly) : '—'}</strong></td>
                    <td>{(org.enabled_modules || []).length} modules</td>
                    <td>{org.hospitals}</td>
                    <td>{org.users}</td>
                    <td>{org.beds_occupied} / {org.beds}</td>
                    <td>{pf.admitted || 0} inpatients {'·'} {pf.appointments || 0} appts</td>
                    <td className="table-actions">
                      <button
                        className="md-btn md-btn-outlined md-btn-sm"
                        style={{ borderRadius: 'var(--radius-full, 9999px)', padding: '4px 14px', fontSize: 11, marginRight: 6 }}
                        onClick={() => onOpenOrg.detail(org.organization_id)}
                      >
                        Manage
                      </button>
                      <button
                        className="md-btn md-btn-text md-btn-sm"
                        style={{
                          borderRadius: 'var(--radius-full, 9999px)',
                          padding: '4px 12px',
                          fontSize: 11,
                          color: isSuspended ? 'var(--status-success, #2e7d32)' : 'var(--status-error, #b3261e)',
                        }}
                        onClick={() => onToggleStatus(org.organization_id, isSuspended ? 'activate' : 'suspend')}
                      >
                        {isSuspended ? 'Activate' : 'Suspend'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

const RATE_FIELDS = [
  ['rate-gen-beds', 'GENERAL_BEDS', 'General Ward Beds (₹ / bed / mo)', 150],
  ['rate-icu-beds', 'ICU_BEDS', 'ICU Critical Care Beds (₹ / bed / mo)', 600],
  ['rate-priv-beds', 'PRIVATE_BEDS', 'Private / Semi-Private Beds (₹ / bed / mo)', 350],
  ['rate-doc-seats', 'DOCTOR_SEATS', 'Doctor Directory Seats (₹ / doc / mo)', 150],
  ['rate-staff-seats', 'STAFF_SEATS', 'Staff User Accounts (HOM/PRE/FA) (₹ / seat / mo)', 200],
  ['rate-terminals', 'BILLING_TERMINALS', 'Billing Terminals (₹ / terminal / mo)', 500],
  ['rate-warehouses', 'WAREHOUSES', 'Central Warehouses (₹ / warehouse / mo)', 1000],
  ['rate-admissions', 'PATIENT_ADMISSIONS', 'Variable Admission Fee (₹ / patient admission)', 10],
];

function RatesTab({ rates, baseFee, setRates, setBaseFee, onSave }) {
  const field = (id, key, label) => (
    <div className="md-field" style={{ marginBottom: 12 }} key={id}>
      <label htmlFor={id}>{label}</label>
      <input
        type="number"
        id={id}
        min="0"
        value={rates[key] ?? ''}
        onChange={(e) => setRates((p) => ({ ...p, [key]: e.target.value }))}
      />
    </div>
  );

  return (
    <>
      <div className="panel-toolbar">
        <div>
          <h2 className="section-heading" style={{ margin: 0 }}>Global SaaS Pricing Rate Card</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--md-on-surface-variant)', margin: '4px 0 0 0' }}>
            Adjust base platform fees and pay-as-you-scale resource rates across all multi-tenant
            hospital branches in real-time.
          </p>
        </div>
        <button
          className="md-btn md-btn-filled"
          id="btn-save-rates"
          style={{ borderRadius: 'var(--radius-full, 9999px)', padding: '10px 24px', fontWeight: 600 }}
          onClick={onSave}
        >
          Save Dynamic Rate Card
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 16 }}>
        <div className="rate-card rate-card-highlight">
          <h3>Base Platform License Fee</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--md-on-surface-variant)', margin: '0 0 16px 0' }}>
            Flat monthly baseline per branch instance (includes all 8 core clinical and
            administrative modules).
          </p>
          <div className="md-field" style={{ maxWidth: 320 }}>
            <label htmlFor="rate-base-fee">Base Fee ({'₹'} / month / branch)</label>
            <input type="number" id="rate-base-fee" min="0" value={baseFee} onChange={(e) => setBaseFee(e.target.value)} />
          </div>
        </div>

        <div className="rate-card">
          <h3>Inpatient Bed Rates</h3>
          {RATE_FIELDS.slice(0, 3).map(([id, key, label]) => field(id, key, label))}
        </div>

        <div className="rate-card">
          <h3>Directory &amp; Staff Accounts</h3>
          {RATE_FIELDS.slice(3, 5).map(([id, key, label]) => field(id, key, label))}
        </div>

        <div className="rate-card">
          <h3>Hardware &amp; Facilities</h3>
          {RATE_FIELDS.slice(5, 7).map(([id, key, label]) => field(id, key, label))}
        </div>

        <div className="rate-card">
          <h3>Patient Admission Volume</h3>
          {RATE_FIELDS.slice(7).map(([id, key, label]) => field(id, key, label))}
        </div>
      </div>
    </>
  );
}

export default function PlatformDashboardPage() {
  usePageStyles(platformCss);
  useDocumentTitle('Federico Platform — Super User Dashboard');
  const navigate = useNavigate();
  const { session, logout } = useSession();

  const [tab, setTab] = useState('overview');
  const [usage, setUsage] = useState(null);
  const [orgs, setOrgs] = useState([]);
  const [activity, setActivity] = useState(null);
  const [detailOrgId, setDetailOrgId] = useState(null);
  const [provisionOpen, setProvisionOpen] = useState(false);

  const [baseFee, setBaseFee] = useState(3000);
  const [rates, setRates] = useState(
    RATE_FIELDS.reduce((acc, [, key, , fallback]) => ({ ...acc, [key]: fallback }), {}),
  );

  /**
   * platform-dashboard.js had two loaders that both called platform.usage():
   * loadOverview() for the stats panel and loadOrganizationsTable() for the
   * table. They are kept separate because they report different failures -
   * merging them would silently drop the "Could not load organizations."
   * message the Organizations tab shows.
   */
  const loadUsage = useCallback(async () => {
    try {
      const data = await api.platform.usage();
      setUsage(data);
      return data;
    } catch (err) {
      setUsage(false);
      toast(err.message || 'Could not load platform usage.', 'error');
      return null;
    }
  }, []);

  const loadOrgs = useCallback(async () => {
    try {
      const data = await api.platform.usage();
      setOrgs(data.organizations || []);
      return data;
    } catch (err) {
      toast(err.message || 'Could not load organizations.', 'error');
      return null;
    }
  }, []);

  const loadActivity = useCallback(async () => {
    try {
      setActivity(await api.platform.activityLog());
    } catch {
      setActivity(false);
    }
  }, []);

  const loadRates = useCallback(async () => {
    try {
      const data = await api.platform.rates.get();
      if (!data) return;
      // Note the field name: base_platform_fee. The org-signup page reads
      // base_fee instead and so never picks this up (defect D3).
      setBaseFee(data.base_platform_fee || 3000);
      const r = data.rates || {};
      setRates((prev) => {
        const next = { ...prev };
        RATE_FIELDS.forEach(([, key, , fallback]) => {
          next[key] = r[key] !== undefined ? r[key] : fallback;
        });
        return next;
      });
    } catch (err) {
      toast(err.message || 'Could not load global rate card.', 'error');
    }
  }, []);

  useEffect(() => {
    (async () => {
      await loadUsage();
      await loadOrgs();
      await loadActivity();
      await loadRates();
    })();
  }, [loadUsage, loadOrgs, loadActivity, loadRates]);

  async function toggleOrgStatus(id, action) {
    try {
      if (action === 'suspend') await api.platform.organizations.suspend(id);
      else await api.platform.organizations.activate(id);
      toast('Organization status updated.', 'success');
      await loadUsage();
      await loadOrgs();
    } catch (err) {
      toast(err.message || 'Failed to update status.', 'error');
    }
  }

  async function saveRates() {
    const payload = {
      base_platform_fee: Number(baseFee) || 3000,
      rates: RATE_FIELDS.reduce((acc, [, key, , fallback]) => {
        acc[key] = Number(rates[key]) || fallback;
        return acc;
      }, {}),
    };
    // The legacy page also mirrored the private-bed rate into
    // SEMI_PRIVATE_BEDS, which has no input of its own.
    payload.rates.SEMI_PRIVATE_BEDS = Number(rates.PRIVATE_BEDS) || 350;

    try {
      await api.platform.rates.update(payload);
      toast('Global SaaS rate card updated successfully.', 'success');
      await loadUsage();
    } catch (err) {
      toast(err.message || 'Failed to update rates.', 'error');
    }
  }

  const detailOrg = orgs.find((o) => o.organization_id === detailOrgId) || null;

  return (
    <>
      <header className="md-topbar">
        <div className="md-brand">
          <span className="md-brand-mark">F</span>
          <span>Federico Platform</span>
          <span className="platform-badge">Super User</span>
        </div>
        <div className="topbar-actions">
          <span className="user-pill" id="current-user-label">
            {session ? session.displayName + ' · ' + session.email : ''}
          </span>
          <button
            className="md-btn md-btn-outlined"
            id="logout-btn"
            style={{ borderRadius: 'var(--radius-full, 9999px)', padding: '6px 16px', fontSize: 12 }}
            onClick={async () => {
              await api.platform.auth.logout();
              await logout();
              navigate('/platform/platform-login.html');
            }}
          >
            Log out
          </button>
        </div>
      </header>

      <main className="md-container platform-page">
        <div className="md-tabs" role="tablist">
          {[
            ['overview', 'Overview & Analytics'],
            ['organizations', 'Hospital Tenants'],
            ['rates', 'Pricing & Rate Card'],
          ].map(([id, label]) => (
            <button
              key={id}
              className={'md-tab' + (tab === id ? ' is-active' : '')}
              data-tab={id}
              type="button"
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <section className={'tab-panel md-fade-switch' + (tab === 'overview' ? '' : ' is-hidden')} id="panel-overview">
          <OverviewTab usage={usage} orgs={orgs} activity={activity} onOpenOrg={setDetailOrgId} />
        </section>

        <section className={'tab-panel md-fade-switch' + (tab === 'organizations' ? '' : ' is-hidden')} id="panel-organizations">
          <OrganizationsTab
            orgs={orgs}
            onOpenOrg={{ detail: setDetailOrgId, provision: () => setProvisionOpen(true) }}
            onToggleStatus={toggleOrgStatus}
          />
        </section>

        <section className={'tab-panel md-fade-switch' + (tab === 'rates' ? '' : ' is-hidden')} id="panel-rates">
          <RatesTab rates={rates} baseFee={baseFee} setRates={setRates} setBaseFee={setBaseFee} onSave={saveRates} />
        </section>
      </main>

      <ProvisionDialog
        open={provisionOpen}
        onClose={() => setProvisionOpen(false)}
        onProvisioned={async () => {
          await loadUsage();
          await loadOrgs();
        }}
      />
      <OrgDetailDialog org={detailOrg} onClose={() => setDetailOrgId(null)} />
    </>
  );
}
