import { useState } from 'react'

export default function ProductModal({ product, onClose, onSave, saving, existingProductTypes = [] }) {
  const [form, setForm] = useState({
    name: product?.name || '',
    brand: product?.brand || '',
    productType: product?.productType || '',
    category: product?.category || '',
    costPrice: product?.costPrice != null ? product.costPrice : '',
    sellingPrice: product?.sellingPrice != null ? product.sellingPrice : '',
    stockQuantity: product?.stockQuantity != null ? product.stockQuantity : '',
    reorderThreshold: product?.reorderThreshold != null ? product.reorderThreshold : '',
    expiryDate: product?.expiryDate || '',
  })

  function updateField(field, val) {
    setForm((f) => ({ ...f, [field]: val }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSave({
      name: form.name.trim(),
      brand: form.brand?.trim() || null,
      productType: form.productType.trim(),
      category: form.category.trim(),
      costPrice: form.costPrice !== '' ? Number(form.costPrice) : null,
      sellingPrice: form.sellingPrice !== '' ? Number(form.sellingPrice) : null,
      stockQuantity: form.stockQuantity !== '' ? Number(form.stockQuantity) : 0,
      reorderThreshold: form.reorderThreshold !== '' ? Number(form.reorderThreshold) : 0,
      expiryDate: form.expiryDate || null,
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()} style={{ width: 'min(500px, 94vw)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-heading)' }}>
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button
            type="button"
            style={{ padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer' }}
            onClick={onClose}
          >
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label style={{ fontSize: '0.85rem' }}>
              Product Name *
              <input className="glass-input" style={{ borderRadius: '6px' }} value={form.name} onChange={(e) => updateField('name', e.target.value)} required />
            </label>
            <label style={{ fontSize: '0.85rem' }}>
              Brand
              <input className="glass-input" style={{ borderRadius: '6px' }} value={form.brand} onChange={(e) => updateField('brand', e.target.value)} placeholder="e.g. Amul" />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label style={{ fontSize: '0.85rem' }}>
              Product Type *
              <input
                className="glass-input"
                style={{ borderRadius: '6px' }}
                value={form.productType}
                onChange={(e) => updateField('productType', e.target.value)}
                required
                list="product-type-suggestions"
                placeholder="e.g. Milk 1L, Curd 400g"
              />
            </label>
            <label style={{ fontSize: '0.85rem' }}>
              Category *
              <input className="glass-input" style={{ borderRadius: '6px' }} value={form.category} onChange={(e) => updateField('category', e.target.value)} required placeholder="e.g. Dairy" />
            </label>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '-0.5rem' }}>
            Compare similar products by brand (e.g. Milk 1L, Curd 400g, Salt 1kg). Do not use broad categories here.
          </div>
          <datalist id="product-type-suggestions">
            {existingProductTypes.map((pt) => (
              <option key={pt} value={pt} />
            ))}
          </datalist>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label style={{ fontSize: '0.85rem' }}>
              Expiry Date
              <input type="date" className="glass-input" style={{ borderRadius: '6px' }} value={form.expiryDate} onChange={(e) => updateField('expiryDate', e.target.value)} />
            </label>
            <div />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label style={{ fontSize: '0.85rem' }}>
              Cost Price (₹) *
              <input type="number" step="0.01" min="0" className="glass-input" style={{ borderRadius: '6px' }} value={form.costPrice} onChange={(e) => updateField('costPrice', e.target.value)} required />
            </label>
            <label style={{ fontSize: '0.85rem' }}>
              Selling Price (₹) *
              <input type="number" step="0.01" min="0" className="glass-input" style={{ borderRadius: '6px' }} value={form.sellingPrice} onChange={(e) => updateField('sellingPrice', e.target.value)} required />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label style={{ fontSize: '0.85rem' }}>
              Stock Quantity *
              <input type="number" step="1" min="0" className="glass-input" style={{ borderRadius: '6px' }} value={form.stockQuantity} onChange={(e) => updateField('stockQuantity', e.target.value)} required />
            </label>
            <label style={{ fontSize: '0.85rem' }}>
              Reorder Threshold *
              <input type="number" step="1" min="0" className="glass-input" style={{ borderRadius: '6px' }} value={form.reorderThreshold} onChange={(e) => updateField('reorderThreshold', e.target.value)} required />
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button
              type="button"
              style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer' }}
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: '#0d9488', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
              disabled={saving}
            >
              {saving ? 'Saving...' : product ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
