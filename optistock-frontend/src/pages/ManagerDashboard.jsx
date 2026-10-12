import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearAuth, getUser, getToken } from '../auth'
import { listProducts, getPendingDiscountRequests } from '../api'
import '../styles/executive-dashboard.css'

import Sidebar from '../components/manager/Sidebar'
import ExecutiveDashboardView from '../components/manager/ExecutiveDashboardView'
import ProductsTab from '../components/manager/ProductsTab'
import StockTab from '../components/manager/StockTab'
import AlertsTab from '../components/manager/AlertsTab'
import ParetoMixSection from '../components/manager/ParetoMixSection'
import DiscountedProductsSection from '../components/manager/DiscountedProductsSection'
import ReordersSection from '../components/manager/ReordersSection'
import SalesTab from '../components/manager/SalesTab'
import { ArrowLeft, LogOut, User, ShieldCheck } from 'lucide-react'

export default function ManagerDashboard() {
  const navigate = useNavigate()
  const user = getUser()
  const token = getToken()
  const [activeTab, setActiveTab] = useState('overview')
  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [productsError, setProductsError] = useState('')
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0)
  const [targetStockProductId, setTargetStockProductId] = useState(null)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [pendingReorderSuggestion, setPendingReorderSuggestion] = useState(null)

  const refreshProducts = useCallback(async () => {
    setLoadingProducts(true)
    setProductsError('')
    try {
      const data = await listProducts()
      setProducts(Array.isArray(data) ? data : [])
    } catch (err) {
      setProductsError(err.message || 'Could not load products')
    } finally {
      setLoadingProducts(false)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    async function init() {
      try {
        const [prods, pending] = await Promise.all([
          listProducts(),
          getPendingDiscountRequests().catch(() => []),
        ])
        if (mounted) {
          setProducts(Array.isArray(prods) ? prods : [])
          setPendingApprovalsCount(Array.isArray(pending) ? pending.length : 0)
          setLoadingProducts(false)
        }
      } catch (err) {
        if (mounted) {
          setProductsError(err.message || 'Could not load products')
          setLoadingProducts(false)
        }
      }
    }
    init()

    const interval = setInterval(async () => {
      try {
        const pending = await getPendingDiscountRequests()
        if (mounted) setPendingApprovalsCount(Array.isArray(pending) ? pending.length : 0)
      } catch {
        // ignore
      }
    }, 10000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  function handleNavigateToStock(productId) {
    setTargetStockProductId(productId)
    setActiveTab('stock')
  }

  function handleAddReorderSuggestion(suggestion) {
    setPendingReorderSuggestion(suggestion)
    setActiveTab('reorders')
  }

  function logout() {
    clearAuth()
    navigate('/', { replace: true })
  }

  return (
    <div className="executive-viewport">
      <div className="executive-frame">
        {/* Left Sidebar (Black Bar with 5 fixed centered icons) */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            if (tab !== 'stock') setTargetStockProductId(null)
            setActiveTab(tab)
          }}
          pendingCount={pendingApprovalsCount}
          onOpenSettings={() => setShowSettingsModal(true)}
        />

        {/* Main Content Area */}
        <main className="executive-main">
          {/* Main Executive Health Dashboard */}
          {activeTab === 'overview' && (
            <ExecutiveDashboardView
              onNavigateToTab={setActiveTab}
              onNavigateToStock={handleNavigateToStock}
            />
          )}

          {/* Subpage Header for non-overview sections */}
          {activeTab !== 'overview' && (
            <div className="executive-subpage-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                  type="button"
                  className="subpage-back-btn"
                  onClick={() => setActiveTab('overview')}
                >
                  <ArrowLeft size={16} /> Back to Dashboard
                </button>
                <h2 className="subpage-title">
                  {activeTab === 'products' && 'Product Stock Catalog'}
                  {activeTab === 'stock' && 'Stock Ledger & History'}
                  {activeTab === 'alerts' && 'Stock & Expiry Alerts'}
                  {activeTab === 'pareto' && '80-20 Mix (Pareto Analysis)'}
                  {activeTab === 'discounted' && 'Discounted & Near-Expiry Products'}
                  {activeTab === 'reorders' && 'Reorders & Purchase Orders'}
                  {activeTab === 'sales' && 'Sales History & Bills'}
                </h2>
              </div>

              {/* Sub-navigation Pills */}
              <div className="subpage-nav-pills">
                {(activeTab === 'products' || activeTab === 'stock') && (
                  <>
                    <button
                      type="button"
                      className={`subpage-nav-pill ${activeTab === 'products' ? 'active' : ''}`}
                      onClick={() => setActiveTab('products')}
                    >
                      Catalog
                    </button>
                    <button
                      type="button"
                      className={`subpage-nav-pill ${activeTab === 'stock' ? 'active' : ''}`}
                      onClick={() => setActiveTab('stock')}
                    >
                      Stock Ledger
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Sub-view Content */}
          {activeTab === 'products' && (
            <ProductsTab
              products={products}
              onRefresh={refreshProducts}
              loading={loadingProducts}
              error={productsError}
            />
          )}

          {activeTab === 'stock' && (
            <StockTab
              products={products}
              onRefreshProducts={refreshProducts}
              targetProductId={targetStockProductId}
            />
          )}

          {activeTab === 'alerts' && (
            <AlertsTab
              onNavigateToStock={handleNavigateToStock}
              onRefreshProducts={refreshProducts}
            />
          )}

          {/* 80-20 Mix Section (USP) */}
          {activeTab === 'pareto' && (
            <ParetoMixSection
              token={token}
              onNavigateToReorder={() => setActiveTab('reorders')}
              onAddReorderSuggestion={handleAddReorderSuggestion}
            />
          )}

          {/* Discounted Products Section */}
          {activeTab === 'discounted' && (
            <DiscountedProductsSection
              token={token}
            />
          )}

          {/* Reorders & Orders Section */}
          {activeTab === 'reorders' && (
            <ReordersSection
              token={token}
              initialSuggestion={pendingReorderSuggestion}
              onClearInitialSuggestion={() => setPendingReorderSuggestion(null)}
            />
          )}

          {activeTab === 'sales' && <SalesTab />}
        </main>
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div
          className="executive-modal-backdrop"
          onClick={() => setShowSettingsModal(false)}
        >
          <div
            className="executive-settings-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="settings-dialog-header">
              <div className="settings-brand-header">
                <img
                  src="/static/images/optistock-logo-icon.svg"
                  alt="OptiStock AI"
                  className="settings-dialog-logo"
                />
                <div>
                  <h3 className="settings-title">OptiStock AI</h3>
                  <p className="settings-subtitle">Smarter Inventory | Higher Profits</p>
                </div>
              </div>
            </div>

            <div className="settings-dialog-body">
              <div className="settings-user-card">
                <div className="user-avatar-circle">
                  <User size={22} />
                </div>
                <div>
                  <div className="user-card-name">{user?.name || 'Store Manager'}</div>
                  <div className="user-card-email">{user?.email || 'manager@optistock.ai'}</div>
                  <div className="user-role-pill">
                    <ShieldCheck size={12} />
                    <span>MANAGER ROLE</span>
                  </div>
                </div>
              </div>

              <div className="settings-info-section">
                <h4 className="info-section-title">System Information</h4>
                <div className="info-row">
                  <span>Engine:</span>
                  <span className="info-val">Spring Boot 3.3.4 (Reactive H2/MySQL)</span>
                </div>
                <div className="info-row">
                  <span>Frontend:</span>
                  <span className="info-val">React 18 + Vite Native CSS</span>
                </div>
                <div className="info-row">
                  <span>Pareto Logic:</span>
                  <span className="info-val text-indigo font-medium">80-20 Class A Fast Movers Active</span>
                </div>
                <div className="info-row">
                  <span>Dynamic Markdowns:</span>
                  <span className="info-val text-emerald font-medium">Auto-Tier Expiry Discounts Enabled</span>
                </div>
              </div>
            </div>

            <div className="settings-dialog-footer">
              <button
                type="button"
                className="btn-settings-cancel"
                onClick={() => setShowSettingsModal(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn-settings-logout"
                onClick={logout}
              >
                <LogOut size={16} />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
