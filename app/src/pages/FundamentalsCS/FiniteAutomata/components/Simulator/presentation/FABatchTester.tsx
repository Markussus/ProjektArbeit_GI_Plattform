import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { runBatch, type FABatchResult } from "../domain/faBatchRunner";
import type { FAProgram } from "../domain/faTypes";

interface FABatchTesterProps {
  program: FAProgram;
  /** Called when user clicks a word to debug it step-by-step */
  onSelectWord?: (word: string) => void;
}

export function FABatchTester({ program, onSelectWord }: FABatchTesterProps) {
  const { t } = useTranslation();
  const [rawInput, setRawInput] = useState("");
  const [results, setResults] = useState<FABatchResult[] | null>(null);

  const handleRun = () => {
    const words = rawInput
      .split("\n")
      .map((w) => w.trim())
      .filter((w) => w.length > 0);

    if (words.length === 0) return;
    setResults(runBatch(program, words));
  };

  const handleClear = () => {
    setRawInput("");
    setResults(null);
  };

  const summary = useMemo(() => {
    if (!results) return null;
    const accepted = results.filter((r) => r.accepted).length;
    return {
      accepted,
      rejected: results.length - accepted,
      total: results.length,
    };
  }, [results]);

  return (
    <div
      className="border-border bg-card flex w-full min-w-0 flex-col gap-3 rounded-xl border p-4"
      style={{ height: "100%", minHeight: 0 }}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-2">
        <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          {t("finite-automata.batch.title", "Batch Testing")}
        </span>
      </div>

      {/* Input area — hidden once results are shown */}
      {!results ? (
        <textarea
          className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-brand rounded-md border p-3 font-mono text-sm transition-colors outline-none"
          rows={4}
          style={{ flex: "1 1 auto", minHeight: 80, resize: "none" }}
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          placeholder={t(
            "finite-automata.batch.placeholder",
            "Enter words (one per line)\ne.g.\n101\n100\n11100",
          )}
        />
      ) : (
        /* Scrollable results area — takes all remaining space */
        <div
          className="flex flex-col gap-2"
          style={{ flex: "1 1 auto", minHeight: 0, overflow: "hidden" }}
        >
          {/* Summary bar */}
          {summary && (
            <div className="text-muted-foreground flex shrink-0 items-center gap-3 text-xs font-semibold">
              <span className="text-emerald-600 dark:text-emerald-400">
                ✅ {summary.accepted}
              </span>
              <span className="text-destructive">
                ❌ {summary.rejected}
              </span>
              <span>
                / {summary.total} {t("finite-automata.batch.total", "total")}
              </span>
            </div>
          )}

          {/* Results list — scrolls independently */}
          <div
            className="flex flex-col gap-1 overflow-y-auto"
            style={{ flex: "1 1 auto", minHeight: 0 }}
          >
            {results.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onSelectWord?.(r.inputWord)}
                className="border-border bg-background hover:bg-muted/50 flex w-full min-w-0 shrink-0 cursor-pointer items-center justify-between gap-2 rounded-md border px-3 py-1.5 text-left text-sm transition-colors"
                title={r.inputWord || "ε"}
              >
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate font-mono",
                    r.accepted
                      ? "text-emerald-600 dark:text-emerald-400 font-medium"
                      : "text-destructive font-medium",
                  )}
                >
                  {r.inputWord || "ε"}
                </span>
                <span className="text-muted-foreground flex shrink-0 items-center gap-1.5 text-xs">
                  <span>
                    {r.steps} {t("finite-automata.batch.steps", "steps")}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center rounded px-1.5 py-0.5 text-xs font-bold",
                      r.accepted
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-destructive/10 text-destructive",
                    )}
                  >
                    {r.accepted ? "✅" : "❌"}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons — always at bottom */}
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          className="bg-brand text-brand-foreground hover:opacity-90 flex flex-1 cursor-pointer items-center justify-center gap-1.5 truncate rounded-md px-3 py-2 text-sm font-semibold transition-opacity"
          onClick={handleRun}
          title={t("finite-automata.batch.runAll", "Run All")}
        >
          <Play className="size-3.5 shrink-0 fill-current" />
          <span className="truncate">
            {t("finite-automata.batch.runAll", "Run All")}
          </span>
        </button>
        {results && (
          <button
            type="button"
            className="border-border bg-background hover:bg-muted text-foreground flex flex-1 cursor-pointer items-center justify-center gap-1.5 truncate rounded-md border px-3 py-2 text-sm font-medium transition-colors"
            onClick={handleClear}
            title={t("finite-automata.batch.clear", "Clear")}
          >
            <RotateCcw className="size-3.5 shrink-0" />
            <span className="truncate">
              {t("finite-automata.batch.clear", "Clear")}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
