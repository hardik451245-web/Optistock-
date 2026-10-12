import { useState } from 'react'
import ProductModal from './ProductModal'
import { addProduct, updateProduct, deleteProduct } from '../../api'

export default function ProductsTab({ products, onRefresh, loading, error }) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [modalProduct, setModalProduct] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')

  const categories = ['ALL', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))]
  const existingProductTypes = Array.from(new Set(products.map((p) => p.productType).filter(Boolean)))

  const filtered = products.filter((p) => {
    const matchesSearch =
      (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.brand || '').toLowerCase().includes(search.toLowerCase())
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  function handleAdd() {
    setModalProduct(null)
    setIsModalOpen(true)
    setActionError('')
    setActionSuccess('')
  }

  function handleEdit(product) {
    setModalProduct(product)
    setIsModalOpen(true)
    setActionError('')
    setActionSuccess('')
  }

  async function handleSave(formData) {
    setSaving(true)
    setActionError('')
    setActionSuccess('')
    try {
      if (modalProduct) {
        await updateProduct(modalProduct.id, formData)
        setActionSuccess(`Product "${formData.name}" updated successfully`)
      } else {
        await addProduct(formData)
        setActionSuccess(`Product "${formData.name}" created successfully`)
      }
      setIsModalOpen(false)
      await onRefresh()
    } catch (err) {
      setActionError(err.message || 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Archive product "${name}"? It will be deactivated and hidden from catalog and billing.`)) {
      return
    }
    setActionError('')
    setActionSuccess('')
    try {
      await deleteProduct(id)
      setActionSuccess(`Product "${name}" archived successfully`)
      await onRefresh()
    } catch (err) {
      setActionError(err.message || 'Failed to archive product')
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flex: 1, maxWidth: 500 }}>
          <input
            className="glass-input"
            style={{ borderRadius: '6px' }}
            placeholder="Search products by name or brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="glass-select"
            style={{ maxWidth: 160, borderRadius: '6px' }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: '#0d9488', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
          onClick={handleAdd}
        >
          + Add Product
        </button>
      </div>

      {actionError ? (
        <div className="state-message error" style={{ marginBottom: '1rem', background: 'rgba(244,63,94,0.15)', color: '#fda4af', padding: '0.75rem 1rem', borderRadius: '6px' }}>
          {actionError}
        </div>
      ) : null}

      {actionSuccess ? (
        <div style={{ marginBottom: '1rem', background: 'rgba(45,212,191,0.15)', color: '#5eead4', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.9rem' }}>
          {actionSuccess}
        </div>
      ) : null}

      {error ? (
        <div className="state-message error" style={{ marginBottom: '1rem', background: 'rgba(244,63,94,0.15)', color: '#fda4af', padding: '0.75rem 1rem', borderRadius: '6px' }}>
          {error}
        </div>
      ) : null}

      <div className="glass-panel glass-table-container">
        {loading ? (
          <div style={{ padding: '2rem' }}>
            <div className="skeleton" style={{ height: 40, marginBottom: '0.75rem', borderRadius: '6px' }} />
            <div className="skeleton" style={{ height: 40, marginBottom: '0.75rem', borderRadius: '6px' }} />
            <div className="skeleton" style={{ height: 40, borderRadius: '6px' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="state-message" style={{ padding: '2rem' }}>No products found.</div>
        ) : (
          <table className="glass-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Selling Price</th>
                <th>Cost Price</th>
                <th>In Stock</th>
                <th>Expiry / Batch</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{p.name}</div>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap', marginTop: 2 }}>
                      {p.brand ? <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.brand}</span> : null}
                      {p.productType ? (
                        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: '4px' }}>
                          {p.productType}
                        </span>
                      ) : null}
                      {p.needsProductTypeFix ? (
                        <button
                          type="button"
                          className="badge badge-amber"
                          style={{ cursor: 'pointer', border: 'none', padding: '2px 6px', fontSize: '0.72rem' }}
                          onClick={() => handleEdit(p)}
                        >
                          Set product type
                        </button>
                      ) : null}
                    </div>
                    {p.onOrderQuantity > 0 ? (
                      <span className="badge badge-teal" style={{ fontSize: '0.72rem', marginTop: 2 }}>
                        On order: {p.onOrderQuantity}
                      </span>
                    ) : null}
                  </td>
                  <td>{p.category}</td>
                  <td>
                    {p.effectivePrice != null && Number(p.effectivePrice) !== Number(p.sellingPrice) ? (
                      <div>
                        <strong style={{ color: 'var(--color-teal)' }}>₹{p.effectivePrice}</strong>
                        <span style={{ textDecoration: 'line-through', fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 6 }}>
                          ₹{p.sellingPrice}
                        </span>
                      </div>
                    ) : (
                      <strong>₹{p.sellingPrice}</strong>
                    )}
                  </td>
                  <td>₹{p.costPrice}</td>
                  <td>
                    <strong style={{ color: p.stockQuantity === 0 ? 'var(--color-rose)' : 'inherit' }}>
                      {p.stockQuantity}
                    </strong>
                  </td>
                  <td>{renderExpiryBadge(p)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer' }}
                        onClick={() => handleEdit(p)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem', borderRadius: '6px', background: 'rgba(244,63,94,0.18)', color: '#fda4af', border: '1px solid rgba(244,63,94,0.3)', cursor: 'pointer' }}
                        onClick={() => handleDelete(p.id, p.name)}
                      >
                        Archive
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <ProductModal
          product={modalProduct}
          existingProductTypes={existingProductTypes}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </div>
  )
}
