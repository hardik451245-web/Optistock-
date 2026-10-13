import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { register } from '../api'
import { dashboardPath, getToken, getUser } from '../auth'

export default function RegisterPage() {
  const navigate = useNavigate()
  const existing = getToken() && getUser()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('CASHIER')
  const [managerCode, setManagerCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [fieldErrors, setFieldErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  if (existing) {
    return <Navigate to={dashboardPath(getUser().role)} replace />
  }

  function validate() {
    const errors = {}
    if (!name.trim()) {
      errors.name = 'Name is required'
    }
    if (!email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$/.test(email.trim())) {
      errors.email = 'Enter a valid email address'
    }
    if (!password) {
      errors.password = 'Password is required'
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    } else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      errors.password = 'Password must contain at least one letter and one number'
    }
    if (confirmPassword !== password) {
      errors.confirmPassword = 'Passwords do not match'
    }
    if (role === 'MANAGER' && !managerCode.trim()) {
      errors.managerCode = 'Manager access code is required'
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setServerError('')
    if (!validate()) {
      return
    }

    setLoading(true)
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        managerCode: role === 'MANAGER' ? managerCode.trim() : null,
      })
      navigate('/', {
        replace: true,
        state: { message: 'Account created. Sign in with your new details.' },
      })
    } catch (err) {
      setServerError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page page-center" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#f1f5f9', padding: '2rem 1rem' }}>
      <div className="card" style={{ width: 'min(460px, 94vw)', background: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)', padding: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>Create Account</h1>
        <p className="muted" style={{ fontSize: '0.88rem', marginBottom: '1.25rem', color: '#64748b' }}>
          Enter your information to register for OptiStock
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="name" style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: null })
              }}
              style={{ width: '100%', padding: '0.6rem 0.75rem', border: fieldErrors.name ? '1px solid #ef4444' : '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.95rem' }}
            />
            {fieldErrors.name ? <div style={{ color: '#b91c1c', fontSize: '0.8rem', marginTop: '0.25rem' }}>{fieldErrors.name}</div> : null}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="email" style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: null })
              }}
              style={{ width: '100%', padding: '0.6rem 0.75rem', border: fieldErrors.email ? '1px solid #ef4444' : '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.95rem' }}
            />
            {fieldErrors.email ? <div style={{ color: '#b91c1c', fontSize: '0.8rem', marginTop: '0.25rem' }}>{fieldErrors.email}</div> : null}
          </div>

          <div style={{ marginBottom: '1rem' }}>
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
              onChange={(e) => {
                setPassword(e.target.value)
                if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: null })
              }}
              style={{ width: '100%', padding: '0.6rem 0.75rem', border: fieldErrors.password ? '1px solid #ef4444' : '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.95rem' }}
            />
            {fieldErrors.password ? <div style={{ color: '#b91c1c', fontSize: '0.8rem', marginTop: '0.25rem' }}>{fieldErrors.password}</div> : null}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="confirmPassword" style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                if (fieldErrors.confirmPassword) setFieldErrors({ ...fieldErrors, confirmPassword: null })
              }}
              style={{ width: '100%', padding: '0.6rem 0.75rem', border: fieldErrors.confirmPassword ? '1px solid #ef4444' : '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.95rem' }}
            />
            {fieldErrors.confirmPassword ? <div style={{ color: '#b91c1c', fontSize: '0.8rem', marginTop: '0.25rem' }}>{fieldErrors.confirmPassword}</div> : null}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="role" style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => {
                setRole(e.target.value)
                if (fieldErrors.managerCode) setFieldErrors({ ...fieldErrors, managerCode: null })
              }}
              style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.95rem', background: '#ffffff', color: '#0f172a' }}
            >
              <option value="CASHIER">Cashier</option>
              <option value="MANAGER">Manager</option>
            </select>
          </div>

          {role === 'MANAGER' && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="managerCode" style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Manager Access Code
              </label>
              <input
                id="managerCode"
                type="password"
                placeholder="Required for manager registration"
                value={managerCode}
                onChange={(e) => {
                  setManagerCode(e.target.value)
                  if (fieldErrors.managerCode) setFieldErrors({ ...fieldErrors, managerCode: null })
                }}
                style={{ width: '100%', padding: '0.6rem 0.75rem', border: fieldErrors.managerCode ? '1px solid #ef4444' : '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.95rem' }}
              />
              {fieldErrors.managerCode ? <div style={{ color: '#b91c1c', fontSize: '0.8rem', marginTop: '0.25rem' }}>{fieldErrors.managerCode}</div> : null}
            </div>
          )}

          {serverError ? (
            <div className="alert" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.88rem' }}>
              {serverError}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '0.7rem', background: '#0d9488', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.88rem', color: '#64748b' }}>
          Already have an account?{' '}
          <Link to="/" style={{ color: '#0d9488', fontWeight: 600, textDecoration: 'none' }}>
            Sign in
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
