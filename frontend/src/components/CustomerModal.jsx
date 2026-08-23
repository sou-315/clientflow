import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import api from '../api/api'
import './CustomerModal.css'

function CustomerModal({ onClose, onSaved }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
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
      await api.post('/customers', { name, email, phone, notes })
      onSaved()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save customer. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="customer-modal-overlay" onClick={onClose}>
      <div className="customer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="customer-modal__header">
          <h2>New customer</h2>
          <button className="customer-modal__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="customer-modal__form">
          <label htmlFor="customer-name">Name</label>
          <input
            id="customer-name"
            type="text"
            placeholder="John Smith"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="customer-modal__row">
            <div className="customer-modal__field">
              <label htmlFor="customer-email">Email</label>
              <input
                id="customer-email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="customer-modal__field">
              <label htmlFor="customer-phone">Phone</label>
              <input
                id="customer-phone"
                type="text"
                placeholder="+1 555 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <label htmlFor="customer-notes">Notes</label>
          <textarea
            id="customer-notes"
            placeholder="Any notes about this customer..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />

          {error && <p className="customer-modal__error">{error}</p>}

          <div className="customer-modal__actions">
            <button type="button" className="customer-modal__cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="customer-modal__submit" disabled={saving}>
              {saving ? 'Creating...' : 'Create customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CustomerModal