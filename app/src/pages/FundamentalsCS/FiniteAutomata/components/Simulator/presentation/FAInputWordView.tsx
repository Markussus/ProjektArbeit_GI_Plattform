import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { FARuntime } from "../domain/faRuntime";

interface FAInputWordViewProps {
  runtime: FARuntime;
}

/**
 * Where one symbol sits relative to the read head. `stopped` is the symbol the
 * run halted on: neither already read nor still ahead.
 */
type SymbolPhase = "read" | "current" | "upcoming" | "stopped";

function symbolPhase(runtime: FARuntime, index: number): SymbolPhase {
  if (index === runtime.inputPosition) {
    return runtime.halted ? "stopped" : "current";
  }
  return index < runtime.inputPosition ? "read" : "upcoming";
}

const SYMBOL_CELL_CLASS =
  "flex size-9 shrink-0 items-center justify-center rounded-md border font-mono text-sm font-medium transition-all";

const SYMBOL_PHASE_CLASS: Record<SymbolPhase, string> = {
  current: "border-brand bg-brand/10 text-brand border-2 font-bold",
  read: "border-border bg-muted/50 text-muted-foreground opacity-50",
  upcoming: "border-border bg-background text-foreground",
  stopped: "border-border bg-muted/30 text-muted-foreground opacity-40",
};

/** The input word as a tape, with the read head on the current symbol. */
export function FAInputWordView({ runtime }: FAInputWordViewProps) {
  const { t } = useTranslation();

  // Keep the panel itself when there is no word yet, so the row holds its shape
  // instead of collapsing to a line of text beside the step timeline.
  if (runtime.inputWord.length === 0) {
    return (
      <div className="border-border bg-card min-w-0 rounded-xl border p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            {t("finite-automata.sim.inputWord", "Input Word")}
          </span>
          <span className="text-muted-foreground text-xs font-medium">
            {t("finite-automata.sim.emptyWord", "Empty word (ε)")}
          </span>
        </div>
        <div className="flex items-center gap-1 pb-1">
          <div className="border-border text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-md border border-dashed font-mono text-sm">
            ε
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-border bg-card min-w-0 rounded-xl border p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          {t("finite-automata.sim.inputWord", "Input Word")}
        </span>
        <span className="text-muted-foreground text-xs font-medium">
          {t("finite-automata.sim.inputWordLength", "{{count}} symbols", {
            count: runtime.inputWord.length,
          })}
        </span>
      </div>
      <div
        className="flex items-center gap-1 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "thin" }}
      >
        {runtime.inputWord.map((symbol, index) => (
          <div
            key={index}
            className={cn(
              SYMBOL_CELL_CLASS,
              SYMBOL_PHASE_CLASS[symbolPhase(runtime, index)],
            )}
          >
            {symbol}
          </div>
        ))}
      </div>
    </div>
  );
}
