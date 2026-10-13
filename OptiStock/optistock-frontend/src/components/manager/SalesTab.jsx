import { useEffect, useState, useCallback } from 'react'
import { getSummary, getBills, cancelBill } from '../../api'
import CancelBillModal from './CancelBillModal'

export default function SalesTab() {
  const todayStr = new Date().toISOString().split('T')[0]
  const [fromDate, setFromDate] = useState(todayStr)
  const [toDate, setToDate] = useState(todayStr)
  const [summary, setSummary] = useState(null)
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [cancelModalBill, setCancelModalBill] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  const loadSales = useCallback(async () => {
    try {
      const [sumData, billsData] = await Promise.all([
        getSummary(fromDate, toDate),
        getBills(fromDate === toDate ? fromDate : ''),
      ])
      setSummary(sumData)
      setBills(Array.isArray(billsData) ? billsData : [])
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to load sales data')
    } finally {
      setLoading(false)
    }
  }, [fromDate, toDate])

  useEffect(() => {
    let mounted = true
    async function init() {
      try {
        const [sumData, billsData] = await Promise.all([
          getSummary(fromDate, toDate),
          getBills(fromDate === toDate ? fromDate : ''),
        ])
        if (mounted) {
          setSummary(sumData)
          setBills(Array.isArray(billsData) ? billsData : [])
          setError('')
          setLoading(false)
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Failed to load sales data')
          setLoading(false)
        }
      }
    }
    init()
    return () => {
      mounted = false
    }
  }, [fromDate, toDate])

  async function handleFilter() {
    setLoading(true)
    setError('')
    setSuccessMsg('')
    await loadSales()
  }

  async function handleConfirmCancel() {
    if (!cancelModalBill) return
    setCancelling(true)
    setError('')
    setSuccessMsg('')
    try {
      await cancelBill(cancelModalBill.id)
      setSuccessMsg(`Bill #${cancelModalBill.id} was cancelled successfully. Items restored to stock.`)
      setCancelModalBill(null)
      await loadSales()
    } catch (err) {
      setError(err.message || 'Failed to cancel bill')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            From:
            <input type="date" className="glass-input" style={{ width: 140, marginLeft: 6, borderRadius: '6px' }} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </label>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            To:
            <input type="date" className="glass-input" style={{ width: 140, marginLeft: 6, borderRadius: '6px' }} value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </label>
          <button
            type="button"
            style={{ padding: '0.45rem 0.9rem', borderRadius: '6px', background: '#0d9488', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
            onClick={handleFilter}
          >
            Filter
          </button>
        </div>
      </div>

      {error ? (
        <div className="state-message error" style={{ marginBottom: '1rem', background: 'rgba(244,63,94,0.15)', color: '#fda4af', padding: '0.75rem 1rem', borderRadius: '6px' }}>
          {error}
        </div>
      ) : null}

      {successMsg ? (
        <div style={{ marginBottom: '1rem', background: 'rgba(45,212,191,0.15)', color: '#5eead4', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.9rem' }}>
          {successMsg}
        </div>
      ) : null}

      <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '1.5rem' }}>
        <div className="glass-panel kpi-card" style={{ borderRadius: '8px' }}>
          <span className="kpi-label">Gross Sales</span>
          <span className="kpi-value" style={{ color: 'var(--text-heading)' }}>₹{summary?.grossSales || '0.00'}</span>
        </div>
        <div className="glass-panel kpi-card" style={{ borderRadius: '8px' }}>
          <span className="kpi-label">Discounts</span>
          <span className="kpi-value" style={{ color: 'var(--color-amber)' }}>-₹{summary?.totalDiscountGiven || '0.00'}</span>
        </div>
        <div className="glass-panel kpi-card" style={{ borderRadius: '8px' }}>
          <span className="kpi-label">Net Sales</span>
          <span className="kpi-value" style={{ color: 'var(--color-teal)' }}>₹{summary?.netSales || '0.00'}</span>
        </div>
        <div className="glass-panel kpi-card" style={{ borderRadius: '8px' }}>
          <span className="kpi-label">Completed Bills</span>
          <span className="kpi-value" style={{ color: 'var(--color-teal)' }}>{summary?.billCount || 0}</span>
        </div>
        <div className="glass-panel kpi-card" style={{ borderRadius: '8px' }}>
          <span className="kpi-label">Cancelled Bills</span>
          <span className="kpi-value" style={{ color: 'var(--color-rose)' }}>{summary?.cancelledBillCount || 0}</span>
          <span className="kpi-footer">₹{summary?.cancelledAmount || '0.00'}</span>
        </div>
      </div>

      <div className="glass-panel glass-table-container">
        {loading ? (
          <div style={{ padding: '2rem' }}>
            <div className="skeleton" style={{ height: 40, marginBottom: '0.75rem', borderRadius: '6px' }} />
            <div className="skeleton" style={{ height: 40, borderRadius: '6px' }} />
          </div>
        ) : bills.length === 0 ? (
          <div className="state-message" style={{ padding: '2rem' }}>No bills found for the selected period.</div>
        ) : (
          <table className="glass-table">
            <thead>
              <tr>
                <th>Bill ID</th>
                <th>Time</th>
                <th>Cashier</th>
                <th>Subtotal</th>
                <th>Discount</th>
                <th>Total Charged</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((bill) => (
                <tr key={bill.id}>
                  <td>
                    <strong>#{bill.id}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{bill.items?.length || 0} items</div>
                  </td>
                  <td>{bill.createdAt ? new Date(bill.createdAt).toLocaleTimeString() : 'N/A'}</td>
                  <td>Cashier #{bill.cashierId}</td>
                  <td>₹{bill.subtotal}</td>
                  <td>₹{bill.totalDiscount}</td>
                  <td>
                    <strong style={{ color: 'var(--color-teal)' }}>₹{bill.totalAmount}</strong>
                  </td>
                  <td>
                    <span className={`badge ${bill.status === 'COMPLETED' ? 'badge-green' : 'badge-rose'}`}>
                      {bill.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {bill.status === 'COMPLETED' ? (
                      <button
                        type="button"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderRadius: '6px', background: 'rgba(244,63,94,0.18)', color: '#fda4af', border: '1px solid rgba(244,63,94,0.3)', cursor: 'pointer', fontWeight: 600 }}
                        onClick={() => setCancelModalBill(bill)}
                      >
                        Cancel Bill
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cancelled</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <CancelBillModal
        bill={cancelModalBill}
        onClose={() => setCancelModalBill(null)}
        onConfirm={handleConfirmCancel}
        cancelling={cancelling}
      />
    </div>
  )
}
