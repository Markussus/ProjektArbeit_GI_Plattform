import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Cpu, GitBranch, Hash, ToggleLeft, TableProperties } from 'lucide-react'
import { cn } from '@/lib/utils'

type ModuleAccent =
    | 'orange'
    | 'blue'
    | 'purple'
    | 'green'
    | 'rose'

interface ModuleCardProps {
  icon: LucideIcon
  title: string
  description: string
  path: string
  accent: ModuleAccent
}

function getAccentClasses(accent: ModuleAccent) {
  return {
    orange: 'bg-module-orange-bg text-module-orange-fg',
    blue: 'bg-module-blue-bg text-module-blue-fg',
    purple: 'bg-module-purple-bg text-module-purple-fg',
    green: 'bg-module-green-bg text-module-green-fg',
    rose: 'bg-module-rose-bg text-module-rose-fg',
  }[accent]
}

function ModuleCard({ icon: Icon, title, description, path, accent }: ModuleCardProps) {
  return (
      <Link
          to={path}
          className="flex items-center gap-4 rounded-lg p-4 hover:bg-muted/50"
      >
        <div
            className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-lg',
                getAccentClasses(accent)
            )}
        >
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </Link>
  )
}

export function ModuleSelector() {
  const { t } = useTranslation()

  const modules = [
    { icon: Cpu, titleKey: 'turing.title', descKey: 'home.turingDesc', path: '/turing-machine', accent: 'orange' },
    { icon: GitBranch, titleKey: 'automata.title', descKey: 'home.automataDesc', path: '/finite-automata', accent: 'blue' },
    { icon: Hash, titleKey: 'number.title', descKey: 'home.numberDesc', path: '/number-systems', accent: 'purple' },
    { icon: ToggleLeft, titleKey: 'moore.title', descKey: 'home.mooreDesc', path: '/moore-mealy', accent: 'green' },
    { icon: TableProperties, titleKey: 'dnf.title', descKey: 'home.dnfDesc', path: '/dnf', accent: 'rose' },
  ] as const

  return (
      <div className="mx-auto w-full max-w-lg">
        <p className="mb-3 text-center text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
          {t('home.selectModule')}
        </p>

        <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-3">
              <TableProperties className="size-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">
              {t('home.exploreModules')}
            </span>
            </div>
          </div>

          <div className="divide-y divide-border">
            {modules.map(({ icon, titleKey, descKey, path, accent }) => (
                <ModuleCard
                    key={path}
                    icon={icon}
                    title={t(titleKey)}
                    description={t(descKey)}
                    path={path}
                    accent={accent}
                />
            ))}
          </div>
        </div>
      </div>
  )
}