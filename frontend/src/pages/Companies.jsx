import { useState, useEffect, useCallback } from 'react'
import { Search, Plus } from 'lucide-react'
import api from '../api/api'
import CompanyDetailPanel from '../components/CompanyDetailPanel'
import CompanyModal from '../components/CompanyModal'
import './Companies.css'

function Companies() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('')
  const [industry, setIndustry] = useState('')
  const [industryOptions, setIndustryOptions] = useState([])

  const [selectedCompany, setSelectedCompany] = useState(null)
  const [panelCustomers, setPanelCustomers] = useState([])
  const [panelLoading, setPanelLoading] = useState(false)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCompany, setEditingCompany] = useState(null)

  const fetchCompanies = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (search) params.search = search
      if (sort) params.sort = sort
      if (industry) params.industry = industry

      const response = await api.get('/companies', { params })
      setCompanies(response.data.companies)
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load companies. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [search, sort, industry])

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchCompanies()
    }, 300)

    return () => clearTimeout(timeout)
  }, [fetchCompanies])

  useEffect(() => {
    async function loadIndustries() {
      try {
        const response = await api.get('/companies')
        const unique = [...new Set(
          response.data.companies
            .map((c) => c.industry)
            .filter((i) => i)
        )].sort()
        setIndustryOptions(unique)
      } catch (err) {
        // silently ignore — industry filter just won't populate
      }
    }
    loadIndustries()
  }, [])

  const handleRowClick = async (company) => {
    setSelectedCompany(company)
    setPanelCustomers([])
    setPanelLoading(true)
    try {
      const response = await api.get(`/companies/${company.id}`)
      setPanelCustomers(response.data.customers)
    } catch (err) {
      setPanelCustomers([])
    } finally {
      setPanelLoading(false)
    }
  }

  const handlePanelClose = () => {
    setSelectedCompany(null)
    setPanelCustomers([])
  }

  const handleEditRequest = (company) => {
    setSelectedCompany(null)
    setPanelCustomers([])
    setEditingCompany(company)
  }

  const handleModalSaved = () => {
    setShowCreateModal(false)
    setEditingCompany(null)
    fetchCompanies()
  }

  const handleDeleted = () => {
    setSelectedCompany(null)
    setPanelCustomers([])
    fetchCompanies()
  }

  return (
    <div className="companies-page">
      <div className="companies-page__header">
        <div>
          <h1>Companies</h1>
          {!loading && !error && (
            <p className="companies-page__count">
              {companies.length} {companies.length === 1 ? 'company' : 'companies'}
            </p>
          )}
        </div>
        <button className="companies-page__new-btn" onClick={() => setShowCreateModal(true)}>
          <Plus size={16} />
          New Company
        </button>
      </div>

      <div className="companies-page__filters">
        <div className="companies-page__search">
          <Search size={16} className="companies-page__search-icon" />
          <input
            type="text"
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="companies-page__sort-select"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="">Sort: Newest</option>
          <option value="name">Sort: Name</option>
        </select>

        <select
          className="companies-page__sort-select"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
        >
          <option value="">All Industries</option>
          {industryOptions.map((i) => (
            <option key={i} value={i}>{i}</option>
          ))}
        </select>
      </div>

      <div className="companies-page__table-wrapper">
        {loading && <p className="companies-page__message">Loading companies...</p>}

        {!loading && error && (
          <p className="companies-page__message companies-page__message--error">{error}</p>
        )}

        {!loading && !error && companies.length === 0 && (
          <p className="companies-page__message">No companies found.</p>
        )}

        {!loading && !error && companies.length > 0 && (
          <table className="companies-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Industry</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr
                  key={company.id}
                  className="companies-table__row"
                  onClick={() => handleRowClick(company)}
                >
                  <td>{company.name}</td>
                  <td>{company.industry || '—'}</td>
                  <td>{new Date(company.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedCompany && (
        <CompanyDetailPanel
          company={selectedCompany}
          customers={panelLoading ? [] : panelCustomers}
          onClose={handlePanelClose}
          onEdit={handleEditRequest}
          onDeleted={handleDeleted}
        />
      )}

      {showCreateModal && (
        <CompanyModal
          onClose={() => setShowCreateModal(false)}
          onSaved={handleModalSaved}
        />
      )}

      {editingCompany && (
        <CompanyModal
          company={editingCompany}
          onClose={() => setEditingCompany(null)}
          onSaved={handleModalSaved}
        />
      )}
    </div>
  )
}

export default Companies
