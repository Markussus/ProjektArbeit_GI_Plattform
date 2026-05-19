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
    <div className="border-border mb-6 flex gap-1 border-b">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onTabChange(tab)}
          data-testid={`tab-button-${tab}`}
          className={cn(
            "relative px-4 py-2.5 text-sm font-medium",
            activeTab === tab
              ? "text-tab-active"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t(`tabs.${tab}`)}
          {activeTab === tab && (
            <span className="bg-tab-indicator absolute inset-x-0 -bottom-px h-0.5" />
          )}
        </button>
      ))}
    </div>
  );
}
