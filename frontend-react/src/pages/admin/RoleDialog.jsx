'use strict';

import { useEffect, useState } from 'react';
import Modal from '../../components/layout/Modal.jsx';
import { api } from '../../api/index.js';
import { toast } from '../../components/feedback/feedback.js';

/** Ported from the #role-dialog <dialog> in Admin/screen-04-admin.html. */
export default function RoleDialog({ open, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (open) {
      setName('');
      setDescription('');
    }
  }, [open]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const role = await api.rbac.createRole({
        role_name: name.trim(),
        description: description.trim() || undefined,
      });
      onClose();
      toast('Role "' + role.role_name + '" created.', 'success');
      await onCreated(role);
    } catch (err) {
      toast(err.message || 'Could not create role.', 'error');
    }
  }

  if (!open) return null;

  return (
    <Modal open onClose={onClose}>
      <div className="md-native-dialog" style={{ display: 'block' }}>
        <form id="role-form" className="dialog-form" onSubmit={handleSubmit}>
          <h2 className="md-dialog-title">Create a Custom Role</h2>
          <div className="md-field">
            <label htmlFor="role-name">Role name</label>
            <input id="role-name" required placeholder="e.g. Billing Manager" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="md-field">
            <label htmlFor="role-description">Description</label>
            <input id="role-description" placeholder="What can this role do?" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="md-dialog-actions">
            <button type="button" className="btn btn-outline btn-default" id="role-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-default">Create</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
