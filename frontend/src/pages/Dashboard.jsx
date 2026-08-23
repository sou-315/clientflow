import { useState, useEffect } from 'react'
import {
  Users,
  Building2,
  Briefcase,
  CheckCircle2,
  XCircle,
  DollarSign,
  ClipboardList,
  Phone,
  Mail,
  StickyNote,
  AlarmClock,
  Calendar,
  ChevronDown,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts'
import api from '../api/api'
import './Dashboard.css'

const ACTIVITY_ICON_MAP = {
  Call: { icon: Phone, tone: 'green' },
  Meeting: { icon: Users, tone: 'blue' },
  Email: { icon: Mail, tone: 'purple' },
  Note: { icon: StickyNote, tone: 'amber' },
  'Follow-up': { icon: AlarmClock, tone: 'red' },
}

function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [totalLeads, setTotalLeads] = useState(0)
  const [totalCustomers, setTotalCustomers] = useState(0)
  const [openDeals, setOpenDeals] = useState(0)
  const [wonDeals, setWonDeals] = useState(0)
  const [lostDeals, setLostDeals] = useState(0)
  const [revenue, setRevenue] = useState(0)
  const [pendingTasks, setPendingTasks] = useState(0)
  const [recentActivities, setRecentActivities] = useState([])
  const [dealsOverview, setDealsOverview] = useState([])
  const [upcomingDeals, setUpcomingDeals] = useState([])
  const [avgDealValue, setAvgDealValue] = useState(0)
  const [winRate, setWinRate] = useState(0)

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true)
      setError('')
      try {
        const [leadsRes, customersRes, dealsRes, tasksRes, activitiesRes] = await Promise.all([
          api.get('/leads'),
          api.get('/customers'),
          api.get('/deals'),
          api.get('/tasks'),
          api.get('/activities'),
        ])

        const leads = leadsRes.data.leads || []
        const customers = customersRes.data.customers || []
        const deals = dealsRes.data.deals || []
        const tasks = tasksRes.data.tasks || []
        const activities = activitiesRes.data.activities || []

        const wonDealsList = deals.filter((d) => d.status === 'Won')
        const lostDealsCount = deals.filter((d) => d.status === 'Lost').length
        const wonRevenue = wonDealsList.reduce((sum, d) => sum + Number(d.value || 0), 0)

        setTotalLeads(leads.length)
        setTotalCustomers(customers.length)
        setOpenDeals(deals.filter((d) => d.status === 'Open').length)
        setWonDeals(wonDealsList.length)
        setLostDeals(lostDealsCount)
        setRevenue(wonRevenue)
        setPendingTasks(tasks.filter((t) => t.status === 'Pending').length)
        setRecentActivities(activities.slice(0, 5))

        setDealsOverview([
          { name: 'Open', value: deals.filter((d) => d.status === 'Open').length, color: '#4B8FD6' },
          { name: 'Won', value: wonDealsList.length, color: '#489159' },
          { name: 'Lost', value: lostDealsCount, color: '#C75B52' },
        ])

        setUpcomingDeals(
          deals
            .filter((d) => d.expected_close_date)
            .sort((a, b) => new Date(a.expected_close_date) - new Date(b.expected_close_date))
            .slice(0, 5)
        )

        setAvgDealValue(wonDealsList.length > 0 ? wonRevenue / wonDealsList.length : 0)
        setWinRate(
          (wonDealsList.length + lostDealsCount) > 0
            ? (wonDealsList.length / (wonDealsList.length + lostDealsCount)) * 100
            : 0
        )
      } catch (err) {
        setError('Could not load dashboard data. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const statCards = [
    { label: 'Total Leads', value: totalLeads, icon: Users, tone: 'green' },
    { label: 'Total Customers', value: totalCustomers, icon: Building2, tone: 'green' },
    { label: 'Open Deals', value: openDeals, icon: Briefcase, tone: 'green' },
    { label: 'Won Deals', value: wonDeals, icon: CheckCircle2, tone: 'green' },
    { label: 'Lost Deals', value: lostDeals, icon: XCircle, tone: 'red' },
  ]

  const formattedRevenue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(revenue)

  const formattedAvgDealValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(avgDealValue)

  const formattedWinRate = `${winRate.toFixed(1)}%`

  const bottomMetrics = [
    { label: 'Avg. Deal Value', value: formattedAvgDealValue },
    { label: 'Win Rate', value: formattedWinRate },
  ]

  return (
    <div className="dashboard-page">
      <div className="dashboard-page__header">
        <div>
          <h1>Dashboard</h1>
          <p className="dashboard-page__subtitle">Welcome back, sou! Here's what's happening with your CRM.</p>
        </div>
        <button className="dashboard-page__period-btn">
          <Calendar size={16} />
          This Month
          <ChevronDown size={16} />
        </button>
      </div>

      {error && (
        <p className="dashboard-page__message dashboard-page__message--error">{error}</p>
      )}

      <div className="dashboard-stats-row">
        {statCards.map((card) => (
          <div key={card.label} className="dashboard-stat-card">
            <div className={`dashboard-stat-card__icon dashboard-stat-card__icon--${card.tone}`}>
              <card.icon size={20} />
            </div>
            <p className="dashboard-stat-card__label">{card.label}</p>
            <p className="dashboard-stat-card__value">{loading ? '—' : card.value}</p>
          </div>
        ))}
      </div>

      <div className="dashboard-row-2">
        <div className="dashboard-card dashboard-card--revenue">
          <div className="dashboard-card__icon dashboard-card__icon--amber">
            <DollarSign size={20} />
          </div>
          <p className="dashboard-card__label">Total Revenue</p>
          <p className="dashboard-card__value">{loading ? '—' : formattedRevenue}</p>
        </div>

        <div className="dashboard-card dashboard-card--tasks">
          <div className="dashboard-card__icon dashboard-card__icon--amber">
            <ClipboardList size={20} />
          </div>
          <p className="dashboard-card__label">Pending Tasks</p>
          <p className="dashboard-card__value">{loading ? '—' : pendingTasks}</p>
        </div>

        <div className="dashboard-card dashboard-card--donut">
          <h3>Deals Overview</h3>
          <div className="dashboard-donut-wrapper">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={dealsOverview}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {dealsOverview.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <ul className="dashboard-donut-legend">
              {dealsOverview.map((entry) => (
                <li key={entry.name}>
                  <span className="dashboard-donut-legend__dot" style={{ background: entry.color }} />
                  {entry.name} ({entry.value})
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="dashboard-row-3">
        <div className="dashboard-card dashboard-card--bar">
          <h3>Upcoming Deals by Close Date</h3>

          {loading && <p className="dashboard-page__message">Loading upcoming deals...</p>}

          {!loading && upcomingDeals.length === 0 && (
            <p className="dashboard-page__message">No deals with an expected close date yet.</p>
          )}

          {!loading && upcomingDeals.length > 0 && (
            <ul className="dashboard-activities-list">
              {upcomingDeals.map((deal) => {
                const closeDate = new Date(deal.expected_close_date)
                const formattedValue = new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  maximumFractionDigits: 0,
                }).format(Number(deal.value || 0))

                return (
                  <li key={deal.id} className="dashboard-activities-list__item">
                    <div className="dashboard-activities-list__icon dashboard-activities-list__icon--green">
                      <Briefcase size={16} />
                    </div>
                    <div className="dashboard-activities-list__content">
                      <p className="dashboard-activities-list__title">{deal.title}</p>
                      <p className="dashboard-activities-list__desc">{formattedValue} · {deal.status}</p>
                    </div>
                    <div className="dashboard-activities-list__meta">
                      <span>{closeDate.toLocaleDateString()}</span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          <div className="dashboard-bottom-metrics">
            {bottomMetrics.map((metric) => (
              <div key={metric.label} className="dashboard-bottom-metrics__item">
                <p className="dashboard-bottom-metrics__label">{metric.label}</p>
                <p className="dashboard-bottom-metrics__value">{loading ? '—' : metric.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-card dashboard-card--activities">
          <div className="dashboard-card__header-row">
            <h3>Recent Activities</h3>
            <a href="/activities" className="dashboard-card__view-all">View all</a>
          </div>

          {loading && <p className="dashboard-page__message">Loading activities...</p>}

          {!loading && recentActivities.length === 0 && (
            <p className="dashboard-page__message">No recent activities.</p>
          )}

          {!loading && recentActivities.length > 0 && (
            <ul className="dashboard-activities-list">
              {recentActivities.map((activity) => {
                const mapping = ACTIVITY_ICON_MAP[activity.type] || { icon: StickyNote, tone: 'amber' }
                const ActivityIcon = mapping.icon
                const createdDate = new Date(activity.created_at)

                return (
                  <li key={activity.id} className="dashboard-activities-list__item">
                    <div className={`dashboard-activities-list__icon dashboard-activities-list__icon--${mapping.tone}`}>
                      <ActivityIcon size={16} />
                    </div>
                    <div className="dashboard-activities-list__content">
                      <p className="dashboard-activities-list__title">{activity.type}</p>
                      <p className="dashboard-activities-list__desc">{activity.notes || '—'}</p>
                    </div>
                    <div className="dashboard-activities-list__meta">
                      <span>{createdDate.toLocaleDateString()}</span>
                      <span>{createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
