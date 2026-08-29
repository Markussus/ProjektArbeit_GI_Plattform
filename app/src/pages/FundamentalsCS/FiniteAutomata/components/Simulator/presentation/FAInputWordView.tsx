import { useTranslation } from "react-i18next";
import type { FARuntime } from "../domain/faRuntime";

interface FAInputWordViewProps {
  runtime: FARuntime;
}

export function FAInputWordView({ runtime }: FAInputWordViewProps) {
  const { t } = useTranslation();

  // Keep the panel itself when there is no word yet, so the row holds its shape
  // instead of collapsing to a line of text beside the step timeline.
  if (runtime.inputWord.length === 0) {
    return (
      <div className="min-w-0 rounded-[0.75rem] border border-(--fa-border) bg-(--fa-surface) p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-xs font-semibold tracking-wider text-(--fa-text-dim) uppercase">
            {t("finite-automata.sim.inputWord", "Input Word")}
          </span>
          <span className="text-[0.65rem] font-medium text-(--fa-text-dim)">
            {t("finite-automata.sim.emptyWord", "Empty word (ε)")}
          </span>
        </div>
        <div className="flex items-center gap-1 pb-1">
          <div
            className="flex items-center justify-center font-mono text-sm"
            style={{
              width: 36,
              height: 36,
              flexShrink: 0,
              borderRadius: "0.375rem",
              border: "1px dashed var(--fa-border)",
              color: "var(--fa-text-dim)",
            }}
          >
            ε
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 rounded-[0.75rem] border border-(--fa-border) bg-(--fa-surface) p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold tracking-wider text-(--fa-text-dim) uppercase">
          {t("finite-automata.sim.inputWord", "Input Word")}
        </span>
        <span className="text-[0.65rem] font-medium text-(--fa-text-dim)">
          {t("finite-automata.sim.inputWordLength", "{{count}} symbols", {
            count: runtime.inputWord.length,
          })}
        </span>
      </div>
      <div
        className="flex items-center gap-1 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "thin" }}
      >
        {runtime.inputWord.map((symbol, index) => {
          const isRead = index < runtime.inputPosition;
          const isCurrent = index === runtime.inputPosition && !runtime.halted;
          const isUpcoming = index > runtime.inputPosition;

          return (
            <div
              key={index}
              className="flex items-center justify-center font-mono text-sm font-medium"
              style={{
                width: 36,
                height: 36,
                flexShrink: 0,
                borderRadius: "0.375rem",
                transition: "all 0.3s",
                ...(isCurrent
                  ? {
                      background: "var(--fa-cyan-dim)",
                      border: "2px solid var(--fa-cyan)",
                      color: "var(--fa-cyan)",
                      boxShadow: "0 0 10px rgba(0, 229, 255, 0.3)",
                    }
                  : isRead
                    ? {
                        background: "var(--fa-surface)",
                        border: "1px solid var(--fa-border-subtle)",
                        color: "var(--fa-text-dim)",
                        opacity: 0.5,
                      }
                    : isUpcoming
                      ? {
                          background: "var(--fa-surface)",
                          border: "1px solid var(--fa-border)",
                          color: "var(--fa-text)",
                        }
                      : {
                          // Halted, beyond position
                          background: "var(--fa-surface)",
                          border: "1px solid var(--fa-border-subtle)",
                          color: "var(--fa-text-dim)",
                          opacity: 0.4,
                        }),
              }}
            >
              {symbol}
            </div>
          );
        })}
      </div>
    </div>
  );
}
