export default function Topbar({ user, onLogout, activeTabTitle }) {
  return (
    <header className="glass-panel glass-topbar">
      <div className="topbar-info">
        <h1>{activeTabTitle}</h1>
        <p>Retail Inventory and Billing Management</p>
      </div>
      <div className="topbar-actions">
        <div className="user-badge">
          <span className="user-dot" title="Connected" />
          <span>{user?.name || 'Manager'}</span>
          <span style={{ color: 'var(--color-teal)', fontWeight: 600 }}>({user?.role})</span>
        </div>
        <button
          type="button"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.45rem 0.85rem',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
          onClick={onLogout}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Log out
        </button>
      </div>
    </header>
  )
}
