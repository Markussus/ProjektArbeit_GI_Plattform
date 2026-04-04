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
              collapsed ? 'w-14' : 'w-56'
          )}
      >
        <div className="flex h-12 items-center px-4">
          <button
              type="button"
              onClick={onToggle}
              className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Toggle sidebar"
          >
            <Menu className="size-4" />
          </button>
        </div>

        {!collapsed && !isHome && (
            <div className="px-4 pb-2">
              <NavLink
                  to="/"
                  className="text-xs font-semibold tracking-wider text-orange-500 uppercase"
              >
                {t('sidebar.theoreticalCs')}
              </NavLink>
              <p className="mt-0.5 text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                {t('sidebar.moduleOverview')}
              </p>
            </div>
        )}

        <nav className="flex-1 space-y-1 px-2 py-2">
          {modules.map(({ labelKey, path, icon: Icon }) => (
              <NavLink
                  key={path}
                  to={path}
                  className={({ isActive }) =>
                      cn(
                          'group flex items-center gap-3 rounded-md px-2 py-2 text-xs font-semibold tracking-wide transition-all duration-200',
                          isActive
                              ? 'border-l-[3px] border-orange-500 bg-orange-50 text-foreground dark:bg-orange-500/10'
                              : 'border-l-[3px] border-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
                          collapsed && 'justify-center border-l-0 px-0',
                          collapsed && isActive && 'bg-orange-50 dark:bg-orange-500/10'
                      )
                  }
              >
                <Icon className="size-4 shrink-0 transition-colors group-[.border-orange-500]:text-orange-500" />
                {!collapsed && <span>{t(labelKey)}</span>}
              </NavLink>
          ))}
        </nav>

        <div className="space-y-1 border-t border-border px-2 py-3">
          <a
              href="#"
              className={cn(
                  'flex items-center gap-3 rounded-md px-2 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                  collapsed && 'justify-center px-0'
              )}
          >
            <FileText className="size-4 shrink-0" />
            {!collapsed && <span>{t('sidebar.documentation')}</span>}
          </a>
          <a
              href="#"
              className={cn(
                  'flex items-center gap-3 rounded-md px-2 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
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