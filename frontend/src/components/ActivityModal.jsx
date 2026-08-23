import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import api from '../api/api'
import './ActivityModal.css'

const TYPE_OPTIONS = ['Call', 'Meeting', 'Email', 'Note', 'Follow-up']

function ActivityModal({ onClose, onSaved }) {
  const [type, setType] = useState('')
  const [notes, setNotes] = useState('')
  const [leadId, setLeadId] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [dealId, setDealId] = useState('')

  const [leads, setLeads] = useState([])
  const [customers, setCustomers] = useState([])
  const [deals, setDeals] = useState([])
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
        const [leadsRes, customersRes, dealsRes] = await Promise.all([
          api.get('/leads'),
          api.get('/customers'),
          api.get('/deals'),
        ])
        setLeads(leadsRes.data.leads)
        setCustomers(customersRes.data.customers)
        setDeals(dealsRes.data.deals)
      } catch (err) {
        setError('Could not load leads/customers/deals. Please try again.')
      } finally {
        setLoadingOptions(false)
      }
    }
    loadOptions()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!type) {
      setError('Please select an activity type.')
      return
    }

    setSaving(true)
    try {
      await api.post('/activities', {
        type,
        notes: notes || null,
        lead_id: leadId ? Number(leadId) : null,
        customer_id: customerId ? Number(customerId) : null,
        deal_id: dealId ? Number(dealId) : null,
      })
      onSaved()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save activity. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="activity-modal-overlay" onClick={onClose}>
      <div className="activity-modal" onClick={(e) => e.stopPropagation()}>
        <div className="activity-modal__header">
          <h2>Log activity</h2>
          <button className="activity-modal__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="activity-modal__form">
          <label htmlFor="activity-type">Type *</label>
          <select
            id="activity-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">Select a type</option>
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <label htmlFor="activity-notes">Notes</label>
          <textarea
            id="activity-notes"
            rows={3}
            placeholder="What happened?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <label htmlFor="activity-lead">Lead</label>
          <select
            id="activity-lead"
            value={leadId}
            onChange={(e) => {
              setLeadId(e.target.value)
              setCustomerId('')
              setDealId('')
            }}
            disabled={loadingOptions}
          >
            <option value="">
              {loadingOptions ? 'Loading leads...' : 'None'}
            </option>
            {leads.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>

          <label htmlFor="activity-customer">Customer</label>
          <select
            id="activity-customer"
            value={customerId}
            onChange={(e) => {
              setCustomerId(e.target.value)
              setLeadId('')
              setDealId('')
            }}
            disabled={loadingOptions}
          >
            <option value="">
              {loadingOptions ? 'Loading customers...' : 'None'}
            </option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <label htmlFor="activity-deal">Deal</label>
          <select
            id="activity-deal"
            value={dealId}
            onChange={(e) => {
              setDealId(e.target.value)
              setLeadId('')
              setCustomerId('')
            }}
            disabled={loadingOptions}
          >
            <option value="">
              {loadingOptions ? 'Loading deals...' : 'None'}
            </option>
            {deals.map((d) => (
              <option key={d.id} value={d.id}>{d.title}</option>
            ))}
          </select>

          {error && <p className="activity-modal__error">{error}</p>}

          <div className="activity-modal__actions">
            <button type="button" className="activity-modal__cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="activity-modal__submit"
              disabled={saving || loadingOptions || !type}
            >
              {saving ? 'Saving...' : 'Log activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ActivityModal