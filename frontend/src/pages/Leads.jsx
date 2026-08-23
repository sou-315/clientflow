import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import api from '../api/api'
import StatusPill from '../components/StatusPill'
import LeadModal from '../components/LeadModal'
import LeadDetailPanel from '../components/LeadDetailPanel'
import { exportToCsv } from '../utils/csvExport'
import './Leads.css'

const STATUS_OPTIONS = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost']
const PAGE_SIZE = 10

function Leads() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState(null)
  const [exporting, setExporting] = useState(false)

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const buildFilterParams = () => {
    const params = {}
    if (search) params.search = search
    if (status) params.status = status
    if (sort) params.sort = sort
    if (from) params.from = from
    if (to) params.to = to
    return params
  }

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { ...buildFilterParams(), page, limit: PAGE_SIZE }
      const response = await api.get('/leads', { params })
      setLeads(response.data.leads)

      const pagination = response.data.pagination
      if (pagination) {
        setTotalPages(pagination.total_pages)
        setTotal(pagination.total)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load leads. Please try again.')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, sort, from, to, page])

  useEffect(() => {
    setPage(1)
  }, [search, status, sort, from, to])

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchLeads()
    }, 300)

    return () => clearTimeout(timeout)
  }, [fetchLeads])

  const handleExport = async () => {
    setExporting(true)
    try {
      const params = { ...buildFilterParams(), page: 1, limit: 10000 }
      const response = await api.get('/leads', { params })
      const rows = response.data.leads || []

      exportToCsv('leads.csv', rows, [
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'status', label: 'Status' },
        { value: (r) => new Date(r.created_at).toLocaleDateString(), label: 'Created' },
      ])
    } catch (err) {
      setError('Could not export leads.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="leads-page">
      <div className="leads-page__header">
        <div>
          <h1>Leads</h1>
          {!loading && !error && (
            <p className="leads-page__count">
              {total} {total === 1 ? 'lead' : 'leads'}
            </p>
          )}
        </div>
        <div className="leads-page__header-actions">
          <button className="leads-page__export-btn" onClick={handleExport} disabled={exporting}>
            <Download size={16} />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
          <button className="leads-page__new-btn" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} />
            New Lead
          </button>
        </div>
      </div>

      <div className="leads-page__filters">
        <div className="leads-page__search">
          <Search size={16} className="leads-page__search-icon" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="leads-page__status-select"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          className="leads-page__status-select"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="">Sort: Newest</option>
          <option value="name">Sort: Name</option>
        </select>

        <div className="leads-page__date-range">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="leads-page__date-input"
          />
          <span className="leads-page__date-sep">to</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="leads-page__date-input"
          />
        </div>
      </div>

      <div className="leads-page__table-wrapper">
        {loading && <p className="leads-page__message">Loading leads...</p>}

        {!loading && error && (
          <p className="leads-page__message leads-page__message--error">{error}</p>
        )}

        {!loading && !error && leads.length === 0 && (
          <p className="leads-page__message">No leads found.</p>
        )}

        {!loading && !error && leads.length > 0 && (
          <table className="leads-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="leads-table__row"
                  onClick={() => setSelectedLead(lead)}
                >
                  <td>{lead.name}</td>
                  <td>{lead.email || '—'}</td>
                  <td>{lead.phone || '—'}</td>
                  <td><StatusPill status={lead.status} /></td>
                  <td>{new Date(lead.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!loading && !error && total > 0 && (
        <div className="leads-page__pagination">
          <span className="leads-page__pagination-info">
            Page {page} of {totalPages} · {total} lead{total === 1 ? '' : 's'}
          </span>
          <div className="leads-page__pagination-controls">
            <button
              className="leads-page__pagination-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft size={16} />
              Prev
            </button>
            <button
              className="leads-page__pagination-btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {isModalOpen && (
        <LeadModal
          onClose={() => setIsModalOpen(false)}
          onSaved={() => {
            setIsModalOpen(false)
            fetchLeads()
          }}
        />
      )}

      {selectedLead && (
        <LeadDetailPanel
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdated={() => {
            setSelectedLead(null)
            fetchLeads()
          }}
          onDeleted={() => {
            setSelectedLead(null)
            fetchLeads()
          }}
        />
      )}
    </div>
  )
}

export default Leads
