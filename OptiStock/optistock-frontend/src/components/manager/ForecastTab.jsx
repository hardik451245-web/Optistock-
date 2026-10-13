import { useEffect, useState, useCallback } from 'react'
import { getForecast, createPurchaseOrder, createBulkPurchaseOrders } from '../../api'

export default function ForecastTab({ onRefreshProducts }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [copied, setCopied] = useState(false)
  const [filterReorderOnly, setFilterReorderOnly] = useState(false)

  // Reorder single item dialog
  const [reorderItem, setReorderItem] = useState(null)
  const [reorderQty, setReorderQty] = useState(1)
  const [reorderSupplier, setReorderSupplier] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const loadForecast = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getForecast()
      setItems(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Failed to load forecast data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadForecast()
  }, [loadForecast])

  function handleCopyReorderList() {
    const reorderItems = items.filter((i) => i.suggestedReorderQty > 0)
    if (reorderItems.length === 0) {
      alert('No items currently require reordering.')
      return
    }

    const lines = [
      `OPTISTOCK REORDER LIST: ${new Date().toLocaleDateString()}`,
      '-------------------------------------------------------',
      ...reorderItems.map(
        (i) => `* [${i.category}] ${i.name}${i.brand ? ` (${i.brand})` : ''}: Order Qty: ${i.suggestedReorderQty} (Current Stock: ${i.stock}, Covers: ${i.daysOfCover}d)`
      ),
    ]

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  async function handleConfirmSingleReorder() {
    if (!reorderItem || reorderQty <= 0) return
    setActionLoading(true)
    setError('')
    setSuccessMsg('')
    try {
      await createPurchaseOrder({
        productId: reorderItem.id || reorderItem.productId,
        quantity: Number(reorderQty),
        supplier: reorderSupplier.trim() || null,
      })
      setSuccessMsg(`Purchase order created for ${reorderItem.name} (Qty: ${reorderQty})`)
      setReorderItem(null)
      await loadForecast()
      if (onRefreshProducts) await onRefreshProducts()
    } catch (err) {
      setError(err.message || 'Failed to create purchase order')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleReorderAllSuggested() {
    const reorderCandidates = items.filter((i) => i.suggestedReorderQty > 0)
    if (reorderCandidates.length === 0) {
      alert('No items currently require reordering.')
      return
    }
    const confirmed = window.confirm(
      `Create purchase orders for all ${reorderCandidates.length} items needing reorder?`
    )
    if (!confirmed) return

    setActionLoading(true)
    setError('')
    setSuccessMsg('')
    try {
      const payload = reorderCandidates.map((i) => ({
        productId: i.id || i.productId,
        quantity: i.suggestedReorderQty,
      }))
      await createBulkPurchaseOrders(payload)
      setSuccessMsg(`Successfully created bulk purchase orders for ${reorderCandidates.length} items`)
      await loadForecast()
      if (onRefreshProducts) await onRefreshProducts()
    } catch (err) {
      setError(err.message || 'Failed to submit bulk reorders')
    } finally {
      setActionLoading(false)
    }
  }

  const displayed = filterReorderOnly ? items.filter((i) => i.suggestedReorderQty > 0) : items

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            type="button"
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '6px',
              border: 'none',
              background: !filterReorderOnly ? '#0d9488' : 'rgba(255,255,255,0.08)',
              color: '#fff',
              fontSize: '0.85rem',
              cursor: 'pointer',
              fontWeight: 600,
            }}
            onClick={() => setFilterReorderOnly(false)}
          >
            All Products ({items.length})
          </button>
          <button
            type="button"
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '6px',
              border: 'none',
              background: filterReorderOnly ? '#0d9488' : 'rgba(255,255,255,0.08)',
              color: '#fff',
              fontSize: '0.85rem',
              cursor: 'pointer',
              fontWeight: 600,
            }}
            onClick={() => setFilterReorderOnly(true)}
          >
            Needs Reorder ({items.filter((i) => i.suggestedReorderQty > 0).length})
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            type="button"
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '6px',
              border: '1px solid #0d9488',
              background: 'transparent',
              color: '#5eead4',
              fontSize: '0.85rem',
              cursor: 'pointer',
              fontWeight: 600,
            }}
            disabled={actionLoading}
            onClick={handleReorderAllSuggested}
          >
            Reorder All Suggested
          </button>

          <button
            type="button"
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '6px',
              border: 'none',
              background: '#0d9488',
              color: '#fff',
              fontSize: '0.85rem',
              cursor: 'pointer',
              fontWeight: 600,
            }}
            onClick={handleCopyReorderList}
          >
            {copied ? 'Copied to Clipboard!' : 'Copy Reorder List'}
          </button>
        </div>
      </div>

      {error ? (
        <div className="state-message error" style={{ marginBottom: '1rem', background: 'rgba(244,63,94,0.15)', color: '#fda4af', padding: '0.75rem 1rem', borderRadius: '6px' }}>
          {error}
        </div>
      ) : null}

      {successMsg ? (
        <div style={{ marginBottom: '1rem', background: 'rgba(45,212,191,0.15)', color: '#5eead4', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.9rem' }}>
          {successMsg}
        </div>
      ) : null}

      <div className="glass-panel glass-table-container">
        {loading ? (
          <div style={{ padding: '2rem' }}>
            <div className="skeleton" style={{ height: 40, marginBottom: '0.75rem', borderRadius: '6px' }} />
            <div className="skeleton" style={{ height: 40, marginBottom: '0.75rem', borderRadius: '6px' }} />
            <div className="skeleton" style={{ height: 40, borderRadius: '6px' }} />
          </div>
        ) : displayed.length === 0 ? (
          <div className="state-message" style={{ padding: '2rem' }}>No forecast records found.</div>
        ) : (
          <table className="glass-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Avg Daily Sales</th>
                <th>30-Day Forecast</th>
                <th style={{ width: 170 }}>Days of Cover</th>
                <th>Suggested Reorder</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((item) => {
                const doc = Number(item.daysOfCover || 0)
                const docPercent = Math.min(100, Math.max(5, (doc / 30) * 100))
                const docColor = doc < 7 ? 'var(--color-rose)' : doc < 14 ? 'var(--color-amber)' : 'var(--color-teal)'

                return (
                  <tr key={item.productId}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{item.name}</div>
                      {item.brand ? <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.brand}</div> : null}
                      {item.onOrderQuantity > 0 ? (
                        <div style={{ marginTop: 2 }}>
                          <span className="badge badge-teal" style={{ fontSize: '0.72rem' }}>
                            On order: {item.onOrderQuantity}
                          </span>
                        </div>
                      ) : null}
                    </td>
                    <td>{item.category}</td>
                    <td>
                      <strong style={{ color: item.stock === 0 ? 'var(--color-rose)' : 'inherit' }}>{item.stock}</strong>
                    </td>
                    <td>{item.avgDailySales} /day</td>
                    <td>{item.forecast30} units</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span style={{ color: docColor, fontWeight: 600 }}>{doc >= 999 ? 'High' : `${doc}d`}</span>
                        </div>
                        <div className="progress-bar-bg" style={{ borderRadius: '4px' }}>
                          <div className="progress-bar-fill" style={{ width: `${docPercent}%`, backgroundColor: docColor, borderRadius: '4px' }} />
                        </div>
                      </div>
                    </td>
                    <td>
                      {item.suggestedReorderQty > 0 ? (
                        <span className="badge badge-amber" style={{ fontSize: '0.85rem', padding: '0.25rem 0.75rem' }}>
                          +{item.suggestedReorderQty}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Adequate</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        style={{
                          padding: '0.35rem 0.7rem',
                          fontSize: '0.8rem',
                          borderRadius: '6px',
                          background: '#0d9488',
                          color: '#fff',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                        onClick={() => {
                          setReorderItem(item)
                          setReorderQty(item.suggestedReorderQty > 0 ? item.suggestedReorderQty : 10)
                          setReorderSupplier('')
                        }}
                      >
                        Reorder
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Reorder Dialog */}
      {reorderItem && (
        <div className="modal-overlay" onClick={() => setReorderItem(null)}>
          <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()} style={{ width: 'min(450px, 92vw)' }}>
            <h2 style={{ fontSize: '1.25rem', marginTop: 0 }}>Reorder Product</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Product: <strong>{reorderItem.name}</strong>
              <br />Current stock: {reorderItem.stock} | Suggested reorder: {reorderItem.suggestedReorderQty}
            </p>
            <div style={{ marginTop: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4 }}>Order Quantity</label>
              <input
                type="number"
                min="1"
                className="glass-input"
                style={{ borderRadius: '6px' }}
                value={reorderQty}
                onChange={(e) => setReorderQty(e.target.value)}
              />
            </div>
            <div style={{ marginTop: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4 }}>Supplier (optional)</label>
              <input
                type="text"
                placeholder="Supplier name"
                className="glass-input"
                style={{ borderRadius: '6px' }}
                value={reorderSupplier}
                onChange={(e) => setReorderSupplier(e.target.value)}
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
                disabled={actionLoading}
                onClick={handleConfirmSingleReorder}
              >
                {actionLoading ? 'Placing Order...' : 'Confirm Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
