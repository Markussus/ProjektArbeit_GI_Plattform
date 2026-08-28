import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Play, RotateCcw } from "lucide-react";
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
      className="flex w-full min-w-0 flex-col gap-3 rounded-[0.75rem] border border-(--fa-border) bg-(--fa-surface) p-4"
      style={{ height: "100%", minHeight: 0 }}
    >
      {/* Header */}
      <div className="flex flex-shrink-0 items-center justify-between gap-2">
        <span className="text-xs font-semibold tracking-wider text-(--fa-text-dim) uppercase">
          {t("finite-automata.batch.title", "Batch Testing")}
        </span>
      </div>

      {/* Input area — hidden once results are shown */}
      {!results ? (
        <textarea
          className="rounded-md border border-(--fa-border) bg-(--fa-surface) p-3 font-mono text-[0.8125rem] text-(--fa-text) transition-colors duration-200 outline-none placeholder:text-(--fa-text-dim) focus:border-(--fa-cyan)"
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
            <div
              className="flex flex-shrink-0 items-center gap-3"
              style={{ fontSize: "0.75rem", fontWeight: 600 }}
            >
              <span style={{ color: "var(--fa-green)" }}>
                ✅ {summary.accepted}
              </span>
              <span style={{ color: "var(--fa-red)" }}>
                ❌ {summary.rejected}
              </span>
              <span style={{ color: "var(--fa-text-dim)" }}>
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
                className="flex w-full min-w-0 flex-shrink-0 items-center justify-between gap-2 rounded-md px-3 py-1.5 text-left transition-colors"
                style={{
                  background: "var(--fa-surface)",
                  border: "1px solid var(--fa-border-subtle)",
                  fontSize: "0.8125rem",
                  cursor: "pointer",
                }}
                title={r.inputWord || "ε"}
              >
                <span
                  className="min-w-0 flex-1 truncate font-mono"
                  style={{
                    color: r.accepted ? "var(--fa-green)" : "var(--fa-red)",
                  }}
                >
                  {r.inputWord || "ε"}
                </span>
                <span
                  className="flex shrink-0 items-center gap-1.5"
                  style={{ fontSize: "0.75rem" }}
                >
                  <span style={{ color: "var(--fa-text-dim)" }}>
                    {r.steps} {t("finite-automata.batch.steps", "steps")}
                  </span>
                  <span
                    className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-bold"
                    style={{
                      background: r.accepted
                        ? "var(--fa-green-dim)"
                        : "var(--fa-red-dim)",
                      color: r.accepted ? "var(--fa-green)" : "var(--fa-red)",
                    }}
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
      <div className="flex flex-shrink-0 items-center gap-1.5">
        <button
          type="button"
          className="cursor-pointer rounded-md border border-(--fa-cyan) bg-(--fa-cyan-dim) px-4 py-2 text-[0.8125rem] font-semibold text-(--fa-cyan) transition-all duration-200 hover:brightness-[1.15]"
          onClick={handleRun}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            whiteSpace: "nowrap",
            flex: "1 1 0%",
            paddingInline: "0.4rem",
            overflow: "hidden",
          }}
          title={t("finite-automata.batch.runAll", "Run All")}
        >
          <Play
            style={{
              width: 14,
              height: 14,
              fill: "currentcolor",
              flexShrink: 0,
            }}
          />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
            {t("finite-automata.batch.runAll", "Run All")}
          </span>
        </button>
        {results && (
          <button
            type="button"
            className="cursor-pointer rounded-md border border-(--fa-border) bg-(--fa-surface-raised) px-4 py-2 text-[0.8125rem] font-semibold text-(--fa-text) transition-all duration-200 hover:border-(--fa-cyan) hover:text-(--fa-cyan)"
            onClick={handleClear}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              whiteSpace: "nowrap",
              flex: "1 1 0%",
              paddingInline: "0.4rem",
              overflow: "hidden",
            }}
            title={t("finite-automata.batch.clear", "Clear")}
          >
            <RotateCcw style={{ width: 14, height: 14, flexShrink: 0 }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
              {t("finite-automata.batch.clear", "Clear")}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
