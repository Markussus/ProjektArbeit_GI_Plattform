import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  Cpu,
  GitBranch,
  Hash,
  ToggleLeft,
  TableProperties,
  FileText,
  HelpCircle,
  Menu,
} from 'lucide-react'

interface ModuleNavItem {
  labelKey:
      | 'sidebar.turingMachines'
      | 'sidebar.finiteAutomata'
      | 'sidebar.numberSystems'
      | 'sidebar.mooreMealy'
      | 'sidebar.dnf'
  path: string
  icon: LucideIcon
}

const modules: ModuleNavItem[] = [
  { labelKey: 'sidebar.turingMachines', path: '/turing-machine', icon: Cpu },
  { labelKey: 'sidebar.finiteAutomata', path: '/finite-automata', icon: GitBranch },
  { labelKey: 'sidebar.numberSystems', path: '/number-systems', icon: Hash },
  { labelKey: 'sidebar.mooreMealy', path: '/moore-mealy', icon: ToggleLeft },
  { labelKey: 'sidebar.dnf', path: '/dnf', icon: TableProperties },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
      <aside
          className={cn(
              'flex h-full flex-col border-r border-border bg-background',
              collapsed ? 'w-16' : 'w-64'
          )}
      >
        <div className="flex h-14 items-center px-4">
          <button
              type="button"
              onClick={onToggle}
              className="flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Toggle sidebar"
          >
            <Menu className="size-4" />
          </button>
        </div>

        {!collapsed && !isHome && (
            <div className="px-4 pb-3">
              <NavLink
                  to="/"
                  className="text-brand text-sm font-semibold tracking-wider uppercase"
              >
                {t('sidebar.theoreticalCs')}
              </NavLink>
              <p className="mt-1 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                {t('sidebar.moduleOverview')}
              </p>
            </div>
        )}

        <nav className="flex-1 space-y-1 px-2 py-2">
          {modules.map(({ labelKey, path, icon: Icon }) => (
              <NavLink key={path} to={path}>
                {({ isActive }) => (
                    <div
                        className={cn(
                            'flex items-center gap-3 rounded-md px-3 py-3 text-sm font-semibold tracking-wide',
                            isActive
                                ? 'bg-nav-active-bg text-nav-active-fg'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                            collapsed && 'justify-center px-0'
                        )}
                    >
                      <Icon
                          className={cn(
                              'size-4 shrink-0',
                              isActive ? 'text-brand' : 'text-current'
                          )}
                      />
                      {!collapsed && <span>{t(labelKey)}</span>}
                    </div>
                )}
              </NavLink>
          ))}
        </nav>

        <div className="space-y-1 border-t border-border px-2 py-3">
          <a
              href="#"
              className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground',
                  collapsed && 'justify-center px-0'
              )}
          >
            <FileText className="size-4 shrink-0" />
            {!collapsed && <span>{t('sidebar.documentation')}</span>}
          </a>

          <a
              href="#"
              className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground',
                  collapsed && 'justify-center px-0'
              )}
          >
            <HelpCircle className="size-4 shrink-0" />
            {!collapsed && <span>{t('sidebar.support')}</span>}
          </a>
        </div>
      </aside>
  )
}