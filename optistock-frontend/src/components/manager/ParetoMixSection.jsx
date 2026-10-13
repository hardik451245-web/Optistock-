import React, { useState, useEffect, useMemo } from 'react'
import {
  PieChart,
  Layers,
  Package,
  TrendingUp,
  ShoppingCart,
  CheckCircle2,
  Info,
} from 'lucide-react'
import { getProductMix } from '../../api'
import { useReorder } from '../../context/ReorderContext'

export default function ParetoMixSection() {
  const { openReorder, reorderVersion } = useReorder()

  const [periodDays, setPeriodDays] = useState(30)
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [mixGroups, setMixGroups] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)

    getProductMix(periodDays)
      .then((data) => {
        if (!active) return
        setMixGroups(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch((err) => {
        if (!active) return
        setError(err.message || 'Failed to load product mix')
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [periodDays, reorderVersion])

  // Extract unique productTypes for filter pills
  const availableTypes = useMemo(() => {
    const list = mixGroups.map((g) => g.productType).filter(Boolean)
    return Array.from(new Set(list))
  }, [mixGroups])

  // Filter groups
  const filteredGroups = useMemo(() => {
    if (selectedTypeFilter === 'ALL') return mixGroups
    return mixGroups.filter((g) => g.productType === selectedTypeFilter)
  }, [mixGroups, selectedTypeFilter])

  const handleOrderMix = (group) => {
    const items = (group.brands || []).map((b) => ({
      productId: b.productId,
      name: b.name,
      brand: b.brand,
      suggestedSharePercent: Number(b.suggestedSharePercent || 0),
      suggestedQty: b.unitsToOrder > 0 ? b.unitsToOrder : 5,
      costPrice: 0,
    }))

    openReorder({
      mode: 'mix',
      productType: group.productType,
      items,
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '0 4px' }}>
      {/* Header & Controls Bar */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '8px',
          border: '1px solid #E2E8F0',
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#0F172A' }}>
            80-20 Mix: Brand Portfolio Optimization
          </h2>
          <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#64748B' }}>
            Allocate 80% reorder budget to the winning brand with higher unit margin and profitability.
          </p>
        </div>

        {/* Period Selector (7d, 30d, 90d) */}
        <div style={{ display: 'inline-flex', backgroundColor: '#F1F5F9', borderRadius: '6px', padding: '3px' }}>
          {[
            { label: '7 Days', val: 7 },
            { label: '30 Days', val: 30 },
            { label: '90 Days', val: 90 },
          ].map((opt) => (
            <button
              key={opt.val}
              type="button"
              onClick={() => setPeriodDays(opt.val)}
              style={{
                border: 'none',
                padding: '6px 14px',
                borderRadius: '4px',
                fontSize: '13px',
                fontWeight: periodDays === opt.val ? 600 : 400,
                backgroundColor: periodDays === opt.val ? '#FFFFFF' : 'transparent',
                color: periodDays === opt.val ? '#0F172A' : '#64748B',
                boxShadow: periodDays === opt.val ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                cursor: 'pointer',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product Type Filter Pills */}
      {availableTypes.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setSelectedTypeFilter('ALL')}
            style={{
              padding: '5px 12px',
              borderRadius: '20px',
              border: selectedTypeFilter === 'ALL' ? '1px solid #0F172A' : '1px solid #CBD5E1',
              backgroundColor: selectedTypeFilter === 'ALL' ? '#0F172A' : '#FFFFFF',
              color: selectedTypeFilter === 'ALL' ? '#FFFFFF' : '#475569',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            All Product Types ({mixGroups.length})
          </button>
          {availableTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedTypeFilter(type)}
              style={{
                padding: '5px 12px',
                borderRadius: '20px',
                border: selectedTypeFilter === type ? '1px solid #0F172A' : '1px solid #CBD5E1',
                backgroundColor: selectedTypeFilter === type ? '#0F172A' : '#FFFFFF',
                color: selectedTypeFilter === type ? '#FFFFFF' : '#475569',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {type}
            </button>
          ))}
        </div>
      )}

      {/* Content State */}
      {loading ? (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            padding: '50px',
            textAlign: 'center',
            color: '#64748B',
          }}
        >
          Evaluating brand portfolio margins and calculating 80-20 splits...
        </div>
      ) : error ? (
        <div
          style={{
            backgroundColor: '#FEF2F2',
            borderRadius: '8px',
            border: '1px solid #FECACA',
            padding: '20px',
            color: '#991B1B',
          }}
        >
          {error}
        </div>
      ) : filteredGroups.length === 0 ? (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            padding: '50px',
            textAlign: 'center',
            color: '#64748B',
          }}
        >
          No product groups available for mix optimization.
        </div>
      ) : (
        /* Card Grid: Each card represents one productType */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(460px, 1fr))',
            gap: '20px',
          }}
        >
          {filteredGroups.map((group) => {
            const brands = group.brands || []
            const groupNeed = group.groupNeed ?? 0
            const displaySentence = group.sentence || group.recommendation || ''
            const isNeedZero = groupNeed <= 0

            return (
              <div
                key={group.productType}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                {/* Card Header */}
                <div
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #E2E8F0',
                    backgroundColor: '#FAFAFA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#0F172A' }}>
                        {group.productType}
                      </h3>
                      {group.category && (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 500,
                            backgroundColor: '#E2E8F0',
                            color: '#334155',
                            padding: '2px 8px',
                            borderRadius: '12px',
                          }}
                        >
                          {group.category}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                      30d Forecast: <strong>{group.groupForecast30}</strong> | Stock:{' '}
                      <strong>{group.groupStock}</strong> | On Order:{' '}
                      <strong>{group.groupOnOrder}</strong>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>Group Need</span>
                    <span
                      style={{
                        fontSize: '15px',
                        fontWeight: 700,
                        color: isNeedZero ? '#10B981' : '#2563EB',
                      }}
                    >
                      {isNeedZero ? '0 units' : `${groupNeed} units`}
                    </span>
                  </div>
                </div>

                {/* Brands Table */}
                <div style={{ padding: '16px 20px', flex: 1 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#64748B', textAlign: 'left' }}>
                        <th style={{ padding: '6px 8px', fontWeight: 600 }}>Brand</th>
                        <th style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 600 }}>Sold ({periodDays}d)</th>
                        <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>Total Profit</th>
                        <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>Profit/Unit</th>
                        <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>Margin</th>
                        <th style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 600 }}>Cur. Share</th>
                        <th style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 700, color: '#0F172A' }}>
                          Rec. Share
                        </th>
                        <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>Order Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {brands.map((b) => {
                        const isTop = Number(b.suggestedSharePercent) >= 80
                        return (
                          <tr
                            key={b.productId}
                            style={{
                              borderBottom: '1px solid #F1F5F9',
                              backgroundColor: isTop ? '#F0FDF4' : 'transparent',
                            }}
                          >
                            <td style={{ padding: '8px', fontWeight: 600, color: '#0F172A' }}>
                              {b.brand || b.name}
                              {isTop && (
                                <span
                                  style={{
                                    marginLeft: '6px',
                                    fontSize: '10px',
                                    padding: '1px 5px',
                                    borderRadius: '4px',
                                    backgroundColor: '#DCFCE7',
                                    color: '#15803D',
                                    fontWeight: 700,
                                  }}
                                >
                                  Top Brand
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '8px', textAlign: 'center', color: '#334155' }}>
                              {b.unitsSold}
                            </td>
                            <td style={{ padding: '8px', textAlign: 'right', color: '#334155' }}>
                              Rs. {Number(b.profit || 0).toFixed(2)}
                            </td>
                            <td style={{ padding: '8px', textAlign: 'right', color: '#334155' }}>
                              Rs. {Number(b.profitPerUnit || 0).toFixed(2)}
                            </td>
                            <td style={{ padding: '8px', textAlign: 'right', color: '#334155' }}>
                              {Number(b.marginPercent || 0).toFixed(1)}%
                            </td>
                            <td style={{ padding: '8px', textAlign: 'center', color: '#64748B' }}>
                              {Number(b.currentSharePercent || 0).toFixed(0)}%
                            </td>
                            <td
                              style={{
                                padding: '8px',
                                textAlign: 'center',
                                fontWeight: 700,
                                color: isTop ? '#15803D' : '#1E293B',
                              }}
                            >
                              {Number(b.suggestedSharePercent || 0).toFixed(0)}%
                            </td>
                            <td
                              style={{
                                padding: '8px',
                                textAlign: 'right',
                                fontWeight: 600,
                                color: b.unitsToOrder > 0 ? '#2563EB' : '#94A3B8',
                              }}
                            >
                              {b.unitsToOrder}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>

                  {/* Visual Split Bar (80/20 horizontal bar) */}
                  {brands.length > 1 && (
                    <div style={{ marginTop: '16px' }}>
                      <div
                        style={{
                          height: '14px',
                          borderRadius: '7px',
                          display: 'flex',
                          overflow: 'hidden',
                          backgroundColor: '#E2E8F0',
                        }}
                      >
                        {brands.map((b, idx) => {
                          const pct = Number(b.suggestedSharePercent || 0)
                          if (pct <= 0) return null
                          const color = idx === 0 ? '#10B981' : idx === 1 ? '#3B82F6' : '#F59E0B'
                          return (
                            <div
                              key={b.productId}
                              style={{
                                width: `${pct}%`,
                                backgroundColor: color,
                                transition: 'width 0.3s ease',
                              }}
                              title={`${b.brand}: ${pct}%`}
                            />
                          )
                        })}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginTop: '4px',
                          fontSize: '11px',
                          color: '#64748B',
                        }}
                      >
                        {brands.map((b, idx) => {
                          const color = idx === 0 ? '#10B981' : idx === 1 ? '#3B82F6' : '#F59E0B'
                          return (
                            <span key={b.productId} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <span
                                style={{
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  backgroundColor: color,
                                  display: 'inline-block',
                                }}
                              />
                              {b.brand}: {Number(b.suggestedSharePercent || 0).toFixed(0)}%
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Prominent Recommendation Sentence Callout Box */}
                  <div
                    style={{
                      marginTop: '16px',
                      padding: '12px 14px',
                      borderRadius: '6px',
                      backgroundColor: isNeedZero ? '#F8FAFC' : '#EFF6FF',
                      border: isNeedZero ? '1px solid #E2E8F0' : '1px solid #BFDBFE',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                    }}
                  >
                    <Info
                      size={16}
                      color={isNeedZero ? '#64748B' : '#2563EB'}
                      style={{ marginTop: '2px', flexShrink: 0 }}
                    />
                    <div style={{ fontSize: '13px', color: isNeedZero ? '#475569' : '#1E40AF', lineHeight: 1.45 }}>
                      <strong>Recommendation:</strong> {displaySentence}
                    </div>
                  </div>
                </div>

                {/* Card Footer Action */}
                <div
                  style={{
                    padding: '12px 20px',
                    borderTop: '1px solid #E2E8F0',
                    backgroundColor: '#FAFAFA',
                    display: 'flex',
                    justifyContent: 'flex-end',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleOrderMix(group)}
                    disabled={isNeedZero}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: isNeedZero ? '#E2E8F0' : '#0F172A',
                      color: isNeedZero ? '#94A3B8' : '#FFFFFF',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: isNeedZero ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <ShoppingCart size={15} />
                    {isNeedZero ? 'Stock Adequate' : 'Order this mix'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
