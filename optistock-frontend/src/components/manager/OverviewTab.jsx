import { useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts'
import { getSummary, getAlerts, getPendingDiscountRequests } from '../../api'

export default function OverviewTab() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [summaryToday, setSummaryToday] = useState(null)
  const [summary14Days, setSummary14Days] = useState(null)
  const [alerts, setAlerts] = useState(null)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    async function fetchOverview() {
      setLoading(true)
      setError('')
      try {
        const today = new Date().toISOString().split('T')[0]
        const d14 = new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0]

        const [todayData, histData, alertData, pendingData] = await Promise.all([
          getSummary(today, today),
          getSummary(d14, today),
          getAlerts(),
          getPendingDiscountRequests(),
        ])

        setSummaryToday(todayData)
        setSummary14Days(histData)
        setAlerts(alertData)
        setPendingCount(Array.isArray(pendingData) ? pendingData.length : 0)
      } catch (err) {
        setError(err.message || 'Failed to load overview data')
      } finally {
        setLoading(false)
      }
    }
    fetchOverview()
  }, [])

  if (loading) {
    return (
      <div>
        <div className="card-grid">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="glass-panel kpi-card skeleton" style={{ height: 110 }} />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
          <div className="glass-panel skeleton" style={{ height: 320 }} />
          <div className="glass-panel skeleton" style={{ height: 320 }} />
        </div>
      </div>
    )
  }

  if (error) {
    return <div className="state-message error">{error}</div>
  }

  const kpis = [
    { label: 'Net Sales Today', value: `₹${summaryToday?.netSales || '0.00'}`, color: 'var(--color-teal)', note: 'Gross - discounts' },
    { label: 'Bills Today', value: summaryToday?.billCount || 0, color: 'var(--color-teal-bright)', note: 'Completed bills' },
    { label: 'Low Stock Alert', value: alerts?.lowStock?.length || 0, color: 'var(--color-amber)', note: 'At/below threshold' },
    { label: 'Active Markdowns', value: alerts?.markdownActive?.length || 0, color: 'var(--color-orange)', note: 'Discounted products' },
    { label: 'Pending Approvals', value: pendingCount, color: 'var(--color-rose)', note: 'Cashier discounts' },
  ]

  const lineData = (summary14Days?.dailyTotals || []).map((d) => ({
    date: d.date?.slice(5) || d.date,
    netSales: Number(d.netSales || 0),
    bills: Number(d.bills || 0),
  }))

  const topProducts = (summaryToday?.top5Products || []).map((p) => ({
    name: p.name.length > 12 ? p.name.slice(0, 11) + '…' : p.name,
    revenue: Number(p.revenue || 0),
    qtySold: Number(p.qtySold || 0),
  }))

  return (
    <div>
      <div className="card-grid">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="glass-panel kpi-card">
            <span className="kpi-label">{kpi.label}</span>
            <span className="kpi-value" style={{ color: kpi.color }}>{kpi.value}</span>
            <span className="kpi-footer">{kpi.note}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', color: 'var(--text-heading)', marginBottom: '1rem' }}>
            14-Day Sales Velocity (₹)
          </h2>
          <div style={{ width: '100%', height: 260 }}>
            {lineData.length === 0 ? (
              <div className="state-message">No sales recorded in the last 14 days</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} />
                  <Tooltip
                    contentStyle={{ background: '#12172b', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12 }}
                    labelStyle={{ color: '#fff', fontWeight: 600 }}
                  />
                  <Line type="monotone" dataKey="netSales" stroke="var(--color-teal)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', color: 'var(--text-heading)', marginBottom: '1rem' }}>
            Today's Top 5 Products by Revenue (₹)
          </h2>
          <div style={{ width: '100%', height: 260 }}>
            {topProducts.length === 0 ? (
              <div className="state-message">No product sales yet today</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} />
                  <Tooltip
                    contentStyle={{ background: '#12172b', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12 }}
                    labelStyle={{ color: '#fff', fontWeight: 600 }}
                  />
                  <Bar dataKey="revenue" fill="var(--color-teal)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
