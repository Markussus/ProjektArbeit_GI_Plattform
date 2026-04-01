import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Cpu, GitBranch, Hash, ToggleLeft, TableProperties } from 'lucide-react'

interface ModuleCardProps {
  icon: LucideIcon
  title: string
  description: string
  path: string
  color: string
}

function ModuleCard({ icon: Icon, title, description, path, color }: ModuleCardProps) {
  return (
    <Link
      to={path}
      className="flex items-center gap-4 rounded-lg p-4 transition-colors hover:bg-muted/50"
    >
      <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${color}`}>
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
    { icon: Cpu, titleKey: 'turing.title', descKey: 'home.turingDesc', path: '/turing-machine', color: 'bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400' },
    { icon: GitBranch, titleKey: 'automata.title', descKey: 'home.automataDesc', path: '/finite-automata', color: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400' },
    { icon: Hash, titleKey: 'number.title', descKey: 'home.numberDesc', path: '/number-systems', color: 'bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400' },
    { icon: ToggleLeft, titleKey: 'moore.title', descKey: 'home.mooreDesc', path: '/moore-mealy', color: 'bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400' },
    { icon: TableProperties, titleKey: 'dnf.title', descKey: 'home.dnfDesc', path: '/dnf', color: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400' },
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
            <span className="text-sm font-semibold text-foreground">{t('home.exploreModules')}</span>
          </div>
        </div>
        <div className="divide-y divide-border">
          {modules.map(({ icon, titleKey, descKey, path, color }) => (
            <ModuleCard
              key={path}
              icon={icon}
              title={t(titleKey)}
              description={t(descKey)}
              path={path}
              color={color}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

