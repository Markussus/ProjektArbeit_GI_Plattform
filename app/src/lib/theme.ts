import type { Theme } from "@/store/themeStore";

export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme-storage";

function isBrowser() {
  return typeof window !== "undefined";
}

export function getSystemTheme(): ResolvedTheme {
  if (!isBrowser()) return "light";

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === "system") {
    return getSystemTheme();
  }

  return theme;
}

export function applyResolvedTheme(resolvedTheme: ResolvedTheme) {
  if (!isBrowser()) return;

  const root = document.documentElement;
  const isDark = resolvedTheme === "dark";

  root.classList.toggle("dark", isDark);
  root.style.colorScheme = resolvedTheme;
}

export function applyTheme(theme: Theme) {
  const resolvedTheme = resolveTheme(theme);
  applyResolvedTheme(resolvedTheme);
  return resolvedTheme;
}

export function getStoredTheme(): Theme {
  if (!isBrowser()) return "system";

  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return "system";

    const parsed = JSON.parse(raw) as { state?: { theme?: Theme } };
    const storedTheme = parsed?.state?.theme;

    if (
      storedTheme === "light" ||
      storedTheme === "dark" ||
      storedTheme === "system"
    ) {
      return storedTheme;
    }

    return "system";
  } catch {
    return "system";
  }
}

export function watchSystemTheme(
  callback: (resolvedTheme: ResolvedTheme) => void,
) {
  if (!isBrowser()) {
    return () => {};
  }

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  const handleChange = () => {
    callback(mediaQuery.matches ? "dark" : "light");
  };

  mediaQuery.addEventListener("change", handleChange);

  return () => {
    mediaQuery.removeEventListener("change", handleChange);
  };
}

export function getInitialTheme(): Theme {
  return getStoredTheme();
}
