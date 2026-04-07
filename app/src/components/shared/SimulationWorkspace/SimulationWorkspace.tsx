import { Maximize2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Exercise } from "@/components/shared/ExerciseCard/ExerciseCard";
import { cn } from "@/lib/utils";

interface SimulationWorkspaceProps {
  selectedExercise: Exercise | null;
  emptyStateText: string;
  isFocused: boolean;
  onToggleFocus: () => void;
}

export function SimulationWorkspace({
  selectedExercise,
  emptyStateText,
  isFocused,
  onToggleFocus,
}: SimulationWorkspaceProps) {
  const { t } = useTranslation();

  if (!selectedExercise) {
    return (
      <div className="space-y-4 transition-all duration-300 ease-in-out">
        <div className="bg-card ring-foreground/10 rounded-xl p-6 ring-1 transition-all duration-300 ease-in-out">
          <div className="mb-4 flex items-start justify-end">
            <button
              type="button"
              onClick={onToggleFocus}
              aria-pressed={isFocused}
              aria-label={
                isFocused ? t("simulation.exitFocus") : t("simulation.expand")
              }
              title={isFocused ? t("simulation.close") : t("simulation.expand")}
              className="border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring inline-flex size-9 items-center justify-center rounded-md border transition-all duration-200 focus-visible:ring-2 focus-visible:outline-none"
            >
              {isFocused ? (
                <X className="size-4" />
              ) : (
                <Maximize2 className="size-4" />
              )}
            </button>
          </div>

          <p className="text-muted-foreground text-sm">{emptyStateText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 transition-all duration-300 ease-in-out">
      <div className="bg-card ring-foreground/10 rounded-xl p-6 ring-1 transition-all duration-300 ease-in-out">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-foreground text-sm font-semibold">
              {t("simulation.selectedExercise")}
            </p>
            <p className="text-foreground mt-2 text-sm font-medium">
              {selectedExercise.title}
            </p>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              {selectedExercise.description}
            </p>
          </div>

          <button
            type="button"
            onClick={onToggleFocus}
            aria-pressed={isFocused}
            aria-label={
              isFocused ? t("simulation.exitFocus") : t("simulation.expand")
            }
            title={isFocused ? t("simulation.close") : t("simulation.expand")}
            className="border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring inline-flex size-9 shrink-0 items-center justify-center rounded-md border transition-all duration-200 focus-visible:ring-2 focus-visible:outline-none"
          >
            {isFocused ? (
              <X className="size-4" />
            ) : (
              <Maximize2 className="size-4" />
            )}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "bg-card ring-foreground/10 rounded-xl p-6 ring-1 transition-all duration-300 ease-in-out",
          isFocused ? "min-h-[calc(100vh-13rem)]" : "min-h-[24rem]",
        )}
      >
        <p className="text-muted-foreground text-sm">{emptyStateText}</p>
      </div>
    </div>
  );
}
