import { useState, useEffect } from 'react'
import { X, DollarSign, Clock } from 'lucide-react'
import api from '../api/api'
import StatusPill from './StatusPill'
import './DealDetailPanel.css'

const STATUS_OPTIONS = ['Open', 'Won', 'Lost']

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(value)
}

function DealDetailPanel({ deal, onClose, onUpdated, onDeleted }) {
  const [mode, setMode] = useState('view')
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const [title, setTitle] = useState(deal.title)
  const [value, setValue] = useState(deal.value)
  const [status, setStatus] = useState(deal.status)
  const [customerId, setCustomerId] = useState(deal.customer_id)
  const [expectedCloseDate, setExpectedCloseDate] = useState(deal.expected_close_date || '')

  const [customers, setCustomers] = useState([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)

  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [activities, setActivities] = useState([])
  const [loadingActivities, setLoadingActivities] = useState(true)

  useEffect(() => {
    async function loadActivities() {
      setLoadingActivities(true)
      try {
        const response = await api.get('/activities', {
          params: { deal_id: deal.id },
        })
        setActivities(response.data.activities)
      } catch (err) {
        setActivities([])
      } finally {
        setLoadingActivities(false)
      }
    }
    loadActivities()
  }, [deal.id])

  const enterEditMode = async () => {
    setMode('edit')
    setLoadingCustomers(true)
    try {
      const response = await api.get('/customers')
      setCustomers(response.data.customers)
    } catch (err) {
      setError('Could not load customers list.')
    } finally {
      setLoadingCustomers(false)
    }
  }

  const handleSave = async (e) => {
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
      await api.put(`/deals/${deal.id}`, {
        title,
        value: value === '' ? 0 : Number(value),
        status,
        customer_id: Number(customerId),
        expected_close_date: expectedCloseDate || null,
      })
      onUpdated()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save changes.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/deals/${deal.id}`)
      onDeleted()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not delete deal.')
      setDeleting(false)
    }
  }

  return (
    <div className="deal-panel-overlay" onClick={onClose}>
      <div className="deal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="deal-panel__header">
          <h2>{mode === 'edit' ? 'Edit deal' : 'Deal details'}</h2>
          <button className="deal-panel__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {mode === 'view' && (
          <>
            <div className="deal-panel__profile">
             <div className="deal-panel__avatar">
  <DollarSign size={20} />
</div>
              <div className="deal-panel__profile-info">
                <p className="deal-panel__name">{deal.title}</p>
                <StatusPill status={deal.status} />
              </div>
            </div>

            <div className="deal-panel__field">
              <span className="deal-panel__label">Value</span>
              <span className="deal-panel__value">{formatCurrency(deal.value)}</span>
            </div>
            <div className="deal-panel__field">
              <span className="deal-panel__label">Customer</span>
              <span className="deal-panel__value">
                {deal.customer_name || `#${deal.customer_id}`}
              </span>
            </div>
            <div className="deal-panel__field">
              <span className="deal-panel__label">Expected close date</span>
              <span className="deal-panel__value">
                {deal.expected_close_date
                  ? new Date(deal.expected_close_date).toLocaleDateString()
                  : '—'}
              </span>
            </div>
            <div className="deal-panel__field">
              <span className="deal-panel__label">Created</span>
              <span className="deal-panel__value">
                {new Date(deal.created_at).toLocaleDateString()}
              </span>
            </div>

            {!confirmingDelete ? (
              <div className="deal-panel__actions">
                <button className="deal-panel__edit-btn" onClick={enterEditMode}>
                  Edit
                </button>
                <button
                  className="deal-panel__delete-btn"
                  onClick={() => setConfirmingDelete(true)}
                >
                  Delete
                </button>
              </div>
            ) : (
              <div className="deal-panel__confirm">
                <p>Delete this deal? This can't be undone.</p>
                <div className="deal-panel__actions">
                  <button
                    className="deal-panel__edit-btn"
                    onClick={() => setConfirmingDelete(false)}
                    disabled={deleting}
                  >
                    Cancel
                  </button>
                  <button
                    className="deal-panel__delete-btn"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? 'Deleting...' : 'Yes, delete'}
                  </button>
                </div>
              </div>
            )}

            {error && <p className="deal-panel__error">{error}</p>}

            <div className="deal-panel__timeline">
              <span className="deal-panel__label">
                <Clock size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                Activity timeline
              </span>
              {loadingActivities ? (
                <p className="deal-panel__empty">Loading activities...</p>
              ) : activities.length === 0 ? (
                <p className="deal-panel__empty">No activities logged yet.</p>
              ) : (
                <ul className="deal-panel__timeline-list">
                  {activities.map((activity) => (
                    <li key={activity.id} className="deal-panel__timeline-item">
                      <div className="deal-panel__timeline-item-header">
                        <span className="deal-panel__timeline-type">{activity.type}</span>
                        <span className="deal-panel__timeline-date">
                          {new Date(activity.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {activity.notes && (
                        <p className="deal-panel__timeline-notes">{activity.notes}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        {mode === 'edit' && (
          <form onSubmit={handleSave} className="deal-panel__form">
            <label htmlFor="edit-title">Title</label>
            <input
              id="edit-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <label htmlFor="edit-value">Value</label>
            <input
              id="edit-value"
              type="number"
              min="0"
              step="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />

            <label htmlFor="edit-status">Status</label>
            <select id="edit-status" value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <label htmlFor="edit-customer">Customer</label>
            <select
              id="edit-customer"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              disabled={loadingCustomers}
            >
              <option value="">
                {loadingCustomers ? 'Loading customers...' : 'Select a customer'}
              </option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <label htmlFor="edit-close-date">Expected close date</label>
            <input
              id="edit-close-date"
              type="date"
              value={expectedCloseDate}
              onChange={(e) => setExpectedCloseDate(e.target.value)}
            />

            {error && <p className="deal-panel__error">{error}</p>}

            <div className="deal-panel__actions">
              <button
                type="button"
                className="deal-panel__edit-btn"
                onClick={() => setMode('view')}
                disabled={saving}
              >
                Cancel
              </button>
              <button type="submit" className="deal-panel__save-btn" disabled={saving}>
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default DealDetailPanel