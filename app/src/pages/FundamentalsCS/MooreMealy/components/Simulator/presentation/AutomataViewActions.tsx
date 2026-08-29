import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AutomataViewAction {
  label: string;
  onClick: () => void;
  icon: LucideIcon;
  testId: string;
  disabled?: boolean;
}

export function AutomataViewActions({
  actions,
}: {
  actions: [AutomataViewAction, AutomataViewAction, AutomataViewAction];
}) {
  const tones = [
    "border-border bg-background hover:bg-muted",
    "border-brand bg-brand text-brand-foreground hover:opacity-90",
    "border-brand bg-brand/10 text-brand hover:bg-brand/15",
  ];

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {actions.map((action, index) => {
        const Icon = action.icon;
        return (
          <button
            key={action.testId}
            type="button"
            onClick={action.onClick}
            disabled={action.disabled}
            data-testid={action.testId}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border px-4 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-50",
              tones[index],
            )}
          >
            <Icon className="size-4" />
            {action.label}
          </button>
        );
      })}
    </div>
  );
}
