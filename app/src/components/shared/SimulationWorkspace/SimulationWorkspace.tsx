import type { ReactNode } from "react";
import { Maximize2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { Exercise, TopicItem } from "@/types/exercise";

interface SimulationWorkspaceProps {
  selectedExercise: Exercise | null;
  selectedItem?: TopicItem | null;
  selectedItemActions?: ReactNode;
  emptyStateText: string;
  isFocused: boolean;
  onToggleFocus: () => void;
  children?: ReactNode;
}

export function SimulationWorkspace({
  selectedExercise,
  selectedItem,
  selectedItemActions,
  emptyStateText,
  isFocused,
  onToggleFocus,
  children,
}: SimulationWorkspaceProps) {
  const { t } = useTranslation();
  const activeItem = selectedItem ?? selectedExercise;
  const itemLabel =
    activeItem?.kind === "example"
      ? t("simulation.selectedExample")
      : t("simulation.selectedExercise");

  return (
    <div className="space-y-4">
      {activeItem && (
        <div className="bg-card ring-foreground/10 rounded-xl p-6 ring-1">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <p className="text-foreground text-sm font-semibold">
                {itemLabel}
              </p>
              <p className="text-foreground mt-2 text-sm font-medium">
                {activeItem.title}
              </p>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                {activeItem.description}
              </p>
            </div>

            {selectedItemActions && (
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {selectedItemActions}
              </div>
            )}
          </div>
        </div>
      )}

      <div
        className={cn(
          "bg-card ring-foreground/10 rounded-xl p-6 ring-1 transition-[min-height] duration-300 ease-in-out",
          isFocused ? "min-h-[calc(100vh-13rem)]" : "min-h-[24rem]",
        )}
      >
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={onToggleFocus}
            aria-pressed={isFocused}
            aria-label={
              isFocused ? t("simulation.exitFocus") : t("simulation.expand")
            }
            title={isFocused ? t("simulation.close") : t("simulation.expand")}
            className="border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring inline-flex size-9 shrink-0 items-center justify-center rounded-md border focus-visible:ring-2 focus-visible:outline-none"
          >
            {isFocused ? (
              <X className="size-4" />
            ) : (
              <Maximize2 className="size-4" />
            )}
          </button>
        </div>

        {children ?? (
          <p className="text-muted-foreground text-sm">{emptyStateText}</p>
        )}
      </div>
    </div>
  );
}
