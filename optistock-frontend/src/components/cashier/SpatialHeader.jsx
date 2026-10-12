import { ShoppingCart } from 'lucide-react'

export default function SpatialHeader({ user, onLogout }) {
  return (
    <header className="spatial-header">
      <div className="spatial-header-title">
        <ShoppingCart size={20} color="#0d9488" />
        <span style={{ fontWeight: 700 }}>OptiStock POS</span>
        <span className="spatial-badge-role">CASHIER</span>
      </div>

      <div className="spatial-header-actions">
        <div className="spatial-shortcut-hint">
          <span className="spatial-key">/</span> Focus Search
        </div>
        <div className="spatial-shortcut-hint">
          <span className="spatial-key">Enter</span> Add Match
        </div>
        <div className="spatial-shortcut-hint">
          <span className="spatial-key">Ctrl+Enter</span> Instant Pay
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginLeft: '0.5rem' }}>
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user?.name || 'Cashier'}</span>
          <button
            type="button"
            onClick={onLogout}
            style={{
              background: 'rgba(0, 0, 0, 0.06)',
              border: '1px solid rgba(0, 0, 0, 0.12)',
              borderRadius: '6px',
              padding: '0.4rem 0.9rem',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.82rem',
              color: 'var(--spatial-text-main)',
            }}
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  )
}
