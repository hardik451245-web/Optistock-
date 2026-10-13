import React, { useState, useEffect } from 'react'

export default function ProductModal({
  product,
  onClose,
  onSave,
  saving,
  existingProductTypes = [],
}) {
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

  const [errors, setErrors] = useState({})

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !saving) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, saving])

  function updateField(field, val) {
    setForm((f) => ({ ...f, [field]: val }))
    if (errors[field]) {
      setErrors((errs) => ({ ...errs, [field]: null }))
    }
  }

  function validate() {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Product name is required'
    if (!form.productType.trim()) errs.productType = 'Product type is required (e.g. Milk 1L)'
    if (!form.category.trim()) errs.category = 'Category is required'
    if (form.costPrice === '' || isNaN(Number(form.costPrice)) || Number(form.costPrice) < 0) {
      errs.costPrice = 'Valid cost price is required'
    }
    if (form.sellingPrice === '' || isNaN(Number(form.sellingPrice)) || Number(form.sellingPrice) < 0) {
      errs.sellingPrice = 'Valid selling price is required'
    }
    if (form.stockQuantity === '' || isNaN(Number(form.stockQuantity)) || Number(form.stockQuantity) < 0) {
      errs.stockQuantity = 'Valid stock quantity is required'
    }
    if (form.reorderThreshold === '' || isNaN(Number(form.reorderThreshold)) || Number(form.reorderThreshold) < 0) {
      errs.reorderThreshold = 'Valid reorder threshold is required'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    try {
      await onSave({
        name: form.name.trim(),
        brand: form.brand?.trim() || null,
        productType: form.productType.trim(),
        category: form.category.trim(),
        costPrice: Number(form.costPrice),
        sellingPrice: Number(form.sellingPrice),
        stockQuantity: Number(form.stockQuantity),
        reorderThreshold: Number(form.reorderThreshold),
        expiryDate: form.expiryDate || null,
      })
    } catch (err) {
      setErrors({ form: err.message || 'Failed to save product' })
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) {
          onClose()
        }
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #E2E8F0',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#0F172A' }}>
              {product ? 'Edit Product' : 'Add New Product'}
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748B' }}>
              {product ? 'Update product details and pricing' : 'Create a new stock catalog entry'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            x
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {errors.form && (
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
                {errors.form}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                  Product Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="e.g. Amul Milk 1L"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: errors.name ? '1px solid #EF4444' : '1px solid #CBD5E1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
                {errors.name && <span style={{ fontSize: '11px', color: '#EF4444' }}>{errors.name}</span>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                  Brand
                </label>
                <input
                  type="text"
                  value={form.brand}
                  onChange={(e) => updateField('brand', e.target.value)}
                  placeholder="e.g. Amul"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                  Product Type *
                </label>
                <input
                  type="text"
                  list="product-type-suggestions"
                  value={form.productType}
                  onChange={(e) => updateField('productType', e.target.value)}
                  placeholder="e.g. Milk 1L, Curd 400g"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: errors.productType ? '1px solid #EF4444' : '1px solid #CBD5E1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
                <datalist id="product-type-suggestions">
                  {existingProductTypes.map((pt) => (
                    <option key={pt} value={pt} />
                  ))}
                </datalist>
                {errors.productType ? (
                  <span style={{ fontSize: '11px', color: '#EF4444' }}>{errors.productType}</span>
                ) : (
                  <span style={{ fontSize: '11px', color: '#64748B' }}>Used for 80/20 brand mix grouping</span>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                  Category *
                </label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => updateField('category', e.target.value)}
                  placeholder="e.g. Dairy, Grocery"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: errors.category ? '1px solid #EF4444' : '1px solid #CBD5E1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
                {errors.category && <span style={{ fontSize: '11px', color: '#EF4444' }}>{errors.category}</span>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                  Cost Price (Rs.) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.costPrice}
                  onChange={(e) => updateField('costPrice', e.target.value)}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: errors.costPrice ? '1px solid #EF4444' : '1px solid #CBD5E1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
                {errors.costPrice && <span style={{ fontSize: '11px', color: '#EF4444' }}>{errors.costPrice}</span>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                  Selling Price (Rs.) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.sellingPrice}
                  onChange={(e) => updateField('sellingPrice', e.target.value)}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: errors.sellingPrice ? '1px solid #EF4444' : '1px solid #CBD5E1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
                {errors.sellingPrice && <span style={{ fontSize: '11px', color: '#EF4444' }}>{errors.sellingPrice}</span>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                  Initial Stock Quantity *
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={form.stockQuantity}
                  onChange={(e) => updateField('stockQuantity', e.target.value)}
                  placeholder="0"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: errors.stockQuantity ? '1px solid #EF4444' : '1px solid #CBD5E1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
                {errors.stockQuantity && <span style={{ fontSize: '11px', color: '#EF4444' }}>{errors.stockQuantity}</span>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                  Reorder Threshold *
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={form.reorderThreshold}
                  onChange={(e) => updateField('reorderThreshold', e.target.value)}
                  placeholder="10"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: errors.reorderThreshold ? '1px solid #EF4444' : '1px solid #CBD5E1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
                {errors.reorderThreshold && <span style={{ fontSize: '11px', color: '#EF4444' }}>{errors.reorderThreshold}</span>}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                Expiry Date (optional)
              </label>
              <input
                type="date"
                value={form.expiryDate}
                onChange={(e) => updateField('expiryDate', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div
            style={{
              padding: '16px 24px',
              backgroundColor: '#F8FAFC',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                color: '#334155',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '8px 18px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#0F172A',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {saving ? 'Saving...' : product ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
