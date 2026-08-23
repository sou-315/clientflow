import { useState, useEffect } from 'react'
import { X, User, Clock } from 'lucide-react'
import api from '../api/api'
import './CustomerDetailPanel.css'

function CustomerDetailPanel({ customer, onClose, onUpdated, onDeleted }) {
  const [mode, setMode] = useState('view')
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [name, setName] = useState(customer.name)
  const [email, setEmail] = useState(customer.email || '')
  const [phone, setPhone] = useState(customer.phone || '')
  const [notes, setNotes] = useState(customer.notes || '')
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
          params: { customer_id: customer.id },
        })
        setActivities(response.data.activities)
      } catch (err) {
        setActivities([])
      } finally {
        setLoadingActivities(false)
      }
    }
    loadActivities()
  }, [customer.id])

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Name is required.')
      return
    }

    setSaving(true)
    try {
      await api.put(`/customers/${customer.id}`, { name, email, phone, notes })
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
      await api.delete(`/customers/${customer.id}`)
      onDeleted()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not delete customer.')
      setDeleting(false)
    }
  }

  return (
    <div className="customer-panel-overlay" onClick={onClose}>
      <div className="customer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="customer-panel__header">
          <h2>{mode === 'edit' ? 'Edit customer' : 'Customer details'}</h2>
          <button className="customer-panel__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {mode === 'view' && (
          <>
            <div className="customer-panel__profile">
              <div className="customer-panel__avatar">
                <User size={20} />
              </div>
              <div className="customer-panel__profile-info">
                <p className="customer-panel__name">{customer.name}</p>
              </div>
            </div>

            <div className="customer-panel__field">
              <span className="customer-panel__label">Email</span>
              <span className="customer-panel__value">{customer.email || '—'}</span>
            </div>
            <div className="customer-panel__field">
              <span className="customer-panel__label">Phone</span>
              <span className="customer-panel__value">{customer.phone || '—'}</span>
            </div>
            <div className="customer-panel__field">
              <span className="customer-panel__label">Notes</span>
              <span className="customer-panel__value">{customer.notes || '—'}</span>
            </div>
            <div className="customer-panel__field">
              <span className="customer-panel__label">Created</span>
              <span className="customer-panel__value">
                {new Date(customer.created_at).toLocaleDateString()}
              </span>
            </div>

            {!confirmingDelete ? (
              <div className="customer-panel__actions">
                <button className="customer-panel__edit-btn" onClick={() => setMode('edit')}>
                  Edit
                </button>
                <button
                  className="customer-panel__delete-btn"
                  onClick={() => setConfirmingDelete(true)}
                >
                  Delete
                </button>
              </div>
            ) : (
              <div className="customer-panel__confirm">
                <p>Delete this customer? This can't be undone.</p>
                <div className="customer-panel__actions">
                  <button
                    className="customer-panel__edit-btn"
                    onClick={() => setConfirmingDelete(false)}
                    disabled={deleting}
                  >
                    Cancel
                  </button>
                  <button
                    className="customer-panel__delete-btn"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? 'Deleting...' : 'Yes, delete'}
                  </button>
                </div>
              </div>
            )}

            {error && <p className="customer-panel__error">{error}</p>}

            <div className="customer-panel__timeline">
              <span className="customer-panel__label">
                <Clock size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                Activity timeline
              </span>
              {loadingActivities ? (
                <p className="customer-panel__empty">Loading activities...</p>
              ) : activities.length === 0 ? (
                <p className="customer-panel__empty">No activities logged yet.</p>
              ) : (
                <ul className="customer-panel__timeline-list">
                  {activities.map((activity) => (
                    <li key={activity.id} className="customer-panel__timeline-item">
                      <div className="customer-panel__timeline-item-header">
                        <span className="customer-panel__timeline-type">{activity.type}</span>
                        <span className="customer-panel__timeline-date">
                          {new Date(activity.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {activity.notes && (
                        <p className="customer-panel__timeline-notes">{activity.notes}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        {mode === 'edit' && (
          <form onSubmit={handleSave} className="customer-panel__form">
            <label htmlFor="edit-cname">Name</label>
            <input
              id="edit-cname"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <label htmlFor="edit-cemail">Email</label>
            <input
              id="edit-cemail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label htmlFor="edit-cphone">Phone</label>
            <input
              id="edit-cphone"
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <label htmlFor="edit-cnotes">Notes</label>
            <textarea
              id="edit-cnotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />

            {error && <p className="customer-panel__error">{error}</p>}

            <div className="customer-panel__actions">
              <button
                type="button"
                className="customer-panel__edit-btn"
                onClick={() => setMode('view')}
                disabled={saving}
              >
                Cancel
              </button>
              <button type="submit" className="customer-panel__save-btn" disabled={saving}>
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default CustomerDetailPanel