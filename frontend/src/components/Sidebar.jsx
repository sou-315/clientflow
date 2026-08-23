import { NavLink } from 'react-router-dom'
import {
  LayoutGrid,
  Users,
  UserRound,
  Building2,
  CircleDollarSign,
  CalendarClock,
  CheckSquare,
  History,
  ChevronsLeft,
  ChevronsRight,
  Leaf,
} from 'lucide-react'
import './Sidebar.css'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { to: '/leads', label: 'Leads', icon: Users },
  { to: '/customers', label: 'Customers', icon: UserRound },
  { to: '/companies', label: 'Companies', icon: Building2 },
  { to: '/deals', label: 'Deals', icon: CircleDollarSign },
  { to: '/activities', label: 'Activities', icon: CalendarClock },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/audit-log', label: 'Audit Log', icon: History },
]

function Sidebar({ collapsed, onToggle }) {
  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      <div className="sidebar__decor sidebar__decor--circle-1"></div>
      <div className="sidebar__decor sidebar__decor--circle-2"></div>
      <div className="sidebar__decor sidebar__decor--dots"></div>

      <div className="sidebar__brand">
        <Leaf size={22} className="sidebar__brand-icon" />
        {!collapsed && (
          <span className="sidebar__brand-text">
            Client<span className="sidebar__brand-accent">Flow</span>
          </span>
        )}
      </div>

      <nav className="sidebar__nav">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
            }
          >
            <Icon size={20} className="sidebar__link-icon" />
            {!collapsed && <span className="sidebar__link-label">{label}</span>}
          </NavLink>
        ))}
      </nav>

      <button className="sidebar__toggle" onClick={onToggle}>
        {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
        {!collapsed && <span>Collapse</span>}
      </button>
    </aside>
  )
}

export default Sidebar