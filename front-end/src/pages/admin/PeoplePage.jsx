'use strict';

import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/index.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useSession } from '../../auth/useSession.js';
import Button from '../../components/ui/Button.jsx';
import ModuleLock from '../../components/layout/ModuleLock.jsx';
import { toast, confirm } from '../../components/feedback/feedback.js';
import StaffDialog from './StaffDialog.jsx';
import DoctorDialog from './DoctorDialog.jsx';

/**
 * Ported from Admin/screen-05-people.html + people.js.
 *
 * This screen is absent from front-end/README.md but is fully wired and linked
 * from the Admin nav, so it is in scope (DEC-9). The DOCTOR module gate applies
 * in two places, exactly as before: the "+ Add Doctor" button, and the doctors
 * table which shows an explanatory row instead of loading.
 */
export default function PeoplePage() {
  useDocumentTitle('People | Federico Hospital Admin');
  const { hasModule } = useSession();
  const doctorModule = hasModule('DOCTOR');

  const [staff, setStaff] = useState(null);
  const [doctors, setDoctors] = useState(null);
  const [wards, setWards] = useState([]);
  const [staffDialogOpen, setStaffDialogOpen] = useState(false);
  const [editingDoctorId, setEditingDoctorId] = useState(undefined);

  const loadStaff = useCallback(async () => {
    try {
      setStaff(await api.rbac.staff());
    } catch (err) {
      setStaff(false);
      toast(err.message || 'Could not load staff.', 'error');
    }
  }, []);

  const loadDoctors = useCallback(async () => {
    if (!doctorModule) {
      setDoctors('locked');
      return;
    }
    try {
      const [d, w] = await Promise.all([api.doctors.list(), api.wards.list().catch(() => [])]);
      setDoctors(d || []);
      setWards(w || []);
    } catch (err) {
      setDoctors(false);
      toast(err.message || 'Could not load doctors.', 'error');
    }
  }, [doctorModule]);

  useEffect(() => {
    loadStaff();
    loadDoctors();
  }, [loadStaff, loadDoctors]);

  async function toggleStaff(userId, next) {
    try {
      await api.rbac.setStaffActive(userId, next);
      toast(next ? 'Login enabled.' : 'Login disabled.', next ? 'success' : 'warning');
      await loadStaff();
    } catch (err) {
      toast(err.message || 'Could not update this login.', 'error');
    }
  }

  async function deleteDoctor(doctorId) {
    const doc = (doctors || []).find((d) => d.doctor_id === doctorId);
    if (!doc) return;
    const ok = await confirm({
      title: 'Remove ' + doc.name + '?',
      body: 'The doctor will no longer be available for new appointments.',
      confirmLabel: 'Remove',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.doctors.remove(doctorId);
      toast(doc.name + ' removed.', 'warning');
      await loadDoctors();
    } catch (err) {
      toast(err.message || 'Could not remove this doctor.', 'error');
    }
  }

  return (
    <main className="dashboard-container">
      <div className="header-section">
        <div>
          <h1 className="h1" style={{ marginBottom: 8 }}>People</h1>
          <p className="body-text">
            Add staff logins for your organization and manage doctors by department. Staff sign in
            to their own portal with the email and password you set here.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 className="card-title">Staff Accounts</h2>
            <p className="card-description">
              HOM (operations), PRE (registration) and FA (finance) logins for this organization.
            </p>
          </div>
          <button className="btn btn-primary btn-default" id="new-staff-btn" onClick={() => setStaffDialogOpen(true)}>
            + Add Person
          </button>
        </div>
        <div className="card-content" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Portal Role</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody id="staff-tbody">
                {staff === null ? null : staff === false ? (
                  <tr><td colSpan="5">Could not load staff.</td></tr>
                ) : staff.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No staff logins yet. Use {'“'}Add Person{'”'}.
                    </td>
                  </tr>
                ) : (
                  staff.map((m) => {
                    const active = m.is_active !== false;
                    return (
                      <tr key={m.user_id}>
                        <td style={{ fontWeight: 500 }}>{m.name}</td>
                        <td>{m.email}</td>
                        <td><span className="badge badge-neutral">{m.actor_role}</span></td>
                        <td><span className={'status-pill ' + (active ? 'active' : 'inactive')}>{active ? 'Active' : 'Disabled'}</span></td>
                        <td>
                          <Button
                            variant={active ? 'outline' : 'primary'}
                            size="sm"
                            onClick={() => toggleStaff(m.user_id, !active)}
                          >
                            {active ? 'Disable' : 'Enable'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 className="card-title">Doctors &amp; Departments</h2>
            <p className="card-description">
              Assign doctors to a department/ward. Locked when the Doctor Management module
              isn&apos;t in your subscription.
            </p>
          </div>
          <ModuleLock module="DOCTOR">
            <button className="btn btn-primary btn-default" id="new-doctor-btn" onClick={() => setEditingDoctorId(null)}>
              + Add Doctor
            </button>
          </ModuleLock>
        </div>
        <div className="card-content" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr><th>Name</th><th>Specialization</th><th>Department</th><th>Contact</th><th>Action</th></tr>
              </thead>
              <tbody id="doctors-tbody">
                {doctors === 'locked' ? (
                  <tr>
                    <td colSpan="5" style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>
                      The Doctor Management module is not enabled for your organization.
                    </td>
                  </tr>
                ) : doctors === null ? null : doctors === false ? (
                  <tr><td colSpan="5">Could not load doctors.</td></tr>
                ) : doctors.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No doctors yet. Use {'“'}Add Doctor{'”'}.
                    </td>
                  </tr>
                ) : (
                  doctors.map((d) => (
                    <tr key={d.doctor_id}>
                      <td style={{ fontWeight: 500 }}>{d.name}</td>
                      <td>{d.specialization || '—'}</td>
                      <td>{d.department || '—'}</td>
                      <td>{d.phone || d.email || '—'}</td>
                      <td style={{ display: 'flex', gap: 6 }}>
                        <Button variant="outline" size="sm" onClick={() => setEditingDoctorId(d.doctor_id)}>Edit</Button>
                        <Button variant="danger" size="sm" onClick={() => deleteDoctor(d.doctor_id)}>Delete</Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <StaffDialog open={staffDialogOpen} onClose={() => setStaffDialogOpen(false)} onSaved={loadStaff} />
      <DoctorDialog
        open={editingDoctorId !== undefined}
        doctor={editingDoctorId ? (doctors || []).find((d) => d.doctor_id === editingDoctorId) : null}
        wards={wards}
        onClose={() => setEditingDoctorId(undefined)}
        onSaved={loadDoctors}
      />
    </main>
  );
}

