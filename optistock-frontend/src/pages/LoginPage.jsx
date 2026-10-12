import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { login } from '../api'
import { dashboardPath, getToken, getUser, saveAuth } from '../auth'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const existing = getToken() && getUser()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const successMessage = location.state?.message || ''

  if (existing) {
    return <Navigate to={dashboardPath(getUser().role)} replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await login(email.trim(), password)
      saveAuth(result)
      navigate(dashboardPath(result.role), { replace: true })
    } catch (err) {
      setError(err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page page-center" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#f1f5f9' }}>
      <div className="card login-card" style={{ width: 'min(420px, 94vw)', background: '#ffffff', borderRadius: '16px', border: '1px solid #cbd5e1', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)', padding: '2.25rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <img src="/static/images/optistock-logo-full.svg" alt="OptiStock AI" style={{ height: '42px' }} />
        </div>
        <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem', textAlign: 'center' }}>Sign in</h1>

        {successMessage ? (
          <div className="alert success" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.88rem' }}>
            {successMessage}
          </div>
        ) : null}

        {error ? (
          <div className="alert" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.88rem' }}>
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="email" style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.95rem', background: '#ffffff', color: '#0f172a' }}
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label htmlFor="password" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#334155', margin: 0 }}>
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: 'none', border: 'none', color: '#0d9488', fontSize: '0.82rem', padding: 0, cursor: 'pointer', fontWeight: 500 }}
              >
                {showPassword ? 'Hide password' : 'Show password'}
              </button>
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.95rem', background: '#ffffff', color: '#0f172a' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '0.7rem', background: '#0d9488', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.88rem', color: '#64748b' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#0d9488', fontWeight: 600, textDecoration: 'none' }}>
            Create account
          </Link>
        </div>

        <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '1.5rem', paddingTop: '1rem', display: 'flex', justifyContent: 'center', gap: '1.5rem', fontSize: '0.8rem' }}>
          <Link to="/privacy" style={{ color: '#64748b', textDecoration: 'none' }}>
            Privacy Policy
          </Link>
          <Link to="/terms" style={{ color: '#64748b', textDecoration: 'none' }}>
            Terms
          </Link>
        </div>
      </div>
    </div>
  )
}
