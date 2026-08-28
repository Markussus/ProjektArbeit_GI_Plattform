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
      className="text-muted-foreground hover:bg-muted hover:text-foreground flex size-8 items-center justify-center rounded-md"
      aria-label={isDark ? t("common.theme.switchToLight") : t("common.theme.switchToDark")}
      title={isDark ? t("common.theme.light") : t("common.theme.dark")}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
