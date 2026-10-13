import { Info } from 'lucide-react'

export default function HelperPanel({
  selectedOutOfStockProduct,
  alternatives,
  loadingAlternatives,
  onClearSelectedOutOfStock,
  onAddAlternative,
  markdownAlerts = [],
}) {
  return (
    <section className="spatial-panel panel-helper">
      <div className="panel-header">
        <div className="panel-title-row">
          <h2 className="panel-title">
            <Info size={18} color="#0d9488" /> Assistant
          </h2>
          {selectedOutOfStockProduct ? (
            <button
              type="button"
              onClick={onClearSelectedOutOfStock}
              style={{ background: 'none', border: 0, color: 'var(--spatial-text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      <div className="panel-body">
        {selectedOutOfStockProduct ? (
          <div>
            <div
              style={{
                background: 'rgba(225,29,72,0.08)',
                border: '1px solid rgba(225,29,72,0.2)',
                borderRadius: 8,
                padding: '0.85rem',
                marginBottom: '1rem',
              }}
            >
              <div style={{ fontSize: '0.78rem', color: 'var(--spatial-rose)', fontWeight: 700 }}>
                OUT OF STOCK
              </div>
              <strong style={{ fontSize: '1rem', color: 'var(--spatial-text-bright)' }}>
                {selectedOutOfStockProduct.name}
              </strong>
              <div style={{ fontSize: '0.8rem', color: 'var(--spatial-text-muted)' }}>
                {selectedOutOfStockProduct.category} (Stock: 0)
              </div>
            </div>

            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--spatial-text-muted)', marginBottom: '0.6rem' }}>
              RECOMMENDED IN-STOCK ALTERNATIVES:
            </div>

            {loadingAlternatives ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--spatial-text-muted)' }}>
                Finding best alternatives...
              </div>
            ) : alternatives.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--spatial-text-muted)' }}>
                No active in-stock alternatives found in category '{selectedOutOfStockProduct.category}'.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {alternatives.map((alt) => (
                  <div key={alt.id} className="bill-item-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <strong style={{ color: 'var(--spatial-text-bright)' }}>{alt.name}</strong>
                        {alt.brand ? (
                          <div style={{ fontSize: '0.78rem', color: 'var(--spatial-text-muted)' }}>
                            {alt.brand}
                          </div>
                        ) : null}
                        <div style={{ marginTop: 4 }}>
                          <span className="stock-chip stock-chip-green" style={{ fontSize: '0.72rem' }}>
                            {alt.stockQuantity} in stock
                          </span>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, color: 'var(--spatial-text-bright)' }}>
                          ₹{alt.effectivePrice || alt.sellingPrice}
                        </div>
                        <button
                          type="button"
                          className="ornament-pay-btn"
                          style={{
                            padding: '0.35rem 0.8rem',
                            fontSize: '0.8rem',
                            marginTop: 6,
                            background: '#0d9488',
                            borderRadius: 6,
                          }}
                          onClick={() => onAddAlternative(alt)}
                        >
                          Add instead +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--spatial-text-muted)', marginBottom: '0.75rem' }}>
              TODAY'S EXPIRY MARKDOWNS
            </div>
            {markdownAlerts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--spatial-text-muted)' }}>
                No active markdown specials at this moment.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {markdownAlerts.slice(0, 5).map((m) => (
                  <div key={m.productId || m.id} className="bill-item-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{m.name}</strong>
                        <div style={{ fontSize: '0.78rem', color: 'var(--spatial-text-muted)' }}>
                          {m.daysLeft != null ? `${m.daysLeft}d left` : 'Discounted'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className="stock-chip stock-chip-amber">
                          {Number(m.discountPercent)}% OFF
                        </span>
                        <div style={{ fontWeight: 700, color: 'var(--spatial-teal)', marginTop: 2 }}>
                          ₹{m.effectivePrice}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
