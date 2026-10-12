import { Link } from 'react-router-dom'
import { siteConfig } from '../siteConfig'

export default function PrivacyPage() {
  const businessName = siteConfig.businessName || 'OptiStock'
  const contactEmail = siteConfig.supportEmail || 'support@example.com'

  return (
    <div className="page" style={{ maxWidth: '800px', margin: '2rem auto', padding: '1rem' }}>
      <div className="card" style={{ padding: '2rem', borderRadius: '8px' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <Link to="/" style={{ color: '#0d9488', textDecoration: 'none', fontSize: '0.9rem' }}>
            &larr; Back to Sign In
          </Link>
        </div>

        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', color: '#0f172a' }}>Privacy Policy</h1>
        <p className="muted" style={{ fontSize: '0.88rem' }}>Last updated: October 2026</p>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', color: '#1e293b' }}>1. Data Stored</h2>
          <p style={{ color: '#334155', lineHeight: 1.6 }}>
            {businessName} stores only the information necessary for retail inventory management and point of sale operations. This includes:
          </p>
          <ul style={{ color: '#334155', lineHeight: 1.6, paddingLeft: '1.25rem' }}>
            <li>User account information: name, email address, cryptographically hashed passwords, and assigned system role (Manager or Cashier).</li>
            <li>Inventory and catalog records: product names, brands, categories, stock quantities, cost prices, selling prices, and batch expiry dates.</li>
            <li>Operational and financial records: purchase orders, stock movement logs, discount authorization requests, and customer billing histories.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', color: '#1e293b' }}>2. Purpose of Data Collection</h2>
          <p style={{ color: '#334155', lineHeight: 1.6 }}>
            The data collected is used solely to authenticate system users, track inventory counts, execute sales transactions, calculate discounts and expiry markdowns, and record purchase orders.
          </p>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', color: '#1e293b' }}>3. Data Retention and Sale</h2>
          <p style={{ color: '#334155', lineHeight: 1.6 }}>
            Data is retained for as long as your organization maintains an active deployment of {businessName}. We do not sell, rent, or share personal or business data with third parties or advertising networks.
          </p>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', color: '#1e293b' }}>4. Data Deletion Requests</h2>
          <p style={{ color: '#334155', lineHeight: 1.6 }}>
            System administrators or users can request complete data export or deletion by contacting the business administrator at {contactEmail}. Upon verification, accounts and operational logs will be permanently erased, subject to statutory bookkeeping obligations.
          </p>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', color: '#1e293b' }}>5. Contact Information</h2>
          <p style={{ color: '#334155', lineHeight: 1.6 }}>
            If you have questions regarding this privacy policy, please contact us at:
          </p>
          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', color: '#334155', fontSize: '0.9rem' }}>
            <div><strong>Organization:</strong> {siteConfig.businessName || 'Not configured'}</div>
            <div><strong>Email:</strong> {siteConfig.supportEmail || 'Not configured'}</div>
            <div><strong>Phone:</strong> {siteConfig.supportPhone || 'Not configured'}</div>
            <div><strong>Address:</strong> {siteConfig.address || 'Not configured'}</div>
          </div>
        </section>

        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginTop: '2rem', display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
          <Link to="/terms" style={{ color: '#0d9488', textDecoration: 'none' }}>Terms of Service</Link>
          <Link to="/" style={{ color: '#0d9488', textDecoration: 'none' }}>Sign In</Link>
        </div>
      </div>
    </div>
  )
}
