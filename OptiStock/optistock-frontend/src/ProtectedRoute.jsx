import { Navigate } from 'react-router-dom'
import { getToken, getUser } from './auth'

export default function ProtectedRoute({ role, children }) {
  const token = getToken()
  const user = getUser()

  if (!token || !user) {
    return <Navigate to="/" replace />
  }

  if (role && String(user.role || '').toUpperCase() !== String(role).toUpperCase()) {
    return <Navigate to={String(user.role || '').toUpperCase() === 'MANAGER' ? '/manager' : '/cashier'} replace />
  }

  return children
}
