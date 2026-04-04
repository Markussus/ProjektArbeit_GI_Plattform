import { HelpCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router-dom'
import { ThemeToggle } from '@/components/shared/ThemeToggle/ThemeToggle'
import { LanguageToggle } from '@/components/shared/LanguageToggle/LanguageToggle'
import ThwsLogo from '@/assets/THWS.svg'

export function Header() {
    const { t } = useTranslation()
    const location = useLocation()
    const isHome = location.pathname === '/'

    return (
        <header className="flex h-14 items-center justify-between border-b border-border bg-background px-5">
            <div className="flex items-center gap-3">
                <Link to="/" className="flex items-center shrink-0">
                    <img
                        src={ThwsLogo}
                        alt="THWS Logo"
                        className="h-8 w-auto"
                    />
                </Link>

                <div className="h-6 w-px bg-border" />

                <span className="text-lg font-bold tracking-tight text-foreground">
    {isHome ? t('nav.home') : t('nav.title')}
  </span>
            </div>

            <div className="flex items-center gap-2">
                <LanguageToggle />
                <button
                    type="button"
                    className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Help"
                >
                    <HelpCircle className="size-4" />
                </button>
                <ThemeToggle />
            </div>
        </header>
    )
}