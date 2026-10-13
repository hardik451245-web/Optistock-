import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useReorder } from '../../context/ReorderContext'
import {
  createPurchaseOrder,
  createBulkPurchaseOrders,
  createSupplier,
} from '../../api'

export default function NewReorderDialog() {
  const {
    isOpen,
    modalOptions,
    closeReorder,
    suppliers,
    products,
    loadSuppliers,
    notifyOrderCreated,
  } = useReorder()

  const isMixMode = modalOptions?.mode === 'mix'

  // Single mode state
  const [selectedProductId, setSelectedProductId] = useState('')
  const [quantity, setQuantity] = useState(10)
  const [unitCost, setUnitCost] = useState('0.00')

  // Mix mode state
  const [mixItems, setMixItems] = useState([])

  // Shared state
  const [supplierId, setSupplierId] = useState('')
  const [showNewSupplier, setShowNewSupplier] = useState(false)
  const [newSupplierName, setNewSupplierName] = useState('')
  const [newSupplierPhone, setNewSupplierPhone] = useState('')
  const [newSupplierEmail, setNewSupplierEmail] = useState('')
  const [expectedDate, setExpectedDate] = useState('')
  const [notes, setNotes] = useState('')

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [bannerSuccess, setBannerSuccess] = useState('')

  const modalRef = useRef(null)

  // Default expected delivery date: today + 3 days in Asia/Kolkata
  const defaultDateStr = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 3)
    return d.toISOString().split('T')[0]
  }, [])

  // Initialize dialog state when modal opens
  useEffect(() => {
    if (!isOpen) return

    setErrors({})
    setBannerSuccess('')
    setNotes('')
    setShowNewSupplier(false)
    setNewSupplierName('')
    setNewSupplierPhone('')
    setNewSupplierEmail('')
    setExpectedDate(defaultDateStr)

    // Preselect supplier if provided or default to first
    if (modalOptions?.supplierId) {
      setSupplierId(String(modalOptions.supplierId))
    } else if (suppliers.length > 0) {
      setSupplierId(String(suppliers[0].id))
    } else {
      setSupplierId('')
    }

    if (modalOptions?.mode === 'mix') {
      const items = (modalOptions.items || []).map((item) => {
        const prod = products.find((p) => p.id === item.productId)
        const cost = item.costPrice || prod?.costPrice || 0
        return {
          productId: item.productId,
          name: item.name || prod?.name || `Product #${item.productId}`,
          brand: item.brand || prod?.brand || '',
          suggestedSharePercent: item.suggestedSharePercent || 0,
          quantity: Math.max(1, item.suggestedQty ?? item.unitsToOrder ?? 5),
          unitCost: Number(cost).toFixed(2),
        }
      })
      setMixItems(items)
    } else {
      // Single mode
      const pid = modalOptions?.productId || modalOptions?.product?.id || ''
      setSelectedProductId(pid ? String(pid) : '')

      const prod = products.find((p) => String(p.id) === String(pid))
      let initialQty = 10
      if (modalOptions?.suggestedQty != null) {
        initialQty = Math.max(1, modalOptions.suggestedQty)
      } else if (prod) {
        const threshold = prod.reorderThreshold ?? 10
        const stock = prod.stockQuantity ?? 0
        initialQty = Math.max(1, threshold * 2 - stock)
      }
      setQuantity(initialQty)

      const cost = modalOptions?.unitCost ?? prod?.costPrice ?? 0
      setUnitCost(Number(cost).toFixed(2))
    }
  }, [isOpen, modalOptions, products, suppliers, defaultDateStr])

  // Handle product change in single mode
  const handleProductChange = (e) => {
    const pid = e.target.value
    setSelectedProductId(pid)
    const prod = products.find((p) => String(p.id) === String(pid))
    if (prod) {
      const threshold = prod.reorderThreshold ?? 10
      const stock = prod.stockQuantity ?? 0
      setQuantity(Math.max(1, threshold * 2 - stock))
      setUnitCost(Number(prod.costPrice ?? 0).toFixed(2))
    }
  }

  // Escape key handler and focus trap
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeReorder()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, closeReorder])

  if (!isOpen) return null

  // Mix mode item quantity adjustment
  const updateMixItemQty = (index, delta) => {
    setMixItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item
        const nextQty = Math.max(1, Number(item.quantity) + delta)
        return { ...item, quantity: nextQty }
      })
    )
  }

  const setMixItemQtyValue = (index, val) => {
    const num = parseInt(val, 10)
    setMixItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item
        return { ...item, quantity: isNaN(num) ? '' : Math.max(1, num) }
      })
    )
  }

  const setMixItemCostValue = (index, val) => {
    setMixItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item
        return { ...item, unitCost: val }
      })
    )
  }

  // Calculated totals
  const singleTotalCost = (Number(quantity || 0) * Number(unitCost || 0)).toFixed(2)

  const mixTotalUnits = mixItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
  const mixTotalCost = mixItems
    .reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitCost || 0), 0)
    .toFixed(2)

  const validate = () => {
    const errs = {}

    if (!showNewSupplier && !supplierId) {
      errs.supplier = 'Please select a supplier'
    }

    if (showNewSupplier && !newSupplierName.trim()) {
      errs.newSupplierName = 'Supplier name is required'
    }

    if (!isMixMode) {
      if (!selectedProductId) {
        errs.product = 'Please select a product'
      }
      if (!quantity || Number(quantity) < 1) {
        errs.quantity = 'Quantity must be at least 1'
      }
      if (unitCost === '' || isNaN(Number(unitCost)) || Number(unitCost) < 0) {
        errs.unitCost = 'Unit cost must be 0 or higher'
      }
    } else {
      if (!mixItems.length) {
        errs.mix = 'No items in mix'
      }
      mixItems.forEach((item, idx) => {
        if (!item.quantity || Number(item.quantity) < 1) {
          errs[`item_qty_${idx}`] = 'Quantity must be at least 1'
        }
        if (item.unitCost === '' || isNaN(Number(item.unitCost)) || Number(item.unitCost) < 0) {
          errs[`item_cost_${idx}`] = 'Unit cost must be 0 or higher'
        }
      })
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (targetStatus) => {
    if (!validate()) return

    setLoading(true)
    setErrors({})

    try {
      let activeSupplierName = ''
      let activeSupplierId = supplierId ? Number(supplierId) : null

      // Create new supplier if needed
      if (showNewSupplier) {
        const createdSup = await createSupplier({
          name: newSupplierName.trim(),
          phone: newSupplierPhone.trim(),
          email: newSupplierEmail.trim(),
        })
        activeSupplierId = createdSup.id
        activeSupplierName = createdSup.name
        await loadSuppliers()
      } else {
        const sup = suppliers.find((s) => String(s.id) === String(supplierId))
        activeSupplierName = sup ? sup.name : ''
      }

      let createdOrder = null
      if (isMixMode) {
        const payload = mixItems.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
          unitCost: Number(item.unitCost),
          unitCostPrice: Number(item.unitCost),
          supplierId: activeSupplierId,
          supplier: activeSupplierName,
          supplierName: activeSupplierName,
          expectedDeliveryDate: expectedDate || null,
          notes: notes.trim() || null,
          status: targetStatus,
          isSuggested: targetStatus !== 'ORDERED',
        }))

        const createdList = await createBulkPurchaseOrders(payload)
        createdOrder = createdList && createdList.length > 0 ? createdList[0] : null
      } else {
        const payload = {
          productId: Number(selectedProductId),
          quantity: Number(quantity),
          unitCost: Number(unitCost),
          unitCostPrice: Number(unitCost),
          supplierId: activeSupplierId,
          supplier: activeSupplierName,
          supplierName: activeSupplierName,
          expectedDeliveryDate: expectedDate || null,
          notes: notes.trim() || null,
          status: targetStatus,
          isSuggested: targetStatus !== 'ORDERED',
        }

        createdOrder = await createPurchaseOrder(payload)
      }

      setBannerSuccess(
        targetStatus === 'ORDERED'
          ? 'Purchase order created and marked ORDERED successfully.'
          : 'Purchase order saved as SUGGESTED.'
      )

      notifyOrderCreated()
      window.dispatchEvent(new CustomEvent('optistock:order-created', { detail: createdOrder }))
      if (targetStatus === 'ORDERED' && createdOrder) {
        window.dispatchEvent(new CustomEvent('optistock:open-po-preview', { detail: createdOrder }))
      }

      setTimeout(() => {
        closeReorder()
      }, 700)
    } catch (err) {
      setErrors({ form: err.message || 'Failed to create purchase order' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-reorder-title"
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
        if (e.target === e.currentTarget && !loading) {
          closeReorder()
        }
      }}
    >
      <div
        ref={modalRef}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          width: '100%',
          maxWidth: isMixMode ? '680px' : '520px',
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
            <h2
              id="new-reorder-title"
              style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 600,
                color: '#0F172A',
              }}
            >
              {isMixMode ? `Reorder Mix: ${modalOptions?.productType || 'Product Group'}` : 'New Reorder'}
            </h2>
            <p
              style={{
                margin: '3px 0 0',
                fontSize: '13px',
                color: '#64748B',
              }}
            >
              {isMixMode
                ? 'Split purchase order among brands based on 80/20 mix performance'
                : 'Create a single product purchase order'}
            </p>
          </div>
          <button
            type="button"
            onClick={closeReorder}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '6px',
            }}
            aria-label="Close"
          >
            x
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {bannerSuccess && (
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: '#ECFDF5',
                color: '#065F46',
                borderRadius: '6px',
                marginBottom: '16px',
                fontSize: '13px',
                border: '1px solid #A7F3D0',
              }}
            >
              {bannerSuccess}
            </div>
          )}

          {errors.form && (
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: '#FEF2F2',
                color: '#991B1B',
                borderRadius: '6px',
                marginBottom: '16px',
                fontSize: '13px',
                border: '1px solid #FECACA',
              }}
            >
              {errors.form}
            </div>
          )}

          {/* Single Mode Product Selection */}
          {!isMixMode && (
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#334155',
                  marginBottom: '6px',
                }}
              >
                Product *
              </label>
              {modalOptions?.productId && modalOptions?.product ? (
                <div
                  style={{
                    padding: '9px 12px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: '#0F172A',
                    fontWeight: 500,
                  }}
                >
                  {modalOptions.product.name}
                  <span style={{ marginLeft: '8px', fontSize: '12px', color: '#64748B', fontWeight: 400 }}>
                    (Stock: {modalOptions.product.stockQuantity ?? 0} | Threshold: {modalOptions.product.reorderThreshold ?? 0})
                  </span>
                </div>
              ) : (
                <select
                  value={selectedProductId}
                  onChange={handleProductChange}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    border: errors.product ? '1px solid #EF4444' : '1px solid #CBD5E1',
                    fontSize: '14px',
                    color: '#0F172A',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <option value="">-- Select Product --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stock: {p.stockQuantity ?? 0}, Cost: Rs.{p.costPrice})
                    </option>
                  ))}
                </select>
              )}
              {errors.product && (
                <span style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px', display: 'block' }}>
                  {errors.product}
                </span>
              )}
            </div>
          )}

          {/* Single Mode Quantity & Cost */}
          {!isMixMode && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#334155',
                    marginBottom: '6px',
                  }}
                >
                  Quantity to Reorder *
                </label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, Number(q || 0) - 1))}
                    disabled={loading || Number(quantity) <= 1}
                    style={{
                      width: '36px',
                      height: '38px',
                      border: '1px solid #CBD5E1',
                      borderRight: 'none',
                      backgroundColor: '#F1F5F9',
                      borderTopLeftRadius: '6px',
                      borderBottomLeftRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      color: '#334155',
                    }}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10)
                      setQuantity(isNaN(val) ? '' : Math.max(1, val))
                    }}
                    disabled={loading}
                    style={{
                      width: '100%',
                      height: '38px',
                      padding: '0 10px',
                      textAlign: 'center',
                      border: errors.quantity ? '1px solid #EF4444' : '1px solid #CBD5E1',
                      fontSize: '14px',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Number(q || 0) + 1)}
                    disabled={loading}
                    style={{
                      width: '36px',
                      height: '38px',
                      border: '1px solid #CBD5E1',
                      borderLeft: 'none',
                      backgroundColor: '#F1F5F9',
                      borderTopRightRadius: '6px',
                      borderBottomRightRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      color: '#334155',
                    }}
                  >
                    +
                  </button>
                </div>
                {errors.quantity && (
                  <span style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px', display: 'block' }}>
                    {errors.quantity}
                  </span>
                )}
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#334155',
                    marginBottom: '6px',
                  }}
                >
                  Unit Cost Price (Rs.) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                  disabled={loading}
                  style={{
                    width: '100%',
                    height: '38px',
                    padding: '0 12px',
                    borderRadius: '6px',
                    border: errors.unitCost ? '1px solid #EF4444' : '1px solid #CBD5E1',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
                {errors.unitCost && (
                  <span style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px', display: 'block' }}>
                    {errors.unitCost}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Single Mode Computed Total */}
          {!isMixMode && (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: '#F8FAFC',
                borderRadius: '6px',
                border: '1px solid #E2E8F0',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '13px', color: '#64748B' }}>Estimated Total Cost:</span>
              <span style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A' }}>
                Rs. {Number(singleTotalCost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}

          {/* Mix Mode Items Table */}
          {isMixMode && (
            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#334155' }}>
                  Brand Breakdown (Suggested vs Allocated)
                </label>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  Total Units: <strong>{mixTotalUnits}</strong>
                </span>
              </div>
              <div
                style={{
                  border: '1px solid #E2E8F0',
                  borderRadius: '6px',
                  overflow: 'hidden',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>
                      <th style={{ padding: '8px 12px', color: '#475569' }}>Brand / Item</th>
                      <th style={{ padding: '8px 12px', color: '#475569', textAlign: 'center' }}>Share</th>
                      <th style={{ padding: '8px 12px', color: '#475569', textAlign: 'center' }}>Qty</th>
                      <th style={{ padding: '8px 12px', color: '#475569', textAlign: 'right' }}>Cost</th>
                      <th style={{ padding: '8px 12px', color: '#475569', textAlign: 'right' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mixItems.map((item, idx) => (
                      <tr key={item.productId} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '8px 12px', color: '#0F172A', fontWeight: 500 }}>
                          {item.brand || item.name}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', color: '#64748B' }}>
                          {Number(item.suggestedSharePercent).toFixed(0)}%
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={() => updateMixItemQty(idx, -1)}
                              disabled={loading || Number(item.quantity) <= 1}
                              style={{
                                width: '26px',
                                height: '28px',
                                border: '1px solid #CBD5E1',
                                borderRight: 'none',
                                backgroundColor: '#F8FAFC',
                                borderTopLeftRadius: '4px',
                                borderBottomLeftRadius: '4px',
                                cursor: 'pointer',
                              }}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => setMixItemQtyValue(idx, e.target.value)}
                              disabled={loading}
                              style={{
                                width: '48px',
                                height: '28px',
                                textAlign: 'center',
                                border: '1px solid #CBD5E1',
                                fontSize: '13px',
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => updateMixItemQty(idx, 1)}
                              disabled={loading}
                              style={{
                                width: '26px',
                                height: '28px',
                                border: '1px solid #CBD5E1',
                                borderLeft: 'none',
                                backgroundColor: '#F8FAFC',
                                borderTopRightRadius: '4px',
                                borderBottomRightRadius: '4px',
                                cursor: 'pointer',
                              }}
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                          <input
                            type="number"
                            step="0.01"
                            value={item.unitCost}
                            onChange={(e) => setMixItemCostValue(idx, e.target.value)}
                            disabled={loading}
                            style={{
                              width: '70px',
                              padding: '4px',
                              textAlign: 'right',
                              borderRadius: '4px',
                              border: '1px solid #CBD5E1',
                              fontSize: '12px',
                            }}
                          />
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#0F172A' }}>
                          Rs. {(Number(item.quantity || 0) * Number(item.unitCost || 0)).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div
                style={{
                  marginTop: '10px',
                  padding: '10px 14px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '6px',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: '13px', color: '#64748B' }}>
                  Total Mix Units: <strong>{mixTotalUnits}</strong>
                </span>
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A' }}>
                  Total: Rs. {Number(mixTotalCost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}

          {/* Supplier Select & Add New Inline */}
          <div style={{ marginBottom: '16px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '6px',
              }}
            >
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#334155' }}>
                Supplier *
              </label>
              <button
                type="button"
                onClick={() => setShowNewSupplier((prev) => !prev)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563EB',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                {showNewSupplier ? 'Select Existing' : '+ Add New Supplier'}
              </button>
            </div>

            {!showNewSupplier ? (
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: errors.supplier ? '1px solid #EF4444' : '1px solid #CBD5E1',
                  fontSize: '14px',
                  color: '#0F172A',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <option value="">-- Select Supplier --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.phone ? `(${s.phone})` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                }}
              >
                <div style={{ marginBottom: '10px' }}>
                  <input
                    type="text"
                    placeholder="Supplier Name *"
                    value={newSupplierName}
                    onChange={(e) => setNewSupplierName(e.target.value)}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '4px',
                      border: errors.newSupplierName ? '1px solid #EF4444' : '1px solid #CBD5E1',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                  {errors.newSupplierName && (
                    <span style={{ fontSize: '11px', color: '#EF4444', marginTop: '3px', display: 'block' }}>
                      {errors.newSupplierName}
                    </span>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Phone (optional)"
                    value={newSupplierPhone}
                    onChange={(e) => setNewSupplierPhone(e.target.value)}
                    disabled={loading}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '4px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                    }}
                  />
                  <input
                    type="email"
                    placeholder="Email (optional)"
                    value={newSupplierEmail}
                    onChange={(e) => setNewSupplierEmail(e.target.value)}
                    disabled={loading}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '4px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                    }}
                  />
                </div>
              </div>
            )}
            {errors.supplier && !showNewSupplier && (
              <span style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px', display: 'block' }}>
                {errors.supplier}
              </span>
            )}
          </div>

          {/* Expected Delivery Date & Notes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#334155',
                  marginBottom: '6px',
                }}
              >
                Expected Delivery Date
              </label>
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#334155',
                  marginBottom: '6px',
                }}
              >
                Notes (optional)
              </label>
              <textarea
                rows={2}
                placeholder="Purchase order notes, batch requirements or instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                }}
              />
            </div>
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
            onClick={closeReorder}
            disabled={loading}
            style={{
              padding: '9px 16px',
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
            type="button"
            onClick={() => handleSubmit('SUGGESTED')}
            disabled={loading}
            style={{
              padding: '9px 16px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              backgroundColor: '#F1F5F9',
              color: '#1E293B',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {loading ? 'Saving...' : 'Save as Suggested'}
          </button>
          <button
            type="button"
            onClick={() => handleSubmit('ORDERED')}
            disabled={loading}
            style={{
              padding: '9px 18px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {loading ? 'Placing Order...' : 'Approve & Order'}
          </button>
        </div>
      </div>
    </div>
  )
}
