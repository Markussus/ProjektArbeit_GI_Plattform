import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Play, RotateCcw, Wand2 } from "lucide-react";
import { runBatch, type FABatchResult } from "../domain/faBatchRunner";
import type { FAProgram } from "../domain/faTypes";

const MAX_AUTOFILL = 64;

function generateWords(alphabet: string[], length: number): string[] {
  if (length === 0) return [""];
  const results: string[] = [];
  const stack: string[] = [""];
  while (stack.length > 0 && results.length < MAX_AUTOFILL) {
    const prefix = stack.pop()!;
    if (prefix.length === length) {
      results.push(prefix);
    } else {
      for (let i = alphabet.length - 1; i >= 0; i--) {
        stack.push(prefix + alphabet[i]);
      }
    }
  }
  return results;
}

interface FABatchTesterProps {
  program: FAProgram;
  /** Default word length used for auto-fill (matches the current input word length) */
  defaultWordLen?: number;
  /** Called when user clicks a word to debug it step-by-step */
  onSelectWord?: (word: string) => void;
}

/**
 * Batch testing panel: enter multiple words, run them all, see pass/fail.
 * Stretches to match the state diagram height. Results scroll inside the
 * panel so the transition table is never pushed down.
 */
export function FABatchTester({
  program,
  defaultWordLen,
  onSelectWord,
}: FABatchTesterProps) {
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

  const handleAutoFill = () => {
    if (defaultWordLen === undefined) return;
    const words = generateWords(program.alphabet, defaultWordLen);
    setRawInput(words.join("\n"));
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
      className="fa-card flex flex-col gap-3 p-4"
      style={{ height: "100%", minHeight: 0, minWidth: "300px" }}
    >
      {/* Header */}
      <div className="flex flex-shrink-0 items-center justify-between gap-2">
        <span className="fa-label">{t("fa.batch.title", "Batch Testing")}</span>
        {defaultWordLen !== undefined && program.alphabet.length > 0 && (
          <button
            type="button"
            className="fa-btn"
            onClick={handleAutoFill}
            title={t(
              "fa.batch.autoFillTooltip",
              "Generate all words of length {{n}}",
              { n: defaultWordLen },
            )}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: "0.75rem",
              padding: "0.2rem 0.5rem",
              whiteSpace: "nowrap",
            }}
          >
            <Wand2 style={{ width: 12, height: 12 }} />
            {t("fa.batch.autoFill", "Auto-fill")}
          </button>
        )}
      </div>

      {/* Input area — hidden once results are shown */}
      {!results ? (
        <textarea
          className="fa-textarea"
          rows={4}
          style={{ flex: "1 1 auto", minHeight: 80, resize: "none" }}
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          placeholder={t(
            "fa.batch.placeholder",
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
                / {summary.total} {t("fa.batch.total", "total")}
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
                className="flex flex-shrink-0 items-center justify-between rounded-md px-3 py-1.5 text-left transition-colors"
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
        </div>
      )}

      {/* Action buttons — always at bottom */}
      <div className="flex flex-shrink-0 items-center gap-1.5">
        <button
          type="button"
          className="fa-btn fa-btn-primary"
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
          title={t("fa.batch.runAll", "Run All")}
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
            {t("fa.batch.runAll", "Run All")}
          </span>
        </button>
        {results && (
          <button
            type="button"
            className="fa-btn"
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
            title={t("fa.batch.clear", "Clear")}
          >
            <RotateCcw style={{ width: 14, height: 14, flexShrink: 0 }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
              {t("fa.batch.clear", "Clear")}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
