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

/**
 * Batch testing panel: enter multiple words, run them all, see pass/fail.
 */
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
    <div className="fa-card flex flex-col gap-3 p-4">
      <span className="fa-label">{t("fa.batch.title", "Batch Testing")}</span>

      {/* Input area */}
      <textarea
        className="fa-textarea"
        rows={4}
        value={rawInput}
        onChange={(e) => setRawInput(e.target.value)}
        placeholder={t(
          "fa.batch.placeholder",
          "Enter words (one per line)\ne.g.\n101\n100\n11100",
        )}
      />

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="fa-btn fa-btn-primary"
          onClick={handleRun}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <Play style={{ width: 14, height: 14, fill: "currentcolor" }} />
          {t("fa.batch.runAll", "Run All")}
        </button>
        {results && (
          <button
            type="button"
            className="fa-btn"
            onClick={handleClear}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <RotateCcw style={{ width: 14, height: 14 }} />
            {t("fa.batch.clear", "Clear")}
          </button>
        )}
      </div>

      {/* Summary */}
      {summary && (
        <div
          className="flex items-center gap-3"
          style={{ fontSize: "0.75rem", fontWeight: 600 }}
        >
          <span style={{ color: "var(--fa-green)" }}>
            ✅ {summary.accepted}
          </span>
          <span style={{ color: "var(--fa-red)" }}>❌ {summary.rejected}</span>
          <span style={{ color: "var(--fa-text-dim)" }}>
            / {summary.total} {t("fa.batch.total", "total")}
          </span>
        </div>
      )}

      {/* Results list */}
      {results && results.length > 0 && (
        <div
          className="flex flex-col gap-1 overflow-y-auto"
          style={{ maxHeight: 200 }}
        >
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelectWord?.(r.inputWord)}
              className="flex items-center justify-between rounded-md px-3 py-2 text-left transition-colors"
              style={{
                background: "var(--fa-surface)",
                border: "1px solid var(--fa-border-subtle)",
                fontSize: "0.8125rem",
                cursor: "pointer",
              }}
              title={t("fa.batch.debugHint", "Click to debug step-by-step")}
            >
              <span
                className="font-mono"
                style={{
                  color: r.accepted ? "var(--fa-green)" : "var(--fa-red)",
                }}
              >
                {r.inputWord || "ε"}
              </span>
              <span
                style={{
                  fontSize: "0.75rem",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span style={{ color: "var(--fa-text-dim)" }}>
                  {r.steps} {t("fa.batch.steps", "steps")}
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
      )}
    </div>
  );
}
