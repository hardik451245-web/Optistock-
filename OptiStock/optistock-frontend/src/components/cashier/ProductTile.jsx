export default function ProductTile({ product, onAdd, onOutOfStock }) {
  const isExpired = product.expiryStatus === 'EXPIRED'
  const isOutOfStock = (product.stockQuantity ?? 0) <= 0
  const isMarkdown = product.discountPercent != null && Number(product.discountPercent) > 0

  function handleClick(e) {
    if (e && e.stopPropagation) {
      e.stopPropagation()
    }
    if (isExpired) return
    if (isOutOfStock) {
      onOutOfStock(product)
      return
    }
    onAdd(product, e)
  }

  const stockClass = isOutOfStock
    ? 'stock-chip-red'
    : (product.stockQuantity || 0) <= (product.reorderThreshold || 0)
    ? 'stock-chip-amber'
    : 'stock-chip-green'

  return (
    <div
      className={`product-tile-3d ${isExpired ? 'dimmed' : ''}`}
      onClick={handleClick}
    >
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--spatial-text-muted)' }}>
            {product.category}
          </span>
          <span className={`stock-chip ${stockClass}`}>
            {isOutOfStock ? '0 in stock' : `${product.stockQuantity} in stock`}
          </span>
        </div>

        <h3 style={{ margin: '0.4rem 0 0.15rem', fontSize: '0.98rem', fontWeight: 700, color: 'var(--spatial-text-bright)' }}>
          {product.name}
        </h3>
        {product.brand ? (
          <div style={{ fontSize: '0.8rem', color: 'var(--spatial-text-muted)' }}>{product.brand}</div>
        ) : null}

        {isMarkdown ? (
          <div className="markdown-glow-badge">
            {Number(product.discountPercent)}% OFF
            {product.daysLeft != null ? ` (${product.daysLeft}d left)` : ''}
          </div>
        ) : null}
      </div>

      <div style={{ marginTop: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          {isMarkdown ? (
            <div>
              <span style={{ textDecoration: 'line-through', color: 'var(--spatial-text-muted)', fontSize: '0.82rem', marginRight: 4 }}>
                ₹{product.sellingPrice}
              </span>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--spatial-teal)' }}>
                ₹{product.effectivePrice}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--spatial-text-bright)' }}>
              ₹{product.sellingPrice}
            </div>
          )}
        </div>

        <div>
          {isExpired ? (
            <span className="stock-chip stock-chip-red">Expired</span>
          ) : isOutOfStock ? (
            <span style={{ fontSize: '0.78rem', color: 'var(--spatial-teal)', fontWeight: 600, textDecoration: 'underline' }}>
              Find Alts
            </span>
          ) : (
            <button
              type="button"
              style={{
                width: 32,
                height: 32,
                borderRadius: '6px',
                background: 'var(--spatial-text-bright)',
                color: '#fff',
                border: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
                cursor: 'pointer',
              }}
              title="Add to Bill"
              onClick={handleClick}
            >
              +
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
