import { useTranslation } from "react-i18next";
import { Link, NavLink, useLocation } from "react-router-dom";
import { HelpCircle, Menu } from "lucide-react";
import {
  findModuleByPath,
  type LearningModuleDefinition,
  type ModuleTopicDefinition,
  type TopicAccent,
} from "@/data/moduleCatalogData";
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

interface SidebarToggleHeaderProps {
  onToggle: () => void;
}

function SidebarToggleHeader({ onToggle }: SidebarToggleHeaderProps) {
  const { t } = useTranslation();

  return (
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
  );
}

interface SidebarModuleHeaderProps {
  module: LearningModuleDefinition;
  isOverview: boolean;
}

function SidebarModuleHeader({ module, isOverview }: SidebarModuleHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="shrink-0 px-4 pb-3">
      <NavLink
        to={module.path}
        className={cn(
          "text-sm font-semibold tracking-wider uppercase",
          isOverview ? "text-brand" : "text-foreground",
        )}
      >
        {t(module.titleKey)}
      </NavLink>
    </div>
  );
}

interface SidebarModuleSectionProps {
  module: LearningModuleDefinition | undefined;
  isOverview: boolean;
  collapsed: boolean;
}

function SidebarModuleSection({
  module,
  isOverview,
  collapsed,
}: SidebarModuleSectionProps) {
  if (!module || collapsed) {
    return null;
  }

  return <SidebarModuleHeader module={module} isOverview={isOverview} />;
}

interface SidebarTopicItemProps {
  topic: ModuleTopicDefinition;
  collapsed: boolean;
}

function SidebarTopicItem({ topic, collapsed }: SidebarTopicItemProps) {
  const { t } = useTranslation();
  const Icon = topic.icon;

  return (
    <NavLink to={topic.path}>
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
            <Icon className={cn("size-4", getAccentClasses(topic.accent))} />
          </div>

          {!collapsed && (
            <span className="leading-none">{t(topic.titleKey)}</span>
          )}
        </div>
      )}
    </NavLink>
  );
}

interface SidebarTopicNavProps {
  module: LearningModuleDefinition;
  collapsed: boolean;
}

function SidebarTopicNav({ module, collapsed }: SidebarTopicNavProps) {
  return (
    <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 py-2">
      {module.topics.map((topic) => (
        <SidebarTopicItem key={topic.id} topic={topic} collapsed={collapsed} />
      ))}
    </nav>
  );
}

interface SidebarNavContentProps {
  module: LearningModuleDefinition | undefined;
  collapsed: boolean;
}

function SidebarNavContent({ module, collapsed }: SidebarNavContentProps) {
  if (!module) {
    return <div className="flex-1" />;
  }

  return <SidebarTopicNav module={module} collapsed={collapsed} />;
}

interface SidebarInfoLinkProps {
  collapsed: boolean;
}

function SidebarInfoLink({ collapsed }: SidebarInfoLinkProps) {
  const { t } = useTranslation();

  return (
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
  );
}

function resolveActiveSidebarState(pathname: string) {
  const activeModule = findModuleByPath(pathname);
  const showNav = pathname !== "/" && Boolean(activeModule);
  return {
    activeModule: showNav ? activeModule : undefined,
    isOverview: Boolean(activeModule && pathname === activeModule.path),
  };
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const { activeModule, isOverview } = resolveActiveSidebarState(
    location.pathname,
  );

  return (
    <aside
      data-testid="sidebar"
      data-collapsed={String(collapsed)}
      className={cn(
        "border-border bg-background flex h-full flex-col border-r",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <SidebarToggleHeader onToggle={onToggle} />

      <SidebarModuleSection
        module={activeModule}
        isOverview={isOverview}
        collapsed={collapsed}
      />

      <SidebarNavContent module={activeModule} collapsed={collapsed} />

      <SidebarInfoLink collapsed={collapsed} />
    </aside>
  );
}
