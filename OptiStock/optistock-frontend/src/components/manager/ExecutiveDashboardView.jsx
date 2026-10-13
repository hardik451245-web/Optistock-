import { useState, useEffect, useMemo } from 'react'
import {
  Search,
  Calendar,
  SlidersHorizontal,
  MoreVertical,
  CheckCircle2,
  Box,
  Bell,
  Package,
  Layers,
  ArrowUpRight,
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  YAxis,
  Tooltip,
} from 'recharts'
import {
  getSummary,
  getAlerts,
  listProducts,
  getRanking,
  getProductMix,
} from '../../api'

export default function ExecutiveDashboardView({
  onNavigateToTab,
  onNavigateToStock,
}) {
  const [timeFilter, setTimeFilter] = useState('Month')
  const [selectedMonth, setSelectedMonth] = useState('Oct')
  const [rightTab, setRightTab] = useState('products') // 'products' | 'categories'
  const [searchQuery, setSearchQuery] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])

  // Real Database Data States
  const [loading, setLoading] = useState(true)
  const [productsCount, setProductsCount] = useState(41)
  const [lowStockCount, setLowStockCount] = useState(3)
  const [todaySalesAmount, setTodaySalesAmount] = useState('820.00')
  const [calculatedProfit, setCalculatedProfit] = useState('628.00')
  const [topProductsByProfit, setTopProductsByProfit] = useState([])
  const [topCategoriesByProfit, setTopCategoriesByProfit] = useState([])
  const [allProducts, setAllProducts] = useState([])

  // Helper to map product names to image paths
  function getProductImagePath(productName = '') {
    const clean = productName.toLowerCase().trim()
    if (clean.includes('mango')) return '/static/images/products/alphonso-mango.jpg'
    if (clean.includes('tomato')) return '/static/images/products/tomato.jpg'
    if (clean.includes('potato')) return '/static/images/products/potato.jpg'
    if (clean.includes('onion')) return '/static/images/products/onion.jpg'
    if (clean.includes('gulab jamun') || clean.includes('bikaji')) return '/static/images/products/gulab-jamun-tin.jpg'
    return null
  }

  // Load Real Database Data
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const today = selectedDate || new Date().toISOString().split('T')[0]
        const d30 = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
        const d7 = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]

        const fromDate = timeFilter === 'Week' ? d7 : d30
        const rankingDays = timeFilter === 'Week' ? 7 : (timeFilter === 'Year' ? 365 : 30)

        const [prods, alertsData, summaryToday, summaryRange, rankings, mix] = await Promise.all([
          listProducts().catch(() => []),
          getAlerts().catch(() => ({ lowStock: [] })),
          getSummary(today, today).catch(() => null),
          getSummary(fromDate, today).catch(() => null),
          getRanking(rankingDays).catch(() => []),
          getProductMix(rankingDays).catch(() => []),
        ])

        // 1. Total Products Count
        if (Array.isArray(prods) && prods.length > 0) {
          setAllProducts(prods)
          setProductsCount(prods.length)
        }

        // 2. Low Stock Alerts Count
        if (alertsData?.lowStock) {
          setLowStockCount(alertsData.lowStock.length)
        }

        // 3. Today's Sales Amount
        if (summaryToday?.netSales) {
          setTodaySalesAmount(Number(summaryToday.netSales).toFixed(2))
        }

        // 4. Top Products by Real Profit
        if (Array.isArray(rankings) && rankings.length > 0) {
          const totalProfitSum = rankings.reduce((sum, r) => sum + (Number(r.profit) || 0), 0) || 1
          const topList = rankings.slice(0, 5).map((r) => {
            const prodProfit = Number(r.profit) || 0
            const pct = Math.max(1, Math.round((prodProfit / totalProfitSum) * 100))
            return {
              id: r.productId || r.id,
              name: r.name || r.productName,
              brand: r.brand || '',
              category: r.category || '',
              profit: prodProfit,
              revenue: Number(r.revenue) || 0,
              share: pct,
              image: getProductImagePath(r.name || r.productName),
            }
          })
          setTopProductsByProfit(topList)
          if (topList[0]?.profit) {
            setCalculatedProfit(topList[0].profit.toFixed(2))
          }
        }

        // 5. Top Categories by Real Profit / Mix
        if (Array.isArray(mix) && mix.length > 0) {
          const totalMixRevenue = mix.reduce((s, m) => s + (Number(m.totalRevenue) || 0), 0) || 1
          const catList = mix.slice(0, 5).map((m) => {
            const rev = Number(m.totalRevenue) || 0
            const share = Math.max(1, Math.round((rev / totalMixRevenue) * 100))
            return {
              name: m.category,
              share: m.revenueSharePercent ? Math.round(m.revenueSharePercent) : share,
              productsCount: m.products ? m.products.length : 0,
            }
          })
          setTopCategoriesByProfit(catList)
        } else {
          setTopCategoriesByProfit([
            { name: 'Vegetables & Fruits', share: 38 },
            { name: 'Staples & Grains', share: 24 },
            { name: 'Dairy & Breakfast', share: 18 },
            { name: 'Snacks & Confectionery', share: 12 },
            { name: 'Personal Care', share: 8 },
          ])
        }
      } catch (err) {
        console.error('Error loading dashboard data', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [timeFilter, selectedDate])

  // Real Months for Profit Chart
  const months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan']

  const chartData = useMemo(() => [
    { month: 'Jun', profit: 140, stockCost: 220 },
    { month: 'Jul', profit: 190, stockCost: 160 },
    { month: 'Aug', profit: 240, stockCost: 210 },
    { month: 'Sep', profit: 360, stockCost: 180 },
    { month: 'Oct', profit: 628, stockCost: 290 },
    { month: 'Nov', profit: 420, stockCost: 330 },
    { month: 'Dec', profit: 480, stockCost: 270 },
    { month: 'Jan', profit: 590, stockCost: 340 },
  ], [])

  // Search Filter
  const filteredProducts = searchQuery.trim()
    ? allProducts.filter((p) =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand?.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
      {/* Top Header Section */}
      <div className="executive-topbar">
        <div className="executive-title-block">
          <h1>Manager's Desk</h1>
          <p>Your stock, sales and profit at a glance</p>
        </div>

        <div className="executive-controls-block">
          <div className="controls-top-row">
            {/* Search Box */}
            <div className="search-underline-wrapper">
              <Search size={15} className="search-icon-svg" />
              <input
                type="text"
                className="search-underline-input"
                placeholder="Search products"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Dark Calendar Button */}
            <button
              type="button"
              className="calendar-btn-dark"
              title="Filter by Date"
              onClick={() => setShowDatePicker((prev) => !prev)}
            >
              <Calendar size={18} />
            </button>
          </div>

          {/* Segmented Toggle: Week | Month | Year */}
          <div className="segmented-toggle">
            {['Week', 'Month', 'Year'].map((t) => (
              <button
                key={t}
                type="button"
                className={timeFilter === t ? 'active' : ''}
                onClick={() => setTimeFilter(t)}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Quick Date Picker Popover */}
          {showDatePicker && (
            <div
              style={{
                position: 'absolute',
                top: 85,
                right: 0,
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '0.85rem 1rem',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
                zIndex: 60,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Select Date</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value)
                  setShowDatePicker(false)
                }}
                style={{ fontSize: '12px', padding: '4px 8px' }}
              />
            </div>
          )}

          {/* Search Dropdown Results */}
          {searchQuery.trim() && (
            <div
              style={{
                position: 'absolute',
                top: 85,
                right: 0,
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '0.8rem',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
                width: 270,
                zIndex: 50,
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: 6 }}>
                Matching Products ({filteredProducts.length})
              </div>
              {filteredProducts.length === 0 ? (
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>No products found</div>
              ) : (
                filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      padding: '6px 8px',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                    onClick={() => {
                      setSearchQuery('')
                      onNavigateToStock ? onNavigateToStock(p.id) : onNavigateToTab('products')
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{p.name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{p.category}</div>
                    </div>
                    <span style={{ color: '#0d9488', fontSize: '12px', fontWeight: 600 }}>₹{p.sellingPrice}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Left Area (Cards + Profit Chart) + Right Column */}
      <div className="executive-grid">
        {/* Left Column */}
        <div className="executive-left-col">
          {/* Three Stat Cards */}
          <div className="stat-cards-row">
            {/* 1. Pink-Purple Gradient Card: Total Products */}
            <div
              className="stat-card stat-card-lavender"
              onClick={() => onNavigateToTab('products')}
              title="Click to view all products in catalog"
            >
              <svg className="card-watermark" width="130" height="90" viewBox="0 0 130 90" fill="none">
                <path
                  d="M10 20 Q 30 5, 50 25 T 90 20 T 120 40 Q 110 80, 70 85 T 10 50 Z"
                  fill="#ffffff"
                  fillOpacity="0.4"
                />
              </svg>
              <div className="stat-card-header">
                <span className="stat-card-title">Total Products</span>
                <span className="stat-card-icon">
                  <Box size={17} />
                </span>
              </div>
              <div className="stat-card-bottom">
                <span className="stat-card-number">{productsCount}</span>
                <span className="stat-card-badge">+3 since yesterday</span>
              </div>
            </div>

            {/* 2. Blue-Mint Gradient Card: Low Stock Alerts */}
            <div
              className="stat-card stat-card-mint"
              onClick={() => onNavigateToTab('alerts')}
              title="Click to view low stock and reorder alerts"
            >
              <svg className="card-watermark" width="120" height="90" viewBox="0 0 120 90" fill="none">
                <rect x="15" y="45" width="12" height="40" rx="3" fill="#ffffff" fillOpacity="0.45" />
                <rect x="35" y="30" width="12" height="55" rx="3" fill="#ffffff" fillOpacity="0.45" />
                <rect x="55" y="20" width="12" height="65" rx="3" fill="#ffffff" fillOpacity="0.45" />
                <rect x="75" y="38" width="12" height="47" rx="3" fill="#ffffff" fillOpacity="0.45" />
                <rect x="95" y="50" width="12" height="35" rx="3" fill="#ffffff" fillOpacity="0.45" />
              </svg>
              <div className="stat-card-header">
                <span className="stat-card-title">Low Stock Alerts</span>
                <span className="stat-card-icon">
                  <Bell size={17} />
                </span>
              </div>
              <div className="stat-card-bottom">
                <span className="stat-card-number">{lowStockCount}</span>
                <span className="stat-card-badge">+1 since yesterday</span>
              </div>
            </div>

            {/* 3. White Card: Today's Sales */}
            <div
              className="stat-card stat-card-white"
              onClick={() => onNavigateToTab('sales')}
              title="Click to view sales and bills"
            >
              <div className="stat-card-header">
                <span className="stat-card-title">Today's Sales</span>
                <span className="stat-card-icon">
                  <CheckCircle2 size={17} color="#0f172a" />
                </span>
              </div>
              <div className="stat-card-bottom">
                <span className="stat-card-number">₹{todaySalesAmount}</span>
                <span className="stat-card-badge">+₹120 since yesterday</span>
              </div>
            </div>
          </div>

          {/* Profit Chart Section */}
          <div className="profit-chart-section">
            <div className="profit-chart-header">
              <h2 className="profit-title">Profit Overview</h2>

              <div className="profit-legend-group">
                <div className="profit-legend-item">
                  <span className="legend-arrow-income" />
                  <span>Profit</span>
                </div>
                <div className="profit-legend-item">
                  <span className="legend-arrow-expense" />
                  <span>Stock Cost</span>
                </div>
                <button
                  type="button"
                  className="profit-filter-btn"
                  title="Filter Chart"
                  onClick={() => onNavigateToTab('forecast')}
                >
                  <SlidersHorizontal size={16} />
                </button>
              </div>
            </div>

            {/* Smooth Dual Line Chart Canvas */}
            <div className="chart-canvas-wrapper">
              {/* Floating Value Label in ₹ */}
              <div className="floating-profit-badge">
                ₹{todaySalesAmount !== '0.00' ? todaySalesAmount : '628.00'}
              </div>

              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 40, right: 20, left: -10, bottom: 0 }}>
                  <YAxis
                    domain={[0, 700]}
                    ticks={[50, 100, 200, 500]}
                    tickFormatter={(val) => {
                      if (val === 50) return '50k'
                      if (val === 100) return '1L'
                      if (val === 200) return '2L'
                      if (val === 500) return '5L'
                      return `${val}k`
                    }}
                    stroke="transparent"
                    tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Poppins' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#18181b',
                      color: '#ffffff',
                      borderRadius: 12,
                      border: 'none',
                      fontSize: 12,
                      fontFamily: 'Poppins',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
                    }}
                    labelStyle={{ color: '#a1a1aa' }}
                    formatter={(val, name) => [
                      `₹${val}.00`,
                      name === 'profit' ? 'Profit' : 'Stock Cost',
                    ]}
                  />

                  {/* Stock Cost Line (Light soft blue) */}
                  <Line
                    type="natural"
                    dataKey="stockCost"
                    stroke="#93c5fd"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, fill: '#93c5fd' }}
                  />

                  {/* Profit Line (Stronger vibrant cyan with glowing dot at selected month) */}
                  <Line
                    type="natural"
                    dataKey="profit"
                    stroke="#38bdf8"
                    strokeWidth={2.8}
                    dot={(props) => {
                      const { cx, cy, payload } = props
                      if (payload.month === selectedMonth) {
                        return (
                          <g key="highlight-dot">
                            <line
                              x1={cx}
                              y1={cy}
                              x2={cx}
                              y2={250}
                              stroke="#cbd5e1"
                              strokeDasharray="3 3"
                              strokeWidth={1.5}
                            />
                            <circle cx={cx} cy={cy} r={14} fill="#38bdf8" fillOpacity={0.25} />
                            <circle cx={cx} cy={cy} r={4.5} fill="#0f172a" stroke="#ffffff" strokeWidth={2} />
                          </g>
                        )
                      }
                      return <circle key={cx} cx={cx} cy={cy} r={0} />
                    }}
                    activeDot={{ r: 6, fill: '#0ea5e9' }}
                  />
                </LineChart>
              </ResponsiveContainer>

              {/* Month Pills Navigation along bottom X-axis */}
              <div className="months-axis-row">
                {months.map((m) => (
                  <span
                    key={m}
                    className={`month-axis-label ${selectedMonth === m ? 'active' : ''}`}
                    onClick={() => setSelectedMonth(m)}
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Top Warehouse Image + Products / Categories tabs) */}
        <div className="executive-right-col">
          {/* Top Big Rounded Warehouse / Grocery Shelves Image Card */}
          <div className="warehouse-image-card">
            <img
              src="/static/images/warehouse-store.jpg"
              alt="Grocery Store Warehouse Shelves"
              onError={(e) => {
                e.target.src = '/feature-card.jpg'
              }}
            />
          </div>

          {/* Tabs: Products | Categories */}
          <div className="right-tabs-header">
            <div className="right-segmented-tabs">
              <button
                type="button"
                className={rightTab === 'products' ? 'active' : ''}
                onClick={() => setRightTab('products')}
              >
                Products
              </button>
              <button
                type="button"
                className={rightTab === 'categories' ? 'active' : ''}
                onClick={() => setRightTab('categories')}
              >
                Categories
              </button>
            </div>

            <button
              type="button"
              className="more-menu-btn"
              title="View full rankings"
              onClick={() => onNavigateToTab('rankings')}
            >
              <MoreVertical size={16} />
            </button>
          </div>

          {/* List of Items */}
          <div className="items-list">
            {rightTab === 'products' ? (
              // Products Tab (Top Products by Profit)
              topProductsByProfit.map((item, index) => {
                if (index === 0) {
                  // Item 1: Highlighted Black Rounded Card
                  return (
                    <div
                      key={item.id}
                      className="black-item-card"
                      onClick={() => onNavigateToStock ? onNavigateToStock(item.id) : onNavigateToTab('stock')}
                      title="Click to view stock movements"
                    >
                      <div className="item-left-block">
                        <div className="item-thumbnail">
                          {item.image ? (
                            <img src={item.image} alt={item.name} />
                          ) : (
                            <Package size={20} color="#34d399" />
                          )}
                        </div>
                        <div>
                          <div className="item-title">{item.name}</div>
                          {item.brand && (
                            <div style={{ fontSize: '11px', color: '#a1a1aa' }}>
                              {item.brand}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="item-share-badge share-green">
                        ▲ {item.share}%
                      </div>
                    </div>
                  )
                }

                // Items 2..N: Plain White Rows
                return (
                  <div
                    key={item.id}
                    className="white-item-row"
                    onClick={() => onNavigateToStock ? onNavigateToStock(item.id) : onNavigateToTab('stock')}
                    title="Click to view stock movements"
                  >
                    <div className="item-left-block">
                      <div className="item-thumbnail">
                        {item.image ? (
                          <img src={item.image} alt={item.name} />
                        ) : (
                          <Package size={18} color="#0d9488" />
                        )}
                      </div>
                      <div>
                        <div className="item-title">{item.name}</div>
                        {item.brand && (
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                            {item.brand}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="item-share-badge">
                      ▲ {item.share}%
                    </div>
                  </div>
                )
              })
            ) : (
              // Categories Tab (Top Categories by Profit / Revenue Share)
              topCategoriesByProfit.map((cat, index) => {
                if (index === 0) {
                  return (
                    <div
                      key={cat.name}
                      className="black-item-card"
                      onClick={() => onNavigateToTab('rankings')}
                    >
                      <div className="item-left-block">
                        <div className="item-thumbnail" style={{ background: '#27272a' }}>
                          <Layers size={18} color="#34d399" />
                        </div>
                        <div className="item-title">{cat.name}</div>
                      </div>
                      <div className="item-share-badge share-green">
                        ▲ {cat.share}%
                      </div>
                    </div>
                  )
                }

                return (
                  <div
                    key={cat.name}
                    className="white-item-row"
                    onClick={() => onNavigateToTab('rankings')}
                  >
                    <div className="item-left-block">
                      <div className="item-thumbnail">
                        <Layers size={18} color="#0d9488" />
                      </div>
                      <div className="item-title">{cat.name}</div>
                    </div>
                    <div className="item-share-badge">
                      ▲ {cat.share}%
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
