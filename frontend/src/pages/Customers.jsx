import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, ChevronLeft, ChevronRight, Download, Trash2 } from 'lucide-react'
import api from '../api/api'
import CustomerModal from '../components/CustomerModal'
import CustomerDetailPanel from '../components/CustomerDetailPanel'
import { exportToCsv } from '../utils/csvExport'
import './Customers.css'

const PAGE_SIZE = 10

function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [exporting, setExporting] = useState(false)

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const buildFilterParams = () => {
    const params = {}
    if (search) params.search = search
    if (sort) params.sort = sort
    return params
  }

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { ...buildFilterParams(), page, limit: PAGE_SIZE }
      const response = await api.get('/customers', { params })
      setCustomers(response.data.customers)

      const pagination = response.data.pagination
      if (pagination) {
        setTotalPages(pagination.total_pages)
        setTotal(pagination.total)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load customers. Please try again.')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, sort, page])

  useEffect(() => {
    setPage(1)
  }, [search, sort])

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchCustomers()
    }, 300)

    return () => clearTimeout(timeout)
  }, [fetchCustomers])

  useEffect(() => {
    setSelectedIds(new Set())
  }, [customers])

  const handleExport = async () => {
    setExporting(true)
    try {
      const params = { ...buildFilterParams(), page: 1, limit: 10000 }
      const response = await api.get('/customers', { params })
      const rows = response.data.customers || []

      exportToCsv('customers.csv', rows, [
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { value: (r) => new Date(r.created_at).toLocaleDateString(), label: 'Created' },
      ])
    } catch (err) {
      setError('Could not export customers.')
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
    if (selectedIds.size === customers.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(customers.map((c) => c.id)))
    }
  }

  const handleBulkDelete = async () => {
    const count = selectedIds.size
    if (count === 0) return
    if (!window.confirm(`Delete ${count} customer${count === 1 ? '' : 's'}? This can't be undone.`)) {
      return
    }

    setBulkDeleting(true)
    try {
      await Promise.all([...selectedIds].map((id) => api.delete(`/customers/${id}`)))
      setSelectedIds(new Set())
      fetchCustomers()
    } catch (err) {
      setError('Could not delete some customers. Please try again.')
    } finally {
      setBulkDeleting(false)
    }
  }

  const allSelected = customers.length > 0 && selectedIds.size === customers.length

  return (
    <div className="customers-page">
      <div className="customers-page__header">
        <div>
          <h1>Customers</h1>
          {!loading && !error && (
            <p className="customers-page__count">
              {total} {total === 1 ? 'customer' : 'customers'}
            </p>
          )}
        </div>
        <div className="customers-page__header-actions">
          <button className="customers-page__export-btn" onClick={handleExport} disabled={exporting}>
            <Download size={16} />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
          <button className="customers-page__new-btn" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} />
            New Customer
          </button>
        </div>
      </div>

      <div className="customers-page__filters">
        <div className="customers-page__search">
          <Search size={16} className="customers-page__search-icon" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="customers-page__sort-select"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="">Sort: Newest</option>
          <option value="name">Sort: Name</option>
        </select>
      </div>

      {selectedIds.size > 0 && (
        <div className="customers-page__bulk-bar">
          <span>{selectedIds.size} selected</span>
          <div className="customers-page__bulk-bar-actions">
            <button
              className="customers-page__bulk-cancel-btn"
              onClick={() => setSelectedIds(new Set())}
              disabled={bulkDeleting}
            >
              Cancel
            </button>
            <button
              className="customers-page__bulk-delete-btn"
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
            >
              <Trash2 size={14} />
              {bulkDeleting ? 'Deleting...' : 'Delete selected'}
            </button>
          </div>
        </div>
      )}

      <div className="customers-page__table-wrapper">
        {loading && <p className="customers-page__message">Loading customers...</p>}

        {!loading && error && (
          <p className="customers-page__message customers-page__message--error">{error}</p>
        )}

        {!loading && !error && customers.length === 0 && (
          <p className="customers-page__message">No customers found.</p>
        )}

        {!loading && !error && customers.length > 0 && (
          <table className="customers-table">
            <thead>
              <tr>
                <th className="customers-table__checkbox-col">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr
                  key={customer.id}
                  className="customers-table__row"
                  onClick={() => setSelectedCustomer(customer)}
                >
                  <td
                    className="customers-table__checkbox-col"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(customer.id)}
                      onChange={() => toggleRow(customer.id)}
                    />
                  </td>
                  <td>{customer.name}</td>
                  <td>{customer.email || '—'}</td>
                  <td>{customer.phone || '—'}</td>
                  <td>{new Date(customer.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!loading && !error && total > 0 && (
        <div className="customers-page__pagination">
          <span className="customers-page__pagination-info">
            Page {page} of {totalPages} · {total} {total === 1 ? 'customer' : 'customers'}
          </span>
          <div className="customers-page__pagination-controls">
            <button
              className="customers-page__pagination-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft size={16} />
              Prev
            </button>
            <button
              className="customers-page__pagination-btn"
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
        <CustomerModal
          onClose={() => setIsModalOpen(false)}
          onSaved={() => {
            setIsModalOpen(false)
            fetchCustomers()
          }}
        />
      )}

      {selectedCustomer && (
        <CustomerDetailPanel
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onUpdated={() => {
            setSelectedCustomer(null)
            fetchCustomers()
          }}
          onDeleted={() => {
            setSelectedCustomer(null)
            fetchCustomers()
          }}
        />
      )}
    </div>
  )
}

export default Customers
