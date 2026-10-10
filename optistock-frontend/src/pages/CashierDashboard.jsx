import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createBill, listProducts } from '../api'
import { clearAuth, getUser } from '../auth'

export default function CashierDashboard() {
  const navigate = useNavigate()
  const user = getUser()
  const [products, setProducts] = useState([])
  const [query, setQuery] = useState('')
  const [cart, setCart] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await listProducts()
        setProducts(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(err.message || 'Could not load products')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      return products
    }
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q),
    )
  }, [products, query])

  function addToCart(product) {
    setSuccess('')
    setError('')
    setCart((current) => {
      const existing = current.find((item) => item.productId === product.id)
      if (existing) {
        return current.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, product.stockQuantity ?? item.quantity + 1) }
            : item,
        )
      }
      return [
        ...current,
        {
          productId: product.id,
          name: product.name,
          price: product.sellingPrice,
          stockQuantity: product.stockQuantity,
          quantity: 1,
        },
      ]
    })
  }

  function setQuantity(productId, quantity) {
    const parsed = Number(quantity)
    setCart((current) =>
      current.map((item) => {
        if (item.productId !== productId) {
          return item
        }
        const max = item.stockQuantity ?? parsed
        const next = Number.isNaN(parsed) ? 0 : Math.max(0, Math.min(parsed, max))
        return { ...item, quantity: next }
      }),
    )
  }

  function removeFromCart(productId) {
    setCart((current) => current.filter((item) => item.productId !== productId))
  }

  const cartTotal = cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0)

  async function submitBill() {
    setError('')
    setSuccess('')
    const items = cart
      .filter((item) => item.quantity > 0)
      .map((item) => ({ productId: item.productId, quantity: Number(item.quantity) }))
    if (items.length === 0) {
      setError('Add at least one product with a quantity greater than 0')
      return
    }
    setSubmitting(true)
    try {
      const bill = await createBill(items)
      setCart([])
      setSuccess(`Bill #${bill.id} saved. Total: ${bill.totalAmount}`)
      const data = await listProducts()
      setProducts(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Could not submit bill')
    } finally {
      setSubmitting(false)
    }
  }

  function logout() {
    clearAuth()
    navigate('/', { replace: true })
  }

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <h1>Cashier Billing</h1>
          <p className="muted">{user?.name} · {user?.role}</p>
        </div>
        <button type="button" className="secondary" onClick={logout}>
          Log out
        </button>
      </header>

      {error ? <div className="alert">{error}</div> : null}
      {success ? <div className="alert success">{success}</div> : null}

      <div className="split">
        <section className="card">
          <h2>Search products</h2>
          <input
            placeholder="Search by name or category"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {loading ? (
            <p className="muted">Loading products…</p>
          ) : (
            <ul className="product-list">
              {filtered.length === 0 ? (
                <li className="muted">No matching products</li>
              ) : (
                filtered.map((product) => (
                  <li key={product.id}>
                    <div>
                      <strong>{product.name}</strong>
                      <div className="muted">
                        {product.category} · ₹{product.sellingPrice} · stock {product.stockQuantity}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={!product.stockQuantity}
                      onClick={() => addToCart(product)}
                    >
                      Add
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </section>

        <section className="card">
          <h2>Cart</h2>
          {cart.length === 0 ? (
            <p className="muted">No items in the cart</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item) => (
                    <tr key={item.productId}>
                      <td>{item.name}</td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          max={item.stockQuantity}
                          value={item.quantity}
                          onChange={(e) => setQuantity(item.productId, e.target.value)}
                        />
                      </td>
                      <td>{(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}</td>
                      <td>
                        <button type="button" className="secondary" onClick={() => removeFromCart(item.productId)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="cart-footer">
            <strong>Total: {cartTotal.toFixed(2)}</strong>
            <button type="button" onClick={submitBill} disabled={submitting || cart.length === 0}>
              {submitting ? 'Submitting…' : 'Submit bill'}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
