import { Receipt } from 'lucide-react'

export default function BillPanel({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateManualDiscount,
  onPay,
  submitting,
}) {
  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.sellingPrice || 0) * Number(item.quantity || 0),
    0
  )

  const totalCharged = cart.reduce((sum, item) => {
    let eff = Number(item.effectivePrice || item.sellingPrice || 0)
    if (item.manualDiscountPercent != null && Number(item.manualDiscountPercent) > 0) {
      const discountPct = Number(item.manualDiscountPercent)
      const base = Number(item.sellingPrice || 0)
      const manualEff = base * (1 - discountPct / 100)
      eff = Math.min(eff, manualEff)
    }
    return sum + eff * Number(item.quantity || 0)
  }, 0)

  const totalSavings = Math.max(0, subtotal - totalCharged)

  return (
    <section className="spatial-panel panel-bill" style={{ overflow: 'visible' }}>
      <div className="panel-header">
        <div className="panel-title-row">
          <h2 className="panel-title">
            <Receipt size={18} color="#0d9488" /> Active Bill
          </h2>
          <span className="spatial-badge-role" style={{ fontSize: '0.8rem' }}>
            {cart.reduce((s, i) => s + (i.quantity || 0), 0)} items
          </span>
        </div>
      </div>

      <div className="panel-body" style={{ paddingBottom: '4.5rem' }}>
        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--spatial-text-muted)' }}>
            Bill is currently empty.
            <div style={{ fontSize: '0.82rem', marginTop: '0.35rem' }}>
              Select items from the shelf or search by name.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {cart.map((item) => {
              const base = Number(item.sellingPrice || 0)
              const eff = Number(item.effectivePrice || base)
              const qty = Number(item.quantity || 1)
              const lineSavings = Math.max(0, (base - eff) * qty)

              return (
                <div key={item.productId} className="bill-item-card">
                  <div className="bill-item-row">
                    <div>
                      <strong style={{ fontSize: '0.98rem', color: 'var(--spatial-text-bright)' }}>
                        {item.name}
                      </strong>
                      <div style={{ fontSize: '0.78rem', color: 'var(--spatial-text-muted)' }}>
                        {item.brand ? `${item.brand} (₹${eff.toFixed(2)})` : `₹${eff.toFixed(2)}`}
                        {base > eff ? (
                          <span style={{ textDecoration: 'line-through', marginLeft: 4 }}>
                            ₹{base.toFixed(2)}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="bill-qty-btn"
                        onClick={() => onUpdateQuantity(item.productId, qty - 1)}
                      >
                        -
                      </button>
                      <span className="bill-item-qty" style={{ minWidth: 24, textAlign: 'center', fontWeight: 700 }}>{qty}</span>
                      <button
                        type="button"
                        className="bill-qty-btn"
                        disabled={qty >= (item.stockQuantity ?? 999)}
                        onClick={() => onUpdateQuantity(item.productId, qty + 1)}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.productId)}
                        style={{ background: 'none', border: 0, color: 'var(--spatial-rose)', cursor: 'pointer', padding: '0 4px', fontSize: '1rem' }}
                        title="Remove item"
                      >
                        x
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTop: '1px solid rgba(0,0,0,0.05)', fontSize: '0.82rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ color: 'var(--spatial-text-muted)' }}>Disc %:</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="spatial-search-input"
                        style={{ width: 58, padding: '0.2rem 0.4rem', borderRadius: 6, fontSize: '0.8rem', textAlign: 'center' }}
                        value={item.manualDiscountPercent ?? ''}
                        placeholder="0"
                        onChange={(e) => onUpdateManualDiscount(item.productId, e.target.value)}
                      />
                      {item.approvedRequestId ? (
                        <span className="stock-chip stock-chip-green" style={{ fontSize: '0.68rem' }}>
                          Approved (#{item.approvedRequestId})
                        </span>
                      ) : null}
                    </div>

                    <div>
                      {lineSavings > 0 ? (
                        <span style={{ color: 'var(--spatial-teal)', fontWeight: 600, marginRight: 8 }}>
                          Saved ₹{lineSavings.toFixed(2)}
                        </span>
                      ) : null}
                      <strong style={{ fontSize: '1rem', color: 'var(--spatial-text-bright)' }}>
                        ₹{(eff * qty).toFixed(2)}
                      </strong>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Floating Ornament Bar under Bill Panel */}
      <div className="spatial-ornament-bar">
        <div>
          <div style={{ fontSize: '0.78rem', color: 'var(--spatial-text-muted)', fontWeight: 600 }}>
            PAYABLE TOTAL
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--spatial-text-bright)' }}>
            ₹{totalCharged.toFixed(2)}
          </div>
          {totalSavings > 0 ? (
            <div style={{ fontSize: '0.75rem', color: 'var(--spatial-teal)', fontWeight: 700 }}>
              Discount savings: ₹{totalSavings.toFixed(2)}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          className="ornament-pay-btn"
          disabled={submitting || cart.length === 0}
          onClick={onPay}
        >
          {submitting ? 'Processing...' : 'Pay and Bill'}
        </button>
      </div>
    </section>
  )
}
