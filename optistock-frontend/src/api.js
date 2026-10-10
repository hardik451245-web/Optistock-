import { clearAuth, getToken } from './auth'

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  const token = getToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(path, { ...options, headers })

  if (response.status === 401 || response.status === 403) {
    clearAuth()
    window.location.href = '/'
    const text = await response.text()
    let msg = `Request failed (${response.status})`
    try {
      const data = JSON.parse(text)
      msg = data?.error || msg
    } catch {
      // ignore
    }
    throw new Error(msg)
  }

  if (response.status === 204) {
    return null
  }

  const text = await response.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { error: text }
    }
  }

  if (!response.ok) {
    const message = data?.error || data?.message || `Request failed (${response.status})`
    throw new Error(message)
  }
  return data
}

export function login(email, password) {
  return request('/api/users/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function listProducts() {
  return request('/api/products')
}

export function addProduct(product) {
  return request('/api/products', {
    method: 'POST',
    body: JSON.stringify(product),
  })
}

export function updateProduct(id, product) {
  return request(`/api/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(product),
  })
}

export function deleteProduct(id) {
  return request(`/api/products/${id}`, {
    method: 'DELETE',
  })
}

export function createBill(items) {
  return request('/api/bills', {
    method: 'POST',
    body: JSON.stringify({ items }),
  })
}
