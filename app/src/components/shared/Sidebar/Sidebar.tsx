import { useTranslation } from "react-i18next";
import { Link, NavLink, useLocation } from "react-router-dom";
import { FileText, HelpCircle, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { learningModules, type TopicAccent } from "@/data/modules";

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
  const tk = (key: string) => t(key as never);

  const isHome = location.pathname === "/";

  const activeModule = learningModules.find(
    (module) =>
      location.pathname === module.path ||
      module.topics.some((topic) => location.pathname === topic.path),
  );

  const hasModuleNavigation = Boolean(activeModule);
  const isModuleOverview = activeModule
    ? location.pathname === activeModule.path
    : false;

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border bg-background",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex h-14 items-center px-4">
        <button
          type="button"
          onClick={onToggle}
          className="flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Toggle sidebar"
        >
          <div className="flex size-5 items-center justify-center">
            <Menu className="size-4" />
          </div>
        </button>
      </div>

      {!collapsed && !isHome && hasModuleNavigation && activeModule && (
        <div className="px-4 pb-3">
          <NavLink
            to={activeModule.path}
            className={cn(
              "text-sm font-semibold tracking-wider uppercase",
              isModuleOverview ? "text-brand" : "text-foreground",
            )}
          >
            {tk(activeModule.titleKey)}
          </NavLink>
        </div>
      )}

      {!isHome && hasModuleNavigation && activeModule ? (
        <nav className="flex-1 space-y-1 px-2 py-2">
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
                      <span className="leading-none">{tk(topic.titleKey)}</span>
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

      <div className="space-y-1 border-t border-border px-2 py-3">
        <Link
          to="/documentation"
          className={cn(
            "flex h-11 items-center rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
            collapsed ? "justify-center" : "gap-3",
          )}
        >
          <div className="flex size-5 shrink-0 items-center justify-center">
            <FileText className="size-4" />
          </div>
          {!collapsed && (
            <span className="leading-none">{t("sidebar.documentation")}</span>
          )}
        </Link>

        <Link
          to="/help"
          className={cn(
            "flex h-11 items-center rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
            collapsed ? "justify-center" : "gap-3",
          )}
        >
          <div className="flex size-5 shrink-0 items-center justify-center">
            <HelpCircle className="size-4" />
          </div>
          {!collapsed && (
            <span className="leading-none">{t("sidebar.support")}</span>
          )}
        </Link>
      </div>
    </aside>
  );
}
