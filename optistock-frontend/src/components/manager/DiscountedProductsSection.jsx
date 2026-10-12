import React, { useState, useEffect } from 'react'
import {
  Tag,
  Clock,
  AlertCircle,
  Percent,
  CheckCircle,
  XCircle,
  Flame,
  ShieldAlert,
  Edit2,
  Trash2,
  Sparkles,
  Package,
} from 'lucide-react'

export default function DiscountedProductsSection({ token }) {
  const [daysBeforeExpiry, setDaysBeforeExpiry] = useState(3)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [actionMessage, setActionMessage] = useState('')
  const [editingProduct, setEditingProduct] = useState(null)
  const [customDiscount, setCustomDiscount] = useState('')

  useEffect(() => {
    fetchExpiringDiscounted()
  }, [daysBeforeExpiry])

  async function fetchExpiringDiscounted() {
    setLoading(true)
    try {
      const res = await fetch(`/api/manager/expiring-discounted?daysBeforeExpiry=${daysBeforeExpiry}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Auth-Token': token,
        },
      })
      if (!res.ok) throw new Error('Failed to load discounted products')
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleApplyDiscount(productId, discountPercent) {
    try {
      const res = await fetch(`/api/manager/products/${productId}/discount`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Auth-Token': token,
        },
        body: JSON.stringify({ discountPercent }),
      })
      if (!res.ok) throw new Error('Failed to update discount')
      setActionMessage(`Updated discount to ${discountPercent}%`)
      setTimeout(() => setActionMessage(''), 3000)
      setEditingProduct(null)
      fetchExpiringDiscounted()
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleAutoSuggestTiersAll() {
    if (!data?.items) return
    let count = 0
    for (const item of data.items) {
      if (item.suggestedDiscount > 0 && item.discountPercent === 0) {
        await fetch(`/api/manager/products/${item.id}/discount`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Auth-Token': token,
          },
          body: JSON.stringify({ discountPercent: item.suggestedDiscount }),
        })
        count++
      }
    }
    setActionMessage(`Auto-applied tier discounts to ${count} expiring items!`)
    setTimeout(() => setActionMessage(''), 4000)
    fetchExpiringDiscounted()
  }

  async function handleMarkCleared(productId, name) {
    if (!window.confirm(`Mark ${name} as Cleared / Sold Out? This will set stock to 0.`)) return
    try {
      const res = await fetch(`/api/manager/products/${productId}/mark-cleared`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Auth-Token': token,
        },
      })
      if (!res.ok) throw new Error('Failed to clear stock')
      setActionMessage(`Marked ${name} as cleared / sold out.`)
      setTimeout(() => setActionMessage(''), 3000)
      fetchExpiringDiscounted()
    } catch (err) {
      alert(err.message)
    }
  }

  function getProductImage(item) {
    const slug = (item.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const knownImages = ['alphonso-mango', 'tomato', 'potato', 'onion', 'gulab-jamun-tin']
    if (knownImages.includes(slug)) {
      return `/static/images/products/${slug}.jpg`
    }
    return null
  }

  const items = data?.items || []

  return (
    <div className="section-container">
      {/* Top Header */}
      <div className="section-header-row">
        <div>
          <h2 className="section-title">Discounted & Near-Expiry Products</h2>
          <p className="section-subtitle">
            Smart markdown management to clear perishable inventory and avoid write-offs.
          </p>
        </div>

        {/* Days Before Expiry Filter Setting */}
        <div className="expiry-setting-control">
          <span className="setting-label-tag">Days Before Expiry:</span>
          <div className="period-toggle-group">
            {[2, 3, 5, 7].map((num) => (
              <button
                key={num}
                type="button"
                className={`period-toggle-btn ${daysBeforeExpiry === num ? 'active' : ''}`}
                onClick={() => setDaysBeforeExpiry(num)}
              >
                {num} Days
              </button>
            ))}
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className="success-banner-bubble">
          <CheckCircle size={18} />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* 3 Summary Cards */}
      <div className="pareto-stat-grid">
        <div className="pareto-card card-pink-purple">
          <div className="card-top-meta">
            <span className="card-badge-pill">Expiring Soon</span>
            <Clock size={20} className="card-icon" />
          </div>
          <div className="card-number-val">
            {data ? data.expiringSoonCount : '...'}
          </div>
          <div className="card-label-name">Items Expiring Soon</div>
          <div className="card-delta-sub">
            Within next {daysBeforeExpiry} days threshold
          </div>
        </div>

        <div className="pareto-card card-blue-mint">
          <div className="card-top-meta">
            <span className="card-badge-pill">Active Offers</span>
            <Tag size={20} className="card-icon" />
          </div>
          <div className="card-number-val">
            {data ? data.discountedLiveCount : '...'}
          </div>
          <div className="card-label-name">Discounted Items Live</div>
          <div className="card-delta-sub">
            Automatic discounted price charged in POS billing
          </div>
        </div>

        <div className="pareto-card card-white-elevation">
          <div className="card-top-meta">
            <span className="card-badge-pill">Capital at Risk</span>
            <ShieldAlert size={20} className="card-icon text-red" />
          </div>
          <div className="card-number-val text-dark">
            {data ? `₹${Number(data.totalRiskValue || 0).toLocaleString('en-IN')}` : '...'}
          </div>
          <div className="card-label-name">Stock Value at Risk</div>
          <div className="card-delta-sub">
            Recoverable inventory before expiration
          </div>
        </div>
      </div>

      {/* Auto-suggest Tier Action Bar */}
      <div className="discount-tier-cta-bar">
        <div className="cta-left">
          <Sparkles size={20} className="text-indigo" />
          <div>
            <span className="cta-bold">Smart Expiry Discount Tiers: </span>
            <span className="cta-info">3 days &rarr; 10% off | 2 days &rarr; 20% off | 1 day &rarr; 30% off</span>
          </div>
        </div>
        <button
          type="button"
          className="btn-apply-all-tiers"
          onClick={handleAutoSuggestTiersAll}
        >
          <Flame size={16} />
          <span>Apply Recommended Tiers to All</span>
        </button>
      </div>

      {/* Products List / Cards */}
      <div className="discounted-items-wrapper">
        {loading ? (
          <div className="loading-card-placeholder">Loading inventory data...</div>
        ) : items.length === 0 ? (
          <div className="empty-card-placeholder">
            <CheckCircle size={32} className="text-emerald" />
            <p>No products expiring within {daysBeforeExpiry} days. Stock is fresh!</p>
          </div>
        ) : (
          <div className="discount-card-grid">
            {items.map((item) => {
              const img = getProductImage(item)
              const hasDiscount = Number(item.discountPercent || 0) > 0
              const isUrgent = item.daysLeft <= 1

              return (
                <div key={item.id} className={`discount-item-card ${isUrgent ? 'card-urgent' : ''}`}>
                  <div className="card-main-info">
                    {/* Image */}
                    <div className="card-thumb-wrap">
                      {img ? (
                        <img src={img} alt={item.name} className="product-card-thumb" />
                      ) : (
                        <div className="product-card-thumb-fallback">
                          <Package size={24} />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="card-text-details">
                      <div className="card-product-title-row">
                        <span className="card-product-name">{item.name}</span>
                        <span className={`expiry-badge ${isUrgent ? 'urgent' : 'warning'}`}>
                          {item.daysLeft <= 0 ? 'Expires Today' : `${item.daysLeft} days left`}
                        </span>
                      </div>

                      <div className="card-product-meta-row">
                        <span className="batch-pill">{item.batchNumber}</span>
                        <span className="category-pill-tag">{item.category}</span>
                        <span className="stock-rem-tag">{item.stockQuantity} in stock</span>
                      </div>

                      {/* Pricing with Strikethrough & Discount % */}
                      <div className="card-pricing-row">
                        <div className="prices-group">
                          {hasDiscount ? (
                            <>
                              <span className="original-price-strikethrough">
                                ₹{Number(item.originalPrice).toFixed(2)}
                              </span>
                              <span className="discounted-live-price">
                                ₹{Number(item.discountedPrice).toFixed(2)}
                              </span>
                              <span className="discount-percent-tag">
                                {Number(item.discountPercent)}% OFF
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="regular-price">
                                ₹{Number(item.originalPrice).toFixed(2)}
                              </span>
                              <span className="no-discount-tag">Full Price</span>
                            </>
                          )}
                        </div>
                        <div className="risk-amount-tag">
                          Risk: ₹{Number(item.riskValue).toFixed(0)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="card-action-bar">
                    <div className="quick-tier-buttons">
                      <span className="quick-label">Set:</span>
                      <button
                        type="button"
                        className={`tier-quick-btn ${Number(item.discountPercent) === 10 ? 'selected' : ''}`}
                        onClick={() => handleApplyDiscount(item.id, 10)}
                      >
                        10%
                      </button>
                      <button
                        type="button"
                        className={`tier-quick-btn ${Number(item.discountPercent) === 20 ? 'selected' : ''}`}
                        onClick={() => handleApplyDiscount(item.id, 20)}
                      >
                        20%
                      </button>
                      <button
                        type="button"
                        className={`tier-quick-btn ${Number(item.discountPercent) === 30 ? 'selected' : ''}`}
                        onClick={() => handleApplyDiscount(item.id, 30)}
                      >
                        30%
                      </button>
                      {hasDiscount && (
                        <button
                          type="button"
                          className="tier-remove-btn"
                          title="Remove discount"
                          onClick={() => handleApplyDiscount(item.id, 0)}
                        >
                          Reset
                        </button>
                      )}
                    </div>

                    <div className="cleared-btn-group">
                      <button
                        type="button"
                        className="btn-mark-cleared"
                        onClick={() => handleMarkCleared(item.id, item.name)}
                      >
                        Mark Cleared
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
