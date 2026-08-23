import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import api from '../api/api'
import './CompanyModal.css'

function CompanyModal({ company, onClose, onSaved }) {
  const isEdit = Boolean(company)

  const [name, setName] = useState(company?.name || '')
  const [industry, setIndustry] = useState(company?.industry || '')
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
      if (isEdit) {
        await api.put(`/companies/${company.id}`, { name, industry })
      } else {
        await api.post('/companies', { name, industry })
      }
      onSaved()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save company. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="company-modal-overlay" onClick={onClose}>
      <div className="company-modal" onClick={(e) => e.stopPropagation()}>
        <div className="company-modal__header">
          <h2>{isEdit ? 'Edit company' : 'New company'}</h2>
          <button className="company-modal__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="company-modal__form">
          <label htmlFor="company-name">Name</label>
          <input
            id="company-name"
            type="text"
            placeholder="Acme Corp"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <label htmlFor="company-industry">Industry</label>
          <input
            id="company-industry"
            type="text"
            placeholder="Tech"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
          />

          {error && <p className="company-modal__error">{error}</p>}

          <div className="company-modal__actions">
            <button type="button" className="company-modal__cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="company-modal__submit" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create company'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CompanyModal