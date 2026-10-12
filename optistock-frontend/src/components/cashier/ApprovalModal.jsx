import { useEffect, useState } from 'react'
import { createDiscountRequest, getDiscountRequest } from '../../api'

export default function ApprovalModal({
  product,
  requestedPercent,
  onApproved,
  onClose,
}) {
  const [requestId, setRequestId] = useState(null)
  const [status, setStatus] = useState('IDLE') // 'IDLE' | 'PENDING' | 'APPROVED' | 'REJECTED'
  const [requesting, setRequesting] = useState(false)
  const [pollError, setPollError] = useState('')

  async function handleSendRequest() {
    setRequesting(true)
    setPollError('')
    try {
      const res = await createDiscountRequest(product.productId, Number(requestedPercent))
      setRequestId(res.id)
      setStatus(res.status)
    } catch (err) {
      setPollError(err.message || 'Failed to submit discount request')
    } finally {
      setRequesting(false)
    }
  }

  useEffect(() => {
    if (!requestId || status === 'APPROVED' || status === 'REJECTED') return

    const interval = setInterval(async () => {
      try {
        const res = await getDiscountRequest(requestId)
        if (res.status === 'APPROVED') {
          setStatus('APPROVED')
        } else if (res.status === 'REJECTED') {
          setStatus('REJECTED')
        }
      } catch {
        // silent retry
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [requestId, status])

  function handleApply() {
    onApproved(product.productId, requestId)
    onClose()
  }

  return (
    <div className="spatial-modal-backdrop" onClick={onClose}>
      <div className="spatial-modal-window" onClick={(e) => e.stopPropagation()} style={{ borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--spatial-rose)' }}>
            Profit Warning: Authorization Required
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 0, fontSize: '1.1rem', cursor: 'pointer' }}
          >
            x
          </button>
        </div>

        <p style={{ color: 'var(--spatial-text-main)', fontSize: '0.92rem', lineHeight: 1.5 }}>
          The discount of <strong>{requestedPercent}%</strong> on <strong>{product.name}</strong> causes the line margin to fall below the minimum threshold. Manager authorization is required before completing the bill.
        </p>

        {pollError ? (
          <div style={{ color: 'var(--spatial-rose)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {pollError}
          </div>
        ) : null}

        {status === 'IDLE' && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              style={{ padding: '0.55rem 1.1rem', borderRadius: '6px', background: '#ffffff', border: '1px solid #cbd5e1', cursor: 'pointer', fontSize: '0.88rem' }}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              style={{ padding: '0.55rem 1.25rem', borderRadius: '6px', background: '#0d9488', color: '#ffffff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' }}
              disabled={requesting}
              onClick={handleSendRequest}
            >
              {requesting ? 'Requesting...' : 'Request Manager Approval'}
            </button>
          </div>
        )}

        {status === 'PENDING' && (
          <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(217,119,6,0.08)', borderRadius: '8px', border: '1px solid rgba(217,119,6,0.25)', marginTop: '1rem' }}>
            <strong style={{ color: 'var(--spatial-amber)', fontSize: '1rem' }}>Request #{requestId} Sent to Manager</strong>
            <p style={{ fontSize: '0.82rem', color: 'var(--spatial-text-muted)', margin: '0.35rem 0 0' }}>
              Checking manager status every 5 seconds. Please wait...
            </p>
          </div>
        )}

        {status === 'APPROVED' && (
          <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(13,148,136,0.08)', borderRadius: '8px', border: '1px solid rgba(13,148,136,0.3)', marginTop: '1rem' }}>
            <strong style={{ color: 'var(--spatial-teal)', fontSize: '1.05rem' }}>Discount Approved by Manager</strong>
            <div style={{ marginTop: '1.25rem' }}>
              <button
                type="button"
                style={{ padding: '0.6rem 1.5rem', borderRadius: '6px', background: '#0d9488', color: '#ffffff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                onClick={handleApply}
              >
                Apply Approval and Continue
              </button>
            </div>
          </div>
        )}

        {status === 'REJECTED' && (
          <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(225,29,72,0.08)', borderRadius: '8px', border: '1px solid rgba(225,29,72,0.3)', marginTop: '1rem' }}>
            <strong style={{ color: 'var(--spatial-rose)', fontSize: '1rem' }}>Discount Request Rejected</strong>
            <p style={{ fontSize: '0.82rem', color: 'var(--spatial-text-muted)', margin: '0.35rem 0 1rem' }}>
              The manager has declined this discount rate. Please reset discount or adjust percentage.
            </p>
            <button
              type="button"
              style={{ padding: '0.5rem 1.2rem', borderRadius: '6px', background: '#ffffff', border: '1px solid #cbd5e1', cursor: 'pointer' }}
              onClick={onClose}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
