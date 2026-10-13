import React, { useState, useEffect, useMemo } from 'react'
import {
  AlertTriangle,
  Package,
  Download,
  Info,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  CheckCircle,
} from 'lucide-react'
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts'
import { getDemandForecast } from '../../api'
import { useReorder } from '../../context/ReorderContext'

export default function DemandForecastPage() {
  const { openReorder, reorderVersion } = useReorder()

  const [horizon, setHorizon] = useState(30)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedProductType, setSelectedProductType] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [forecastData, setForecastData] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showFormulaPanel, setShowFormulaPanel] = useState(false)

  // Fetch forecast data
  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')

    getDemandForecast(horizon, selectedCategory, selectedProductType)
      .then((data) => {
        if (!active) return
        setForecastData(data)
        setLoading(false)
        if (data?.items?.length > 0) {
          // Keep current selected product or default to first
          setSelectedProduct((prev) => {
            if (prev) {
              const matched = data.items.find((item) => item.id === prev.id)
              if (matched) return matched
            }
            return data.items[0]
          })
        } else {
          setSelectedProduct(null)
        }
      })
      .catch((err) => {
        if (!active) return
        setError(err.message || 'Failed to load demand forecast')
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [horizon, selectedCategory, selectedProductType, reorderVersion])

  const items = forecastData?.items || []

  // Extract unique categories and product types for filters
  const categories = useMemo(() => {
    const set = new Set()
    items.forEach((item) => {
      if (item.category) set.add(item.category)
    })
    return Array.from(set).sort()
  }, [items])

  const productTypes = useMemo(() => {
    const set = new Set()
    items.forEach((item) => {
      if (item.productType) set.add(item.productType)
    })
    return Array.from(set).sort()
  }, [items])

  // Check if stock-out is within 7 days
  const isAtRisk = (item) => {
    if (!item.predictedStockOutDate) return false
    const now = new Date()
    const target = new Date(item.predictedStockOutDate)
    const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24))
    return diffDays >= 0 && diffDays <= 7
  }

  // Prepare chart series: combines 30 days history and forecast horizon
  const chartData = useMemo(() => {
    if (!selectedProduct) return []
    const points = []

    // 1. History points
    const history = selectedProduct.history30 || []
    history.forEach((h) => {
      points.push({
        date: h.date,
        type: 'History',
        actualSales: Number(h.unitsSold),
        forecastUnits: null,
        lowerBound: null,
        upperBound: null,
      })
    })

    // 2. Forecast points
    const dailyForecast = selectedProduct.dailyForecast || []
    dailyForecast.forEach((f) => {
      points.push({
        date: f.date,
        type: 'Forecast',
        actualSales: null,
        forecastUnits: Number(f.forecastUnits),
        lowerBound: Number(f.lowerBound),
        upperBound: Number(f.upperBound),
      })
    })

    return points
  }, [selectedProduct])

  // CSV Export
  const exportCSV = () => {
    if (!items.length) return
    const headers = [
      'Product ID',
      'Name',
      'Brand',
      'Category',
      'Type',
      'Stock',
      'On Order',
      'Avg Daily Sales',
      `Forecast (${horizon}d)`,
      'Days of Cover',
      'Predicted Stock-out Date',
      'Trend %',
      'Suggested Order',
      'Backtest Error',
    ]

    const rows = items.map((item) => [
      item.id,
      `"${item.name || ''}"`,
      `"${item.brand || ''}"`,
      `"${item.category || ''}"`,
      `"${item.productType || ''}"`,
      item.stock,
      item.onOrder,
      item.avgDaily,
      item.forecastTotal,
      item.daysOfCover,
      item.predictedStockOutDate || 'No stockout',
      item.trendPercent != null ? `${item.trendPercent}%` : '0%',
      item.suggestedOrder,
      `"${item.backtestError || ''}"`,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `optistock-demand-forecast-${horizon}d.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div style={{ padding: '0 4px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Controls Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          backgroundColor: '#FFFFFF',
          padding: '16px 20px',
          borderRadius: '8px',
          border: '1px solid #E2E8F0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Horizon Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#475569' }}>Forecast Horizon:</span>
            <div style={{ display: 'inline-flex', backgroundColor: '#F1F5F9', borderRadius: '6px', padding: '2px' }}>
              {[7, 14, 30].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHorizon(h)}
                  style={{
                    border: 'none',
                    padding: '5px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: horizon === h ? 600 : 400,
                    backgroundColor: horizon === h ? '#FFFFFF' : 'transparent',
                    color: horizon === h ? '#0F172A' : '#64748B',
                    boxShadow: horizon === h ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  {h} Days
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              fontSize: '13px',
              color: '#334155',
              backgroundColor: '#FFFFFF',
            }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Product Type Filter */}
          <select
            value={selectedProductType}
            onChange={(e) => setSelectedProductType(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              fontSize: '13px',
              color: '#334155',
              backgroundColor: '#FFFFFF',
            }}
          >
            <option value="">All Product Types</option>
            {productTypes.map((pt) => (
              <option key={pt} value={pt}>
                {pt}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setShowFormulaPanel((prev) => !prev)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              color: '#475569',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Info size={15} />
            How this forecast was calculated
            {showFormulaPanel ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          <button
            type="button"
            onClick={exportCSV}
            disabled={!items.length}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '6px',
              border: '1px solid #0F172A',
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Download size={15} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Formula Breakdown Panel (Expandable) */}
      {showFormulaPanel && (
        <div
          style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '18px 22px',
            fontSize: '13px',
            color: '#334155',
            lineHeight: 1.6,
          }}
        >
          <h4 style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: 600, color: '#0F172A' }}>
            Demand Forecasting Algorithm Specification
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div style={{ backgroundColor: '#FFFFFF', padding: '12px 16px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
              <strong style={{ color: '#0F172A' }}>1. Baseline A (Weighted Moving Average)</strong>
              <p style={{ margin: '6px 0 0', color: '#64748B' }}>
                Weights recent demand double: last 7 completed days have weight 2, previous 23 days have weight 1.
                Sum divided by 37 (7*2 + 23*1 = 37).
              </p>
            </div>
            <div style={{ backgroundColor: '#FFFFFF', padding: '12px 16px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
              <strong style={{ color: '#0F172A' }}>2. Day-of-Week Seasonality</strong>
              <p style={{ margin: '6px 0 0', color: '#64748B' }}>
                Weekday factor = (Average for that day over last 28 days) / (Overall 28-day daily average).
                Daily forecast = Baseline A * Weekday Factor.
              </p>
            </div>
            <div style={{ backgroundColor: '#FFFFFF', padding: '12px 16px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
              <strong style={{ color: '#0F172A' }}>3. Confidence Intervals</strong>
              <p style={{ margin: '6px 0 0', color: '#64748B' }}>
                Residual standard deviation computed over 30 days. Lower bound = max(0, Forecast - 1.96 * SD);
                Upper bound = Forecast + 1.96 * SD.
              </p>
            </div>
            <div style={{ backgroundColor: '#FFFFFF', padding: '12px 16px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
              <strong style={{ color: '#0F172A' }}>4. Expiry Cap & Order Suggestion</strong>
              <p style={{ margin: '6px 0 0', color: '#64748B' }}>
                Suggested order = max(0, Forecast Total - Stock - On Order).
                If product expires within horizon, order quantity is capped at projected demand until expiry.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top 4 KPI Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {/* Products at Risk */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748B' }}>Products at Risk</span>
            <AlertTriangle size={18} color="#EF4444" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A' }}>
              {forecastData?.productsAtRisk ?? 0}
            </span>
            <span style={{ fontSize: '12px', color: '#EF4444', fontWeight: 500 }}>
              Stock-out in &le; 7 days
            </span>
          </div>
        </div>

        {/* Total Forecast Units */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748B' }}>Total Forecast Units</span>
            <Package size={18} color="#3B82F6" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A' }}>
              {(forecastData?.totalForecastUnits ?? 0).toLocaleString()}
            </span>
            <span style={{ fontSize: '12px', color: '#64748B' }}>units next {horizon}d</span>
          </div>
        </div>

        {/* Model Accuracy */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748B' }}>Model Accuracy</span>
            <CheckCircle size={18} color="#10B981" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A' }}>
              {forecastData?.overallAccuracy ?? 'not enough data'}
            </span>
            <span style={{ fontSize: '12px', color: '#10B981', fontWeight: 500 }}>30-day backtest</span>
          </div>
        </div>

        {/* Products Needing Reorder */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748B' }}>Needing Reorder</span>
            <ShoppingCart size={18} color="#F59E0B" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A' }}>
              {forecastData?.productsNeedingReorder ?? 0}
            </span>
            <span style={{ fontSize: '12px', color: '#F59E0B', fontWeight: 500 }}>cover &lt; 7d or &le; threshold</span>
          </div>
        </div>
      </div>

      {/* Main Forecast Table */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '8px',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#0F172A' }}>
              Product Demand Forecast &amp; Stock-Out Risk
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748B' }}>
              Sorted by stock-out risk. Click any row to preview historical and projected demand curves.
            </p>
          </div>
          <span style={{ fontSize: '12px', color: '#64748B' }}>
            Showing <strong>{items.length}</strong> products
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
            Computing demand forecast models...
          </div>
        ) : error ? (
          <div style={{ padding: '20px', color: '#EF4444', backgroundColor: '#FEF2F2' }}>
            {error}
          </div>
        ) : !items.length ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
            No products match the selected criteria.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px', color: '#475569' }}>Product</th>
                  <th style={{ padding: '10px 14px', color: '#475569' }}>Category / Type</th>
                  <th style={{ padding: '10px 14px', color: '#475569', textAlign: 'center' }}>Stock</th>
                  <th style={{ padding: '10px 14px', color: '#475569', textAlign: 'center' }}>On Order</th>
                  <th style={{ padding: '10px 14px', color: '#475569', textAlign: 'center' }}>Avg Daily</th>
                  <th style={{ padding: '10px 14px', color: '#475569', textAlign: 'center' }}>Forecast ({horizon}d)</th>
                  <th style={{ padding: '10px 14px', color: '#475569', textAlign: 'center' }}>Cover</th>
                  <th style={{ padding: '10px 14px', color: '#475569' }}>Predicted Stock-out</th>
                  <th style={{ padding: '10px 14px', color: '#475569', textAlign: 'center' }}>Trend</th>
                  <th style={{ padding: '10px 14px', color: '#475569', textAlign: 'center' }}>Suggested Order</th>
                  <th style={{ padding: '10px 14px', color: '#475569', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const atRisk = isAtRisk(item)
                  const isSelected = selectedProduct?.id === item.id

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedProduct(item)}
                      style={{
                        cursor: 'pointer',
                        borderBottom: '1px solid #F1F5F9',
                        backgroundColor: isSelected
                          ? '#EFF6FF'
                          : atRisk
                          ? '#FEF2F2'
                          : 'transparent',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 600, color: '#0F172A' }}>{item.name}</div>
                        {item.brand && (
                          <div style={{ fontSize: '11px', color: '#64748B' }}>{item.brand}</div>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            backgroundColor: '#F1F5F9',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            color: '#475569',
                          }}
                        >
                          {item.category || 'General'}
                        </span>
                        {item.productType && (
                          <span
                            style={{
                              marginLeft: '6px',
                              fontSize: '11px',
                              color: '#64748B',
                            }}
                          >
                            {item.productType}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 500 }}>
                        {item.stock}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', color: '#64748B' }}>
                        {item.onOrder > 0 ? (
                          <span style={{ color: '#2563EB', fontWeight: 600 }}>{item.onOrder}</span>
                        ) : (
                          0
                        )}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        {Number(item.avgDaily || 0).toFixed(1)} /d
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, color: '#0F172A' }}>
                        {item.forecastTotal}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span
                          style={{
                            fontWeight: 600,
                            color: Number(item.daysOfCover) < 7 ? '#EF4444' : '#10B981',
                          }}
                        >
                          {Number(item.daysOfCover).toFixed(1)}d
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        {item.predictedStockOutDate ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 500,
                              backgroundColor: atRisk ? '#FEE2E2' : '#FEF3C7',
                              color: atRisk ? '#991B1B' : '#92400E',
                            }}
                          >
                            {atRisk && <AlertTriangle size={12} />}
                            {item.predictedStockOutDate}
                          </span>
                        ) : (
                          <span style={{ color: '#94A3B8', fontSize: '12px' }}>Sufficient stock</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span
                          style={{
                            color:
                              Number(item.trendPercent) > 0
                                ? '#10B981'
                                : Number(item.trendPercent) < 0
                                ? '#EF4444'
                                : '#64748B',
                            fontWeight: 500,
                          }}
                        >
                          {Number(item.trendPercent) > 0 ? '+' : ''}
                          {Number(item.trendPercent || 0).toFixed(1)}%
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        {item.suggestedOrder > 0 ? (
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              backgroundColor: '#EFF6FF',
                              color: '#1D4ED8',
                              borderRadius: '4px',
                              fontWeight: 600,
                            }}
                          >
                            {item.suggestedOrder}
                          </span>
                        ) : (
                          <span style={{ color: '#94A3B8' }}>0</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            openReorder({
                              productId: item.id,
                              product: {
                                id: item.id,
                                name: item.name,
                                stockQuantity: item.stock,
                                reorderThreshold: Math.max(1, Math.round(item.avgDaily * 7)),
                                costPrice: 0,
                              },
                              suggestedQty: item.suggestedOrder > 0 ? item.suggestedOrder : 10,
                            })
                          }}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: '#0F172A',
                            color: '#FFFFFF',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                          }}
                        >
                          Order
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Interactive Recharts Graph Panel */}
      {selectedProduct && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            padding: '20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#0F172A' }}>
                Demand Projection: {selectedProduct.name}
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#64748B' }}>
                30-Day Historical Sales (Solid) vs. Next {horizon}-Day Forecast with 95% Confidence Interval
                (Dashed / Area)
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px', color: '#64748B' }}>
              <span>
                Baseline A: <strong>{Number(selectedProduct.calcDetails?.baselineA || 0).toFixed(2)}</strong>
              </span>
              <span>
                Backtest Error: <strong>{selectedProduct.backtestError || 'N/A'}</strong>
              </span>
            </div>
          </div>

          <div style={{ width: '100%', height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickFormatter={(val) => {
                    if (!val) return ''
                    const parts = val.split('-')
                    return `${parts[1]}/${parts[2]}`
                  }}
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    const p = payload[0].payload
                    return (
                      <div
                        style={{
                          backgroundColor: '#0F172A',
                          color: '#FFFFFF',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        }}
                      >
                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>{label}</div>
                        {p.actualSales != null && (
                          <div>Actual Sold: {p.actualSales} units</div>
                        )}
                        {p.forecastUnits != null && (
                          <div>Forecast Demand: {p.forecastUnits} units</div>
                        )}
                        {p.lowerBound != null && p.upperBound != null && (
                          <div style={{ color: '#94A3B8', fontSize: '11px', marginTop: '2px' }}>
                            CI Range: [{p.lowerBound} - {p.upperBound}]
                          </div>
                        )}
                      </div>
                    )
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
                />
                {/* Confidence Interval shaded band */}
                <Area
                  type="monotone"
                  dataKey="upperBound"
                  fill="#E0E7FF"
                  stroke="none"
                  name="Confidence Range"
                />
                {/* Actual Sales */}
                <Line
                  type="monotone"
                  dataKey="actualSales"
                  stroke="#2563EB"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  name="Historical Sales"
                />
                {/* Forecast Demand */}
                <Line
                  type="monotone"
                  dataKey="forecastUnits"
                  stroke="#10B981"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 2 }}
                  name="Forecasted Demand"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
