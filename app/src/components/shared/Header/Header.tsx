import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/shared/ThemeToggle/ThemeToggle";
import { LanguageSelect } from "@/components/shared/LanguageSelect/LanguageSelect";
import { HeaderTransferBox } from "@/components/shared/Header/HeaderTransferBox";
import ThwsLogo from "@/assets/THWS.svg";
import { findModuleByPath } from "@/data/moduleCatalogData";

export function Header() {
  const { t } = useTranslation();
  const location = useLocation();

  const activeModule = findModuleByPath(location.pathname);

  const headerLabel: string = activeModule
    ? t(activeModule.titleKey)
    : location.pathname === "/info" ||
        location.pathname === "/help" ||
        location.pathname === "/legal"
      ? t("common.info.title")
      : t("common.nav.home");

  return (
    <header className="border-border bg-background flex h-16 items-center justify-between gap-2 border-b px-2 sm:gap-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-2 sm:gap-4">
        <Link
          to="/"
          className="flex shrink-0 items-center"
          aria-label={t("common.nav.home")}
        >
          <img
            src={ThwsLogo}
            alt="THWS Logo"
            className="h-8 w-auto shrink-0 sm:h-9"
          />
        </Link>

        <div className="bg-border hidden h-7 w-px shrink-0 min-[520px]:block" />

        <div className="hidden min-w-0 items-center min-[520px]:flex">
          <span className="text-foreground truncate text-sm font-semibold sm:text-base">
            {headerLabel}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <HeaderTransferBox />
        <LanguageSelect />
        <ThemeToggle />
      </div>
    </header>
  );
}
