import { useEffect, useMemo } from 'react'
import { useThemeStore } from '@/store/themeStore'
import {
    applyResolvedTheme,
    applyTheme,
    getSystemTheme,
    resolveTheme,
    watchSystemTheme,
} from '@/lib/theme'
import type { Theme } from '@/store/themeStore'

export function useTheme() {
    const theme = useThemeStore((state) => state.theme)
    const setThemeState = useThemeStore((state) => state.setTheme)

    const resolvedTheme = useMemo(() => resolveTheme(theme), [theme])

    useEffect(() => {
        if (theme !== 'system') return

        const unsubscribe = watchSystemTheme((nextResolvedTheme) => {
            applyResolvedTheme(nextResolvedTheme)
        })

        applyResolvedTheme(getSystemTheme())

        return unsubscribe
    }, [theme])

    const setTheme = (nextTheme: Theme) => {
        applyTheme(nextTheme)
        setThemeState(nextTheme)
    }

    const toggleTheme = () => {
        const nextTheme: Theme = resolvedTheme === 'dark' ? 'light' : 'dark'
        applyTheme(nextTheme)
        setThemeState(nextTheme)
    }

    return {
        theme,
        resolvedTheme,
        setTheme,
        toggleTheme,
    }
}