import { useState, useCallback } from 'react'

export default function useCashierCart(setFlyingGhost) {
  const [cart, setCart] = useState([])

  const addToCart = useCallback((product, event) => {
    if (product.expiryStatus === 'EXPIRED') return
    if ((product.stockQuantity ?? 0) <= 0) return

    if (event?.clientX && setFlyingGhost) {
      setFlyingGhost({ x: event.clientX, y: event.clientY, name: product.name })
      setTimeout(() => setFlyingGhost(null), 450)
    }

    setCart((current) => {
      const existing = current.find((i) => i.productId === product.id)
      if (existing) {
        return current.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: Math.min(i.quantity + 1, product.stockQuantity ?? 999) }
            : i
        )
      }
      return [
        ...current,
        {
          productId: product.id,
          name: product.name,
          brand: product.brand,
          category: product.category,
          sellingPrice: product.sellingPrice,
          effectivePrice: product.effectivePrice || product.sellingPrice,
          stockQuantity: product.stockQuantity,
          quantity: 1,
          manualDiscountPercent: null,
          approvedRequestId: null,
        },
      ]
    })
  }, [setFlyingGhost])

  const handleQuantity = useCallback((productId, nextQty) => {
    setCart((c) =>
      nextQty <= 0
        ? c.filter((i) => i.productId !== productId)
        : c.map((i) => (i.productId === productId ? { ...i, quantity: nextQty } : i))
    )
  }, [])

  const handleRemoveItem = useCallback((id) => {
    setCart((c) => c.filter((i) => i.productId !== id))
  }, [])

  const handleManualDiscount = useCallback((productId, percent) => {
    setCart((c) =>
      c.map((i) => (i.productId === productId ? { ...i, manualDiscountPercent: percent, approvedRequestId: null } : i))
    )
  }, [])

  const applyDiscountApproval = useCallback((prodId, reqId) => {
    setCart((c) => c.map((i) => (i.productId === prodId ? { ...i, approvedRequestId: reqId } : i)))
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
  }, [])

  return {
    cart,
    addToCart,
    handleQuantity,
    handleRemoveItem,
    handleManualDiscount,
    applyDiscountApproval,
    clearCart,
  }
}
