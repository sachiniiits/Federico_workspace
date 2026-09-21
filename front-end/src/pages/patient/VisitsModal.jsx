'use strict';

import Modal from '../../components/layout/Modal.jsx';
import VisitItems from './VisitItems.jsx';

export default function VisitsModal({ open, onClose, visits }) {
  return (
    <Modal open={open} onClose={onClose} labelledBy="modal-visits-title">
      <div className="dash-modal" role="dialog" aria-modal="true" aria-labelledby="modal-visits-title">
        <div className="modal-head">
          <h2 id="modal-visits-title">Full Visit History</h2>
          <button className="modal-close" type="button" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="visit-list modal-visit-list">
            <VisitItems
              visits={visits}
              emptyMessage="No visit history recorded yet."
              departmentFontSize="12px"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}

