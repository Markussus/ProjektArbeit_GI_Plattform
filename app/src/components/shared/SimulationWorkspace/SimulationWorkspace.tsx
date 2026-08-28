import type { ReactNode } from "react";
import { Maximize2, RotateCcw, X } from "lucide-react";
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
  onReset?: () => void;
  resetDisabled?: boolean;
  overlayControls?: boolean;
  onCloseItem?: () => void;
  children?: ReactNode;
}

export function SimulationWorkspace({
  selectedExercise,
  selectedItem,
  selectedItemActions,
  emptyStateText,
  isFocused,
  onToggleFocus,
  onReset,
  resetDisabled = false,
  overlayControls = false,
  onCloseItem,
  children,
}: SimulationWorkspaceProps) {
  const { t } = useTranslation();
  const activeItem = selectedItem ?? selectedExercise;
  const activeItemTitle = activeItem?.titleKey
    ? t(activeItem.titleKey)
    : activeItem?.title;
  const activeItemDescription = activeItem?.descriptionKey
    ? t(activeItem.descriptionKey, activeItem.descriptionParams)
    : activeItem?.description;
  const itemLabel =
    activeItem?.kind === "example"
      ? t("common.simulation.selectedExample")
      : t("common.simulation.selectedExercise");

  return (
    <div className="space-y-4">
      {activeItem && (
        <div
          data-testid="simulation-selected-exercise"
          data-item-id={activeItem.id}
          data-item-kind={activeItem.kind}
          className="bg-card ring-foreground/10 relative rounded-xl p-6 ring-1"
        >
          {onCloseItem && (
            <button
              onClick={onCloseItem}
              className="text-primary hover:text-primary/80 absolute top-4 right-4 p-1 transition-colors"
              aria-label={t("common.simulation.close")}
              title={t("common.simulation.close")}
            >
              <X className="size-6" />
            </button>
          )}
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 pr-6">
              <p className="text-foreground text-sm font-semibold">
                {itemLabel}
              </p>
              <p className="text-foreground mt-2 text-sm font-medium">
                {activeItemTitle}
              </p>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                {activeItemDescription}
              </p>
            </div>

            {selectedItemActions && (
              <div
                data-testid="simulation-selected-item-actions"
                className="flex shrink-0 flex-wrap items-center gap-2"
              >
                {selectedItemActions}
              </div>
            )}
          </div>
        </div>
      )}

      <div
        data-testid="simulation-workspace"
        className={cn(
          "bg-card ring-foreground/10 relative rounded-xl p-6 ring-1 transition-[min-height] duration-300 ease-in-out",
          isFocused ? "min-h-[calc(100vh-13rem)]" : "min-h-[24rem]",
        )}
      >
        <div
          className={cn(
            "absolute top-6 right-6 z-20 flex justify-end gap-2",
            overlayControls && "bg-card/80 rounded-lg backdrop-blur-sm",
          )}
        >
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              data-testid="simulation-reset"
              disabled={resetDisabled}
              aria-label={t("common.trainingCenter.resetCurrent")}
              title={t("common.trainingCenter.resetCurrent")}
              className="border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring inline-flex size-9 shrink-0 items-center justify-center rounded-md border focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw className="size-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onToggleFocus}
            data-testid="simulation-focus-toggle"
            aria-pressed={isFocused}
            aria-label={
              isFocused
                ? t("common.simulation.exitFocus")
                : t("common.simulation.expand")
            }
            title={
              isFocused
                ? t("common.simulation.close")
                : t("common.simulation.expand")
            }
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
