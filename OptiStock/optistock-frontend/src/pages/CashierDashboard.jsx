import { useEffect, useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearAuth, getUser } from '../auth'
import { listProducts, getAlternatives, createBill } from '../api'
import '../styles/spatial.css'

import SpatialHeader from '../components/cashier/SpatialHeader'
import ShelfPanel from '../components/cashier/ShelfPanel'
import BillPanel from '../components/cashier/BillPanel'
import HelperPanel from '../components/cashier/HelperPanel'
import CashierModals from '../components/cashier/CashierModals'
import ErrorBoundary from '../components/cashier/ErrorBoundary'
import useCashierCart from '../components/cashier/useCashierCart'

export default function CashierDashboard() {
  useEffect(() => {
    console.log('[MOUNT] CashierDashboard mounted')
  }, [])

  const navigate = useNavigate()
  const user = getUser()

  const [products, setProducts] = useState([])
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)

  const [selectedOutOfStock, setSelectedOutOfStock] = useState(null)
  const [alternatives, setAlternatives] = useState([])
  const [loadingAlts, setLoadingAlts] = useState(false)
  const [markdownAlerts, setMarkdownAlerts] = useState([])

  const [approvalModal, setApprovalModal] = useState(null)
  const [activeReceipt, setActiveReceipt] = useState(null)
  const [flyingGhost, setFlyingGhost] = useState(null)

  const {
    cart,
    addToCart,
    handleQuantity,
    handleRemoveItem,
    handleManualDiscount,
    applyDiscountApproval,
    clearCart,
  } = useCashierCart(setFlyingGhost)

  const showToast = useCallback((message, type = 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }, [])

  const loadProducts = useCallback(async () => {
    try {
      const prods = await listProducts()
      const list = Array.isArray(prods) ? prods : []
      setProducts(list)
      const markdowns = list.filter(
        (p) => (p.discountPercent != null && Number(p.discountPercent) > 0) || p.expiryStatus === 'MARKDOWN' || p.expiryStatus === 'LAST_DAY'
      )
      setMarkdownAlerts(markdowns)
    } catch (err) {
      showToast(err.message || 'Could not load products', 'error')
    }
  }, [showToast])

  useEffect(() => {
    let mounted = true
    async function init() {
      try {
        const prods = await listProducts()
        if (mounted) {
          const list = Array.isArray(prods) ? prods : []
          setProducts(list)
          const markdowns = list.filter(
            (p) => (p.discountPercent != null && Number(p.discountPercent) > 0) || p.expiryStatus === 'MARKDOWN' || p.expiryStatus === 'LAST_DAY'
          )
          setMarkdownAlerts(markdowns)
        }
      } catch (err) {
        if (mounted) showToast(err.message || 'Could not load products', 'error')
      }
    }
    init()

    const interval = setInterval(() => {
      loadProducts()
    }, 30000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [loadProducts, showToast])

  const productMap = useMemo(() => {
    return products.reduce((acc, p) => {
      acc[p.id] = p
      return acc
    }, {})
  }, [products])

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((p) => {
      const matchQ = !q || p.name?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q)
      const matchC = selectedCategory === 'ALL' || p.category === selectedCategory
      return matchQ && matchC
    })
  }, [products, query, selectedCategory])

  const handlePay = useCallback(async () => {
    if (cart.length === 0) {
      showToast('Cart is empty. Add products before billing.', 'error')
      return
    }
    setSubmitting(true)
    const items = cart.map((i) => ({
      productId: i.productId,
      quantity: Number(i.quantity),
      manualDiscountPercent: i.manualDiscountPercent != null && i.manualDiscountPercent !== '' ? Number(i.manualDiscountPercent) : null,
      approvedRequestId: i.approvedRequestId || null,
    }))

    try {
      const receipt = await createBill(items)
      setActiveReceipt(receipt)
      clearCart()
      showToast(`Bill #${receipt.id} processed successfully!`, 'success')
      await loadProducts()
    } catch (err) {
      showToast(err.message, 'error')
      if (err.status === 409 || err.code === 'PROFIT_WARNING') {
        const warningLine = cart.find((i) => i.manualDiscountPercent != null && Number(i.manualDiscountPercent) > 0 && !i.approvedRequestId) || cart[0]
        if (warningLine) {
          setApprovalModal({ product: warningLine, requestedPercent: warningLine.manualDiscountPercent || 15 })
        }
      }
    } finally {
      setSubmitting(false)
    }
  }, [cart, clearCart, loadProducts, showToast])

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault()
        handlePay()
      } else if (e.key === 'Enter' && !e.ctrlKey && document.activeElement?.tagName === 'INPUT') {
        if (filteredProducts.length > 0 && (filteredProducts[0].stockQuantity ?? 0) > 0) {
          e.preventDefault()
          addToCart(filteredProducts[0])
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [filteredProducts, addToCart, handlePay])

  async function handleOutOfStock(product) {
    setSelectedOutOfStock(product)
    setLoadingAlts(true)
    try {
      const alts = await getAlternatives(product.id)
      setAlternatives(Array.isArray(alts) ? alts : [])
    } catch (err) {
      showToast(err.message || 'Could not fetch alternatives', 'error')
    } finally {
      setLoadingAlts(false)
    }
  }

  return (
    <div className="spatial-viewport">
      <div className="spatial-floor-reflection" />
      <SpatialHeader user={user} onLogout={() => { clearAuth(); navigate('/', { replace: true }) }} />

      <main className="spatial-stage">
        <ErrorBoundary onRetry={loadProducts}>
          <ShelfPanel
            products={products}
            query={query}
            setQuery={setQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            onAddProduct={addToCart}
            onOutOfStockProduct={handleOutOfStock}
          />
        </ErrorBoundary>

        <ErrorBoundary onRetry={loadProducts}>
          <BillPanel
            cart={cart}
            onUpdateQuantity={handleQuantity}
            onRemoveItem={handleRemoveItem}
            onUpdateManualDiscount={handleManualDiscount}
            onPay={handlePay}
            submitting={submitting}
          />
        </ErrorBoundary>

        <ErrorBoundary onRetry={loadProducts}>
          <HelperPanel
            selectedOutOfStockProduct={selectedOutOfStock}
            alternatives={alternatives}
            loadingAlternatives={loadingAlts}
            onClearSelectedOutOfStock={() => setSelectedOutOfStock(null)}
            onAddAlternative={(alt) => addToCart(alt)}
            markdownAlerts={markdownAlerts}
          />
        </ErrorBoundary>
      </main>

      <CashierModals
        flyingGhost={flyingGhost}
        approvalModal={approvalModal}
        onApprovedDiscount={(prodId, reqId) => {
          applyDiscountApproval(prodId, reqId)
          showToast('Discount approval applied. You may now complete the bill.', 'success')
        }}
        onCloseApprovalModal={() => setApprovalModal(null)}
        activeReceipt={activeReceipt}
        productMap={productMap}
        onNewBill={() => setActiveReceipt(null)}
        toast={toast}
        onCloseToast={() => setToast(null)}
      />
    </div>
  )
}
