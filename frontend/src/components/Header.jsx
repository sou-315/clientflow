import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../api/api'
import './Header.css'

const ENTITY_ROUTES = {
  task: '/tasks',
  lead: '/leads',
  deal: '/deals',
}

function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const [unreadCount, setUnreadCount] = useState(0)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notifLoading, setNotifLoading] = useState(false)
  const notifRef = useRef(null)

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await api.get('/notifications/unread-count')
      setUnreadCount(response.data.unread_count)
    } catch (err) {
      // silently ignore — badge just won't update
    }
  }, [])

  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [fetchUnreadCount])

  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false)
      }
    }
    if (notifOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [notifOpen])

  const openNotifications = async () => {
    setNotifOpen((open) => !open)
    if (!notifOpen) {
      setNotifLoading(true)
      try {
        const response = await api.get('/notifications')
        setNotifications(response.data.notifications)
      } catch (err) {
        setNotifications([])
      } finally {
        setNotifLoading(false)
      }
    }
  }

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      try {
        await api.put(`/notifications/${notification.id}/read`)
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, is_read: 1 } : n))
        )
        setUnreadCount((c) => Math.max(0, c - 1))
      } catch (err) {
        // silently ignore
      }
    }

    setNotifOpen(false)
    const route = ENTITY_ROUTES[notification.entity_type]
    if (route) {
      navigate(route)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/mark-all-read')
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })))
      setUnreadCount(0)
    } catch (err) {
      // silently ignore
    }
  }

  return (
    <header className="header">
      <div className="header__search">
        <Search size={18} className="header__search-icon" />
        <input type="text" placeholder="Search anything..." />
      </div>

      <div className="header__right">
        <div className="header__notif-wrapper" ref={notifRef}>
          <button
            className="header__icon-btn"
            aria-label="Notifications"
            onClick={openNotifications}
          >
            <Bell size={20} />
            {unreadCount > 0 && <span className="header__badge">{unreadCount}</span>}
          </button>

          {notifOpen && (
            <div className="header__notif-panel">
              <div className="header__notif-panel-header">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <button className="header__notif-mark-all" onClick={handleMarkAllRead}>
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="header__notif-list">
                {notifLoading && (
                  <p className="header__notif-empty">Loading...</p>
                )}

                {!notifLoading && notifications.length === 0 && (
                  <p className="header__notif-empty">No notifications yet.</p>
                )}

                {!notifLoading && notifications.map((n) => (
                  <button
                    key={n.id}
                    className={`header__notif-item ${n.is_read ? '' : 'header__notif-item--unread'}`}
                    onClick={() => handleNotificationClick(n)}
                  >
                    <p className="header__notif-message">{n.message}</p>
                    <span className="header__notif-date">
                      {new Date(n.created_at).toLocaleDateString()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="header__user-wrapper">
          <div
            className="header__user"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <div className="header__avatar">{initials}</div>
            <div className="header__user-info">
              <span className="header__user-name">{user?.name || 'User'}</span>
              <span className="header__user-role">{user?.role || ''}</span>
            </div>
          </div>

          {menuOpen && (
            <div className="header__menu">
              <button className="header__menu-item" onClick={handleLogout}>
                <LogOut size={16} />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header