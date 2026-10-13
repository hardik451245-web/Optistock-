import ApprovalModal from './ApprovalModal'
import ReceiptModal from './ReceiptModal'
import Toast from './Toast'

export default function CashierModals({
  flyingGhost,
  approvalModal,
  onApprovedDiscount,
  onCloseApprovalModal,
  activeReceipt,
  productMap,
  onNewBill,
  toast,
  onCloseToast,
}) {
  return (
    <>
      {flyingGhost && (
        <div className="flying-ghost" style={{ left: flyingGhost.x, top: flyingGhost.y }}>
          <div className="stock-chip stock-chip-green" style={{ boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
            + {flyingGhost.name}
          </div>
        </div>
      )}

      {approvalModal && (
        <ApprovalModal
          product={approvalModal.product}
          requestedPercent={approvalModal.requestedPercent}
          onApproved={onApprovedDiscount}
          onClose={onCloseApprovalModal}
        />
      )}

      {activeReceipt && (
        <ReceiptModal
          bill={activeReceipt}
          productMap={productMap}
          onNewBill={onNewBill}
        />
      )}

      <Toast toast={toast} onClose={onCloseToast} />
    </>
  )
}
