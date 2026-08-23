import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, ChevronLeft, ChevronRight, Download, Trash2 } from 'lucide-react'
import api from '../api/api'
import StatusPill from '../components/StatusPill'
import DealModal from '../components/DealModal'
import DealDetailPanel from '../components/DealDetailPanel'
import { exportToCsv } from '../utils/csvExport'
import './Deals.css'

const STATUS_OPTIONS = ['Open', 'Won', 'Lost']
const PAGE_SIZE = 10

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(value)
}

function Deals() {
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDeal, setSelectedDeal] = useState(null)
  const [exporting, setExporting] = useState(false)

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const buildFilterParams = () => {
    const params = {}
    if (search) params.search = search
    if (status) params.status = status
    if (sort) params.sort = sort
    return params
  }

  const fetchDeals = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { ...buildFilterParams(), page, limit: PAGE_SIZE }
      const response = await api.get('/deals', { params })
      setDeals(response.data.deals)

      const pagination = response.data.pagination
      if (pagination) {
        setTotalPages(pagination.total_pages)
        setTotal(pagination.total)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load deals. Please try again.')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, sort, page])

  useEffect(() => {
    setPage(1)
  }, [search, status, sort])

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchDeals()
    }, 300)

    return () => clearTimeout(timeout)
  }, [fetchDeals])

  useEffect(() => {
    setSelectedIds(new Set())
  }, [deals])

  const closePanel = () => setSelectedDeal(null)

  const handleDealUpdated = () => {
    closePanel()
    fetchDeals()
  }

  const handleDealDeleted = () => {
    closePanel()
    fetchDeals()
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const params = { ...buildFilterParams(), page: 1, limit: 10000 }
      const response = await api.get('/deals', { params })
      const rows = response.data.deals || []

      exportToCsv('deals.csv', rows, [
        { key: 'title', label: 'Title' },
        { value: (r) => formatCurrency(r.value), label: 'Value' },
        { key: 'status', label: 'Status' },
        { value: (r) => r.customer_name || `#${r.customer_id}`, label: 'Customer' },
        {
          value: (r) => (r.expected_close_date ? new Date(r.expected_close_date).toLocaleDateString() : ''),
          label: 'Close Date',
        },
        { value: (r) => new Date(r.created_at).toLocaleDateString(), label: 'Created' },
      ])
    } catch (err) {
      setError('Could not export deals.')
    } finally {
      setExporting(false)
    }
  }

  const toggleRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === deals.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(deals.map((d) => d.id)))
    }
  }

  const handleBulkDelete = async () => {
    const count = selectedIds.size
    if (count === 0) return
    if (!window.confirm(`Delete ${count} deal${count === 1 ? '' : 's'}? This can't be undone.`)) {
      return
    }

    setBulkDeleting(true)
    try {
      await Promise.all([...selectedIds].map((id) => api.delete(`/deals/${id}`)))
      setSelectedIds(new Set())
      fetchDeals()
    } catch (err) {
      setError('Could not delete some deals. Please try again.')
    } finally {
      setBulkDeleting(false)
    }
  }

  const allSelected = deals.length > 0 && selectedIds.size === deals.length

  return (
    <div className="deals-page">
      <div className="deals-page__header">
        <div>
          <h1>Deals</h1>
          {!loading && !error && (
            <p className="deals-page__count">
              {total} {total === 1 ? 'deal' : 'deals'}
            </p>
          )}
        </div>
        <div className="deals-page__header-actions">
          <button className="deals-page__export-btn" onClick={handleExport} disabled={exporting}>
            <Download size={16} />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
          <button className="deals-page__new-btn" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} />
            New Deal
          </button>
        </div>
      </div>

      <div className="deals-page__filters">
        <div className="deals-page__search">
          <Search size={16} className="deals-page__search-icon" />
          <input
            type="text"
            placeholder="Search by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="deals-page__status-select"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          className="deals-page__status-select"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="">Sort: Newest</option>
          <option value="value">Sort: Value</option>
          <option value="close_date">Sort: Close date</option>
        </select>
      </div>

      {selectedIds.size > 0 && (
        <div className="deals-page__bulk-bar">
          <span>{selectedIds.size} selected</span>
          <div className="deals-page__bulk-bar-actions">
            <button
              className="deals-page__bulk-cancel-btn"
              onClick={() => setSelectedIds(new Set())}
              disabled={bulkDeleting}
            >
              Cancel
            </button>
            <button
              className="deals-page__bulk-delete-btn"
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
            >
              <Trash2 size={14} />
              {bulkDeleting ? 'Deleting...' : 'Delete selected'}
            </button>
          </div>
        </div>
      )}

      <div className="deals-page__table-wrapper">
        {loading && <p className="deals-page__message">Loading deals...</p>}

        {!loading && error && (
          <p className="deals-page__message deals-page__message--error">{error}</p>
        )}

        {!loading && !error && deals.length === 0 && (
          <p className="deals-page__message">No deals found.</p>
        )}

        {!loading && !error && deals.length > 0 && (
          <table className="deals-table">
            <thead>
              <tr>
                <th className="deals-table__checkbox-col">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>Title</th>
                <th>Value</th>
                <th>Status</th>
                <th>Customer</th>
                <th>Close Date</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((deal) => (
                <tr
                  key={deal.id}
                  className="deals-table__row"
                  onClick={() => setSelectedDeal(deal)}
                  style={{ cursor: 'pointer' }}
                >
                  <td
                    className="deals-table__checkbox-col"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(deal.id)}
                      onChange={() => toggleRow(deal.id)}
                    />
                  </td>
                  <td>{deal.title}</td>
                  <td>{formatCurrency(deal.value)}</td>
                  <td><StatusPill status={deal.status} /></td>
                  <td>{deal.customer_name || `#${deal.customer_id}`}</td>
                  <td>
                    {deal.expected_close_date
                      ? new Date(deal.expected_close_date).toLocaleDateString()
                      : '—'}
                  </td>
                  <td>{new Date(deal.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!loading && !error && total > 0 && (
        <div className="deals-page__pagination">
          <span className="deals-page__pagination-info">
            Page {page} of {totalPages} · {total} {total === 1 ? 'deal' : 'deals'}
          </span>
          <div className="deals-page__pagination-controls">
            <button
              className="deals-page__pagination-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft size={16} />
              Prev
            </button>
            <button
              className="deals-page__pagination-btn"
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
        <DealModal
          onClose={() => setIsModalOpen(false)}
          onSaved={() => {
            setIsModalOpen(false)
            fetchDeals()
          }}
        />
      )}

      {selectedDeal && (
        <DealDetailPanel
          deal={selectedDeal}
          onClose={closePanel}
          onUpdated={handleDealUpdated}
          onDeleted={handleDealDeleted}
        />
      )}
    </div>
  )
}

export default Deals
