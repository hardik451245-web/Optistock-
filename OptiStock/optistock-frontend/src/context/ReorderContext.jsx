import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { listSuppliers, listProducts } from '../api'

const ReorderContext = createContext(null)

export function ReorderProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  const [modalOptions, setModalOptions] = useState(null)
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [reorderVersion, setReorderVersion] = useState(0)

  const loadSuppliers = useCallback(async () => {
    try {
      const data = await listSuppliers()
      setSuppliers(data || [])
    } catch {
      // ignore
    }
  }, [])

  const loadProducts = useCallback(async () => {
    try {
      const data = await listProducts()
      setProducts(data || [])
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    loadSuppliers()
    loadProducts()
  }, [loadSuppliers, loadProducts, reorderVersion])

  const openReorder = useCallback((options = {}) => {
    setModalOptions(options)
    setIsOpen(true)
  }, [])

  const closeReorder = useCallback(() => {
    setIsOpen(false)
    setModalOptions(null)
  }, [])

  const notifyOrderCreated = useCallback(() => {
    setReorderVersion((v) => v + 1)
  }, [])

  return (
    <ReorderContext.Provider
      value={{
        isOpen,
        modalOptions,
        openReorder,
        closeReorder,
        suppliers,
        products,
        loadSuppliers,
        reorderVersion,
        notifyOrderCreated,
      }}
    >
      {children}
    </ReorderContext.Provider>
  )
}

export function useReorder() {
  const ctx = useContext(ReorderContext)
  if (!ctx) {
    throw new Error('useReorder must be used within a ReorderProvider')
  }
  return ctx
}
