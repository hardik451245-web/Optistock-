import { Link } from 'react-router-dom'
import { siteConfig } from '../siteConfig'

export default function TermsPage() {
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

        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', color: '#0f172a' }}>Terms of Service</h1>
        <p className="muted" style={{ fontSize: '0.88rem' }}>Last updated: October 2026</p>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', color: '#1e293b' }}>1. Acceptable Use</h2>
          <p style={{ color: '#334155', lineHeight: 1.6 }}>
            {businessName} is intended for retail inventory management, stock movement logging, and retail point of sale billing. Users agree to access the service only through designated interfaces and refrain from unauthorized vulnerability scanning or automated scraping.
          </p>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', color: '#1e293b' }}>2. Account Responsibility</h2>
          <p style={{ color: '#334155', lineHeight: 1.6 }}>
            Authorized personnel must maintain confidentiality of login credentials. Managers and Cashiers are accountable for transactions, purchase orders, and stock adjustments recorded under their authenticated accounts.
          </p>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', color: '#1e293b' }}>3. Limitation of Liability</h2>
          <p style={{ color: '#334155', lineHeight: 1.6 }}>
            The software provides inventory calculations, reorder suggestions, and automated markdown pricing on an as-available basis. Store managers must verify critical purchase quantities and expiry dates. The developers and operators of {businessName} shall not be liable for indirect, incidental, or consequential inventory losses.
          </p>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', color: '#1e293b' }}>4. Modifications to Terms</h2>
          <p style={{ color: '#334155', lineHeight: 1.6 }}>
            Terms may be updated periodically to reflect software enhancements or regulatory changes. Continued use of the system constitutes acceptance of revised terms.
          </p>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', color: '#1e293b' }}>5. Contact</h2>
          <p style={{ color: '#334155', lineHeight: 1.6 }}>
            Questions regarding terms of service can be addressed to {contactEmail}.
          </p>
          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', color: '#334155', fontSize: '0.9rem' }}>
            <div><strong>Organization:</strong> {siteConfig.businessName || 'Not configured'}</div>
            <div><strong>Email:</strong> {siteConfig.supportEmail || 'Not configured'}</div>
            <div><strong>Phone:</strong> {siteConfig.supportPhone || 'Not configured'}</div>
            <div><strong>Address:</strong> {siteConfig.address || 'Not configured'}</div>
          </div>
        </section>

        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginTop: '2rem', display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
          <Link to="/privacy" style={{ color: '#0d9488', textDecoration: 'none' }}>Privacy Policy</Link>
          <Link to="/" style={{ color: '#0d9488', textDecoration: 'none' }}>Sign In</Link>
        </div>
      </div>
    </div>
  )
}
