import { Fragment, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { FARuntime } from "../domain/faRuntime";

interface FAStepTimelineProps {
  runtime: FARuntime;
  onJumpToStep: (step: number) => void;
}

export function FAStepTimeline({ runtime, onJumpToStep }: FAStepTimelineProps) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentStep = runtime.stepCount;

  // The view is fully manual: do NOT auto-scroll the timeline when the active
  // step changes. The user pans/scrolls the dot row themselves.

  // Render one slot per step the run will take (Start + one per input symbol),
  // not just the steps reached so far. Reached steps are interactive; the rest
  // are faded placeholders. Showing the whole track lets the connectors stretch
  // to fill the panel width instead of leaving it mostly empty.
  const reachedCount = runtime.stateHistory.length;
  const totalSteps = runtime.inputWord.length;
  const slots = Array.from({ length: totalSteps + 1 }, (_, i) => {
    const isReached = i < reachedCount;
    return {
      index: i,
      isReached,
      isCurrent: i === currentStep,
      stateCount: isReached ? runtime.stateHistory[i].length : 0,
      // Step 0 is the initial state, step N means N symbols consumed
      label: i === 0 ? "Start" : `${i}`,
    };
  });

  return (
    <div className="flex h-full min-w-0 flex-col rounded-[0.75rem] border border-(--fa-border) bg-(--fa-surface) p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold tracking-wider text-(--fa-text-dim) uppercase">
          {t("fa.sim.stepHistory", "Step History")}
        </span>
        <span
          className="shrink-0"
          style={{ color: "var(--fa-text-dim)", fontSize: "0.75rem" }}
        >
          {t("fa.sim.stepOf", "Step {{current}} of {{total}}", {
            current: currentStep,
            total: runtime.inputWord.length,
          })}
        </span>
      </div>

      <div
        ref={scrollRef}
        className="flex flex-1 items-center overflow-x-auto pb-1"
        style={{ scrollbarWidth: "thin" }}
      >
        {slots.map((step, i) => (
          <Fragment key={step.index}>
            {/* Connector leading into this dot — grows to fill spare width. */}
            {i > 0 && (
              <div
                aria-hidden
                style={{
                  flex: "1 1 0",
                  minWidth: 8,
                  height: 2,
                  margin: "0 4px",
                  borderRadius: 2,
                  background: step.isReached
                    ? "var(--fa-cyan)"
                    : "var(--fa-border)",
                  opacity: step.isReached ? 0.4 : 1,
                  transition: "background 0.2s, opacity 0.2s",
                }}
              />
            )}
            <button
              type="button"
              data-active={step.isCurrent}
              disabled={!step.isReached}
              onClick={() => step.isReached && onJumpToStep(step.index)}
              title={
                step.isReached
                  ? `Step ${step.index} · ${step.stateCount} state(s)`
                  : `Step ${step.index} (not reached yet)`
              }
              style={{
                width: step.isCurrent ? 36 : 28,
                height: step.isCurrent ? 36 : 28,
                borderRadius: "50%",
                border: step.isCurrent
                  ? "2px solid var(--fa-cyan)"
                  : "1px solid var(--fa-border)",
                background: step.isCurrent
                  ? "var(--fa-cyan-dim)"
                  : "var(--fa-surface)",
                color: step.isCurrent ? "var(--fa-cyan)" : "var(--fa-text-dim)",
                fontSize: "0.65rem",
                fontWeight: 700,
                cursor: step.isReached ? "pointer" : "default",
                opacity: step.isReached ? 1 : 0.4,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
                boxShadow: step.isCurrent
                  ? "0 0 10px rgba(0, 229, 255, 0.35)"
                  : "none",
              }}
            >
              {step.label}
            </button>
          </Fragment>
        ))}

        {runtime.halted && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              marginLeft: 4,
              padding: "0.2rem 0.5rem",
              borderRadius: "0.375rem",
              fontSize: "0.65rem",
              fontWeight: 700,
              background:
                runtime.haltReason?.type === "accepted"
                  ? "var(--fa-green-dim)"
                  : "var(--fa-red-dim)",
              color:
                runtime.haltReason?.type === "accepted"
                  ? "var(--fa-green)"
                  : "var(--fa-red)",
              border: `1px solid ${
                runtime.haltReason?.type === "accepted"
                  ? "rgba(105, 240, 174, 0.3)"
                  : "rgba(255, 82, 82, 0.3)"
              }`,
              flexShrink: 0,
            }}
          >
            {runtime.haltReason?.type === "accepted" ? "✓" : "✗"}
          </div>
        )}
      </div>
    </div>
  );
}
