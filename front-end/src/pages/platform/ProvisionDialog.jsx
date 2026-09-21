'use strict';

import { useState } from 'react';
import Modal from '../../components/layout/Modal.jsx';
import { MODULE_CATALOG } from './platformHelpers.js';
import { api } from '../../api/index.js';
import { toast } from '../../components/feedback/feedback.js';

/** Ported from the #provision-dialog form in platform-dashboard.html. */
export default function ProvisionDialog({ open, onClose, onProvisioned }) {
  const [f, setF] = useState({ name: '', city: '', adminName: '', adminEmail: '', adminPassword: '' });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await api.platform.organizations.provision({
        name: f.name.trim(),
        city: f.city.trim(),
        admin_name: f.adminName.trim(),
        admin_email: f.adminEmail.trim(),
        admin_password: f.adminPassword,
        plan_id: 1,
        modules: MODULE_CATALOG.map((m) => m.code),
      });
      onClose();
      toast('Organization provisioned successfully.', 'success');
      onProvisioned();
    } catch (err) {
      toast(err.message || 'Failed to provision organization.', 'error');
    }
  }

  if (!open) return null;

  return (
    <Modal open onClose={onClose}>
      <div className="md-native-dialog" style={{ display: 'block' }}>
        <form id="provision-form" className="dialog-form" onSubmit={handleSubmit}>
          <h2 className="md-dialog-title">Provision a New Organization</h2>
          <div className="md-field"><label htmlFor="p-name">Organization name</label><input id="p-name" required placeholder="Enter organization name" value={f.name} onChange={set('name')} /></div>
          <div className="md-field"><label htmlFor="p-city">Primary city</label><input id="p-city" placeholder="Enter primary city" value={f.city} onChange={set('city')} /></div>
          <div className="md-field"><label htmlFor="p-admin-name">Default admin {'—'} name</label><input id="p-admin-name" required placeholder="Enter admin name" value={f.adminName} onChange={set('adminName')} /></div>
          <div className="md-field"><label htmlFor="p-admin-email">Default admin {'—'} email</label><input id="p-admin-email" type="email" required placeholder="admin@hospital.com" value={f.adminEmail} onChange={set('adminEmail')} /></div>
          <div className="md-field"><label htmlFor="p-admin-password">Default admin {'—'} password</label><input id="p-admin-password" type="password" required placeholder="Enter secure password" value={f.adminPassword} onChange={set('adminPassword')} /></div>
          <div className="md-dialog-actions">
            <button type="button" className="md-btn md-btn-text" id="provision-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="md-btn md-btn-filled" id="provision-submit">Provision</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
