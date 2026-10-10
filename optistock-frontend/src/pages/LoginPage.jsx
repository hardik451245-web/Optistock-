import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { login } from '../api'
import { dashboardPath, getToken, getUser, saveAuth } from '../auth'

export default function LoginPage() {
  const navigate = useNavigate()
  const existing = getToken() && getUser()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (existing) {
    return <Navigate to={dashboardPath(getUser().role)} replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await login(email, password)
      saveAuth(result)
      navigate(dashboardPath(result.role), { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page page-center">
      <form className="card login-card" onSubmit={handleSubmit}>
        <h1>OptiStock</h1>
        <p className="muted">Sign in with your email and password</p>
        {error ? <div className="alert">{error}</div> : null}
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
