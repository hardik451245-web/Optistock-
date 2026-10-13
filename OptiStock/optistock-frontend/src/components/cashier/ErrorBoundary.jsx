import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
    if (this.props.onRetry) {
      this.props.onRetry()
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="spatial-panel"
          style={{
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            gap: '1rem',
          }}
        >
          <div style={{ color: 'var(--spatial-rose)', fontWeight: 700, fontSize: '1.1rem' }}>
            Panel Error
          </div>
          <div style={{ color: 'var(--spatial-text-muted)', fontSize: '0.88rem', maxWidth: 360 }}>
            {this.state.error?.message || 'An unexpected error occurred in this panel.'}
          </div>
          <button
            type="button"
            className="ornament-pay-btn"
            style={{ fontSize: '0.88rem', padding: '0.5rem 1.25rem' }}
            onClick={this.handleRetry}
          >
            Retry
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
