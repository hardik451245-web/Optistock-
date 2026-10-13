import { useEffect, useState } from 'react'
import { getRanking, getProductMix, createBulkPurchaseOrders } from '../../api'

const BRAND_PALETTE = ['#0d9488', '#8b5cf6', '#f59e0b', '#38bdf8', '#ec4899']

export default function RankingsMixTab() {
  const [ranking, setRanking] = useState([])
  const [productMix, setProductMix] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')
  const [actionError, setActionError] = useState('')
  const [submittingType, setSubmittingType] = useState(null)
  const [view, setView] = useState('ranking') // 'ranking' | 'mix'

  async function loadData() {
    try {
      const [rankData, mixData] = await Promise.all([getRanking(30), getProductMix(30)])
      setRanking(Array.isArray(rankData) ? rankData : [])
      setProductMix(Array.isArray(mixData) ? mixData : [])
    } catch (err) {
      setError(err.message || 'Failed to load rankings or product mix')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleReorderToMix(mix) {
    const toOrder = (mix.items || []).filter((item) => (item.unitsToOrder || 0) > 0)
    if (toOrder.length === 0) {
      return
    }

    const summary = toOrder
      .map((item) => `${item.unitsToOrder} units of ${item.brand || item.name}`)
      .join(', ')

    if (!window.confirm(`Order ${summary}?`)) {
      return
    }

    setSubmittingType(mix.productType)
    setActionError('')
    setActionSuccess('')
    try {
      const payload = toOrder.map((item) => ({
        productId: item.productId || item.id,
        quantity: item.unitsToOrder,
        supplier: item.brand || null,
      }))
      await createBulkPurchaseOrders(payload)
      setActionSuccess(`Successfully placed purchase orders for ${mix.productType}: ${summary}`)
      await loadData()
    } catch (err) {
      setActionError(err.message || 'Failed to place purchase orders')
    } finally {
      setSubmittingType(null)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="glass-panel skeleton" style={{ height: 180, borderRadius: '8px' }} />
        <div className="glass-panel skeleton" style={{ height: 350, borderRadius: '8px' }} />
      </div>
    )
  }

  if (error) {
    return <div className="state-message error" style={{ borderRadius: '8px' }}>{error}</div>
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: 'none',
            background: view === 'ranking' ? '#0d9488' : 'rgba(255, 255, 255, 0.08)',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.88rem',
          }}
          onClick={() => setView('ranking')}
        >
          30-Day Profit Rankings
        </button>
        <button
          type="button"
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: 'none',
            background: view === 'mix' ? '#0d9488' : 'rgba(255, 255, 255, 0.08)',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.88rem',
          }}
          onClick={() => setView('mix')}
        >
          80/20 Stock Mix Recommendations
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

      {view === 'ranking' ? (
        <div className="glass-panel glass-table-container">
          <table className="glass-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>Rank</th>
                <th>Product</th>
                <th>Category</th>
                <th>Units Sold</th>
                <th>Revenue</th>
                <th>Total Profit</th>
                <th style={{ width: 180 }}>Margin %</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((item) => {
                const margin = Number(item.marginPercent || 0)
                const marginWidth = Math.min(100, Math.max(5, margin))
                const barColor = margin >= 30 ? 'var(--color-teal)' : margin >= 15 ? '#14b8a6' : 'var(--color-amber)'

                return (
                  <tr key={item.productId || item.name}>
                    <td>
                      <span className="badge" style={{ background: item.rank <= 3 ? 'rgba(13,148,136,0.3)' : 'rgba(255,255,255,0.06)' }}>
                        #{item.rank}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{item.name}</div>
                      {item.brand ? <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.brand}</div> : null}
                    </td>
                    <td>{item.category}</td>
                    <td>{item.qtySold}</td>
                    <td>₹{item.revenue}</td>
                    <td>
                      <strong style={{ color: 'var(--color-teal)' }}>₹{item.profit}</strong>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: barColor }}>{margin}%</span>
                        <div className="progress-bar-bg" style={{ borderRadius: '4px' }}>
                          <div className="progress-bar-fill" style={{ width: `${marginWidth}%`, backgroundColor: barColor, borderRadius: '4px' }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {productMix.length === 0 ? (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No product mix data available. Add products with product types to generate 80/20 brand recommendations.
            </div>
          ) : (
            productMix.map((mix) => {
              const items = mix.items || []
              const totalUnitsToOrder = items.reduce((sum, item) => sum + (item.unitsToOrder || 0), 0)
              const isSubmitting = submittingType === mix.productType

              return (
                <div key={mix.productType} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text-heading)' }}>{mix.productType}</h2>
                        <span className="badge badge-teal">{mix.category}</span>
                        <span className="badge badge-green">30d forecast: {mix.groupForecast30} units</span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        {items.length} {items.length === 1 ? 'brand evaluated' : 'brands evaluated'}
                      </div>
                    </div>

                    <button
                      type="button"
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        background: totalUnitsToOrder > 0 ? '#0d9488' : 'rgba(255,255,255,0.08)',
                        color: totalUnitsToOrder > 0 ? '#fff' : 'var(--text-muted)',
                        border: 'none',
                        cursor: totalUnitsToOrder > 0 && !isSubmitting ? 'pointer' : 'default',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        opacity: isSubmitting ? 0.7 : 1,
                      }}
                      disabled={totalUnitsToOrder === 0 || isSubmitting}
                      onClick={() => handleReorderToMix(mix)}
                    >
                      {isSubmitting
                        ? 'Ordering...'
                        : totalUnitsToOrder > 0
                        ? `Reorder to this mix (${totalUnitsToOrder} units)`
                        : 'Stock aligned with mix'}
                    </button>
                  </div>

                  {/* Recommendation sentence */}
                  <div
                    style={{
                      background: 'rgba(13,148,136,0.12)',
                      border: '1px solid rgba(13,148,136,0.3)',
                      padding: '0.85rem 1.1rem',
                      borderRadius: '8px',
                      fontSize: '0.88rem',
                      color: 'var(--text-heading)',
                      marginBottom: '1.25rem',
                    }}
                  >
                    <strong>Recommendation:</strong> {mix.recommendation}
                  </div>

                  {/* Split bar comparing current vs suggested share */}
                  {items.length > 0 ? (
                    <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-heading)' }}>
                          Share Distribution: Current Stock vs Suggested 80/20 Mix
                        </span>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                          {items.map((item, idx) => (
                            <span key={item.productId || item.name} style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span style={{ width: 10, height: 10, borderRadius: '2px', background: BRAND_PALETTE[idx % BRAND_PALETTE.length], display: 'inline-block' }} />
                              {item.brand || item.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Current share split bar */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                          <span>Current Stock Share</span>
                        </div>
                        <div style={{ display: 'flex', height: 14, borderRadius: '4px', overflow: 'hidden', background: 'rgba(255,255,255,0.08)' }}>
                          {items.map((item, idx) => {
                            const width = Number(item.currentSharePercent || 0)
                            return width > 0 ? (
                              <div
                                key={item.productId || item.name}
                                title={`${item.brand || item.name}: ${width}%`}
                                style={{
                                  width: `${width}%`,
                                  backgroundColor: BRAND_PALETTE[idx % BRAND_PALETTE.length],
                                  opacity: 0.85,
                                  transition: 'width 0.3s ease',
                                }}
                              />
                            ) : null
                          })}
                        </div>
                      </div>

                      {/* Suggested share split bar */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                          <span>Suggested 80/20 Share</span>
                        </div>
                        <div style={{ display: 'flex', height: 14, borderRadius: '4px', overflow: 'hidden', background: 'rgba(255,255,255,0.08)' }}>
                          {items.map((item, idx) => {
                            const width = Number(item.suggestedSharePercent || 0)
                            return width > 0 ? (
                              <div
                                key={item.productId || item.name}
                                title={`${item.brand || item.name}: ${width}%`}
                                style={{
                                  width: `${width}%`,
                                  backgroundColor: BRAND_PALETTE[idx % BRAND_PALETTE.length],
                                  transition: 'width 0.3s ease',
                                }}
                              />
                            ) : null
                          })}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Brand comparison table */}
                  <div className="glass-table-container">
                    <table className="glass-table">
                      <thead>
                        <tr>
                          <th>Brand / Product</th>
                          <th>30d Units Sold</th>
                          <th>Profit</th>
                          <th>Margin %</th>
                          <th>Current Share</th>
                          <th>Suggested Share</th>
                          <th>In Stock</th>
                          <th>On Order</th>
                          <th>Target Units</th>
                          <th style={{ textAlign: 'right' }}>Units to Order</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, idx) => (
                          <tr key={item.productId || item.name}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: BRAND_PALETTE[idx % BRAND_PALETTE.length] }} />
                                <div>
                                  <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>
                                    {item.brand || item.name}
                                  </div>
                                  {item.brand && item.name ? (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.name}</div>
                                  ) : null}
                                </div>
                              </div>
                            </td>
                            <td>{item.unitsSold ?? item.qtySold ?? 0}</td>
                            <td>
                              <strong style={{ color: 'var(--color-teal)' }}>₹{item.profit}</strong>
                            </td>
                            <td>{item.marginPercent}%</td>
                            <td>{item.currentSharePercent}%</td>
                            <td>
                              <strong style={{ color: Number(item.suggestedSharePercent) >= 50 ? 'var(--color-teal)' : 'var(--text-muted)' }}>
                                {item.suggestedSharePercent}%
                              </strong>
                            </td>
                            <td>{item.stock}</td>
                            <td>{item.onOrderQuantity || 0}</td>
                            <td>{item.targetUnits}</td>
                            <td style={{ textAlign: 'right' }}>
                              {(item.unitsToOrder || 0) > 0 ? (
                                <span className="badge badge-amber" style={{ fontWeight: 600 }}>
                                  +{item.unitsToOrder}
                                </span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>0</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
