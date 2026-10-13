import { useEffect, useState, useCallback } from 'react'
import { getPendingDiscountRequests, approveDiscountRequest, rejectDiscountRequest } from '../../api'

export default function ApprovalsTab({ products = [] }) {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [actionId, setActionId] = useState(null)

  const productMap = products.reduce((acc, p) => {
    acc[p.id] = p
    return acc
  }, {})

  const loadPending = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true)
    try {
      const data = await getPendingDiscountRequests()
      setRequests(Array.isArray(data) ? data : [])
      setError('')
    } catch (err) {
      if (!quiet) setError(err.message || 'Failed to load discount requests')
    } finally {
      if (!quiet) setLoading(false)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    async function init() {
      try {
        const data = await getPendingDiscountRequests()
        if (mounted) {
          setRequests(Array.isArray(data) ? data : [])
          setError('')
          setLoading(false)
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Failed to load discount requests')
          setLoading(false)
        }
      }
    }
    init()

    const interval = setInterval(async () => {
      try {
        const data = await getPendingDiscountRequests()
        if (mounted) setRequests(Array.isArray(data) ? data : [])
      } catch {
        // ignore
      }
    }, 10000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  async function handleApprove(id) {
    setActionId(id)
    setError('')
    setFeedback('')
    try {
      await approveDiscountRequest(id)
      setFeedback(`Discount request #${id} approved`)
      await loadPending(true)
    } catch (err) {
      setError(`Approval failed: ${err.message}`)
    } finally {
      setActionId(null)
    }
  }

  async function handleReject(id) {
    setActionId(id)
    setError('')
    setFeedback('')
    try {
      await rejectDiscountRequest(id)
      setFeedback(`Discount request #${id} rejected`)
      await loadPending(true)
    } catch (err) {
      setError(`Rejection failed: ${err.message}`)
    } finally {
      setActionId(null)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--text-heading)' }}>
            Pending Cashier Discount Requests
          </h2>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Automatically refreshing every 10 seconds.
          </p>
        </div>
        <button
          type="button"
          style={{ padding: '0.45rem 0.9rem', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
          onClick={() => loadPending(false)}
        >
          Refresh Now
        </button>
      </div>

      {feedback ? (
        <div style={{ marginBottom: '1rem', background: 'rgba(45,212,191,0.15)', color: '#5eead4', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.9rem' }}>
          {feedback}
        </div>
      ) : null}

      {error ? (
        <div className="state-message error" style={{ marginBottom: '1rem', background: 'rgba(244,63,94,0.15)', color: '#fda4af', padding: '0.75rem 1rem', borderRadius: '6px' }}>
          {error}
        </div>
      ) : null}

      <div className="glass-panel glass-table-container">
        {loading ? (
          <div style={{ padding: '2rem' }}>
            <div className="skeleton" style={{ height: 40, marginBottom: '0.75rem', borderRadius: '6px' }} />
            <div className="skeleton" style={{ height: 40, borderRadius: '6px' }} />
          </div>
        ) : requests.length === 0 ? (
          <div className="state-message" style={{ padding: '2rem' }}>
            No pending discount requests awaiting manager approval.
          </div>
        ) : (
          <table className="glass-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Product</th>
                <th>Cashier ID</th>
                <th>Requested Discount</th>
                <th>Base Selling Price</th>
                <th>Created At</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => {
                const prod = productMap[req.productId]
                const isProcessing = actionId === req.id
                return (
                  <tr key={req.id}>
                    <td>#{req.id}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>
                        {prod ? prod.name : `Product #${req.productId}`}
                      </div>
                      {prod?.brand ? <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{prod.brand}</div> : null}
                    </td>
                    <td>Cashier #{req.cashierId}</td>
                    <td>
                      <span className="badge badge-amber" style={{ fontSize: '0.88rem' }}>
                        {req.requestedPercent}%
                      </span>
                    </td>
                    <td>₹{prod?.sellingPrice ?? 'N/A'}</td>
                    <td>{req.createdAt ? new Date(req.createdAt).toLocaleTimeString() : 'Recent'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', background: '#0d9488', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}
                          disabled={isProcessing}
                          onClick={() => handleApprove(req.id)}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', background: 'rgba(244,63,94,0.2)', color: '#fda4af', border: '1px solid rgba(244,63,94,0.3)', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}
                          disabled={isProcessing}
                          onClick={() => handleReject(req.id)}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
