import { useState, useEffect } from 'react'
import { X, CalendarClock } from 'lucide-react'
import api from '../api/api'
import './ActivityDetailPanel.css'

const TYPE_OPTIONS = ['Call', 'Meeting', 'Email', 'Note', 'Follow-up']

function ActivityDetailPanel({ activity, onClose, onUpdated, onDeleted }) {
  const [mode, setMode] = useState('view')
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const [type, setType] = useState(activity.type)
  const [notes, setNotes] = useState(activity.notes || '')
  const [leadId, setLeadId] = useState(activity.lead_id || '')
  const [customerId, setCustomerId] = useState(activity.customer_id || '')
  const [dealId, setDealId] = useState(activity.deal_id || '')

  const [leads, setLeads] = useState([])
  const [customers, setCustomers] = useState([])
  const [deals, setDeals] = useState([])
  const [loadingOptions, setLoadingOptions] = useState(false)

  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const enterEditMode = async () => {
    setMode('edit')
    setLoadingOptions(true)
    try {
      const [leadsRes, customersRes, dealsRes] = await Promise.all([
        api.get('/leads'),
        api.get('/customers'),
        api.get('/deals'),
      ])
      setLeads(leadsRes.data.leads)
      setCustomers(customersRes.data.customers)
      setDeals(dealsRes.data.deals)
    } catch (err) {
      setError('Could not load leads/customers/deals.')
    } finally {
      setLoadingOptions(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')

    if (!type) {
      setError('Please select an activity type.')
      return
    }

    setSaving(true)
    try {
      await api.put(`/activities/${activity.id}`, {
        type,
        notes: notes || null,
        lead_id: leadId ? Number(leadId) : null,
        customer_id: customerId ? Number(customerId) : null,
        deal_id: dealId ? Number(dealId) : null,
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
      await api.delete(`/activities/${activity.id}`)
      onDeleted()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not delete activity.')
      setDeleting(false)
    }
  }

  return (
    <div className="activity-panel-overlay" onClick={onClose}>
      <div className="activity-panel" onClick={(e) => e.stopPropagation()}>
        <div className="activity-panel__header">
          <h2>{mode === 'edit' ? 'Edit activity' : 'Activity details'}</h2>
          <button className="activity-panel__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {mode === 'view' && (
          <>
            <div className="activity-panel__profile">
             <div className="activity-panel__avatar">
  <CalendarClock size={20} />
</div>
              <div className="activity-panel__profile-info">
                <p className="activity-panel__name">{activity.type}</p>
              </div>
            </div>

            <div className="activity-panel__field">
              <span className="activity-panel__label">Notes</span>
              <span className="activity-panel__value">{activity.notes || '—'}</span>
            </div>
            <div className="activity-panel__field">
              <span className="activity-panel__label">Lead</span>
              <span className="activity-panel__value">{activity.lead_name || '—'}</span>
            </div>
            <div className="activity-panel__field">
              <span className="activity-panel__label">Customer</span>
              <span className="activity-panel__value">{activity.customer_name || '—'}</span>
            </div>
            <div className="activity-panel__field">
              <span className="activity-panel__label">Deal</span>
              <span className="activity-panel__value">{activity.deal_title || '—'}</span>
            </div>
            <div className="activity-panel__field">
              <span className="activity-panel__label">Created</span>
              <span className="activity-panel__value">
                {new Date(activity.created_at).toLocaleDateString()}
              </span>
            </div>

            {!confirmingDelete ? (
              <div className="activity-panel__actions">
                <button className="activity-panel__edit-btn" onClick={enterEditMode}>
                  Edit
                </button>
                <button
                  className="activity-panel__delete-btn"
                  onClick={() => setConfirmingDelete(true)}
                >
                  Delete
                </button>
              </div>
            ) : (
              <div className="activity-panel__confirm">
                <p>Delete this activity? This can't be undone.</p>
                <div className="activity-panel__actions">
                  <button
                    className="activity-panel__edit-btn"
                    onClick={() => setConfirmingDelete(false)}
                    disabled={deleting}
                  >
                    Cancel
                  </button>
                  <button
                    className="activity-panel__delete-btn"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? 'Deleting...' : 'Yes, delete'}
                  </button>
                </div>
              </div>
            )}

            {error && <p className="activity-panel__error">{error}</p>}
          </>
        )}

        {mode === 'edit' && (
          <form onSubmit={handleSave} className="activity-panel__form">
            <label htmlFor="edit-type">Type</label>
            <select id="edit-type" value={type} onChange={(e) => setType(e.target.value)}>
              {TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <label htmlFor="edit-notes">Notes</label>
            <textarea
              id="edit-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <label htmlFor="edit-lead">Lead</label>
            <select
              id="edit-lead"
              value={leadId}
              onChange={(e) => {
                setLeadId(e.target.value)
                setCustomerId('')
                setDealId('')
              }}
              disabled={loadingOptions}
            >
              <option value="">{loadingOptions ? 'Loading...' : 'None'}</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>

            <label htmlFor="edit-customer">Customer</label>
            <select
              id="edit-customer"
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value)
                setLeadId('')
                setDealId('')
              }}
              disabled={loadingOptions}
            >
              <option value="">{loadingOptions ? 'Loading...' : 'None'}</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <label htmlFor="edit-deal">Deal</label>
            <select
              id="edit-deal"
              value={dealId}
              onChange={(e) => {
                setDealId(e.target.value)
                setLeadId('')
                setCustomerId('')
              }}
              disabled={loadingOptions}
            >
              <option value="">{loadingOptions ? 'Loading...' : 'None'}</option>
              {deals.map((d) => (
                <option key={d.id} value={d.id}>{d.title}</option>
              ))}
            </select>

            {error && <p className="activity-panel__error">{error}</p>}

            <div className="activity-panel__actions">
              <button
                type="button"
                className="activity-panel__edit-btn"
                onClick={() => setMode('view')}
                disabled={saving}
              >
                Cancel
              </button>
              <button type="submit" className="activity-panel__save-btn" disabled={saving}>
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ActivityDetailPanel