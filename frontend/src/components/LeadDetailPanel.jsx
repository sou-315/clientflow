import { useState } from 'react'
import { X, Users } from 'lucide-react'
import api from '../api/api'
import StatusPill from './StatusPill'
import './LeadDetailPanel.css'

const STATUS_OPTIONS = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost']

function LeadDetailPanel({ lead, onClose, onUpdated, onDeleted }) {
  const [mode, setMode] = useState('view') // 'view' | 'edit'
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [name, setName] = useState(lead.name)
  const [email, setEmail] = useState(lead.email || '')
  const [phone, setPhone] = useState(lead.phone || '')
  const [status, setStatus] = useState(lead.status)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Name is required.')
      return
    }

    setSaving(true)
    try {
      await api.put(`/leads/${lead.id}`, { name, email, phone, status })
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
      await api.delete(`/leads/${lead.id}`)
      onDeleted()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not delete lead.')
      setDeleting(false)
    }
  }

  return (
    <div className="lead-panel-overlay" onClick={onClose}>
      <div className="lead-panel" onClick={(e) => e.stopPropagation()}>
        <div className="lead-panel__header">
          <h2>{mode === 'edit' ? 'Edit lead' : 'Lead details'}</h2>
          <button className="lead-panel__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {mode === 'view' && (
          <>
            <div className="lead-panel__profile">
              <div className="lead-panel__avatar">
                <Users size={20} />
              </div>
              <div className="lead-panel__profile-info">
                <p className="lead-panel__name">{lead.name}</p>
                <StatusPill status={lead.status} />
              </div>
            </div>

            <div className="lead-panel__field">
              <span className="lead-panel__label">Email</span>
              <span className="lead-panel__value">{lead.email || '—'}</span>
            </div>
            <div className="lead-panel__field">
              <span className="lead-panel__label">Phone</span>
              <span className="lead-panel__value">{lead.phone || '—'}</span>
            </div>
            <div className="lead-panel__field">
              <span className="lead-panel__label">Created</span>
              <span className="lead-panel__value">
                {new Date(lead.created_at).toLocaleDateString()}
              </span>
            </div>

            {!confirmingDelete ? (
              <div className="lead-panel__actions">
                <button className="lead-panel__edit-btn" onClick={() => setMode('edit')}>
                  Edit
                </button>
                <button
                  className="lead-panel__delete-btn"
                  onClick={() => setConfirmingDelete(true)}
                >
                  Delete
                </button>
              </div>
            ) : (
              <div className="lead-panel__confirm">
                <p>Delete this lead? This can't be undone.</p>
                <div className="lead-panel__actions">
                  <button
                    className="lead-panel__edit-btn"
                    onClick={() => setConfirmingDelete(false)}
                    disabled={deleting}
                  >
                    Cancel
                  </button>
                  <button
                    className="lead-panel__delete-btn"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? 'Deleting...' : 'Yes, delete'}
                  </button>
                </div>
              </div>
            )}

            {error && <p className="lead-panel__error">{error}</p>}
          </>
        )}

        {mode === 'edit' && (
          <form onSubmit={handleSave} className="lead-panel__form">
            <label htmlFor="edit-name">Name</label>
            <input
              id="edit-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <label htmlFor="edit-email">Email</label>
            <input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label htmlFor="edit-phone">Phone</label>
            <input
              id="edit-phone"
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <label htmlFor="edit-status">Status</label>
            <select id="edit-status" value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {error && <p className="lead-panel__error">{error}</p>}

            <div className="lead-panel__actions">
              <button
                type="button"
                className="lead-panel__edit-btn"
                onClick={() => setMode('view')}
                disabled={saving}
              >
                Cancel
              </button>
              <button type="submit" className="lead-panel__save-btn" disabled={saving}>
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default LeadDetailPanel