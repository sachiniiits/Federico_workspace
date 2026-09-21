'use strict';

import Modal from '../../components/layout/Modal.jsx';
import { forRole } from '../../lib/sanitizer.js';
import { getEffectiveStatus, BillStatusBadge } from './patientDashboardHelpers.jsx';

export default function BillsModal({ open, onClose, bills, onGoToBilling }) {
  const unpaid = bills.filter((b) => getEffectiveStatus(b) !== 'paid');
  const totalOwed = unpaid.reduce((sum, b) => sum + b.youPay, 0);

  return (
    <Modal open={open} onClose={onClose} labelledBy="modal-bills-title">
      <div className="dash-modal" role="dialog" aria-modal="true" aria-labelledby="modal-bills-title">
        <div className="modal-head">
          <h2 id="modal-bills-title">Bill Summary</h2>
          <button className="modal-close" type="button" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Bill No</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bills.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px' }}>
                      No bills found.
                    </td>
                  </tr>
                ) : (
                  bills.map((bill) => {
                    // The row text comes from the sanitised copy; the amount is
                    // read off the original, exactly as the legacy code did.
                    const safeBill = forRole(bill, 'PATIENT');
                    return (
                      <tr key={bill.id}>
                        <td className="bill-id-cell">{safeBill.billNo}</td>
                        <td>{safeBill.description}</td>
                        <td>
                          <strong>₹{bill.youPay.toLocaleString('en-IN')}</strong>
                        </td>
                        <td>{safeBill.dueDate}</td>
                        <td>
                          <BillStatusBadge status={getEffectiveStatus(bill)} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="modal-bill-total">
            <span>Total Outstanding</span>
            <strong>₹{totalOwed.toLocaleString('en-IN')}</strong>
          </div>
          <div className="modal-footer-action">
            <button className="modal-book-btn" type="button" id="modal-go-bills" onClick={onGoToBilling}>
              View Full Billing Page →
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
