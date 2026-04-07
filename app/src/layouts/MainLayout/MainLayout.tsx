import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from '@/components/shared/Header/Header'
import { Sidebar } from '@/components/shared/Sidebar/Sidebar'
import { Footer } from '@/components/shared/Footer/Footer'

export function MainLayout() {
  const location = useLocation()
  const isHome = location.pathname === '/'
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isHome)

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Header */}
      <Header />

      {/* Body: Sidebar + Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((prev) => !prev)}
        />
        <main className="flex-1 overflow-y-auto bg-background">
          <Outlet />
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}

