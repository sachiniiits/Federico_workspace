'use strict';

import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/index.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { toast } from '../../components/feedback/feedback.js';
import RoleDialog from './RoleDialog.jsx';

function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Ported from Admin/screen-04-admin.html + admin.js.
 *
 * The permission checkboxes stay optimistic: the box flips immediately, and on
 * a failed request it flips back and the error is toasted - same as before.
 */
export default function RolesStaffPage() {
  useDocumentTitle('Roles & Staff | Federico Hospital Admin');

  const [roles, setRoles] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [grantedIds, setGrantedIds] = useState(null); // null = loading, false = error
  const [staff, setStaff] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [brandingFile, setBrandingFile] = useState(null);
  const [brandingUpload, setBrandingUpload] = useState(null);
  const [uploading, setUploading] = useState(false);

  const loadRoles = useCallback(async () => {
    try {
      const [r, p] = await Promise.all([
        api.rbac.roles().catch(() => []),
        api.rbac.permissions().catch(() => []),
      ]);
      setRoles(r || []);
      setPermissions(p || []);
    } catch (err) {
      setRoles(false);
      toast(err.message || 'Could not load custom roles.', 'error');
    }
  }, []);

  const loadStaff = useCallback(async () => {
    try {
      setStaff((await api.rbac.staff().catch(() => [])) || []);
    } catch (err) {
      setStaff(false);
      toast(err.message || 'Could not load staff.', 'error');
    }
  }, []);

  useEffect(() => {
    loadRoles();
    loadStaff();
  }, [loadRoles, loadStaff]);

  const selectRole = useCallback(async (roleId) => {
    setSelectedRoleId(roleId);
    setGrantedIds(null);
    try {
      const granted = await api.rbac.permissionsForRole(roleId);
      setGrantedIds((granted || []).map((p) => p.permission_id));
    } catch (err) {
      setGrantedIds(false);
      toast(err.message || 'Could not load permissions.', 'error');
    }
  }, []);

  async function togglePermission(permissionId, nextChecked) {
    setGrantedIds((prev) =>
      nextChecked ? [...prev, permissionId] : prev.filter((id) => id !== permissionId),
    );
    try {
      if (nextChecked) {
        await api.rbac.assignPermission(selectedRoleId, permissionId);
        toast('Permission granted.', 'success');
      } else {
        await api.rbac.unassignPermission(selectedRoleId, permissionId);
        toast('Permission revoked.', 'warning');
      }
    } catch (err) {
      setGrantedIds((prev) =>
        nextChecked ? prev.filter((id) => id !== permissionId) : [...prev, permissionId],
      );
      toast(err.message || 'Could not update permission.', 'error');
    }
  }

  async function uploadBranding() {
    if (!brandingFile) {
      toast('Choose a logo file first.', 'warning');
      return;
    }
    setUploading(true);
    try {
      const result = await api.uploads.branding(brandingFile);
      setBrandingUpload(result);
      toast('Logo uploaded (' + formatFileSize(result.sizeBytes) + ').', 'success');
      setBrandingFile(null);
    } catch (err) {
      toast(err.message || 'Could not upload logo.', 'error');
    } finally {
      setUploading(false);
    }
  }

  const selectedRole = (roles || []).find((r) => r.custom_role_id === selectedRoleId) || null;

  return (
    <main className="dashboard-container">
      <div className="header-section">
        <div>
          <h1 className="h1" style={{ marginBottom: 8 }}>Organization Admin</h1>
          <p className="body-text">
            Create custom roles and grant your hospital staff extra access beyond their base role
            permissions.
          </p>
        </div>
      </div>

      <div className="admin-grid">
        <div className="card">
          <div className="card-header" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 className="card-title">Custom Roles</h2>
              <p className="card-description">Click a role to manage its permissions.</p>
            </div>
          </div>
          <div className="card-content">
            <div id="roles-list">
              {roles === null ? (
                <div className="md-empty-state"><span>Loading roles&hellip;</span></div>
              ) : roles === false ? (
                <div className="md-empty-state"><span>Could not load roles.</span></div>
              ) : roles.length === 0 ? (
                <div className="md-empty-state">
                  <strong>No custom roles yet.</strong>
                  <span>Create one to grant extra access to a specific staff member.</span>
                </div>
              ) : (
                roles.map((role) => (
                  <div
                    key={role.custom_role_id}
                    className={'role-row' + (role.custom_role_id === selectedRoleId ? ' is-selected' : '')}
                    data-role-id={role.custom_role_id}
                    onClick={() => selectRole(role.custom_role_id)}
                  >
                    <div>
                      <div className="role-row-name">{role.role_name}</div>
                      <div className="role-row-meta">{role.description || 'No description'}</div>
                    </div>
                    <span className="badge badge-neutral">Edit</span>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="card-footer">
            <button className="btn btn-primary btn-default" id="new-role-btn" style={{ width: '100%' }} onClick={() => setDialogOpen(true)}>
              + Create Role
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title" id="permissions-card-title">{selectedRole ? selectedRole.role_name : 'Select a role'}</h2>
            <p className="card-description" id="permissions-card-desc">
              {selectedRole ? 'Toggle which permissions this role grants.' : 'Choose a custom role on the left to grant it permissions.'}
            </p>
          </div>
          <div className="card-content">
            <div className="permission-checklist" id="permissions-checklist">
              {!selectedRole ? (
                <div className="md-empty-state"><span>No role selected.</span></div>
              ) : grantedIds === null ? (
                <div className="md-empty-state"><span>Loading permissions&hellip;</span></div>
              ) : grantedIds === false ? (
                <div className="md-empty-state"><span>Could not load permissions.</span></div>
              ) : (
                permissions.map((permission) => (
                  <label
                    key={permission.permission_id}
                    className="permission-row"
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                  >
                    <input
                      type="checkbox"
                      data-permission-id={permission.permission_id}
                      checked={grantedIds.includes(permission.permission_id)}
                      onChange={(e) => togglePermission(permission.permission_id, e.target.checked)}
                      style={{ width: 16, height: 16 }}
                    />
                    <div>
                      <code style={{ fontWeight: 700 }}>{permission.permission_code}</code>
                      <span style={{ color: 'var(--text-secondary)', fontSize: 12, display: 'block' }}>
                        {permission.description || ''}
                      </span>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header">
          <h2 className="card-title">Hospital Branding Assets</h2>
          <p className="card-description">
            Upload a logo file (PNG/JPEG/WEBP, max 5MB). It&apos;s stored on the server and previewed
            below via the File Upload API.
          </p>
        </div>
        <div className="card-content">
          <div className="branding-row">
            <div className="branding-preview" id="branding-preview">
              {brandingUpload ? (
                brandingUpload.mimetype === 'application/pdf' ? (
                  <span>PDF<br />uploaded</span>
                ) : (
                  <img src={api.uploads.staticUrl('branding', brandingUpload.filename)} alt="Hospital logo" />
                )
              ) : (
                <span>No logo<br />uploaded</span>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <input
                type="file"
                id="branding-file-input"
                accept="image/png,image/jpeg,image/webp,application/pdf"
                className="input"
                style={{ padding: 8 }}
                onChange={(e) => setBrandingFile(e.target.files?.[0] || null)}
              />
              <div className="branding-meta" id="branding-meta">
                {brandingUpload
                  ? brandingUpload.originalName + ' · ' + formatFileSize(brandingUpload.sizeBytes) + ' · uploaded just now'
                  : ''}
              </div>
            </div>
            <button className="btn btn-primary btn-default" id="branding-upload-btn" onClick={uploadBranding} disabled={uploading}>
              {uploading ? 'Uploading…' : 'Upload Logo'}
            </button>
          </div>
        </div>
      </div>

      <h2 className="h2" style={{ margin: '40px 0 16px' }}>Staff &amp; Roles</h2>
      <div className="table-container" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
        <table className="data-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Fixed Role</th><th>Custom Roles</th><th>Grant a Role</th></tr>
          </thead>
          <tbody id="staff-tbody">
            <StaffRows staff={staff} roles={roles || []} onChanged={loadStaff} />
          </tbody>
        </table>
      </div>

      <RoleDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={async (role) => {
          await loadRoles();
          await loadStaff();
          selectRole(role.custom_role_id);
        }}
      />
    </main>
  );
}

function StaffRows({ staff, roles, onChanged }) {
  const [pending, setPending] = useState({});

  if (staff === null) return null;
  if (staff === false) {
    return <tr><td colSpan="5" style={{ textAlign: 'center', padding: 20 }}>Could not load staff.</td></tr>;
  }
  if (staff.length === 0) {
    return (
      <tr>
        <td colSpan="5" style={{ textAlign: 'center', padding: 24, color: 'var(--text-secondary)' }}>
          No staff registered in this organization yet.
        </td>
      </tr>
    );
  }

  async function removeRole(userId, roleId) {
    try {
      await api.rbac.unassignStaffRole(userId, roleId);
      toast('Role removed from user.', 'warning');
      await onChanged();
    } catch (err) {
      toast(err.message || 'Could not remove role.', 'error');
    }
  }

  async function grantRole(userId) {
    const value = pending[userId];
    if (!value) {
      toast('Please select a custom role to grant.', 'warning');
      return;
    }
    try {
      await api.rbac.assignStaffRole(userId, Number(value));
      toast('Role granted to user.', 'success');
      await onChanged();
    } catch (err) {
      toast(err.message || 'Could not grant role.', 'error');
    }
  }

  return staff.map((member) => {
    const memberRoles = member.custom_roles || [];
    const unassigned = roles.filter(
      (r) => !memberRoles.some((cr) => cr.custom_role_id === r.custom_role_id),
    );

    return (
      <tr key={member.user_id}>
        <td><strong>{member.name || '-'}</strong></td>
        <td>{member.email || '-'}</td>
        <td><span className="badge badge-neutral">{member.actor_role || '-'}</span></td>
        <td>
          {memberRoles.length === 0 ? (
            <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>No extra roles</span>
          ) : (
            memberRoles.map((role) => (
              <span className="badge badge-info staff-role-chip" key={role.custom_role_id}>
                {role.role_name}
                <button
                  type="button"
                  title="Remove role"
                  style={{ marginLeft: 4, border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 'bold' }}
                  onClick={() => removeRole(member.user_id, role.custom_role_id)}
                >
                  {'✕'}
                </button>
              </span>
            ))
          )}
        </td>
        <td>
          {roles.length === 0 ? (
            <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>No custom roles created</span>
          ) : unassigned.length === 0 ? (
            <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>All custom roles granted</span>
          ) : (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <select
                className="input"
                style={{ height: 34, padding: '0 8px', fontSize: 12 }}
                value={pending[member.user_id] || ''}
                onChange={(e) => setPending((p) => ({ ...p, [member.user_id]: e.target.value }))}
              >
                <option value="" disabled>Select role&hellip;</option>
                {unassigned.map((r) => (
                  <option key={r.custom_role_id} value={r.custom_role_id}>{r.role_name}</option>
                ))}
              </select>
              <button type="button" className="btn btn-primary btn-sm" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => grantRole(member.user_id)}>
                Grant
              </button>
            </div>
          )}
        </td>
      </tr>
    );
  });
}

