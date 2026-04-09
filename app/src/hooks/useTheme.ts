import { useEffect } from "react";
import { useThemeStore } from "@/store/themeStore";
import {
  applyResolvedTheme,
  applyTheme,
  getSystemTheme,
  resolveTheme,
  watchSystemTheme,
} from "@/lib/theme";
import type { Theme } from "@/store/themeStore";

export function useTheme() {
  const theme = useThemeStore((state) => state.theme);
  const setThemeState = useThemeStore((state) => state.setTheme);

  const resolvedTheme = resolveTheme(theme);

  useEffect(() => {
    if (theme !== "system") return;

    // In system mode we keep listening after the initial render so OS theme
    // changes are reflected without requiring a page reload.
    const unsubscribe = watchSystemTheme((nextResolvedTheme) => {
      applyResolvedTheme(nextResolvedTheme);
    });

    applyResolvedTheme(getSystemTheme());

    return unsubscribe;
  }, [theme]);

  const setTheme = (nextTheme: Theme) => {
    applyTheme(nextTheme);
    setThemeState(nextTheme);
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
  };
}
