'use strict';

import { useState } from 'react';
import Modal from '../../components/layout/Modal.jsx';
import { statusChipClass, inr } from './platformHelpers.js';

/**
 * Ported from platform-dashboard.js#openOrgDetail, which used a native
 * <dialog>.showModal().
 *
 * The legacy version re-bound its [data-detail-tab] click listeners on every
 * open, so they accumulated (defect D8). A controlled component cannot
 * reproduce that; the tab state is plain React state here. This is one of the
 * three accepted invisible fixes listed in section 7 of the migration plan.
 */
export default function OrgDetailDialog({ org, onClose }) {
  const [tab, setTab] = useState('summary');
  if (!org) return null;

  return (
    <Modal open onClose={onClose} className="platform-detail-overlay">
      <div className="md-native-dialog md-native-dialog-wide" style={{ display: 'block' }}>
        <div className="dialog-form">
          <div className="detail-header">
            <h2 className="md-dialog-title" id="detail-org-name" style={{ margin: 0 }}>
              {org.name}
            </h2>
            <button type="button" className="md-btn md-btn-text" id="detail-close" onClick={onClose}>
              Close
            </button>
          </div>

          <div className="md-tabs" role="tablist">
            {[
              ['summary', 'Summary'],
              ['modules', 'Modules'],
              ['keys', 'API Keys'],
              ['log', 'Provisioning Log'],
            ].map(([id, label]) => (
              <button
                key={id}
                className={'md-tab' + (tab === id ? ' is-active' : '')}
                data-detail-tab={id}
                type="button"
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className={'detail-panel' + (tab === 'summary' ? '' : ' is-hidden')} id="detail-summary">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: '0.9rem' }}>
              <div><strong>Tenant ID:</strong> <code>tenant_{org.organization_id}</code></div>
              <div>
                <strong>Status:</strong>{' '}
                <span className={'md-chip ' + statusChipClass(org.status)}>{org.status}</span>
              </div>
              <div><strong>Hospital Branches:</strong> {org.hospitals}</div>
              <div><strong>Total Registered Patients:</strong> {org.patients}</div>
              <div><strong>Staff Accounts:</strong> {org.users}</div>
              <div><strong>Bed Occupancy:</strong> {org.beds_occupied} / {org.beds} beds</div>
              <div><strong>Monthly Subscription Fee:</strong> {inr(org.subscription ? org.subscription.price_monthly : 0)}/mo</div>
              <div><strong>Payments Collected:</strong> {inr(org.revenue ? org.revenue.payments_collected : 0)}</div>
            </div>
          </div>

          {/*
            The legacy dialog left these three panels empty - openOrgDetail only
            ever filled #detail-summary. Kept empty so nothing new appears.
          */}
          <div className={'detail-panel' + (tab === 'modules' ? '' : ' is-hidden')} id="detail-modules" />
          <div className={'detail-panel' + (tab === 'keys' ? '' : ' is-hidden')} id="detail-keys" />
          <div className={'detail-panel' + (tab === 'log' ? '' : ' is-hidden')} id="detail-log" />
        </div>
      </div>
    </Modal>
  );
}

