import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { ModuleTabId } from "@/hooks/useExerciseTabs";

interface TabNavigationProps {
  activeTab: ModuleTabId;
  onTabChange: (tab: ModuleTabId) => void;
  tabs?: ModuleTabId[];
}

const defaultTabs: ModuleTabId[] = [
  "overview",
  "exercises",
  "examples",
  "simulation",
];

export function TabNavigation({
  activeTab,
  onTabChange,
  tabs = defaultTabs,
}: TabNavigationProps) {
  const { t } = useTranslation();

  return (
    <div
      role="tablist"
      aria-label={t("common.tabs.navigation", "Topic Navigation")}
      className="border-border mb-6 flex gap-1 border-b"
    >
      {tabs.map((tab) => {
        const tabLabel = t(`common.tabs.${tab}`);
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            aria-label={tabLabel}
            onClick={() => onTabChange(tab)}
            data-testid={`tab-button-${tab}`}
            className={cn(
              "relative px-4 py-2.5 text-sm font-medium",
              activeTab === tab
                ? "text-tab-active"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tabLabel}
            {activeTab === tab && (
              <span className="bg-tab-indicator absolute inset-x-0 -bottom-px h-0.5" />
            )}
          </button>
        );
      })}
    </div>
  );
}
