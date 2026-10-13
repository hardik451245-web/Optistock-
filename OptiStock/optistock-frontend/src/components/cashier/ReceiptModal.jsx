import { Printer, PlusCircle } from 'lucide-react'

export default function ReceiptModal({ bill, productMap = {}, onNewBill }) {
  if (!bill) return null

  function handlePrint() {
    window.print()
  }

  return (
    <div className="spatial-modal-backdrop">
      <div className="spatial-modal-window printable-receipt" style={{ width: 'min(480px, 95vw)', borderRadius: '8px' }}>
        <div style={{ textAlign: 'center', borderBottom: '1px dashed rgba(0,0,0,0.15)', paddingBottom: '1rem', marginBottom: '1rem' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 2, color: '#0f172a' }}>OPTISTOCK RETAIL</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--spatial-text-muted)' }}>
            Point of Sale Receipt
          </div>
          <div style={{ fontSize: '0.85rem', marginTop: 4 }}>
            <strong>Bill #{bill.id}</strong> (Cashier #{bill.cashierId})
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--spatial-text-muted)' }}>
            {bill.createdAt ? new Date(bill.createdAt).toLocaleString() : new Date().toLocaleString()}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
          {(bill.items || []).map((item, idx) => {
            const prod = productMap[item.productId]
            const name = prod ? prod.name : `Product #${item.productId}`
            const lineTotal = Number(item.price || 0) * Number(item.quantity || 1)

            return (
              <div key={item.id || idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                <div>
                  <strong>{name}</strong>
                  <div style={{ fontSize: '0.78rem', color: 'var(--spatial-text-muted)' }}>
                    {item.quantity} × ₹{item.price}
                    {item.discountPercent && Number(item.discountPercent) > 0 ? (
                      <span style={{ color: 'var(--spatial-teal)', marginLeft: 6 }}>
                        ({Number(item.discountPercent)}% off)
                      </span>
                    ) : null}
                  </div>
                </div>
                <div style={{ fontWeight: 700 }}>₹{lineTotal.toFixed(2)}</div>
              </div>
            )
          })}
        </div>

        <div style={{ borderTop: '1px dashed rgba(0,0,0,0.15)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.88rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Subtotal</span>
            <span>₹{bill.subtotal}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--spatial-teal)' }}>
            <span>Total Discounts</span>
            <span>-₹{bill.totalDiscount}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800, marginTop: 4, paddingTop: 4, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
            <span>TOTAL CHARGED</span>
            <span>₹{bill.totalAmount}</span>
          </div>
        </div>

        <div style={{ textAlign: 'center', margin: '1.5rem 0 0.5rem', fontSize: '0.8rem', color: 'var(--spatial-text-muted)' }}>
          Thank you for shopping with us! Please visit again.
        </div>

        <div className="no-print" style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button
            type="button"
            id="print-receipt-btn"
            style={{
              flex: 1,
              padding: '0.7rem 1rem',
              fontSize: '0.92rem',
              color: '#0f172a',
              background: '#ffffff',
              border: '2px solid #0d9488',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.15s ease'
            }}
            onClick={handlePrint}
          >
            <Printer size={18} color="#0d9488" />
            <span>Print Receipt</span>
          </button>
          <button
            type="button"
            id="new-bill-btn"
            style={{
              flex: 1,
              padding: '0.7rem 1rem',
              fontSize: '0.92rem',
              background: '#0d9488',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.15s ease'
            }}
            onClick={onNewBill}
          >
            <PlusCircle size={18} color="#ffffff" />
            <span>Start New Bill</span>
          </button>
        </div>
      </div>
    </div>
  )
}

