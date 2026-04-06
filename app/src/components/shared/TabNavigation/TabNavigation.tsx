import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = ["overview", "exercises", "examples", "simulation"] as const;

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-6 flex gap-1 border-b border-border">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onTabChange(tab)}
          className={cn(
            "relative px-4 py-2.5 text-sm font-medium",
            activeTab === tab
              ? "text-tab-active"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t(`tabs.${tab}`)}
          {activeTab === tab && (
            <span className="absolute inset-x-0 -bottom-px h-0.5 bg-tab-indicator" />
          )}
        </button>
      ))}
    </div>
  );
}
