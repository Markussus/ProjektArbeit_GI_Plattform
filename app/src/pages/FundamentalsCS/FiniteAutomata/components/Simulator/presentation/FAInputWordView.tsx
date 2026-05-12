import { useTranslation } from "react-i18next";
import type { FARuntime } from "../domain/faRuntime";

interface FAInputWordViewProps {
  runtime: FARuntime;
}

export function FAInputWordView({ runtime }: FAInputWordViewProps) {
  const { t } = useTranslation();

  if (runtime.inputWord.length === 0) {
    return (
      <div className="text-sm italic" style={{ color: "var(--fa-text-dim)" }}>
        {t("fa.sim.emptyWord", "Empty word (ε)")}
      </div>
    );
  }

  return (
    <div className="rounded-[0.75rem] border border-(--fa-border) bg-(--fa-surface) p-3">
      <span className="text-xs font-semibold tracking-wider text-(--fa-text-dim) uppercase">
        {t("fa.sim.inputWord", "Input Word")}
      </span>
      <div className="mt-2 flex items-center gap-1">
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
