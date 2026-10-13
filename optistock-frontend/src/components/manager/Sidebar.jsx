import {
  Package,
  Bell,
  PieChart,
  Percent,
  Truck,
  TrendingUp,
  Settings,
} from 'lucide-react'

export default function Sidebar({
  activeTab,
  setActiveTab,
  pendingCount,
  onOpenSettings,
}) {
  const isStockActive = activeTab === 'products' || activeTab === 'stock'
  const isAlertsActive = activeTab === 'alerts'
  const isParetoActive = activeTab === 'pareto'
  const isDiscountedActive = activeTab === 'discounted'
  const isReordersActive = activeTab === 'reorders'
  const isForecastActive = activeTab === 'forecast'

  return (
    <aside className="executive-sidebar">
      {/* Top: OptiStock AI Icon Mark in light rounded-square tile */}
      <div className="sidebar-top">
        <button
          type="button"
          className="sidebar-logo-btn"
          title="OptiStock AI - Manager's Desk"
          onClick={() => setActiveTab('overview')}
        >
          <div className="sidebar-brand-tile">
            <img
              src="/static/images/optistock-logo-icon.svg"
              alt="OptiStock AI"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex'
              }}
            />
            <span className="sidebar-fallback-brand" style={{ display: 'none' }}>AI</span>
          </div>
        </button>
      </div>

      {/* Middle: Icon buttons vertically aligned */}
      <div className="sidebar-nav-group">
        {/* 1. Product Stock (Box) */}
        <button
          type="button"
          className={`sidebar-icon-btn ${isStockActive ? 'active' : ''}`}
          data-tooltip="Product Stock"
          onClick={() => setActiveTab('products')}
        >
          <Package size={22} strokeWidth={1.8} />
        </button>

        {/* 2. Stock Alerts (Bell) */}
        <button
          type="button"
          className={`sidebar-icon-btn ${isAlertsActive ? 'active' : ''}`}
          data-tooltip="Stock Alerts"
          onClick={() => setActiveTab('alerts')}
        >
          <Bell size={22} strokeWidth={1.8} />
          {pendingCount > 0 && <span className="badge-dot" />}
        </button>

        {/* 3. 80-20 Mix (Pie Chart) - USP */}
        <button
          type="button"
          className={`sidebar-icon-btn ${isParetoActive ? 'active' : ''}`}
          data-tooltip="80-20 Mix"
          onClick={() => setActiveTab('pareto')}
        >
          <PieChart size={22} strokeWidth={1.8} />
        </button>

        {/* 4. Demand Forecast (TrendingUp) */}
        <button
          type="button"
          className={`sidebar-icon-btn ${isForecastActive ? 'active' : ''}`}
          data-tooltip="Demand Forecast"
          onClick={() => setActiveTab('forecast')}
        >
          <TrendingUp size={22} strokeWidth={1.8} />
        </button>

        {/* 5. Discounted Products (Percent Tag) */}
        <button
          type="button"
          className={`sidebar-icon-btn ${isDiscountedActive ? 'active' : ''}`}
          data-tooltip="Discounted Products"
          onClick={() => setActiveTab('discounted')}
        >
          <Percent size={22} strokeWidth={1.8} />
        </button>

        {/* 6. Reorders & Orders (Truck) */}
        <button
          type="button"
          className={`sidebar-icon-btn ${isReordersActive ? 'active' : ''}`}
          data-tooltip="Reorders & Orders"
          onClick={() => setActiveTab('reorders')}
        >
          <Truck size={22} strokeWidth={1.8} />
        </button>
      </div>

      {/* Bottom: Settings (Gear) */}
      <div className="sidebar-bottom">
        <button
          type="button"
          className="sidebar-icon-btn"
          data-tooltip="Settings & Profile"
          onClick={onOpenSettings}
        >
          <Settings size={22} strokeWidth={1.8} />
        </button>
      </div>
    </aside>
  )
}
