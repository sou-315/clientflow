import { useState, useEffect, useCallback } from 'react'
import { Plus, Search } from 'lucide-react'
import api from '../api/api'
import ActivityModal from '../components/ActivityModal'
import ActivityDetailPanel from '../components/ActivityDetailPanel'
import './Activities.css'

const TYPE_OPTIONS = ['Call', 'Meeting', 'Email', 'Note', 'Follow-up']

function Activities() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [type, setType] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState(null)

  const fetchActivities = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (type) params.type = type
      if (search) params.search = search
      if (sort) params.sort = sort

      const response = await api.get('/activities', { params })
      setActivities(response.data.activities)
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load activities. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [type, search, sort])

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchActivities()
    }, 300)

    return () => clearTimeout(timeout)
  }, [fetchActivities])

  const handleRowClick = async (activity) => {
    try {
      const response = await api.get(`/activities/${activity.id}`)
      setSelectedActivity(response.data.activity)
    } catch (err) {
      setSelectedActivity(activity)
    }
  }

  const handlePanelClose = () => setSelectedActivity(null)

  const handlePanelUpdated = () => {
    setSelectedActivity(null)
    fetchActivities()
  }

  const handlePanelDeleted = () => {
    setSelectedActivity(null)
    fetchActivities()
  }

  return (
    <div className="activities-page">
      <div className="activities-page__header">
        <div>
          <h1>Activities</h1>
          {!loading && !error && (
            <p className="activities-page__count">
              {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
            </p>
          )}
        </div>
        <button className="activities-page__new-btn" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} />
          New Activity
        </button>
      </div>

      <div className="activities-page__filters">
        <div className="activities-page__search">
          <Search size={16} className="activities-page__search-icon" />
          <input
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="activities-page__type-select"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="">All types</option>
          {TYPE_OPTIONS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select
          className="activities-page__type-select"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="">Sort: Newest</option>
          <option value="oldest">Sort: Oldest</option>
          <option value="type">Sort: Type A–Z</option>
        </select>
      </div>

      <div className="activities-page__table-wrapper">
        {loading && <p className="activities-page__message">Loading activities...</p>}

        {!loading && error && (
          <p className="activities-page__message activities-page__message--error">{error}</p>
        )}

        {!loading && !error && activities.length === 0 && (
          <p className="activities-page__message">No activities found.</p>
        )}

        {!loading && !error && activities.length > 0 && (
          <table className="activities-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Notes</th>
                <th>Customer</th>
                <th>Deal</th>
                <th>Lead</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((activity) => (
                <tr
                  key={activity.id}
                  className="activities-table__row"
                  onClick={() => handleRowClick(activity)}
                >
                  <td>{activity.type}</td>
                  <td>{activity.notes || '—'}</td>
                  <td>{activity.customer_name || '—'}</td>
                  <td>{activity.deal_title || '—'}</td>
                  <td>{activity.lead_name || '—'}</td>
                  <td>{new Date(activity.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <ActivityModal
          onClose={() => setIsModalOpen(false)}
          onSaved={() => {
            setIsModalOpen(false)
            fetchActivities()
          }}
        />
      )}

      {selectedActivity && (
        <ActivityDetailPanel
          activity={selectedActivity}
          onClose={handlePanelClose}
          onUpdated={handlePanelUpdated}
          onDeleted={handlePanelDeleted}
        />
      )}
    </div>
  )
}

export default Activities
