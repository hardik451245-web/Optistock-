import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addProduct, listProducts } from '../api'
import { clearAuth, getUser } from '../auth'

const emptyForm = {
  name: '',
  category: '',
  costPrice: '',
  sellingPrice: '',
  stockQuantity: '',
}

export default function ManagerDashboard() {
  const navigate = useNavigate()
  const user = getUser()
  const [products, setProducts] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function refreshProducts() {
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

  useEffect(() => {
    refreshProducts()
  }, [])

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)
    try {
      await addProduct({
        name: form.name,
        category: form.category,
        costPrice: Number(form.costPrice),
        sellingPrice: Number(form.sellingPrice),
        stockQuantity: Number(form.stockQuantity),
      })
      setForm(emptyForm)
      setSuccess('Product added')
      await refreshProducts()
    } catch (err) {
      setError(err.message || 'Could not add product')
    } finally {
      setSaving(false)
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
          <h1>Manager Dashboard</h1>
          <p className="muted">{user?.name} · {user?.role}</p>
        </div>
        <button type="button" className="secondary" onClick={logout}>
          Log out
        </button>
      </header>

      {error ? <div className="alert">{error}</div> : null}
      {success ? <div className="alert success">{success}</div> : null}

      <section className="card">
        <h2>Add product</h2>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Name
            <input value={form.name} onChange={(e) => updateField('name', e.target.value)} required />
          </label>
          <label>
            Category
            <input value={form.category} onChange={(e) => updateField('category', e.target.value)} required />
          </label>
          <label>
            Cost price
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.costPrice}
              onChange={(e) => updateField('costPrice', e.target.value)}
              required
            />
          </label>
          <label>
            Selling price
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.sellingPrice}
              onChange={(e) => updateField('sellingPrice', e.target.value)}
              required
            />
          </label>
          <label>
            Stock quantity
            <input
              type="number"
              min="0"
              step="1"
              value={form.stockQuantity}
              onChange={(e) => updateField('stockQuantity', e.target.value)}
              required
            />
          </label>
          <div className="form-actions">
            <button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Add product'}
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <h2>All products</h2>
        {loading ? (
          <p className="muted">Loading products…</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Cost</th>
                  <th>Selling</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="muted">
                      No products yet
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>{product.category}</td>
                      <td>{product.costPrice}</td>
                      <td>{product.sellingPrice}</td>
                      <td>{product.stockQuantity}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
