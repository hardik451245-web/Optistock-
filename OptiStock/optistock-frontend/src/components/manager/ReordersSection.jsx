import React, { useState, useEffect } from 'react'
import {
  Truck,
  CheckCircle,
  Clock,
  Send,
  Printer,
  MessageSquare,
  Mail,
  Plus,
  Package,
  Calendar,
  AlertCircle,
  X,
  Edit,
  Trash2,
  FileText,
  Users,
  Building,
  Check,
} from 'lucide-react'
import { useReorder } from '../../context/ReorderContext'

export default function ReordersSection({
  token,
  initialSuggestion,
  onClearInitialSuggestion,
}) {
  const { openReorder, reorderVersion } = useReorder()
  const [activeTab, setActiveTab] = useState('pending') // 'pending' | 'transit' | 'history' | 'suppliers'
  const [orders, setOrders] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [successMessage, setSuccessMessage] = useState('')

  // Reorder Form Modal state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formProduct, setFormProduct] = useState(null)
  const [formOrderQty, setFormOrderQty] = useState('')
  const [formSupplierId, setFormSupplierId] = useState('')
  const [formExpectedDate, setFormExpectedDate] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [formErrors, setFormErrors] = useState({})

  // Receive Modal state
  const [receivingOrder, setReceivingOrder] = useState(null)
  const [receivedQtyInput, setReceivedQtyInput] = useState('')

  // PO Preview Modal state
  const [poPreviewOrder, setPoPreviewOrder] = useState(null)

  // Supplier Form Modal state
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false)
  const [supplierFormData, setSupplierFormData] = useState({
    id: null,
    name: '',
    contactPerson: '',
    phone: '',
    whatsappNumber: '',
    email: '',
    address: '',
    category: '',
  })

  useEffect(() => {
    fetchOrders()
    fetchSuppliers()
    fetchProducts()
  }, [reorderVersion])

  useEffect(() => {
    const handleOpenPreview = (e) => {
      if (e?.detail) {
        setPoPreviewOrder(e.detail)
      }
    }
    window.addEventListener('optistock:open-po-preview', handleOpenPreview)
    return () => window.removeEventListener('optistock:open-po-preview', handleOpenPreview)
  }, [])

  useEffect(() => {
    if (initialSuggestion) {
      // Auto open reorder form pre-filled
      setIsFormOpen(true)
      if (initialSuggestion.productId && products.length > 0) {
        const found = products.find((p) => p.id === initialSuggestion.productId)
        if (found) {
          setFormProduct(found)
          setFormOrderQty(initialSuggestion.quantity || 25)
        }
      }
      if (onClearInitialSuggestion) onClearInitialSuggestion()
    }
  }, [initialSuggestion, products])

  async function fetchOrders() {
    setLoading(true)
    try {
      const res = await fetch('/api/purchase-orders', {
        headers: { 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token },
      })
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchSuppliers() {
    try {
      const res = await fetch('/api/manager/suppliers', {
        headers: { 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token },
      })
      if (res.ok) {
        const data = await res.json()
        setSuppliers(data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function fetchProducts() {
    try {
      const res = await fetch('/api/products', {
        headers: { 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token },
      })
      if (res.ok) {
        const data = await res.json()
        setProducts(data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  function getProductImage(productName) {
    const slug = (productName || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const knownImages = ['alphonso-mango', 'tomato', 'potato', 'onion', 'gulab-jamun-tin']
    if (knownImages.includes(slug)) {
      return `/static/images/products/${slug}.jpg`
    }
    return null
  }

  // Action handlers
  async function handleApprove(orderId) {
    try {
      const order = orders.find((o) => o.id === orderId)
      const res = await fetch(`/api/purchase-orders/${orderId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Auth-Token': token,
        },
        body: JSON.stringify({ supplierId: order?.supplierId || null }),
      })
      if (!res.ok) throw new Error('Failed to approve order')
      const updated = await res.json()
      setSuccessMessage(`Approved Purchase Order ${updated.poNumber}!`)
      setTimeout(() => setSuccessMessage(''), 3500)
      fetchOrders()
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleConfirmSentAndOrdered(orderId, channel) {
    try {
      const res = await fetch(`/api/purchase-orders/${orderId}/mark-ordered?channel=${channel}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token },
      })
      if (!res.ok) throw new Error('Failed to mark order as sent')
      const updated = await res.json()
      setSuccessMessage(`Order ${updated.poNumber} marked as Ordered via ${channel}!`)
      setTimeout(() => setSuccessMessage(''), 3500)
      setPoPreviewOrder(null)
      fetchOrders()
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleConfirmReceive() {
    if (!receivingOrder) return
    const qty = parseInt(receivedQtyInput, 10)
    if (isNaN(qty) || qty <= 0) {
      alert('Please enter a valid received quantity')
      return
    }

    try {
      const res = await fetch(`/api/purchase-orders/${receivingOrder.id}/receive`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Auth-Token': token,
        },
        body: JSON.stringify({ receivedQuantity: qty }),
      })
      if (!res.ok) throw new Error('Failed to receive order')
      setSuccessMessage(`Successfully received ${qty} units for ${receivingOrder.productName}! Stock updated.`)
      setTimeout(() => setSuccessMessage(''), 4000)
      setReceivingOrder(null)
      fetchOrders()
      fetchProducts()
    } catch (err) {
      alert(err.message)
    }
  }

  // Reorder Form submission
  async function handleSubmitReorder(isApproveNow) {
    const errors = {}
    if (!formProduct) errors.product = 'Please select a product'
    const qty = parseInt(formOrderQty, 10)
    if (isNaN(qty) || qty <= 0) errors.quantity = 'Quantity must be greater than 0'
    const todayStr = new Date().toISOString().split('T')[0]
    if (formExpectedDate && formExpectedDate < todayStr) {
      errors.expectedDate = 'Expected delivery date cannot be in the past'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    const supplierObj = suppliers.find((s) => String(s.id) === String(formSupplierId))
    const unitCost = formProduct.costPrice || 0
    const totalCost = (unitCost * qty).toFixed(2)

    const payload = {
      productId: formProduct.id,
      quantity: qty,
      supplierId: supplierObj ? Number(supplierObj.id) : null,
      supplier: supplierObj?.name || (formSupplierId ? '' : (formProduct.supplierName || null)),
      supplierName: supplierObj?.name || (formSupplierId ? '' : (formProduct.supplierName || null)),
      supplierPhone: supplierObj?.phone || '',
      supplierWhatsapp: supplierObj?.whatsappNumber || supplierObj?.phone || '',
      supplierEmail: supplierObj?.email || '',
      unitCost: unitCost,
      unitCostPrice: unitCost,
      totalCost: totalCost,
      expectedDeliveryDate: formExpectedDate || null,
      notes: formNotes || '',
      isSuggested: !isApproveNow,
    }

    try {
      const endpoint = isApproveNow ? '/api/purchase-orders' : '/api/purchase-orders/suggest'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Auth-Token': token,
        },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to create purchase order')
      const created = await res.json()

      setIsFormOpen(false)
      resetForm()
      fetchOrders()

      if (isApproveNow) {
        // Open PO preview immediately for sending
        setPoPreviewOrder(created)
      } else {
        setSuccessMessage(`Saved reorder as Suggested for ${formProduct.name}!`)
        setTimeout(() => setSuccessMessage(''), 3500)
      }
    } catch (err) {
      alert(err.message)
    }
  }

  function resetForm() {
    setFormProduct(null)
    setFormOrderQty('')
    setFormSupplierId('')
    setFormExpectedDate('')
    setFormNotes('')
    setFormErrors({})
  }

  // Supplier CRUD
  async function handleSaveSupplier(e) {
    e.preventDefault()
    if (!supplierFormData.name) {
      alert('Supplier name is required')
      return
    }

    try {
      const isEdit = !!supplierFormData.id
      const url = isEdit ? `/api/manager/suppliers/${supplierFormData.id}` : '/api/manager/suppliers'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Auth-Token': token,
        },
        body: JSON.stringify(supplierFormData),
      })
      if (!res.ok) throw new Error('Failed to save supplier')
      setIsSupplierModalOpen(false)
      fetchSuppliers()
      setSuccessMessage(`Supplier "${supplierFormData.name}" saved!`)
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleDeleteSupplier(id) {
    if (!window.confirm('Delete this supplier?')) return
    try {
      await fetch(`/api/manager/suppliers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token },
      })
      fetchSuppliers()
    } catch (err) {
      console.error(err)
    }
  }

  // Counts for summary
  const pendingOrders = orders.filter((o) => o.status === 'SUGGESTED' || o.status === 'PENDING')
  const transitOrders = orders.filter((o) => o.status === 'APPROVED' || o.status === 'ORDERED')
  const receivedOrders = orders.filter((o) => o.status === 'RECEIVED')

  return (
    <div className="section-container">
      {/* Top Header */}
      <div className="section-header-row">
        <div>
          <h2 className="section-title">Reorders & Purchase Orders</h2>
          <p className="section-subtitle">
            Approval workflow, digital purchase orders, and receiving restock ledger.
          </p>
        </div>

        <div className="header-actions-group">
          <button
            type="button"
            className="btn-new-reorder-primary"
            onClick={() => openReorder({})}
          >
            <Plus size={18} />
            <span>New Reorder</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="success-banner-bubble">
          <CheckCircle size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 3 Summary Cards */}
      <div className="pareto-stat-grid">
        <div className="pareto-card card-white-elevation">
          <div className="card-top-meta">
            <span className="card-badge-pill">Pending</span>
            <Clock size={20} className="card-icon" />
          </div>
          <div className="card-number-val">{pendingOrders.length}</div>
          <div className="card-label-name">Pending Approval</div>
          <div className="card-delta-sub">Suggested by low-stock & 80-20 alerts</div>
        </div>

        <div className="pareto-card card-white-elevation">
          <div className="card-top-meta">
            <span className="card-badge-pill">In Transit</span>
            <Truck size={20} className="card-icon" />
          </div>
          <div className="card-number-val">{transitOrders.length}</div>
          <div className="card-label-name">In Transit / Ordered</div>
          <div className="card-delta-sub">Approved and dispatched by suppliers</div>
        </div>

        <div className="pareto-card card-white-elevation">
          <div className="card-top-meta">
            <span className="card-badge-pill">Received</span>
            <CheckCircle size={20} className="card-icon text-emerald" />
          </div>
          <div className="card-number-val text-dark">{receivedOrders.length}</div>
          <div className="card-label-name">Received History</div>
          <div className="card-delta-sub">Stock ledger updated automatically</div>
        </div>
      </div>

      {/* Workflow Navigation Tabs */}
      <div className="reorder-tabs-bar">
        <div className="tabs-pill-list">
          <button
            type="button"
            className={`tab-pill-btn ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending Approval ({pendingOrders.length})
          </button>
          <button
            type="button"
            className={`tab-pill-btn ${activeTab === 'transit' ? 'active' : ''}`}
            onClick={() => setActiveTab('transit')}
          >
            In Transit ({transitOrders.length})
          </button>
          <button
            type="button"
            className={`tab-pill-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Received History ({receivedOrders.length})
          </button>
          <button
            type="button"
            className={`tab-pill-btn ${activeTab === 'suppliers' ? 'active' : ''}`}
            onClick={() => setActiveTab('suppliers')}
          >
            Manage Suppliers ({suppliers.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Pending Approval */}
      {activeTab === 'pending' && (
        <div className="orders-table-card">
          <div className="table-header-title-bar">
            <div>
              <h3 className="chart-card-title">Suggested Reorders Awaiting Approval</h3>
              <p className="chart-card-subtitle">Review suggested order quantities and approve purchase orders</p>
            </div>
          </div>

          <div className="custom-table-wrap">
            <table className="custom-modern-table">
              <thead>
                <tr>
                  <th>PO #</th>
                  <th>Product</th>
                  <th>Order Qty</th>
                  <th>Supplier</th>
                  <th>Unit Cost</th>
                  <th>Total Cost</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingOrders.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="table-empty-cell">No pending reorders. Everything is on schedule.</td>
                  </tr>
                ) : (
                  pendingOrders.map((order) => {
                    const img = getProductImage(order.productName)
                    return (
                      <tr key={order.id}>
                        <td>
                          <span className="po-number-tag">{order.poNumber || `PO-${order.id}`}</span>
                        </td>
                        <td>
                          <div className="table-product-cell">
                            {img ? (
                              <img src={img} alt={order.productName} className="product-table-thumb" />
                            ) : (
                              <div className="product-table-thumb-fallback"><Package size={16} /></div>
                            )}
                            <div className="product-cell-name">{order.productName}</div>
                          </div>
                        </td>
                        <td className="text-bold">{order.quantity} units</td>
                        <td>
                          {(() => {
                            const s = suppliers.find((sup) => (order.supplierId && String(sup.id) === String(order.supplierId)) || sup.name === order.supplier)
                            return s?.name || order.supplier || 'General Supplier'
                          })()}
                        </td>
                        <td>₹{order.unitCost ? Number(order.unitCost).toFixed(2) : '-'}</td>
                        <td className="text-bold">₹{order.totalCost ? Number(order.totalCost).toLocaleString('en-IN') : '-'}</td>
                        <td>
                          <span className="status-badge-suggested">Suggested</span>
                        </td>
                        <td>
                          <div className="action-buttons-group">
                            <button
                              type="button"
                              className="btn-action-approve"
                              onClick={() => handleApprove(order.id)}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              className="btn-action-send"
                              onClick={() => setPoPreviewOrder(order)}
                            >
                              Review PO
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: In Transit */}
      {activeTab === 'transit' && (
        <div className="orders-table-card">
          <div className="table-header-title-bar">
            <div>
              <h3 className="chart-card-title">Approved & Dispatched Purchase Orders</h3>
              <p className="chart-card-subtitle">Mark orders as received once stock arrives at the warehouse</p>
            </div>
          </div>

          <div className="custom-table-wrap">
            <table className="custom-modern-table">
              <thead>
                <tr>
                  <th>PO #</th>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Supplier</th>
                  <th>Order Date</th>
                  <th>Expected Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transitOrders.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="table-empty-cell">No purchase orders currently in transit.</td>
                  </tr>
                ) : (
                  transitOrders.map((order) => {
                    const img = getProductImage(order.productName)
                    return (
                      <tr key={order.id}>
                        <td>
                          <span className="po-number-tag">{order.poNumber || `PO-${order.id}`}</span>
                        </td>
                        <td>
                          <div className="table-product-cell">
                            {img ? (
                              <img src={img} alt={order.productName} className="product-table-thumb" />
                            ) : (
                              <div className="product-table-thumb-fallback"><Package size={16} /></div>
                            )}
                            <div className="product-cell-name">{order.productName}</div>
                          </div>
                        </td>
                        <td className="text-bold">{order.quantity} units</td>
                        <td>
                          {(() => {
                            const s = suppliers.find((sup) => (order.supplierId && String(sup.id) === String(order.supplierId)) || sup.name === order.supplier)
                            return s?.name || order.supplier || '-'
                          })()}
                        </td>
                        <td>{order.orderedAt ? new Date(order.orderedAt).toLocaleDateString() : '-'}</td>
                        <td>{order.expectedDeliveryDate || 'Prompt'}</td>
                        <td>
                          <span className={`status-badge-${order.status.toLowerCase()}`}>
                            {order.status}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons-group">
                            {order.status === 'APPROVED' && (
                              <button
                                type="button"
                                className="btn-action-send"
                                onClick={() => setPoPreviewOrder(order)}
                              >
                                Send PO
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn-action-receive"
                              onClick={() => {
                                setReceivingOrder(order)
                                setReceivedQtyInput(order.quantity)
                              }}
                            >
                              Mark as Received
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Received History */}
      {activeTab === 'history' && (
        <div className="orders-table-card">
          <div className="table-header-title-bar">
            <div>
              <h3 className="chart-card-title">Completed Restock History</h3>
              <p className="chart-card-subtitle">Verified delivery records and inventory arrivals</p>
            </div>
          </div>

          <div className="custom-table-wrap">
            <table className="custom-modern-table">
              <thead>
                <tr>
                  <th>PO #</th>
                  <th>Product</th>
                  <th>Ordered</th>
                  <th>Received Qty</th>
                  <th>Supplier</th>
                  <th>Received Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {receivedOrders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="table-empty-cell">No delivery records found.</td>
                  </tr>
                ) : (
                  receivedOrders.map((order) => {
                    const img = getProductImage(order.productName)
                    return (
                      <tr key={order.id}>
                        <td>
                          <span className="po-number-tag">{order.poNumber || `PO-${order.id}`}</span>
                        </td>
                        <td>
                          <div className="table-product-cell">
                            {img ? (
                              <img src={img} alt={order.productName} className="product-table-thumb" />
                            ) : (
                              <div className="product-table-thumb-fallback"><Package size={16} /></div>
                            )}
                            <div className="product-cell-name">{order.productName}</div>
                          </div>
                        </td>
                        <td>{order.quantity} units</td>
                        <td className="text-bold text-emerald">+{order.receivedQuantity || order.quantity} units</td>
                        <td>{order.supplier}</td>
                        <td>{order.receivedAt ? new Date(order.receivedAt).toLocaleDateString() : '-'}</td>
                        <td>
                          <span className="status-badge-received">Received</span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Suppliers Management */}
      {activeTab === 'suppliers' && (
        <div className="orders-table-card">
          <div className="table-header-title-bar">
            <div>
              <h3 className="chart-card-title">Suppliers Directory</h3>
              <p className="chart-card-subtitle">Manage wholesale supplier contacts, phone, and WhatsApp numbers</p>
            </div>
            <button
              type="button"
              className="btn-add-supplier-top"
              onClick={() => {
                setSupplierFormData({
                  id: null,
                  name: '',
                  contactPerson: '',
                  phone: '',
                  whatsappNumber: '',
                  email: '',
                  address: '',
                  category: '',
                })
                setIsSupplierModalOpen(true)
              }}
            >
              <Plus size={16} />
              <span>Add Supplier</span>
            </button>
          </div>

          <div className="custom-table-wrap">
            <table className="custom-modern-table">
              <thead>
                <tr>
                  <th>Supplier Name</th>
                  <th>Contact Person</th>
                  <th>Category</th>
                  <th>Phone</th>
                  <th>WhatsApp</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="table-empty-cell">No suppliers registered.</td>
                  </tr>
                ) : (
                  suppliers.map((s) => (
                    <tr key={s.id}>
                      <td className="text-bold">{s.name}</td>
                      <td>{s.contactPerson || '-'}</td>
                      <td><span className="category-pill-tag">{s.category || 'General'}</span></td>
                      <td>{s.phone || '-'}</td>
                      <td>
                        {s.whatsappNumber ? (
                          <a
                            href={`https://wa.me/${s.whatsappNumber.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="wa-link-badge"
                          >
                            <MessageSquare size={13} />
                            <span>{s.whatsappNumber}</span>
                          </a>
                        ) : '-'}
                      </td>
                      <td>{s.email || '-'}</td>
                      <td>
                        <div className="action-buttons-group">
                          <button
                            type="button"
                            className="btn-icon-subtle"
                            title="Edit Supplier"
                            onClick={() => {
                              setSupplierFormData(s)
                              setIsSupplierModalOpen(true)
                            }}
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            type="button"
                            className="btn-icon-danger"
                            title="Delete Supplier"
                            onClick={() => handleDeleteSupplier(s.id)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4A: REORDER FORM MODAL (Redesigned spacing and layout) */}
      {isFormOpen && (
        <div className="reorder-modal-backdrop">
          <div className="reorder-form-dialog">
            {/* Header */}
            <div className="form-dialog-header">
              <div>
                <h3 className="form-dialog-title">New Reorder</h3>
                <p className="form-dialog-subtitle">Create purchase order for supplier restock</p>
              </div>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setIsFormOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Fields: 2-Column Grid */}
            <div className="form-dialog-body">
              {/* Field 1: Product Searchable Dropdown */}
              <div className="form-group-item col-span-2">
                <label className="form-field-label">Product</label>
                <div className="product-select-wrapper">
                  <select
                    className={`form-input-control select-control ${formErrors.product ? 'has-error' : ''}`}
                    value={formProduct?.id || ''}
                    onChange={(e) => {
                      const sel = products.find((p) => String(p.id) === e.target.value)
                      setFormProduct(sel || null)
                      if (sel) {
                        setFormOrderQty(Math.max(20, (sel.reorderThreshold || 10) * 2 - (sel.stockQuantity || 0)))
                        if (sel.supplierId) setFormSupplierId(sel.supplierId)
                      }
                    }}
                  >
                    <option value="">-- Select Product --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.category}) · Stock: {p.stockQuantity}
                      </option>
                    ))}
                  </select>
                </div>
                {formErrors.product && <span className="field-error-msg">{formErrors.product}</span>}
              </div>

              {/* Field 2: Current Stock (Read-only) */}
              <div className="form-group-item">
                <label className="form-field-label">Current Stock</label>
                <input
                  type="text"
                  readOnly
                  className="form-input-control readonly"
                  value={formProduct ? `${formProduct.stockQuantity} units` : '-'}
                />
              </div>

              {/* Field 3: Suggested Quantity (Read-only) */}
              <div className="form-group-item">
                <label className="form-field-label">Suggested Quantity</label>
                <input
                  type="text"
                  readOnly
                  className="form-input-control readonly"
                  value={
                    formProduct
                      ? `${Math.max(15, (formProduct.reorderThreshold || 10) * 2 - (formProduct.stockQuantity || 0))} units`
                      : '-'
                  }
                />
              </div>

              {/* Field 4: Order Quantity */}
              <div className="form-group-item">
                <label className="form-field-label">Order Quantity *</label>
                <input
                  type="number"
                  min="1"
                  className={`form-input-control ${formErrors.quantity ? 'has-error' : ''}`}
                  value={formOrderQty}
                  onChange={(e) => setFormOrderQty(e.target.value)}
                  placeholder="e.g. 50"
                />
                {formErrors.quantity && <span className="field-error-msg">{formErrors.quantity}</span>}
              </div>

              {/* Field 5: Supplier Dropdown */}
              <div className="form-group-item">
                <label className="form-field-label">Supplier</label>
                <select
                  className="form-input-control select-control"
                  value={formSupplierId}
                  onChange={(e) => setFormSupplierId(e.target.value)}
                >
                  <option value="">-- Select Supplier --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category || 'General'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Field 6: Unit Cost (Read-only) */}
              <div className="form-group-item">
                <label className="form-field-label">Unit Cost (₹)</label>
                <input
                  type="text"
                  readOnly
                  className="form-input-control readonly"
                  value={formProduct ? `₹${Number(formProduct.costPrice || 0).toFixed(2)}` : '₹0.00'}
                />
              </div>

              {/* Field 7: Total Cost (Auto-calculated, read-only) */}
              <div className="form-group-item">
                <label className="form-field-label">Total Cost (₹)</label>
                <input
                  type="text"
                  readOnly
                  className="form-input-control readonly text-bold text-dark"
                  value={
                    formProduct && formOrderQty && parseInt(formOrderQty, 10) > 0
                      ? `₹${(Number(formProduct.costPrice || 0) * parseInt(formOrderQty, 10)).toLocaleString('en-IN')}`
                      : '₹0.00'
                  }
                />
              </div>

              {/* Field 8: Expected Delivery Date */}
              <div className="form-group-item">
                <label className="form-field-label">Expected Delivery Date</label>
                <input
                  type="date"
                  className={`form-input-control ${formErrors.expectedDate ? 'has-error' : ''}`}
                  value={formExpectedDate}
                  onChange={(e) => setFormExpectedDate(e.target.value)}
                />
                {formErrors.expectedDate && <span className="field-error-msg">{formErrors.expectedDate}</span>}
              </div>

              {/* Field 9: Notes (Optional) */}
              <div className="form-group-item col-span-2">
                <label className="form-field-label">Notes (Optional)</label>
                <textarea
                  className="form-input-control textarea-control"
                  rows="2"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Batch specifications, urgency, packaging instructions..."
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="form-dialog-footer">
              <button
                type="button"
                className="btn-form-cancel"
                onClick={() => setIsFormOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-form-suggest"
                onClick={() => handleSubmitReorder(false)}
              >
                Save as Suggested
              </button>
              <button
                type="button"
                className="btn-form-approve"
                onClick={() => handleSubmitReorder(true)}
              >
                Approve &amp; Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4B: PO PREVIEW & SEND MODAL */}
      {poPreviewOrder && (
        <div className="reorder-modal-backdrop">
          <div className="po-preview-dialog">
            {/* Modal Header */}
            <div className="po-preview-header">
              <div className="po-branding-row">
                <img src="/static/images/optistock-logo-full.svg" alt="OptiStock AI" className="po-full-logo" />
              </div>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setPoPreviewOrder(null)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Printable / Document Body */}
            {(() => {
              const activeSup = suppliers.find(
                (s) => (poPreviewOrder?.supplierId && String(s.id) === String(poPreviewOrder.supplierId)) ||
                       (poPreviewOrder?.supplier && s.name && s.name.toLowerCase() === poPreviewOrder.supplier.toLowerCase())
              )

              return (
                <>
                  <div className="po-document-sheet" id="printable-po">
                    <div className="po-sheet-top">
                      <div>
                        <h4 className="po-sheet-heading">PURCHASE ORDER</h4>
                        <div className="po-sheet-number">{poPreviewOrder.poNumber || `PO-${poPreviewOrder.id}`}</div>
                        <div className="po-sheet-date">
                          Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </div>

                      <div className="po-supplier-block">
                        <div className="po-block-title">Vendor / Supplier:</div>
                        <div className="po-supplier-name">{activeSup?.name || poPreviewOrder.supplier || 'Wholesale Supplier'}</div>
                        {(activeSup?.phone || poPreviewOrder.supplierPhone) && (
                          <div>Phone: {activeSup?.phone || poPreviewOrder.supplierPhone}</div>
                        )}
                        {(activeSup?.email || poPreviewOrder.supplierEmail) && (
                          <div>Email: {activeSup?.email || poPreviewOrder.supplierEmail}</div>
                        )}
                      </div>
                    </div>

                    {/* Items Table */}
                    <table className="po-items-table">
                      <thead>
                        <tr>
                          <th>Item Description</th>
                          <th>Qty</th>
                          <th>Unit Cost (₹)</th>
                          <th>Line Total (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="text-bold">{poPreviewOrder.productName}</td>
                          <td>{poPreviewOrder.quantity} units</td>
                          <td>₹{poPreviewOrder.unitCost ? Number(poPreviewOrder.unitCost).toFixed(2) : '-'}</td>
                          <td className="text-bold">
                            ₹{poPreviewOrder.totalCost
                              ? Number(poPreviewOrder.totalCost).toLocaleString('en-IN')
                              : (Number(poPreviewOrder.unitCost || 0) * poPreviewOrder.quantity).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="po-total-row">
                      <span className="po-total-label">Grand Total:</span>
                      <span className="po-total-val">
                        ₹{poPreviewOrder.totalCost
                          ? Number(poPreviewOrder.totalCost).toLocaleString('en-IN')
                          : (Number(poPreviewOrder.unitCost || 0) * poPreviewOrder.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>

                    {poPreviewOrder.notes && (
                      <div className="po-notes-block">
                        <div className="po-notes-label">Order Notes:</div>
                        <p>{poPreviewOrder.notes}</p>
                      </div>
                    )}

                    <div className="po-footer-note">
                      Generated via OptiStock AI Purchase Management System. Authorized for stock fulfillment.
                    </div>
                  </div>

                  {/* Actions: 3 Send Options */}
                  <div className="po-preview-actions-bar">
                    <div className="po-send-buttons-row">
                      {/* 1. Download PDF / Print */}
                      <button
                        type="button"
                        className="btn-po-action btn-po-print"
                        onClick={() => window.print()}
                      >
                        <Printer size={16} />
                        <span>Download / Print PDF</span>
                      </button>

                      {/* 2. Send via WhatsApp */}
                      <button
                        type="button"
                        className="btn-po-action btn-po-whatsapp"
                        onClick={() => {
                          const rawPhone = activeSup?.whatsappNumber || activeSup?.phone || poPreviewOrder.supplierWhatsapp || poPreviewOrder.supplierPhone || ''
                          const phone = rawPhone.replace(/[^0-9]/g, '')
                          if (!phone) {
                            alert('Selected supplier does not have a registered WhatsApp or phone number.')
                            return
                          }
                          const text = encodeURIComponent(
                            `*PURCHASE ORDER: ${poPreviewOrder.poNumber || `PO-${poPreviewOrder.id}`}*\n` +
                            `OptiStock AI Store Fulfillment\n\n` +
                            `*Product:* ${poPreviewOrder.productName}\n` +
                            `*Quantity:* ${poPreviewOrder.quantity} units\n` +
                            `*Total:* ₹${poPreviewOrder.totalCost || (Number(poPreviewOrder.unitCost || 0) * poPreviewOrder.quantity)}\n\n` +
                            `Please confirm delivery date.`
                          )
                          window.open(`https://wa.me/${phone}?text=${text}`, '_blank')
                          handleConfirmSentAndOrdered(poPreviewOrder.id, 'WHATSAPP')
                        }}
                      >
                        <MessageSquare size={16} />
                        <span>Send via WhatsApp</span>
                      </button>

                      {/* 3. Send via Email */}
                      <button
                        type="button"
                        className="btn-po-action btn-po-email"
                        onClick={() => {
                          const email = activeSup?.email || poPreviewOrder.supplierEmail || ''
                          if (!email) {
                            alert('Selected supplier does not have a registered email address.')
                            return
                          }
                          const subject = encodeURIComponent(`Purchase Order ${poPreviewOrder.poNumber || `PO-${poPreviewOrder.id}`} - OptiStock AI`)
                          const body = encodeURIComponent(
                            `Dear Supplier,\n\nPlease find purchase order details below:\n\n` +
                            `PO Number: ${poPreviewOrder.poNumber || `PO-${poPreviewOrder.id}`}\n` +
                            `Product: ${poPreviewOrder.productName}\n` +
                            `Quantity: ${poPreviewOrder.quantity} units\n` +
                            `Total: ₹${poPreviewOrder.totalCost || (Number(poPreviewOrder.unitCost || 0) * poPreviewOrder.quantity)}\n\n` +
                            `Best regards,\nOptiStock AI Inventory Team`
                          )
                          window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_self')
                          handleConfirmSentAndOrdered(poPreviewOrder.id, 'EMAIL')
                        }}
                      >
                        <Mail size={16} />
                        <span>Send via Email</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      className="btn-confirm-ordered"
                      onClick={() => handleConfirmSentAndOrdered(poPreviewOrder.id, 'MANUAL')}
                    >
                      <Check size={16} />
                      <span>Confirm Sent &amp; Mark Ordered</span>
                    </button>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* Receive Order Confirmation Modal */}
      {receivingOrder && (
        <div className="reorder-modal-backdrop">
          <div className="receive-modal-dialog">
            <div className="form-dialog-header">
              <div>
                <h3 className="form-dialog-title">Receive Shipment</h3>
                <p className="form-dialog-subtitle">{receivingOrder.productName} · PO #{receivingOrder.poNumber}</p>
              </div>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setReceivingOrder(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="receive-dialog-body">
              <p className="receive-instruction">
                Confirm arrived quantity to automatically increment warehouse stock and clear low-stock alerts:
              </p>
              <div className="form-group-item">
                <label className="form-field-label">Arrived Quantity (units)</label>
                <input
                  type="number"
                  min="1"
                  className="form-input-control"
                  value={receivedQtyInput}
                  onChange={(e) => setReceivedQtyInput(e.target.value)}
                />
              </div>
            </div>

            <div className="form-dialog-footer">
              <button
                type="button"
                className="btn-form-cancel"
                onClick={() => setReceivingOrder(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-form-approve"
                onClick={handleConfirmReceive}
              >
                Confirm Receipt &amp; Add Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Modal (Add / Edit) */}
      {isSupplierModalOpen && (
        <div className="reorder-modal-backdrop">
          <div className="supplier-modal-dialog">
            <div className="form-dialog-header">
              <div>
                <h3 className="form-dialog-title">
                  {supplierFormData.id ? 'Edit Supplier' : 'Add New Supplier'}
                </h3>
                <p className="form-dialog-subtitle">Vendor details for procurement and automated PO dispatch</p>
              </div>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setIsSupplierModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="form-dialog-body">
              <div className="form-group-item col-span-2">
                <label className="form-field-label">Supplier Name *</label>
                <input
                  type="text"
                  required
                  className="form-input-control"
                  value={supplierFormData.name}
                  onChange={(e) => setSupplierFormData({ ...supplierFormData, name: e.target.value })}
                  placeholder="e.g. Kisan Fresh Agro"
                />
              </div>

              <div className="form-group-item">
                <label className="form-field-label">Contact Person</label>
                <input
                  type="text"
                  className="form-input-control"
                  value={supplierFormData.contactPerson}
                  onChange={(e) => setSupplierFormData({ ...supplierFormData, contactPerson: e.target.value })}
                  placeholder="e.g. Ramesh Patel"
                />
              </div>

              <div className="form-group-item">
                <label className="form-field-label">Category</label>
                <input
                  type="text"
                  className="form-input-control"
                  value={supplierFormData.category}
                  onChange={(e) => setSupplierFormData({ ...supplierFormData, category: e.target.value })}
                  placeholder="e.g. Vegetables, Dairy"
                />
              </div>

              <div className="form-group-item">
                <label className="form-field-label">Phone Number</label>
                <input
                  type="text"
                  className="form-input-control"
                  value={supplierFormData.phone}
                  onChange={(e) => setSupplierFormData({ ...supplierFormData, phone: e.target.value })}
                  placeholder="+91 98201 12345"
                />
              </div>

              <div className="form-group-item">
                <label className="form-field-label">WhatsApp Number</label>
                <input
                  type="text"
                  className="form-input-control"
                  value={supplierFormData.whatsappNumber}
                  onChange={(e) => setSupplierFormData({ ...supplierFormData, whatsappNumber: e.target.value })}
                  placeholder="919820112345"
                />
              </div>

              <div className="form-group-item col-span-2">
                <label className="form-field-label">Email</label>
                <input
                  type="email"
                  className="form-input-control"
                  value={supplierFormData.email}
                  onChange={(e) => setSupplierFormData({ ...supplierFormData, email: e.target.value })}
                  placeholder="orders@supplier.com"
                />
              </div>

              <div className="form-group-item col-span-2">
                <label className="form-field-label">Address</label>
                <input
                  type="text"
                  className="form-input-control"
                  value={supplierFormData.address}
                  onChange={(e) => setSupplierFormData({ ...supplierFormData, address: e.target.value })}
                  placeholder="Market yard, Warehouse complex, City"
                />
              </div>

              <div className="form-dialog-footer col-span-2">
                <button
                  type="button"
                  className="btn-form-cancel"
                  onClick={() => setIsSupplierModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-form-approve">
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
