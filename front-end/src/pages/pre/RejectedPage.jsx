'use strict';

import { api } from '../../api/index.js';
import { useApi } from '../../hooks/useApi.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { joinPreRequestsWithPatients, statusLabel, formatDate } from './preHelpers.js';

/** Ported from PRE/pages/rejected.html + rejected.js. */
export default function RejectedPage() {
  useDocumentTitle('Rejected Requests');

  const { data } = useApi(async () => {
    const [preRequests, patients] = await Promise.all([api.preRequests.list(), api.patients.list()]);
    return joinPreRequestsWithPatients(preRequests, patients, {}).filter((r) => r.status === 'REJECTED');
  }, []);

  const rows = data || [];

  return (
    <div className="container">
      <h2>Rejected Patient Requests</h2>
      <table>
        <thead>
          <tr>
            <th>Patient ID</th><th>Age</th><th>Gender</th><th>Name</th><th>Department</th>
            <th>Appointment Date</th><th>Booked Date</th><th>Rejection Reason</th><th>Status</th>
          </tr>
        </thead>
        <tbody id="rejectedTable">
          {rows.length === 0 ? (
            <tr><td colSpan="9">No Rejected Requests</td></tr>
          ) : (
            rows.map((r) => (
              <tr key={r.pre_request_id}>
                <td>{r.patientUhid}</td>
                <td>{r.patientAge}</td>
                <td>{r.patientGender}</td>
                <td>{r.patientName}</td>
                <td>{r.department}</td>
                <td>{formatDate(r.requested_date)}</td>
                <td>{formatDate(r.created_at)}</td>
                <td>{r.reject_reason || '-'}</td>
                <td>{statusLabel(r.status)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

