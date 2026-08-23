import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import api from '../api/api'
import './AuditLog.css'

const ACTION_OPTIONS = ['create', 'update', 'delete']
const ENTITY_OPTIONS = ['lead', 'customer', 'company', 'deal', 'activity', 'task']
const PAGE_SIZE = 20

const ACTION_LABELS = {
  create: 'Created',
  update: 'Updated',
  delete: 'Deleted',
}

function parseDetails(detailsRaw) {
  try {
    const details = typeof detailsRaw === 'string' ? JSON.parse(detailsRaw) : detailsRaw
    return details && typeof details === 'object' ? details : null
  } catch (e) {
    return null
  }
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

function formatDetailsSummary(action, detailsRaw) {
  const details = parseDetails(detailsRaw)
  if (!details) return '—'

  if (action === 'update') {
    const parts = Object.entries(details).map(([field, change]) => {
      if (change && typeof change === 'object' && 'from' in change && 'to' in change) {
        return `${field}: ${formatValue(change.from)} → ${formatValue(change.to)}`
      }
      return `${field}: ${formatValue(change)}`
    })
    return parts.length > 0 ? parts.join(', ') : '—'
  }

  const label = details.title || details.name || null
  const rest = Object.entries(details)
    .filter(([key]) => !['id', 'title', 'name', 'created_at'].includes(key))
    .slice(0, 3)
    .map(([key, value]) => `${key}: ${formatValue(value)}`)
    .join(', ')

  return [label, rest].filter(Boolean).join(' — ') || '—'
}

function AuditLog() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [action, setAction] = useState('')
  const [entityType, setEntityType] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [selectedLog, setSelectedLog] = useState(null)

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, limit: PAGE_SIZE }
      if (action) params.action = action
      if (entityType) params.entity_type = entityType
      if (from) params.from = from
      if (to) params.to = to

      const response = await api.get('/audit-logs', { params })
      setLogs(response.data.logs)

      const pagination = response.data.pagination
      if (pagination) {
        setTotalPages(pagination.total_pages)
        setTotal(pagination.total)
      }
    } catch (err) {
      setError('Could not load audit log. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [action, entityType, from, to, page])

  useEffect(() => {
    setPage(1)
  }, [action, entityType, from, to])

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchLogs()
    }, 300)

    return () => clearTimeout(timeout)
  }, [fetchLogs])

  return (
    <div className="audit-log-page">
      <div className="audit-log-page__header">
        <div>
          <h1>Audit Log</h1>
          {!loading && !error && (
            <p className="audit-log-page__count">
              {total} {total === 1 ? 'entry' : 'entries'}
            </p>
          )}
        </div>
      </div>

      <div className="audit-log-page__filters">
        <select
          className="audit-log-page__filter-select"
          value={action}
          onChange={(e) => setAction(e.target.value)}
        >
          <option value="">All actions</option>
          {ACTION_OPTIONS.map((a) => (
            <option key={a} value={a}>{ACTION_LABELS[a]}</option>
          ))}
        </select>

        <select
          className="audit-log-page__filter-select"
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
        >
          <option value="">All modules</option>
          {ENTITY_OPTIONS.map((e) => (
            <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>
          ))}
        </select>

        <div className="audit-log-page__date-range">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="audit-log-page__date-input"
          />
          <span className="audit-log-page__date-sep">to</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="audit-log-page__date-input"
          />
        </div>
      </div>

      <div className="audit-log-page__table-wrapper">
        {loading && <p className="audit-log-page__message">Loading audit log...</p>}

        {!loading && error && (
          <p className="audit-log-page__message audit-log-page__message--error">{error}</p>
        )}

        {!loading && !error && logs.length === 0 && (
          <p className="audit-log-page__message">No audit log entries found.</p>
        )}

        {!loading && !error && logs.length > 0 && (
          <table className="audit-log-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>User</th>
                <th>Action</th>
                <th>Module</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="audit-log-table__row"
                  onClick={() => setSelectedLog(log)}
                >
                  <td>
                    {new Date(log.created_at).toLocaleDateString()}{' '}
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td>{log.user_name || '—'}</td>
                  <td>
                    <span className={`audit-log-table__action audit-log-table__action--${log.action}`}>
                      {ACTION_LABELS[log.action] || log.action}
                    </span>
                  </td>
                  <td>{log.entity_type} #{log.entity_id}</td>
                  <td className="audit-log-table__details">{formatDetailsSummary(log.action, log.details)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!loading && !error && total > 0 && (
        <div className="audit-log-page__pagination">
          <span className="audit-log-page__pagination-info">
            Page {page} of {totalPages} · {total} {total === 1 ? 'entry' : 'entries'}
          </span>
          <div className="audit-log-page__pagination-controls">
            <button
              className="audit-log-page__pagination-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft size={16} />
              Prev
            </button>
            <button
              className="audit-log-page__pagination-btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {selectedLog && (
        <AuditLogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  )
}

function AuditLogDetailModal({ log, onClose }) {
  const details = parseDetails(log.details)
  const isUpdate = log.action === 'update'

  return (
    <div className="audit-log-modal__overlay" onClick={onClose}>
      <div className="audit-log-modal" onClick={(e) => e.stopPropagation()}>
        <div className="audit-log-modal__header">
          <div>
            <span className={`audit-log-table__action audit-log-table__action--${log.action}`}>
              {ACTION_LABELS[log.action] || log.action}
            </span>
            <h2 className="audit-log-modal__title">
              {log.entity_type.charAt(0).toUpperCase() + log.entity_type.slice(1)} #{log.entity_id}
            </h2>
          </div>
          <button className="audit-log-modal__close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="audit-log-modal__meta">
          <div>
            <span className="audit-log-modal__meta-label">By</span>
            <span className="audit-log-modal__meta-value">{log.user_name || 'Unknown user'}</span>
          </div>
          <div>
            <span className="audit-log-modal__meta-label">When</span>
            <span className="audit-log-modal__meta-value">
              {new Date(log.created_at).toLocaleDateString()}{' '}
              {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        <div className="audit-log-modal__body">
          {!details && <p className="audit-log-modal__empty">No additional details recorded.</p>}

          {details && isUpdate && (
            <table className="audit-log-modal__table">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>From</th>
                  <th>To</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(details).map(([field, change]) => (
                  <tr key={field}>
                    <td className="audit-log-modal__field">{field}</td>
                    {change && typeof change === 'object' && 'from' in change && 'to' in change ? (
                      <>
                        <td>{formatValue(change.from)}</td>
                        <td>{formatValue(change.to)}</td>
                      </>
                    ) : (
                      <td colSpan={2}>{formatValue(change)}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {details && !isUpdate && (
            <table className="audit-log-modal__table">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(details).map(([field, value]) => (
                  <tr key={field}>
                    <td className="audit-log-modal__field">{field}</td>
                    <td>{formatValue(value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuditLog