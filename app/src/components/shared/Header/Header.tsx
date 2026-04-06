import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/shared/ThemeToggle/ThemeToggle";
import { LanguageToggle } from "@/components/shared/LanguageToggle/LanguageToggle";
import ThwsLogo from "@/assets/THWS.svg";
import { learningModules } from "@/data/modules";

function getActiveModule(pathname: string) {
  return learningModules.find(
    (module) =>
      pathname === module.path ||
      module.topics.some((topic) => pathname === topic.path),
  );
}

export function Header() {
  const { t } = useTranslation();
  const location = useLocation();

  const tk = (key: string) => t(key as never) as string;

  const activeModule = getActiveModule(location.pathname);

  const headerLabel: string = activeModule
    ? tk(activeModule.titleKey)
    : t("nav.home");

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center shrink-0">
          <img src={ThwsLogo} alt="THWS Logo" className="h-9 w-auto" />
        </Link>

        <div className="h-7 w-px bg-border" />

        <span className="text-xl font-bold tracking-tight text-foreground">
          {headerLabel}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>
    </header>
  );
}
