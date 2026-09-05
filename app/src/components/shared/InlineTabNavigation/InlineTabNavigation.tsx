import { cn } from "@/lib/utils";

export interface InlineTabItem<T extends string> {
  id: T;
  label: React.ReactNode;
  testId?: string;
  disabled?: boolean;
}

export interface InlineTabNavigationProps<T extends string> {
  activeTab: T;
  tabs: InlineTabItem<T>[];
  onTabChange: (tab: T) => void;
  ariaLabel: string;
  className?: string;
}

export function InlineTabNavigation<T extends string>({
  activeTab,
  tabs,
  onTabChange,
  ariaLabel,
  className,
}: InlineTabNavigationProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn("border-border flex gap-1 border-b", className)}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-disabled={tab.disabled}
          disabled={tab.disabled}
          onClick={() => !tab.disabled && onTabChange(tab.id)}
          data-testid={tab.testId}
          className={cn(
            "relative px-4 py-2.5 text-sm font-medium transition-colors",
            activeTab === tab.id
              ? "text-tab-active"
              : tab.disabled
                ? "text-muted-foreground/40 cursor-not-allowed"
                : "text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
          {activeTab === tab.id && (
            <span className="bg-tab-indicator absolute inset-x-0 -bottom-px h-0.5" />
          )}
        </button>
      ))}
    </div>
  );
}
