import { useState, useEffect, useCallback } from 'react'
import { Plus, Search } from 'lucide-react'
import api from '../api/api'
import StatusPill from '../components/StatusPill'
import TaskModal from '../components/TaskModal'
import TaskDetailPanel from '../components/TaskDetailPanel'
import './Tasks.css'

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Done']
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High']

function Tasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStatusId, setEditingStatusId] = useState(null)
  const [updatingStatusId, setUpdatingStatusId] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (status) params.status = status
      if (priority) params.priority = priority
      if (search) params.search = search
      if (sort) params.sort = sort

      const response = await api.get('/tasks', { params })
      setTasks(response.data.tasks)
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load tasks. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [status, priority, search, sort])

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchTasks()
    }, 300)

    return () => clearTimeout(timeout)
  }, [fetchTasks])

  const relatedTo = (task) => {
    return task.customer_name || task.deal_title || task.lead_name || '—'
  }

  const handleStatusChange = async (taskId, newStatus) => {
    setUpdatingStatusId(taskId)
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus })
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      )
    } catch (err) {
      setError('Could not update task status.')
    } finally {
      setUpdatingStatusId(null)
      setEditingStatusId(null)
    }
  }

  const closePanel = () => setSelectedTask(null)

  const handleTaskUpdated = () => {
    closePanel()
    fetchTasks()
  }

  const handleTaskDeleted = () => {
    closePanel()
    fetchTasks()
  }

  return (
    <div className="tasks-page">
      <div className="tasks-page__header">
        <div>
          <h1>Tasks</h1>
          {!loading && !error && (
            <p className="tasks-page__count">
              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
            </p>
          )}
        </div>
        <button className="tasks-page__new-btn" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} />
          New Task
        </button>
      </div>

      <div className="tasks-page__filters">
        <div className="tasks-page__search">
          <Search size={16} className="tasks-page__search-icon" />
          <input
            type="text"
            placeholder="Search by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="tasks-page__filter-select"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          className="tasks-page__filter-select"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option value="">All priorities</option>
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <select
          className="tasks-page__filter-select"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="">Sort: Due date (earliest)</option>
          <option value="due_latest">Sort: Due date (latest)</option>
          <option value="priority_high">Sort: Priority (High to Low)</option>
          <option value="priority_low">Sort: Priority (Low to High)</option>
          <option value="newest">Sort: Newest</option>
        </select>
      </div>

      <div className="tasks-page__table-wrapper">
        {loading && <p className="tasks-page__message">Loading tasks...</p>}

        {!loading && error && (
          <p className="tasks-page__message tasks-page__message--error">{error}</p>
        )}

        {!loading && !error && tasks.length === 0 && (
          <p className="tasks-page__message">No tasks found.</p>
        )}

        {!loading && !error && tasks.length > 0 && (
          <table className="tasks-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Due Date</th>
                <th>Related To</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  className="tasks-table__row"
                  onClick={() => setSelectedTask(task)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{task.title}</td>
                  <td><StatusPill status={task.priority} /></td>
                  <td onClick={(e) => e.stopPropagation()}>
                    {editingStatusId === task.id ? (
                      <select
                        className="tasks-table__status-select"
                        value={task.status}
                        autoFocus
                        disabled={updatingStatusId === task.id}
                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                        onBlur={() => setEditingStatusId(null)}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    ) : (
                      <button
                        type="button"
                        className="tasks-table__status-trigger"
                        onClick={() => setEditingStatusId(task.id)}
                      >
                        <StatusPill status={task.status} />
                      </button>
                    )}
                  </td>
                  <td>{task.assigned_to_name || '—'}</td>
                  <td>
                    {task.due_date
                      ? new Date(task.due_date).toLocaleDateString()
                      : '—'}
                  </td>
                  <td>{relatedTo(task)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <TaskModal
          onClose={() => setIsModalOpen(false)}
          onSaved={() => {
            setIsModalOpen(false)
            fetchTasks()
          }}
        />
      )}

      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          onClose={closePanel}
          onUpdated={handleTaskUpdated}
          onDeleted={handleTaskDeleted}
        />
      )}
    </div>
  )
}

export default Tasks
