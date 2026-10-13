const TOKEN_KEY = 'optistock_token'
const USER_KEY = 'optistock_user'

export function saveAuth(loginResponse) {
  localStorage.setItem(TOKEN_KEY, loginResponse.token)
  localStorage.setItem(
    USER_KEY,
    JSON.stringify({
      userId: loginResponse.userId,
      name: loginResponse.name,
      email: loginResponse.email,
      role: loginResponse.role,
    }),
  )
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getUser() {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) {
    return null
  }
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function dashboardPath(role) {
  return String(role || '').toUpperCase() === 'MANAGER' ? '/manager' : '/cashier'
}
