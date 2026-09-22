'use strict';

import { useState } from 'react';
import { api } from '../../api/index.js';
import { useApi } from '../../hooks/useApi.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { joinPreRequestsWithPatients, statusLabel, formatDate, to12Hour } from './preHelpers.js';
import ApprovePopup from './ApprovePopup.jsx';
import SuggestPopup from './SuggestPopup.jsx';
import RejectPopup from './RejectPopup.jsx';

/**
 * Ported from PRE/pages/request.html + js/requests.js.
 *
 * Note the filename pair: the page is request.html (singular), its script was
 * requests.js (plural). They belong together - DEC-12.
 *
 * The three popups were built with document.createElement + innerHTML and
 * embedded onclick strings; they are controlled components here.
 */
export default function RequestsPage() {
  useDocumentTitle('Patient Requests');
  const [popup, setPopup] = useState(null); // { kind, id }

  const { data, reload } = useApi(async () => {
    const [preRequests, patients, doctors] = await Promise.all([
      api.preRequests.list(),
      api.patients.list(),
      api.doctors.list(),
    ]);
    const doctorsById = {};
    doctors.forEach((d) => (doctorsById[d.doctor_id] = d));
    return {
      pending: joinPreRequestsWithPatients(preRequests, patients, doctorsById).filter((r) => r.status === 'PENDING'),
      doctors: doctors || [],
    };
  }, []);

  const pending = data?.pending || [];
  const doctors = data?.doctors || [];
  const activeRequest = popup ? pending.find((r) => r.pre_request_id === popup.id) : null;

  return (
    <>
      <div className="container">
        <h2>Patient Requests</h2>
        <table>
          <thead>
            <tr>
              <th>Patient ID</th><th>Age</th><th>Gender</th><th>Name</th><th>Department</th>
              <th>Doctor</th><th>Appointment Date</th><th>Booked Date</th><th>Appointment Time</th>
              <th>Status</th><th>Action</th>
            </tr>
          </thead>
          <tbody id="requestTable">
            {pending.length === 0 ? (
              <tr><td colSpan="11">No Pending Requests</td></tr>
            ) : (
              pending.map((r) => (
                <tr key={r.pre_request_id}>
                  <td>{r.patientUhid}</td>
                  <td>{r.patientAge}</td>
                  <td>{r.patientGender}</td>
                  <td>{r.patientName}</td>
                  <td>{r.department}</td>
                  <td>{r.doctorName}</td>
                  <td>{formatDate(r.requested_date)}</td>
                  <td>{formatDate(r.created_at)}</td>
                  <td>{to12Hour(r.requested_time) || '-'}</td>
                  <td>{statusLabel(r.status)}</td>
                  <td>
                    <button className="btn approve" onClick={() => setPopup({ kind: 'approve', id: r.pre_request_id })}>Approve</button>
                    <button className="btn suggest" onClick={() => setPopup({ kind: 'suggest', id: r.pre_request_id })}>Suggest</button>
                    <button className="btn reject" onClick={() => setPopup({ kind: 'reject', id: r.pre_request_id })}>Reject</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {popup?.kind === 'approve' ? (
        <ApprovePopup request={activeRequest} doctors={doctors} onClose={() => setPopup(null)} onDone={reload} />
      ) : null}
      {popup?.kind === 'suggest' ? (
        <SuggestPopup request={activeRequest} doctors={doctors} onClose={() => setPopup(null)} onDone={reload} />
      ) : null}
      {popup?.kind === 'reject' ? (
        <RejectPopup request={activeRequest} onClose={() => setPopup(null)} onDone={reload} />
      ) : null}
    </>
  );
}

