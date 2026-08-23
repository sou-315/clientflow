import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import api from '../api/api'
import './TaskModal.css'

const PRIORITY_OPTIONS = ['Low', 'Medium', 'High']

function TaskModal({ onClose, onSaved }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState('Medium')
  const [assignedTo, setAssignedTo] = useState('')
  const [leadId, setLeadId] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [dealId, setDealId] = useState('')

  const [users, setUsers] = useState([])
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
        const [usersRes, leadsRes, customersRes, dealsRes] = await Promise.all([
          api.get('/users'),
          api.get('/leads'),
          api.get('/customers'),
          api.get('/deals'),
        ])
        setUsers(usersRes.data.users)
        setLeads(leadsRes.data.leads)
        setCustomers(customersRes.data.customers)
        setDeals(dealsRes.data.deals)
      } catch (err) {
        setError('Could not load form options. Please try again.')
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

    setSaving(true)
    try {
      await api.post('/tasks', {
        title,
        description: description || null,
        due_date: dueDate || null,
        priority,
        assigned_to: assignedTo ? Number(assignedTo) : null,
        lead_id: leadId ? Number(leadId) : null,
        customer_id: customerId ? Number(customerId) : null,
        deal_id: dealId ? Number(dealId) : null,
      })
      onSaved()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save task. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="task-modal-overlay" onClick={onClose}>
      <div className="task-modal" onClick={(e) => e.stopPropagation()}>
        <div className="task-modal__header">
          <h2>New task</h2>
          <button className="task-modal__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="task-modal__form">
          <label htmlFor="task-title">Title *</label>
          <input
            id="task-title"
            type="text"
            placeholder="Send proposal to Acme"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <label htmlFor="task-description">Description</label>
          <textarea
            id="task-description"
            rows={3}
            placeholder="Optional details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <label htmlFor="task-due-date">Due date</label>
          <input
            id="task-due-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />

          <label htmlFor="task-priority">Priority</label>
          <select
            id="task-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <label htmlFor="task-assigned">Assigned to</label>
          <select
            id="task-assigned"
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

                   <label htmlFor="task-lead">Lead</label>
          <select
            id="task-lead"
            value={leadId}
            onChange={(e) => {
              setLeadId(e.target.value)
              if (e.target.value) {
                setCustomerId('')
                setDealId('')
              }
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

                   <label htmlFor="task-customer">Customer</label>
          <select
            id="task-customer"
            value={customerId}
            onChange={(e) => {
              setCustomerId(e.target.value)
              if (e.target.value) {
                setLeadId('')
                setDealId('')
              }
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
          <label htmlFor="task-deal">Deal</label>
          <select
            id="task-deal"
            value={dealId}
            onChange={(e) => {
              setDealId(e.target.value)
              if (e.target.value) {
                setLeadId('')
                setCustomerId('')
              }
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

          {error && <p className="task-modal__error">{error}</p>}

          <div className="task-modal__actions">
            <button type="button" className="task-modal__cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="task-modal__submit"
              disabled={saving || loadingOptions}
            >
              {saving ? 'Creating...' : 'Create task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TaskModal