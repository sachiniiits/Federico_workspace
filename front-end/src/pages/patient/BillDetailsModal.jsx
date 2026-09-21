'use strict';

import Modal from '../../components/layout/Modal.jsx';

/**
 * The itemized invoice dialog. The legacy version reconfigured the Pay button's
 * text, opacity, cursor, disabled flag and onclick imperatively in openBillModal;
 * here the same three states are conditional JSX.
 */
export default function BillDetailsModal({ open, onClose, bill, onPay, onPrint }) {
  if (!bill) return null;

  const statusText =
    bill.status === 'paid'
      ? 'PAID'
      : bill.hasDischargeSummary
        ? 'PENDING PAYMENT (DISCHARGED)'
        : 'INTERIM EOD STATEMENT';
  const statusColor =
    bill.status === 'paid'
      ? 'var(--success)'
      : bill.hasDischargeSummary
        ? 'var(--warn)'
        : 'var(--muted)';

  return (
    <Modal open={open} onClose={onClose} labelledBy="modal-bill-title">
      <div className="modal">
        <div className="modal-head">
          <h2 id="modal-bill-title">Itemized Invoice Details</h2>
          <button className="modal-close" type="button" aria-label="Close dialog" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="modal-meta-row">
            <div className="modal-meta">
              <span>Invoice No</span>
              <strong id="modal-invoice-no">{bill.billNo || '#' + bill.ledgerId}</strong>
            </div>
            <div className="modal-meta">
              <span>Admission</span>
              <strong id="modal-admission-id">
                {bill.admissionId ? '#' + bill.admissionId : 'N/A'}
              </strong>
            </div>
            <div className="modal-meta">
              <span>Billing Date</span>
              <strong id="modal-bill-date">{bill.date || 'N/A'}</strong>
            </div>
            <div className="modal-meta">
              <span>Status</span>
              <strong id="modal-bill-status" style={{ color: statusColor }}>
                {statusText}
              </strong>
            </div>
          </div>

          <div className="table-wrap itemized-table">
            <table>
              <thead>
                <tr>
                  <th>Service / Item</th>
                  <th style={{ textAlign: 'center' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Unit Price</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody id="modal-items-tbody">
                {bill.items && bill.items.length ? (
                  bill.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <strong>{item.name || 'Hospital Service'}</strong>
                      </td>
                      <td style={{ textAlign: 'center' }}>{item.qty || 1}</td>
                      <td style={{ textAlign: 'right' }}>
                        ₹{Number(item.unitPrice || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        ₹{Number(item.total || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--muted)' }}>
                      No line items recorded.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="3">Gross Total</td>
                  <td style={{ textAlign: 'right' }} id="modal-gross-total">
                    ₹{Number(bill.total || 0).toLocaleString('en-IN')}
                  </td>
                </tr>
                <tr className="ins-row">
                  <td colSpan="3">Insurance Covered Amount</td>
                  <td style={{ textAlign: 'right' }} id="modal-ins-deduction">
                    -₹{Number(bill.insuranceCovered || 0).toLocaleString('en-IN')}
                  </td>
                </tr>
                <tr className="total-row">
                  <td colSpan="3">Net Patient Share (You Pay)</td>
                  <td style={{ textAlign: 'right' }} id="modal-net-payable">
                    ₹{Number(bill.youPay || 0).toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="modal-actions" id="modal-bill-actions">
            <button
              className="modal-btn-secondary"
              type="button"
              id="modal-btn-print"
              onClick={() => onPrint(bill)}
            >
              Print / Download
            </button>
            {bill.status === 'paid' ? null : !bill.hasDischargeSummary ? (
              <button
                className="btn-view"
                type="button"
                id="modal-btn-pay"
                disabled
                style={{ display: 'inline-flex', opacity: '0.6', cursor: 'not-allowed' }}
              >
                Payment Opens on Discharge
              </button>
            ) : (
              <button
                className="btn-view"
                type="button"
                id="modal-btn-pay"
                style={{ display: 'inline-flex', opacity: '1', cursor: 'pointer' }}
                onClick={() => onPay(bill)}
              >
                Pay Now
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
