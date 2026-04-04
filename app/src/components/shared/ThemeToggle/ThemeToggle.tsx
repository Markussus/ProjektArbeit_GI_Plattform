import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import type { Theme } from '@/store/themeStore'

const nextThemeMap: Record<Theme, Theme> = {
  system: 'light',
  light: 'dark',
  dark: 'system',
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const nextTheme = nextThemeMap[theme]

  return (
      <button
          type="button"
          onClick={() => setTheme(nextTheme)}
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={`Switch theme to ${nextTheme}`}
          title={`Theme: ${theme}`}
      >
        {theme === 'light' && <Sun className="size-4" />}
        {theme === 'dark' && <Moon className="size-4" />}
        {theme === 'system' && <Monitor className="size-4" />}
      </button>
  )
}