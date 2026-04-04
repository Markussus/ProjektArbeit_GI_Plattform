import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'

export function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme()

  const isDark = resolvedTheme === 'dark'

  return (
      <button
          type="button"
          onClick={toggleTheme}
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={isDark ? 'Zu hellem Modus wechseln' : 'Zu dunklem Modus wechseln'}
          title={isDark ? 'Light Mode' : 'Dark Mode'}
      >
        {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </button>
  )
}