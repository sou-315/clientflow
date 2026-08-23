import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import api from '../api/api'
import './DealModal.css'

function DealModal({ onClose, onSaved }) {
  const [title, setTitle] = useState('')
  const [value, setValue] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [expectedCloseDate, setExpectedCloseDate] = useState('')

  const [customers, setCustomers] = useState([])
  const [users, setUsers] = useState([])
  const [loadingOptions, setLoadingOptions] = useState(true)

  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  useEffect(() => {
    async function loadOptions() {
      setLoadingOptions(true)
      try {
        const [customersRes, usersRes] = await Promise.all([
          api.get('/customers'),
          api.get('/users'),
        ])
        setCustomers(customersRes.data.customers)
        setUsers(usersRes.data.users)
      } catch (err) {
        setError('Could not load customers/users. Please try again.')
      } finally {
        setLoadingOptions(false)
      }
    }
    loadOptions()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Title is required.')
      return
    }

    if (!customerId) {
      setError('Please select a customer.')
      return
    }

    setSaving(true)
    try {
      await api.post('/deals', {
        title,
        value: value === '' ? 0 : Number(value),
        status: 'Open',
        customer_id: Number(customerId),
        assigned_to: assignedTo ? Number(assignedTo) : null,
        expected_close_date: expectedCloseDate || null,
      })
      onSaved()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save deal. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="deal-modal-overlay" onClick={onClose}>
      <div className="deal-modal" onClick={(e) => e.stopPropagation()}>
        <div className="deal-modal__header">
          <h2>Create deal</h2>
          <button className="deal-modal__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="deal-modal__form">
          <label htmlFor="deal-title">Title</label>
          <input
            id="deal-title"
            type="text"
            placeholder="Acme Enterprise Deal"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <label htmlFor="deal-value">Value</label>
          <input
            id="deal-value"
            type="number"
            min="0"
            step="0.01"
            placeholder="15000"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />

          <label htmlFor="deal-customer">Customer *</label>
          <select
            id="deal-customer"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            disabled={loadingOptions}
          >
            <option value="">
              {loadingOptions ? 'Loading customers...' : 'Select a customer'}
            </option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <label htmlFor="deal-assigned">Assigned to</label>
          <select
            id="deal-assigned"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            disabled={loadingOptions}
          >
            <option value="">
              {loadingOptions ? 'Loading users...' : 'Unassigned'}
            </option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>

          <label htmlFor="deal-close-date">Expected close date</label>
          <input
            id="deal-close-date"
            type="date"
            value={expectedCloseDate}
            onChange={(e) => setExpectedCloseDate(e.target.value)}
          />

          {error && <p className="deal-modal__error">{error}</p>}

          <div className="deal-modal__actions">
            <button type="button" className="deal-modal__cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="deal-modal__submit"
              disabled={saving || loadingOptions || !customerId}
            >
              {saving ? 'Creating...' : 'Create deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default DealModal
