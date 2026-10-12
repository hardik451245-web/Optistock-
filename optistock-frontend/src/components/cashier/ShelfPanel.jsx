import { useEffect, useRef } from 'react'
import { Package, Search } from 'lucide-react'
import ProductTile from './ProductTile'

export default function ShelfPanel({
  products,
  query,
  setQuery,
  selectedCategory,
  setSelectedCategory,
  onAddProduct,
  onOutOfStockProduct,
}) {
  const searchInputRef = useRef(null)

  useEffect(() => {
    console.log('[MOUNT] Search Component (ShelfPanel) mounted')
  }, [])

  useEffect(() => {
    searchInputRef.current?.focus()

    function handleKeyDown(e) {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const categories = ['ALL', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))]

  const filtered = products.filter((p) => {
    const q = query.trim().toLowerCase()
    const matchesSearch =
      !q ||
      (p.name || '').toLowerCase().includes(q) ||
      (p.brand || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q)
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <section className="spatial-panel panel-shelf">
      <div className="panel-header">
        <div className="panel-title-row">
          <h2 className="panel-title">
            <Package size={18} color="#0d9488" /> Shelf Browser
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--spatial-text-muted)' }}>
            {filtered.length} products
          </span>
        </div>

        <div className="spatial-search-box">
          <span className="spatial-search-icon">
            <Search size={14} />
          </span>
          <input
            ref={searchInputRef}
            type="text"
            className="spatial-search-input"
            placeholder="Search items or press '/'..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="spatial-chips-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`spatial-chip ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="panel-body">
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--spatial-text-muted)' }}>
            No matching items found on the shelf.
          </div>
        ) : (
          <div className="shelf-grid">
            {filtered.map((prod) => (
              <ProductTile
                key={prod.id}
                product={prod}
                onAdd={onAddProduct}
                onOutOfStock={onOutOfStockProduct}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
