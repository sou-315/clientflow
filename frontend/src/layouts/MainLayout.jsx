import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import './MainLayout.css'

function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="main-layout">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className="main-layout__content">
        <Header />
        <main className="main-layout__page">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default MainLayout