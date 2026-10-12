import { useEffect, useState, useCallback } from 'react'
import { getAlerts, createPurchaseOrder, writeoffStock } from '../../api'

export default function AlertsTab({ onNavigateToStock, onRefreshProducts }) {
  const [alerts, setAlerts] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [actionSuccess, setActionSuccess] = useState('')

  // Reorder dialog
  const [reorderItem, setReorderItem] = useState(null)
  const [orderQty, setOrderQty] = useState(10)

  // Write off dialog
  const [writeoffItem, setWriteoffItem] = useState(null)
  const [writeoffReason, setWriteoffReason] = useState('')

  const loadAlerts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getAlerts()
      setAlerts(data)
    } catch (err) {
      setError(err.message || 'Failed to load inventory alerts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAlerts()
  }, [loadAlerts])

  async function handleConfirmReorder() {
    if (!reorderItem || orderQty <= 0) return
    const prodId = reorderItem.id || reorderItem.productId
    setActionLoadingId(prodId)
    setError('')
    setActionSuccess('')
    try {
      await createPurchaseOrder({
        productId: prodId,
        quantity: Number(orderQty),
      })
      setActionSuccess(`Reorder purchase order created for ${reorderItem.name}`)
      setReorderItem(null)
      await loadAlerts()
      if (onRefreshProducts) await onRefreshProducts()
    } catch (err) {
      setError(err.message || 'Failed to place reorder')
    } finally {
      setActionLoadingId(null)
    }
  }

  async function handleConfirmWriteoff() {
    if (!writeoffItem || !writeoffReason.trim()) {
      setError('A reason is required to write off expired stock')
      return
    }
    const prodId = writeoffItem.id || writeoffItem.productId
    setActionLoadingId(prodId)
    setError('')
    setActionSuccess('')
    try {
      await writeoffStock({
        productId: prodId,
        reason: writeoffReason.trim(),
      })
      setActionSuccess(`Stock written off for ${writeoffItem.name}`)
      setWriteoffItem(null)
      await loadAlerts()
      if (onRefreshProducts) await onRefreshProducts()
    } catch (err) {
      setError(err.message || 'Failed to write off expired product')
    } finally {
      setActionLoadingId(null)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-panel skeleton" style={{ height: 350, borderRadius: '8px' }} />
        ))}
      </div>
    )
  }

  const lowStock = alerts?.lowStock || []
  const expiringSoon = alerts?.expiringSoon || []
  const markdownActive = alerts?.markdownActive || []
  const expired = alerts?.expired || []
  const slowMoving = alerts?.slowMoving || []

  return (
    <div>
      {error ? (
        <div className="state-message error" style={{ marginBottom: '1rem', background: 'rgba(244,63,94,0.15)', color: '#fda4af', padding: '0.75rem 1rem', borderRadius: '6px' }}>
          {error}
        </div>
      ) : null}

      {actionSuccess ? (
        <div style={{ marginBottom: '1rem', background: 'rgba(45,212,191,0.15)', color: '#5eead4', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.9rem' }}>
          {actionSuccess}
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
        {/* 1. Low Stock Column */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--color-amber)' }}>Low Stock</h2>
            <span className="badge badge-amber">{lowStock.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: 500 }}>
            {lowStock.length === 0 ? (
              <div className="state-message" style={{ padding: '1.5rem' }}>Stock levels optimal</div>
            ) : (
              lowStock.map((item) => (
                <div key={item.productId} className="glass-panel" style={{ padding: '0.85rem', background: 'rgba(255,255,255,0.04)', borderRadius: '6px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{item.name}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                    Current: <strong style={{ color: 'var(--color-amber)' }}>{item.stock}</strong> (Threshold: {item.reorderThreshold})
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button
                      type="button"
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', borderRadius: '6px', background: '#0d9488', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                      disabled={actionLoadingId === item.productId}
                      onClick={() => {
                        setReorderItem(item)
                        setOrderQty(Math.max(10, (item.reorderThreshold || 5) * 2))
                      }}
                    >
                      Reorder
                    </button>
                    {onNavigateToStock && (
                      <button
                        type="button"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer' }}
                        onClick={() => onNavigateToStock(item.productId)}
                      >
                        View in Stock
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. Expiring Soon Column */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--color-orange)' }}>Expiring Soon</h2>
            <span className="badge badge-orange">{expiringSoon.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: 500 }}>
            {expiringSoon.length === 0 ? (
              <div className="state-message" style={{ padding: '1.5rem' }}>No products expiring soon</div>
            ) : (
              expiringSoon.map((item) => (
                <div key={item.productId} className="glass-panel" style={{ padding: '0.85rem', background: 'rgba(255,255,255,0.04)', borderRadius: '6px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{item.name}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                    Days left: <strong style={{ color: 'var(--color-orange)' }}>{item.daysLeft}d</strong> ({item.expiryDate})
                  </div>
                  {onNavigateToStock && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <button
                        type="button"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer' }}
                        onClick={() => onNavigateToStock(item.productId)}
                      >
                        View in Stock
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 3. Markdown Active Column */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--color-teal)' }}>Markdown Active</h2>
            <span className="badge badge-green">{markdownActive.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: 500 }}>
            {markdownActive.length === 0 ? (
              <div className="state-message" style={{ padding: '1.5rem' }}>No active markdown discounts</div>
            ) : (
              markdownActive.map((item) => (
                <div key={item.productId} className="glass-panel" style={{ padding: '0.85rem', background: 'rgba(255,255,255,0.04)', borderRadius: '6px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{item.name}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                    Discount: <strong style={{ color: 'var(--color-teal)' }}>{Number(item.discountPercent)}% OFF</strong> (₹{item.effectivePrice})
                  </div>
                  {onNavigateToStock && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <button
                        type="button"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer' }}
                        onClick={() => onNavigateToStock(item.productId)}
                      >
                        View in Stock
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 4. Expired Column */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--color-rose)' }}>Expired Stock</h2>
            <span className="badge badge-rose">{expired.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: 500 }}>
            {expired.length === 0 ? (
              <div className="state-message" style={{ padding: '1.5rem' }}>No expired inventory</div>
            ) : (
              expired.map((item) => (
                <div key={item.productId} className="glass-panel" style={{ padding: '0.85rem', background: 'rgba(255,255,255,0.04)', borderRadius: '6px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{item.name}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--color-rose)', marginTop: 4 }}>
                    Expired on {item.expiryDate} (Units in stock: {item.stock})
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button
                      type="button"
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', borderRadius: '6px', background: 'var(--color-rose)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                      disabled={actionLoadingId === item.productId}
                      onClick={() => {
                        setWriteoffItem(item)
                        setWriteoffReason('Expired inventory write-off')
                      }}
                    >
                      Write off
                    </button>
                    {onNavigateToStock && (
                      <button
                        type="button"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer' }}
                        onClick={() => onNavigateToStock(item.productId)}
                      >
                        View in Stock
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 5. Slow Moving Column */}
        {slowMoving.length > 0 && (
          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-secondary)' }}>Slow Moving</h2>
              <span className="badge badge-slate">{slowMoving.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: 500 }}>
              {slowMoving.map((item) => (
                <div key={item.productId} className="glass-panel" style={{ padding: '0.85rem', background: 'rgba(255,255,255,0.04)', borderRadius: '6px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{item.name}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                    Stock: {item.stock} (Days of cover: {item.daysOfCover}d)
                  </div>
                  {onNavigateToStock && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <button
                        type="button"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer' }}
                        onClick={() => onNavigateToStock(item.productId)}
                      >
                        View in Stock
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Reorder from Alert */}
      {reorderItem && (
        <div className="modal-overlay" onClick={() => setReorderItem(null)}>
          <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()} style={{ width: 'min(420px, 92vw)' }}>
            <h2 style={{ fontSize: '1.2rem', marginTop: 0 }}>Reorder Stock</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Create a purchase order for <strong>{reorderItem.name}</strong>
            </p>
            <div style={{ marginTop: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4 }}>Order Quantity</label>
              <input
                type="number"
                min="1"
                className="glass-input"
                style={{ borderRadius: '6px' }}
                value={orderQty}
                onChange={(e) => setOrderQty(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer' }}
                onClick={() => setReorderItem(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: '#0d9488', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                onClick={handleConfirmReorder}
              >
                Place Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Write Off from Alert */}
      {writeoffItem && (
        <div className="modal-overlay" onClick={() => setWriteoffItem(null)}>
          <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()} style={{ width: 'min(420px, 92vw)' }}>
            <h2 style={{ fontSize: '1.2rem', marginTop: 0, color: 'var(--color-rose)' }}>Write Off Expired Product</h2>
            <p style={{ color: 'var(--text-heading)', fontSize: '0.9rem' }}>
              Confirm write-off of {writeoffItem.stock} expired units of <strong>{writeoffItem.name}</strong>.
            </p>
            <div style={{ marginTop: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4 }}>Reason</label>
              <input
                type="text"
                className="glass-input"
                style={{ borderRadius: '6px' }}
                value={writeoffReason}
                onChange={(e) => setWriteoffReason(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer' }}
                onClick={() => setWriteoffItem(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: 'var(--color-rose)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                onClick={handleConfirmWriteoff}
              >
                Confirm Write Off
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
