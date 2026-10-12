import { useState, useEffect, useCallback } from 'react'
import {
  listProducts,
  listPurchaseOrders,
  createPurchaseOrder,
  receivePurchaseOrder,
  cancelPurchaseOrder,
  adjustStock,
  writeoffStock,
  listStockMovements,
} from '../../api'

export default function StockTab({ products = [], onRefreshProducts, targetProductId = null }) {
  const [subView, setSubView] = useState('stock') // 'stock' | 'orders' | 'movements'
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [orders, setOrders] = useState([])
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL')
  const [movements, setMovements] = useState([])
  const [movementFilters, setMovementFilters] = useState({ productId: '', type: '', from: '', to: '' })

  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Modals state
  const [reorderModal, setReorderModal] = useState(null) // product
  const [reorderQty, setReorderQty] = useState(10)
  const [reorderSupplier, setReorderSupplier] = useState('')

  const [adjustModal, setAdjustModal] = useState(null) // product
  const [adjustDelta, setAdjustDelta] = useState(0)
  const [adjustReason, setAdjustReason] = useState('')

  const [writeoffModal, setWriteoffModal] = useState(null) // product
  const [writeoffReason, setWriteoffReason] = useState('')

  const [receiveModal, setReceiveModal] = useState(null) // order
  const [receiveQty, setReceiveQty] = useState(0)
  const [receiveExpiry, setReceiveExpiry] = useState('')

  // When targetProductId is passed from Alerts tab, filter or highlight that product
  useEffect(() => {
    if (targetProductId) {
      const prod = products.find((p) => p.id === targetProductId)
      if (prod) {
        setSearch(prod.name)
        setSubView('stock')
      }
    }
  }, [targetProductId, products])

  const loadOrders = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const statusParam = orderStatusFilter === 'ALL' ? '' : orderStatusFilter
      const data = await listPurchaseOrders(statusParam)
      setOrders(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Failed to load purchase orders')
    } finally {
      setLoading(false)
    }
  }, [orderStatusFilter])

  const loadMovements = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await listStockMovements(movementFilters)
      setMovements(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Failed to load stock movements')
    } finally {
      setLoading(false)
    }
  }, [movementFilters])

  useEffect(() => {
    if (subView === 'orders') {
      loadOrders()
    } else if (subView === 'movements') {
      loadMovements()
    }
  }, [subView, loadOrders, loadMovements])

  const categories = ['ALL', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))]

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.brand || '').toLowerCase().includes(search.toLowerCase())
    const matchesCat = categoryFilter === 'ALL' || p.category === categoryFilter
    return matchesSearch && matchesCat
  })

  // Handlers for Stock sub-view
  async function handleConfirmReorder() {
    if (!reorderModal || reorderQty <= 0) return
    setActionLoading(true)
    setError('')
    setSuccess('')
    try {
      await createPurchaseOrder({
        productId: reorderModal.id || reorderModal.productId,
        quantity: Number(reorderQty),
        supplier: reorderSupplier.trim() || null,
      })
      setSuccess(`Purchase order created for ${reorderModal.name} (Qty: ${reorderQty})`)
      setReorderModal(null)
      await onRefreshProducts()
      if (subView === 'orders') await loadOrders()
    } catch (err) {
      setError(err.message || 'Failed to create purchase order')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleConfirmAdjust() {
    if (!adjustModal || adjustDelta === 0 || !adjustReason.trim()) {
      setError('Please provide a non-zero adjustment delta and a valid reason')
      return
    }
    setActionLoading(true)
    setError('')
    setSuccess('')
    try {
      await adjustStock({
        productId: adjustModal.id || adjustModal.productId,
        delta: Number(adjustDelta),
        reason: adjustReason.trim(),
      })
      setSuccess(`Stock adjusted for ${adjustModal.name} by ${adjustDelta > 0 ? `+${adjustDelta}` : adjustDelta}`)
      setAdjustModal(null)
      await onRefreshProducts()
    } catch (err) {
      setError(err.message || 'Failed to adjust stock')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleConfirmWriteoff() {
    if (!writeoffModal || !writeoffReason.trim()) {
      setError('Please provide a reason for inventory write-off')
      return
    }
    setActionLoading(true)
    setError('')
    setSuccess('')
    try {
      await writeoffStock({
        productId: writeoffModal.id || writeoffModal.productId,
        reason: writeoffReason.trim(),
      })
      setSuccess(`Stock written off to zero for ${writeoffModal.name}`)
      setWriteoffModal(null)
      await onRefreshProducts()
    } catch (err) {
      setError(err.message || 'Failed to write off stock')
    } finally {
      setActionLoading(false)
    }
  }

  // Handlers for Orders sub-view
  async function handleConfirmReceive() {
    if (!receiveModal) return
    setActionLoading(true)
    setError('')
    setSuccess('')
    try {
      await receivePurchaseOrder(receiveModal.id, {
        receivedQuantity: receiveQty ? Number(receiveQty) : undefined,
        newExpiryDate: receiveExpiry || undefined,
      })
      setSuccess(`Purchase Order #${receiveModal.id} marked as RECEIVED`)
      setReceiveModal(null)
      await loadOrders()
      await onRefreshProducts()
    } catch (err) {
      setError(err.message || 'Failed to receive purchase order')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleCancelOrder(orderId) {
    if (!window.confirm(`Are you sure you want to cancel Purchase Order #${orderId}?`)) return
    setActionLoading(true)
    setError('')
    setSuccess('')
    try {
      await cancelPurchaseOrder(orderId)
      setSuccess(`Purchase Order #${orderId} cancelled`)
      await loadOrders()
      await onRefreshProducts()
    } catch (err) {
      setError(err.message || 'Failed to cancel purchase order')
    } finally {
      setActionLoading(false)
    }
  }

  function renderExpiryBadge(p) {
    const status = p.expiryStatus
    if (!status || status === 'NORMAL' || status === 'NO_EXPIRY') {
      return p.expiryDate ? (
        <span className="badge badge-green">{p.expiryDate}</span>
      ) : (
        <span className="badge badge-green">No expiry</span>
      )
    }
    if (status === 'EXPIRING_SOON') {
      return <span className="badge badge-amber">Expiring Soon ({p.daysLeft ?? '?'}d)</span>
    }
    if (status === 'MARKDOWN' || status === 'LAST_DAY') {
      const discount = p.discountPercent != null ? `${Number(p.discountPercent)}% OFF` : 'Markdown'
      return <span className="badge badge-orange">{discount}</span>
    }
    if (status === 'EXPIRED') {
      return <span className="badge badge-rose">EXPIRED</span>
    }
    return <span className="badge badge-green">{p.expiryDate || 'Normal'}</span>
  }

  return (
    <div>
      {/* Top sub-view switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', padding: '4px', borderRadius: '8px' }}>
          <button
            type="button"
            className={subView === 'stock' ? 'tab-btn active' : 'tab-btn'}
            style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: subView === 'stock' ? '#0d9488' : 'transparent', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => setSubView('stock')}
          >
            Stock Levels
          </button>
          <button
            type="button"
            className={subView === 'orders' ? 'tab-btn active' : 'tab-btn'}
            style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: subView === 'orders' ? '#0d9488' : 'transparent', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => setSubView('orders')}
          >
            Purchase Orders
          </button>
          <button
            type="button"
            className={subView === 'movements' ? 'tab-btn active' : 'tab-btn'}
            style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: subView === 'movements' ? '#0d9488' : 'transparent', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => setSubView('movements')}
          >
            Stock Movements
          </button>
        </div>
      </div>

      {error ? (
        <div className="state-message error" style={{ marginBottom: '1rem', background: 'rgba(244,63,94,0.15)', color: '#fda4af', padding: '0.75rem 1rem', borderRadius: '6px' }}>
          {error}
        </div>
      ) : null}

      {success ? (
        <div style={{ marginBottom: '1rem', background: 'rgba(45,212,191,0.15)', color: '#5eead4', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.9rem' }}>
          {success}
        </div>
      ) : null}

      {/* SUB-VIEW 1: STOCK */}
      {subView === 'stock' && (
        <div>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <input
              className="glass-input"
              style={{ maxWidth: 360, borderRadius: '6px' }}
              placeholder="Search products by name or brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="glass-select"
              style={{ maxWidth: 180, borderRadius: '6px' }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="glass-panel glass-table-container">
            {filteredProducts.length === 0 ? (
              <div className="state-message" style={{ padding: '2rem' }}>No products match criteria.</div>
            ) : (
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>In Stock</th>
                    <th>On Order</th>
                    <th>Expiry Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{p.name}</div>
                        {p.brand ? <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.brand}</div> : null}
                      </td>
                      <td>{p.category}</td>
                      <td>
                        <strong style={{ color: p.stockQuantity === 0 ? 'var(--color-rose)' : 'inherit' }}>
                          {p.stockQuantity}
                        </strong>
                      </td>
                      <td>
                        {p.onOrderQuantity > 0 ? (
                          <span className="badge badge-teal">+{p.onOrderQuantity}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>0</span>
                        )}
                      </td>
                      <td>{renderExpiryBadge(p)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', borderRadius: '6px', background: '#0d9488', color: '#fff', border: 'none', cursor: 'pointer' }}
                            onClick={() => {
                              setReorderModal(p)
                              setReorderQty(10)
                              setReorderSupplier('')
                            }}
                          >
                            Reorder
                          </button>
                          <button
                            type="button"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', borderRadius: '6px', background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}
                            onClick={() => {
                              setAdjustModal(p)
                              setAdjustDelta(0)
                              setAdjustReason('')
                            }}
                          >
                            Adjust
                          </button>
                          <button
                            type="button"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', borderRadius: '6px', background: 'rgba(244,63,94,0.18)', color: '#fda4af', border: '1px solid rgba(244,63,94,0.3)', cursor: 'pointer' }}
                            onClick={() => {
                              setWriteoffModal(p)
                              setWriteoffReason('')
                            }}
                          >
                            Write off
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: ORDERS */}
      {subView === 'orders' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Status:</label>
              <select
                className="glass-select"
                style={{ width: 140, borderRadius: '6px' }}
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="ORDERED">ORDERED</option>
                <option value="RECEIVED">RECEIVED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
            <button
              type="button"
              style={{ padding: '0.45rem 0.9rem', borderRadius: '6px', background: '#0d9488', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
              onClick={loadOrders}
            >
              Refresh Orders
            </button>
          </div>

          <div className="glass-panel glass-table-container">
            {loading ? (
              <div style={{ padding: '2rem' }}>
                <div className="skeleton" style={{ height: 35, marginBottom: '0.5rem' }} />
                <div className="skeleton" style={{ height: 35 }} />
              </div>
            ) : orders.length === 0 ? (
              <div className="state-message" style={{ padding: '2rem' }}>No purchase orders yet</div>
            ) : (
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Status</th>
                    <th>Supplier</th>
                    <th>Ordered</th>
                    <th>Received</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => {
                    const prod = products.find((p) => p.id === o.productId)
                    return (
                      <tr key={o.id}>
                        <td>#{o.id}</td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>
                            {prod ? prod.name : `Product #${o.productId}`}
                          </div>
                        </td>
                        <td><strong>{o.quantity}</strong></td>
                        <td>
                          <span
                            className={
                              o.status === 'RECEIVED'
                                ? 'badge badge-green'
                                : o.status === 'CANCELLED'
                                ? 'badge badge-rose'
                                : 'badge badge-amber'
                            }
                          >
                            {o.status}
                          </span>
                        </td>
                        <td>{o.supplier || '-'}</td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {o.orderedAt ? new Date(o.orderedAt).toLocaleString() : '-'}
                          {o.orderedBy ? <div style={{ color: 'var(--text-muted)' }}>by {o.orderedBy}</div> : null}
                        </td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {o.status === 'RECEIVED' ? (
                            <div>
                              <strong>{o.receivedQuantity} units</strong>
                              <div>{o.receivedAt ? new Date(o.receivedAt).toLocaleDateString() : ''}</div>
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {o.status === 'ORDERED' ? (
                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', borderRadius: '6px', background: '#0d9488', color: '#fff', border: 'none', cursor: 'pointer' }}
                                onClick={() => {
                                  setReceiveModal(o)
                                  setReceiveQty(o.quantity)
                                  setReceiveExpiry('')
                                }}
                              >
                                Receive
                              </button>
                              <button
                                type="button"
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', borderRadius: '6px', background: 'rgba(244,63,94,0.18)', color: '#fda4af', border: '1px solid rgba(244,63,94,0.3)', cursor: 'pointer' }}
                                onClick={() => handleCancelOrder(o.id)}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Closed</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: MOVEMENTS */}
      {subView === 'movements' && (
        <div>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              className="glass-select"
              style={{ width: 170, borderRadius: '6px' }}
              value={movementFilters.type}
              onChange={(e) => setMovementFilters({ ...movementFilters, type: e.target.value })}
            >
              <option value="">All Movement Types</option>
              <option value="PURCHASE">PURCHASE</option>
              <option value="SALE">SALE</option>
              <option value="CANCEL_RESTORE">CANCEL RESTORE</option>
              <option value="ADJUSTMENT">ADJUSTMENT</option>
              <option value="WRITE_OFF">WRITE OFF</option>
            </select>

            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              From:
              <input
                type="date"
                className="glass-input"
                style={{ width: 140, marginLeft: 6, borderRadius: '6px' }}
                value={movementFilters.from}
                onChange={(e) => setMovementFilters({ ...movementFilters, from: e.target.value })}
              />
            </label>

            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              To:
              <input
                type="date"
                className="glass-input"
                style={{ width: 140, marginLeft: 6, borderRadius: '6px' }}
                value={movementFilters.to}
                onChange={(e) => setMovementFilters({ ...movementFilters, to: e.target.value })}
              />
            </label>

            <button
              type="button"
              style={{ padding: '0.45rem 0.9rem', borderRadius: '6px', background: '#0d9488', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
              onClick={loadMovements}
            >
              Apply Filter
            </button>
          </div>

          <div className="glass-panel glass-table-container">
            {loading ? (
              <div style={{ padding: '2rem' }}>
                <div className="skeleton" style={{ height: 35, marginBottom: '0.5rem' }} />
                <div className="skeleton" style={{ height: 35 }} />
              </div>
            ) : movements.length === 0 ? (
              <div className="state-message" style={{ padding: '2rem' }}>No stock movements recorded.</div>
            ) : (
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Product</th>
                    <th>Type</th>
                    <th>Quantity Change</th>
                    <th>Reference</th>
                    <th>By</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => {
                    const prod = products.find((p) => p.id === m.productId)
                    const isPositive = m.quantityChange > 0
                    return (
                      <tr key={m.id}>
                        <td>#{m.id}</td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>
                            {prod ? prod.name : `Product #${m.productId}`}
                          </div>
                        </td>
                        <td>
                          <span
                            className={
                              m.type === 'PURCHASE'
                                ? 'badge badge-green'
                                : m.type === 'CANCEL_RESTORE'
                                ? 'badge badge-teal'
                                : m.type === 'WRITE_OFF'
                                ? 'badge badge-rose'
                                : m.type === 'ADJUSTMENT'
                                ? 'badge badge-amber'
                                : 'badge badge-slate'
                            }
                          >
                            {m.type}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: isPositive ? 'var(--color-teal)' : 'var(--color-rose)' }}>
                            {isPositive ? `+${m.quantityChange}` : m.quantityChange}
                          </strong>
                        </td>
                        <td>{m.reference || '-'}</td>
                        <td style={{ fontSize: '0.85rem' }}>{m.createdBy || '-'}</td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {m.createdAt ? new Date(m.createdAt).toLocaleString() : '-'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: REORDER */}
      {reorderModal && (
        <div className="modal-overlay" onClick={() => setReorderModal(null)}>
          <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()} style={{ width: 'min(450px, 92vw)' }}>
            <h2 style={{ fontSize: '1.25rem', marginTop: 0 }}>Create Purchase Order</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Ordering stock for <strong>{reorderModal.name}</strong> (Current stock: {reorderModal.stockQuantity})
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
                onClick={() => setReorderModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: '#0d9488', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                disabled={actionLoading}
                onClick={handleConfirmReorder}
              >
                {actionLoading ? 'Ordering...' : 'Confirm Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADJUST */}
      {adjustModal && (
        <div className="modal-overlay" onClick={() => setAdjustModal(null)}>
          <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()} style={{ width: 'min(450px, 92vw)' }}>
            <h2 style={{ fontSize: '1.25rem', marginTop: 0 }}>Manual Stock Adjustment</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Adjusting stock for <strong>{adjustModal.name}</strong> (Current stock: {adjustModal.stockQuantity})
            </p>
            <div style={{ marginTop: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4 }}>Quantity Delta (positive or negative)</label>
              <input
                type="number"
                className="glass-input"
                style={{ borderRadius: '6px' }}
                placeholder="e.g. +5 or -2"
                value={adjustDelta}
                onChange={(e) => setAdjustDelta(e.target.value)}
              />
            </div>
            <div style={{ marginTop: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4 }}>Reason for Adjustment (required)</label>
              <input
                type="text"
                placeholder="e.g. Inventory count correction"
                className="glass-input"
                style={{ borderRadius: '6px' }}
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer' }}
                onClick={() => setAdjustModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: '#0d9488', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                disabled={actionLoading}
                onClick={handleConfirmAdjust}
              >
                {actionLoading ? 'Saving...' : 'Save Adjustment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: WRITE OFF */}
      {writeoffModal && (
        <div className="modal-overlay" onClick={() => setWriteoffModal(null)}>
          <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()} style={{ width: 'min(450px, 92vw)' }}>
            <h2 style={{ fontSize: '1.25rem', marginTop: 0, color: 'var(--color-rose)' }}>Confirm Inventory Write Off</h2>
            <p style={{ color: 'var(--text-heading)', fontSize: '0.9rem' }}>
              This will reduce current stock ({writeoffModal.stockQuantity} units) of <strong>{writeoffModal.name}</strong> to 0.
            </p>
            <div style={{ marginTop: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4 }}>Write-off Reason (required)</label>
              <input
                type="text"
                placeholder="e.g. Damaged during storage or expired batch"
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
                onClick={() => setWriteoffModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: 'var(--color-rose)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                disabled={actionLoading}
                onClick={handleConfirmWriteoff}
              >
                {actionLoading ? 'Processing...' : 'Confirm Write Off'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: RECEIVE ORDER */}
      {receiveModal && (
        <div className="modal-overlay" onClick={() => setReceiveModal(null)}>
          <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()} style={{ width: 'min(450px, 92vw)' }}>
            <h2 style={{ fontSize: '1.25rem', marginTop: 0 }}>Receive Purchase Order #{receiveModal.id}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Product: <strong>{products.find((p) => p.id === receiveModal.productId)?.name || `ID #${receiveModal.productId}`}</strong>
              <br />Ordered quantity: <strong>{receiveModal.quantity}</strong>
            </p>
            <div style={{ marginTop: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4 }}>Received Quantity</label>
              <input
                type="number"
                min="1"
                className="glass-input"
                style={{ borderRadius: '6px' }}
                value={receiveQty}
                onChange={(e) => setReceiveQty(e.target.value)}
              />
            </div>
            {products.find((p) => p.id === receiveModal.productId)?.expiryDate && (
              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4 }}>
                  New Batch Expiry Date (required for perishables)
                </label>
                <input
                  type="date"
                  className="glass-input"
                  style={{ borderRadius: '6px' }}
                  value={receiveExpiry}
                  onChange={(e) => setReceiveExpiry(e.target.value)}
                />
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer' }}
                onClick={() => setReceiveModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: '#0d9488', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                disabled={actionLoading}
                onClick={handleConfirmReceive}
              >
                {actionLoading ? 'Receiving...' : 'Confirm Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
