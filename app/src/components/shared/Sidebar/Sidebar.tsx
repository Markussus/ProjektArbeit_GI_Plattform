import { useTranslation } from "react-i18next";
import { Link, NavLink, useLocation } from "react-router-dom";
import { HelpCircle, Menu } from "lucide-react";
import { findModuleByPath, type TopicAccent } from "@/data/moduleCatalogData";
import { cn } from "@/lib/utils";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

function getAccentClasses(accent: TopicAccent) {
  return {
    orange: "text-module-orange-fg",
    blue: "text-module-blue-fg",
    purple: "text-module-purple-fg",
    green: "text-module-green-fg",
    rose: "text-module-rose-fg",
  }[accent];
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { t } = useTranslation();
  const location = useLocation();

  const isHome = location.pathname === "/";

  const activeModule = findModuleByPath(location.pathname);

  const hasModuleNavigation = Boolean(activeModule);
  const isModuleOverview = activeModule
    ? location.pathname === activeModule.path
    : false;

  return (
    <aside
      data-testid="sidebar"
      data-collapsed={collapsed ? "true" : "false"}
      className={cn(
        "border-border bg-background flex h-full flex-col border-r",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex h-14 shrink-0 items-center px-4">
        <button
          type="button"
          onClick={onToggle}
          data-testid="sidebar-toggle"
          className="text-muted-foreground hover:bg-muted hover:text-foreground flex size-9 items-center justify-center rounded-md"
          aria-label={t("common.sidebar.toggle")}
        >
          <div className="flex size-5 items-center justify-center">
            <Menu className="size-4" />
          </div>
        </button>
      </div>

      {!collapsed && !isHome && hasModuleNavigation && activeModule && (
        <div className="shrink-0 px-4 pb-3">
          <NavLink
            to={activeModule.path}
            className={cn(
              "text-sm font-semibold tracking-wider uppercase",
              isModuleOverview ? "text-brand" : "text-foreground",
            )}
          >
            {t(activeModule.titleKey)}
          </NavLink>
        </div>
      )}

      {!isHome && hasModuleNavigation && activeModule ? (
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 py-2">
          {activeModule.topics.map((topic) => {
            const Icon = topic.icon;

            return (
              <NavLink key={topic.id} to={topic.path}>
                {({ isActive }) => (
                  <div
                    className={cn(
                      "flex h-11 items-center rounded-md px-3 text-sm font-semibold tracking-wide",
                      isActive
                        ? "bg-nav-active-bg text-nav-active-fg"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      collapsed ? "justify-center" : "gap-3",
                    )}
                  >
                    <div className="flex size-5 shrink-0 items-center justify-center">
                      <Icon
                        className={cn("size-4", getAccentClasses(topic.accent))}
                      />
                    </div>

                    {!collapsed && (
                      <span className="leading-none">{t(topic.titleKey)}</span>
                    )}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>
      ) : (
        <div className="flex-1" />
      )}

      <div className="border-border shrink-0 space-y-1 border-t px-2 py-3">
        <Link
          to="/info"
          data-testid="sidebar-info-link"
          className={cn(
            "text-muted-foreground hover:bg-muted hover:text-foreground flex h-11 items-center rounded-md px-3 text-sm font-medium",
            collapsed ? "justify-center" : "gap-3",
          )}
        >
          <div className="flex size-5 shrink-0 items-center justify-center">
            <HelpCircle className="size-4" />
          </div>
          {!collapsed && (
            <span className="leading-none">{t("common.sidebar.info")}</span>
          )}
        </Link>
      </div>
    </aside>
  );
}
