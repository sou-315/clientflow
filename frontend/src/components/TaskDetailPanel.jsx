import { useState, useEffect } from 'react'
import { X, CheckSquare } from 'lucide-react'
import api from '../api/api'
import StatusPill from './StatusPill'
import './TaskDetailPanel.css'

const PRIORITY_OPTIONS = ['Low', 'Medium', 'High']
const STATUS_OPTIONS = ['Pending', 'In Progress', 'Done']

function TaskDetailPanel({ task, onClose, onUpdated, onDeleted }) {
  const [mode, setMode] = useState('view') // 'view' | 'edit'
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const [dueDate, setDueDate] = useState(task.due_date || '')
  const [priority, setPriority] = useState(task.priority)
  const [status, setStatus] = useState(task.status)
  const [assignedTo, setAssignedTo] = useState(task.assigned_to || '')
  const [leadId, setLeadId] = useState(task.lead_id || '')
  const [customerId, setCustomerId] = useState(task.customer_id || '')
  const [dealId, setDealId] = useState(task.deal_id || '')

  const [users, setUsers] = useState([])
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
      setError('Could not load form options.')
    } finally {
      setLoadingOptions(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Title is required.')
      return
    }

    setSaving(true)
    try {
      await api.put(`/tasks/${task.id}`, {
        title,
        description: description || null,
        due_date: dueDate || null,
        priority,
        status,
        assigned_to: assignedTo ? Number(assignedTo) : null,
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
      await api.delete(`/tasks/${task.id}`)
      onDeleted()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not delete task.')
      setDeleting(false)
    }
  }

  const relatedTo = task.customer_name || task.deal_title || task.lead_name || '—'

  return (
    <div className="task-panel-overlay" onClick={onClose}>
      <div className="task-panel" onClick={(e) => e.stopPropagation()}>
        <div className="task-panel__header">
          <h2>{mode === 'edit' ? 'Edit task' : 'Task details'}</h2>
          <button className="task-panel__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {mode === 'view' && (
          <>
            <div className="task-panel__profile">
              <div className="task-panel__avatar">
                <CheckSquare size={20} />
              </div>
              <div className="task-panel__profile-info">
                <p className="task-panel__name">{task.title}</p>
                <StatusPill status={task.status} />
              </div>
            </div>

            <div className="task-panel__field">
              <span className="task-panel__label">Priority</span>
              <span className="task-panel__value">
                <StatusPill status={task.priority} />
              </span>
            </div>
            <div className="task-panel__field">
              <span className="task-panel__label">Assigned to</span>
              <span className="task-panel__value">{task.assigned_to_name || '—'}</span>
            </div>
            <div className="task-panel__field">
              <span className="task-panel__label">Due date</span>
              <span className="task-panel__value">
                {task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}
              </span>
            </div>
            <div className="task-panel__field">
              <span className="task-panel__label">Related to</span>
              <span className="task-panel__value">{relatedTo}</span>
            </div>
            {task.description && (
              <div className="task-panel__field">
                <span className="task-panel__label">Description</span>
                <span className="task-panel__value">{task.description}</span>
              </div>
            )}
            <div className="task-panel__field">
              <span className="task-panel__label">Created</span>
              <span className="task-panel__value">
                {new Date(task.created_at).toLocaleDateString()}
              </span>
            </div>

            {!confirmingDelete ? (
              <div className="task-panel__actions">
                <button className="task-panel__edit-btn" onClick={enterEditMode}>
                  Edit
                </button>
                <button
                  className="task-panel__delete-btn"
                  onClick={() => setConfirmingDelete(true)}
                >
                  Delete
                </button>
              </div>
            ) : (
              <div className="task-panel__confirm">
                <p>Delete this task? This can't be undone.</p>
                <div className="task-panel__actions">
                  <button
                    className="task-panel__edit-btn"
                    onClick={() => setConfirmingDelete(false)}
                    disabled={deleting}
                  >
                    Cancel
                  </button>
                  <button
                    className="task-panel__delete-btn"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? 'Deleting...' : 'Yes, delete'}
                  </button>
                </div>
              </div>
            )}

            {error && <p className="task-panel__error">{error}</p>}
          </>
        )}

        {mode === 'edit' && (
          <form onSubmit={handleSave} className="task-panel__form">
            <label htmlFor="edit-title">Title</label>
            <input
              id="edit-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <label htmlFor="edit-description">Description</label>
            <textarea
              id="edit-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <label htmlFor="edit-due-date">Due date</label>
            <input
              id="edit-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />

            <label htmlFor="edit-priority">Priority</label>
            <select id="edit-priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            <label htmlFor="edit-status">Status</label>
            <select id="edit-status" value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <label htmlFor="edit-assigned">Assigned to</label>
            <select
              id="edit-assigned"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              disabled={loadingOptions}
            >
              <option value="">{loadingOptions ? 'Loading...' : 'Unassigned'}</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>

                      <label htmlFor="edit-lead">Lead</label>
            <select
              id="edit-lead"
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
                if (e.target.value) {
                  setLeadId('')
                  setDealId('')
                }
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
                if (e.target.value) {
                  setLeadId('')
                  setCustomerId('')
                }
              }}
              disabled={loadingOptions}
            >
              <option value="">{loadingOptions ? 'Loading...' : 'None'}</option>
              {deals.map((d) => (
                <option key={d.id} value={d.id}>{d.title}</option>
              ))}
            </select>

            {error && <p className="task-panel__error">{error}</p>}

            <div className="task-panel__actions">
              <button
                type="button"
                className="task-panel__edit-btn"
                onClick={() => setMode('view')}
                disabled={saving}
              >
                Cancel
              </button>
              <button type="submit" className="task-panel__save-btn" disabled={saving}>
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default TaskDetailPanel