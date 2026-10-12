import { clearAuth, getToken } from './auth'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  const token = getToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const url = `${BASE_URL}${path}`
  const response = await fetch(url, { ...options, headers })

  const isAuthEndpoint = path.startsWith('/api/users/login') || path.startsWith('/api/users/register')

  if (response.status === 401 && !isAuthEndpoint) {
    clearAuth()
    window.location.href = '/'
    const text = await response.text()
    let msg = 'Please log in'
    try {
      const data = JSON.parse(text)
      msg = data?.error || msg
    } catch {
      // ignore
    }
    const err = new Error(msg)
    err.status = 401
    throw err
  }

  if (response.status === 403) {
    const text = await response.text()
    let msg = 'You do not have permission for this action'
    try {
      const data = JSON.parse(text)
      if (data?.error && data.error !== 'Access denied') {
        msg = data.error
      }
    } catch {
      // ignore
    }
    const err = new Error(msg)
    err.status = 403
    throw err
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
    const err = new Error(message)
    err.status = response.status
    err.code = data?.code
    err.data = data
    throw err
  }
  return data
}

export function login(email, password) {
  return request('/api/users/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function register(userData) {
  return request('/api/users/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  })
}

export function listProducts() {
  return request('/api/products')
}

export function getProduct(id) {
  return request(`/api/products/${id}`)
}

export function getAlternatives(id) {
  return request(`/api/products/${id}/alternatives`)
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

export function createDiscountRequest(productId, requestedPercent) {
  return request('/api/discount-requests', {
    method: 'POST',
    body: JSON.stringify({ productId, requestedPercent }),
  })
}

export function getDiscountRequest(id) {
  return request(`/api/discount-requests/${id}`)
}

export function getForecast() {
  return request('/api/manager/forecast')
}

export function getReorder() {
  return request('/api/manager/reorder')
}

export function getAlerts() {
  return request('/api/manager/alerts')
}

export function getSummary(from, to) {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const qs = params.toString()
  return request(`/api/manager/summary${qs ? `?${qs}` : ''}`)
}

export function getRanking(days = 30) {
  return request(`/api/manager/ranking?days=${days}`)
}

export function getProductMix(days = 30) {
  return request(`/api/manager/product-mix?days=${days}`)
}

export function getPendingDiscountRequests() {
  return request('/api/discount-requests/pending')
}

export function approveDiscountRequest(id) {
  return request(`/api/discount-requests/${id}/approve`, {
    method: 'PUT',
  })
}

export function rejectDiscountRequest(id) {
  return request(`/api/discount-requests/${id}/reject`, {
    method: 'PUT',
  })
}

export function getBills(date) {
  return request(`/api/bills${date ? `?date=${date}` : ''}`)
}

export function cancelBill(id) {
  return request(`/api/bills/${id}/cancel`, {
    method: 'PUT',
  })
}

export function listPurchaseOrders(status) {
  const qs = status ? `?status=${status}` : ''
  return request(`/api/purchase-orders${qs}`)
}

export function createPurchaseOrder(data) {
  return request('/api/purchase-orders', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function createBulkPurchaseOrders(items) {
  return request('/api/purchase-orders/bulk', {
    method: 'POST',
    body: JSON.stringify(items),
  })
}

export function receivePurchaseOrder(id, data = {}) {
  return request(`/api/purchase-orders/${id}/receive`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function cancelPurchaseOrder(id) {
  return request(`/api/purchase-orders/${id}/cancel`, {
    method: 'PUT',
  })
}

export function adjustStock(data) {
  return request('/api/stock/adjust', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function writeoffStock(data) {
  return request('/api/stock/writeoff', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function listStockMovements(params = {}) {
  const q = new URLSearchParams()
  if (params.productId) q.set('productId', params.productId)
  if (params.type) q.set('type', params.type)
  if (params.from) q.set('from', params.from)
  if (params.to) q.set('to', params.to)
  const qs = q.toString()
  return request(`/api/stock/movements${qs ? `?${qs}` : ''}`)
}
