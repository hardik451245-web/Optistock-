import React, { useState } from 'react'
import ProductModal from './ProductModal'
import { addProduct, updateProduct, deleteProduct } from '../../api'

export default function ProductsTab({ products = [], onRefresh, loading, error }) {
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
      if (onRefresh) await onRefresh()
    } catch (err) {
      setActionError(err.message || 'Failed to save product')
      throw err
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
      if (onRefresh) await onRefresh()
    } catch (err) {
      setActionError(err.message || 'Failed to archive product')
    }
  }

  function renderExpiryBadge(p) {
    const status = p.expiryStatus
    if (!status || status === 'NORMAL' || status === 'NO_EXPIRY') {
      return p.expiryDate ? (
        <span style={{ fontSize: '11px', color: '#10B981', backgroundColor: '#ECFDF5', padding: '2px 8px', borderRadius: '4px' }}>
          {p.expiryDate}
        </span>
      ) : (
        <span style={{ fontSize: '11px', color: '#64748B', backgroundColor: '#F1F5F9', padding: '2px 8px', borderRadius: '4px' }}>
          No expiry
        </span>
      )
    }
    if (status === 'EXPIRING_SOON') {
      return (
        <span style={{ fontSize: '11px', color: '#B45309', backgroundColor: '#FEF3C7', padding: '2px 8px', borderRadius: '4px', fontWeight: 500 }}>
          Expiring Soon ({p.daysLeft ?? '?'}d)
        </span>
      )
    }
    if (status === 'MARKDOWN' || status === 'LAST_DAY') {
      const discount = p.discountPercent != null ? `${Number(p.discountPercent)}% OFF` : 'Markdown'
      return (
        <span style={{ fontSize: '11px', color: '#C2410C', backgroundColor: '#FFEDD5', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
          {discount}
        </span>
      )
    }
    if (status === 'EXPIRED') {
      return (
        <span style={{ fontSize: '11px', color: '#BE123C', backgroundColor: '#FFE4E6', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
          EXPIRED
        </span>
      )
    }
    return (
      <span style={{ fontSize: '11px', color: '#64748B', backgroundColor: '#F1F5F9', padding: '2px 8px', borderRadius: '4px' }}>
        {p.expiryDate || 'Normal'}
      </span>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '0 4px' }}>
      {/* Top Search & Filter Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          padding: '14px 18px',
          borderRadius: '8px',
          border: '1px solid #E2E8F0',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', gap: '10px', flex: 1, maxWidth: 520 }}>
          <input
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              fontSize: '13px',
              color: '#0F172A',
            }}
            placeholder="Search products by name or brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            style={{
              width: '160px',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              fontSize: '13px',
              color: '#0F172A',
              backgroundColor: '#FFFFFF',
            }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'ALL' ? 'All Categories' : c}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          + Add Product
        </button>
      </div>

      {actionError && (
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: '#FEF2F2',
            color: '#991B1B',
            borderRadius: '6px',
            fontSize: '13px',
            border: '1px solid #FECACA',
          }}
        >
          {actionError}
        </div>
      )}

      {actionSuccess && (
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: '#ECFDF5',
            color: '#065F46',
            borderRadius: '6px',
            fontSize: '13px',
            border: '1px solid #A7F3D0',
          }}
        >
          {actionSuccess}
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: '#FEF2F2',
            color: '#991B1B',
            borderRadius: '6px',
            fontSize: '13px',
            border: '1px solid #FECACA',
          }}
        >
          {error}
        </div>
      )}

      {/* Main Table Container */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '8px',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
            Loading products catalog...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
            No products found matching criteria.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px', color: '#475569' }}>Product</th>
                  <th style={{ padding: '10px 14px', color: '#475569' }}>Category</th>
                  <th style={{ padding: '10px 14px', color: '#475569', textAlign: 'right' }}>Selling Price</th>
                  <th style={{ padding: '10px 14px', color: '#475569', textAlign: 'right' }}>Cost Price</th>
                  <th style={{ padding: '10px 14px', color: '#475569', textAlign: 'center' }}>In Stock</th>
                  <th style={{ padding: '10px 14px', color: '#475569' }}>Expiry / Batch</th>
                  <th style={{ padding: '10px 14px', color: '#475569', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 600, color: '#0F172A' }}>{p.name}</div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginTop: '2px' }}>
                        {p.brand && (
                          <span style={{ fontSize: '11px', color: '#64748B' }}>{p.brand}</span>
                        )}
                        {p.productType && (
                          <span
                            style={{
                              fontSize: '11px',
                              color: '#334155',
                              backgroundColor: '#F1F5F9',
                              padding: '1px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            {p.productType}
                          </span>
                        )}
                        {p.onOrderQuantity > 0 && (
                          <span
                            style={{
                              fontSize: '11px',
                              color: '#1D4ED8',
                              backgroundColor: '#EFF6FF',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontWeight: 600,
                            }}
                          >
                            On order: {p.onOrderQuantity}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#475569' }}>{p.category}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      {p.effectivePrice != null && Number(p.effectivePrice) !== Number(p.sellingPrice) ? (
                        <div>
                          <strong style={{ color: '#059669' }}>
                            Rs. {Number(p.effectivePrice).toFixed(2)}
                          </strong>
                          <span
                            style={{
                              textDecoration: 'line-through',
                              fontSize: '11px',
                              color: '#94A3B8',
                              marginLeft: '6px',
                            }}
                          >
                            Rs. {Number(p.sellingPrice).toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <strong>Rs. {Number(p.sellingPrice || 0).toFixed(2)}</strong>
                      )}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: '#64748B' }}>
                      Rs. {Number(p.costPrice || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <strong style={{ color: p.stockQuantity === 0 ? '#EF4444' : '#0F172A' }}>
                        {p.stockQuantity ?? 0}
                      </strong>
                    </td>
                    <td style={{ padding: '10px 14px' }}>{renderExpiryBadge(p)}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => handleEdit(p)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            backgroundColor: '#FFFFFF',
                            color: '#334155',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id, p.name)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: '1px solid #FECACA',
                            backgroundColor: '#FEF2F2',
                            color: '#DC2626',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                          }}
                        >
                          Archive
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
