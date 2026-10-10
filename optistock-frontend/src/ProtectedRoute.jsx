import { Navigate } from 'react-router-dom'
import { getToken, getUser } from './auth'

export default function ProtectedRoute({ role, children }) {
  const token = getToken()
  const user = getUser()

  if (!token || !user) {
    return <Navigate to="/" replace />
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === 'MANAGER' ? '/manager' : '/cashier'} replace />
  }

  return children
}
