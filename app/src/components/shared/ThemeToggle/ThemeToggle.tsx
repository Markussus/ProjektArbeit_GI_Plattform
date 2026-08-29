import { Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/hooks/useTheme";

export function ThemeToggle() {
  const { t } = useTranslation();
  const { resolvedTheme, toggleTheme } = useTheme();

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      data-testid="theme-toggle"
      data-theme={resolvedTheme}
      className="border-border bg-background text-foreground hover:bg-muted/60 focus-visible:ring-ring inline-flex size-8 shrink-0 items-center justify-center rounded-md border focus-visible:ring-2 focus-visible:outline-none sm:size-9"
      aria-label={
        isDark
          ? t("common.theme.switchToLight")
          : t("common.theme.switchToDark")
      }
      title={isDark ? t("common.theme.light") : t("common.theme.dark")}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
