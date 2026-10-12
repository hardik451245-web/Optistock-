export default function Toast({ toast, onClose }) {
  if (!toast) return null

  return (
    <div
      className={`spatial-toast ${toast.type || 'error'}`}
      onClick={onClose}
      style={{ cursor: 'pointer' }}
    >
      <span>{toast.message}</span>
    </div>
  )
}
