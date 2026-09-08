import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { FARuntime } from "../domain/faRuntime";

interface FAStepTimelineProps {
  runtime: FARuntime;
  onJumpToStep: (step: number) => void;
}

/** Clickable dot per step; jumping replays the run up to that step. */
export function FAStepTimeline({ runtime, onJumpToStep }: FAStepTimelineProps) {
  const { t } = useTranslation();
  const currentStep = runtime.stepCount;
  const reachedCount = runtime.stateHistory.length;
  const totalSteps = runtime.inputWord.length;
  const slots = Array.from({ length: totalSteps + 1 }, (_, i) => {
    const isReached = i < reachedCount;
    return {
      index: i,
      isReached,
      isCurrent: i === currentStep,
      stateCount: isReached ? runtime.stateHistory[i].length : 0,
      label: i === 0 ? t("finite-automata.sim.stepStart", "Start") : `${i}`,
    };
  });

  return (
    <div className="border-border bg-card flex h-full min-w-0 flex-col rounded-xl border p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          {t("finite-automata.sim.stepHistory", "Step History")}
        </span>
        <span className="text-muted-foreground shrink-0 text-xs">
          {t("finite-automata.sim.stepOf", "Step {{current}} of {{total}}", {
            current: currentStep,
            total: runtime.inputWord.length,
          })}
        </span>
      </div>

      <div
        className="flex flex-1 items-center overflow-x-auto pb-1"
        style={{ scrollbarWidth: "thin" }}
      >
        {slots.map((step, i) => {
          const stepTooltip = step.isReached
            ? t("finite-automata.sim.stepTooltip", {
                step: step.index,
                count: step.stateCount,
              })
            : t("finite-automata.sim.stepTooltipUnreached", {
                step: step.index,
              });

          return (
            <Fragment key={step.index}>
              {/* Connector leading into this dot — grows to fill spare width. */}
              {i > 0 && (
                <div
                  aria-hidden
                  className={cn(
                    "mx-1 h-0.5 min-w-2 flex-1 rounded-sm transition-colors",
                    step.isReached ? "bg-brand/40" : "bg-border",
                  )}
                />
              )}
              <button
                type="button"
                data-active={step.isCurrent}
                disabled={!step.isReached}
                onClick={() => step.isReached && onJumpToStep(step.index)}
                title={stepTooltip}
                aria-label={stepTooltip}
                className={cn(
                  "flex shrink-0 items-center justify-center rounded-full font-mono transition-all",
                  step.isCurrent &&
                    "border-brand bg-brand/10 text-brand size-9 border-2 text-xs font-bold shadow-sm",
                  !step.isCurrent &&
                    step.isReached &&
                    "border-border bg-background text-foreground hover:bg-muted size-7 cursor-pointer border text-[11px] font-semibold",
                  !step.isCurrent &&
                    !step.isReached &&
                    "border-border bg-muted/20 text-muted-foreground size-7 cursor-default border text-[11px] font-semibold opacity-40",
                )}
              >
                {step.label}
              </button>
            </Fragment>
          );
        })}

        {runtime.halted && (
          <div
            className={cn(
              "ml-2 flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-xs font-bold",
              runtime.haltReason?.type === "accepted"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-destructive/10 text-destructive border-destructive/30",
            )}
          >
            {runtime.haltReason?.type === "accepted" ? "✓" : "✗"}
          </div>
        )}
      </div>
    </div>
  );
}
