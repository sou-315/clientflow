import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import api from '../api/api'
import './LeadModal.css'

const STATUS_OPTIONS = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost']

function LeadModal({ onClose, onSaved }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState('New')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Name is required.')
      return
    }

    setSaving(true)
    try {
      await api.post('/leads', { name, email, phone, status })
      onSaved()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save lead. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="lead-modal-overlay" onClick={onClose}>
      <div className="lead-modal" onClick={(e) => e.stopPropagation()}>
        <div className="lead-modal__header">
          <h2>New lead</h2>
          <button className="lead-modal__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="lead-modal__form">
          <label htmlFor="lead-name">Name</label>
          <input
            id="lead-name"
            type="text"
            placeholder="Acme Corp"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="lead-modal__row">
            <div className="lead-modal__field">
              <label htmlFor="lead-email">Email</label>
              <input
                id="lead-email"
                type="email"
                placeholder="contact@acme.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="lead-modal__field">
              <label htmlFor="lead-phone">Phone</label>
              <input
                id="lead-phone"
                type="text"
                placeholder="+1 555 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <label htmlFor="lead-status">Status</label>
          <select id="lead-status" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {error && <p className="lead-modal__error">{error}</p>}

          <div className="lead-modal__actions">
            <button type="button" className="lead-modal__cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="lead-modal__submit" disabled={saving}>
              {saving ? 'Creating...' : 'Create lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LeadModal