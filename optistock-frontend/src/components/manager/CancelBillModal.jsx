export default function CancelBillModal({ bill, onClose, onConfirm, cancelling }) {
  if (!bill) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()} style={{ width: 'min(450px, 92vw)', borderRadius: '8px' }}>
        <h2 style={{ color: 'var(--color-rose)', marginTop: 0, fontSize: '1.25rem' }}>Confirm Bill Cancellation</h2>
        <p style={{ color: 'var(--text-heading)' }}>
          Are you sure you want to cancel <strong>Bill #{bill.id}</strong> for{' '}
          <strong>₹{bill.totalAmount}</strong>?
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5 }}>
          * All {bill.items?.length || 0} item quantities will be immediately restored to product inventory.
          <br />* A CANCEL_RESTORE stock movement record will be written to the stock ledger.
          <br />* This transaction cannot be undone.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button
            type="button"
            style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer' }}
            onClick={onClose}
            disabled={cancelling}
          >
            Close
          </button>
          <button
            type="button"
            style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: 'var(--color-rose)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            onClick={onConfirm}
            disabled={cancelling}
          >
            {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
          </button>
        </div>
      </div>
    </div>
  )
}
