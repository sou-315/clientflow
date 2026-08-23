import { useState } from 'react'
import { Building2, X, Mail, Pencil } from 'lucide-react'
import api from '../api/api'
import './CompanyDetailPanel.css'

function CompanyDetailPanel({ company, customers, onClose, onEdit, onDeleted }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const handleDelete = async () => {
    setDeleting(true)
    setError('')
    try {
      await api.delete(`/companies/${company.id}`)
      onDeleted()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not delete company.')
      setDeleting(false)
    }
  }

  return (
    <div className="company-panel-overlay" onClick={onClose}>
      <div className="company-panel" onClick={(e) => e.stopPropagation()}>
        <div className="company-panel__header">
          <h2>Company details</h2>
          <button className="company-panel__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="company-panel__profile">
          <div className="company-panel__avatar">
            <Building2 size={20} />
          </div>
          <div className="company-panel__profile-info">
            <p className="company-panel__name">{company.name}</p>
            {company.industry && (
              <span className="company-panel__industry-tag">{company.industry}</span>
            )}
          </div>
        </div>
        <div className="company-panel__field">
          <span className="company-panel__label">Industry</span>
          <span className="company-panel__value">{company.industry || '—'}</span>
        </div>
        <div className="company-panel__field">
          <span className="company-panel__label">Created</span>
          <span className="company-panel__value">
            {new Date(company.created_at).toLocaleDateString()}
          </span>
        </div>

        {!confirmingDelete ? (
          <div className="company-panel__actions">
            {onEdit && (
              <button className="company-panel__edit-btn" onClick={() => onEdit(company)}>
                <Pencil size={14} />
                Edit
              </button>
            )}
            {onDeleted && (
              <button
                className="company-panel__delete-btn"
                onClick={() => setConfirmingDelete(true)}
              >
                Delete
              </button>
            )}
          </div>
        ) : (
          <div className="company-panel__confirm">
            <p>Delete this company? This can't be undone.</p>
            <div className="company-panel__actions">
              <button
                className="company-panel__edit-btn"
                onClick={() => setConfirmingDelete(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="company-panel__delete-btn"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Yes, delete'}
              </button>
            </div>
          </div>
        )}

        {error && <p className="company-panel__error">{error}</p>}

        <div className="company-panel__customers">
          <span className="company-panel__label">
            Customers ({customers.length})
          </span>
          {customers.length === 0 ? (
            <p className="company-panel__empty">No customers linked to this company yet.</p>
          ) : (
            <ul className="company-panel__customer-list">
              {customers.map((customer) => (
                <li key={customer.id} className="company-panel__customer-item">
                  <span className="company-panel__customer-name">{customer.name}</span>
                  {customer.email && (
                    <span className="company-panel__customer-email">
                      <Mail size={12} />
                      {customer.email}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default CompanyDetailPanel