import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { FAProgram } from "../domain/faTypes";
import { EPSILON } from "../domain/faTypes";
import { buildTransitionTableSymbols } from "../adapters/faTableAdapter";

interface FATransitionTableEditorProps {
  program: FAProgram;
  onTransitionChange: (from: string, symbol: string, targets: string) => void;
  onAddState?: () => void;
  onRemoveState?: (state: string) => void;
}

export function FATransitionTableEditor({
  program,
  onTransitionChange,
  onAddState,
  onRemoveState,
}: FATransitionTableEditorProps) {
  const { t } = useTranslation();
  const canRemoveState = program.states.length > 1;

  const [showEpsilon, setShowEpsilon] = useState(false);

  // Same rows as the read-only table, plus an empty ε row once the user has
  // asked for one — that is the only way to enter the first ε-transition.
  const symbols = buildTransitionTableSymbols(program);
  if (program.type === "NFA" && showEpsilon && !symbols.includes(EPSILON)) {
    symbols.push(EPSILON);
  }

  const inputClass =
    "w-full rounded border border-input bg-background px-2 py-1 font-mono text-sm focus:ring-1 focus:ring-primary focus:outline-none";

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">
        {t("fa.config.transitionTable", "Transition Table")}
      </h3>
      <div className="overflow-x-auto rounded-lg border shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="border-r p-3 text-left font-semibold">δ</th>
              {program.states.map((state) => (
                <th
                  key={state}
                  className="group border-r p-3 text-left font-semibold"
                >
                  <span className="inline-flex items-center gap-1">
                    <span>
                      {state}
                      {state === program.startState && " →"}
                      {program.acceptStates.includes(state) && " *"}
                    </span>
                    {onRemoveState && canRemoveState && (
                      <button
                        type="button"
                        onClick={() => onRemoveState(state)}
                        aria-label={t("fa.config.removeState", {
                          state,
                          defaultValue: "Remove state {{state}}",
                        })}
                        title={t("fa.config.removeState", {
                          state,
                          defaultValue: "Remove state {{state}}",
                        })}
                        className="text-muted-foreground hover:text-destructive opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </span>
                </th>
              ))}
              {onAddState && (
                <th className="p-2 text-center">
                  <button
                    type="button"
                    onClick={onAddState}
                    aria-label={t("fa.config.addState", "Add state")}
                    title={t("fa.config.addState", "Add state")}
                    className="text-primary hover:bg-primary/10 inline-flex h-7 w-7 items-center justify-center rounded-md font-bold"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {symbols.map((symbol) => (
              <tr key={symbol} className="border-b last:border-b-0">
                <td className="border-r p-2 font-mono font-medium">{symbol}</td>
                {program.states.map((state) => {
                  const targets = program.transitions[state]?.[symbol] ?? [];
                  return (
                    <td key={`${state}-${symbol}`} className="border-r p-1">
                      <input
                        value={targets.join(", ")}
                        onChange={(e) =>
                          onTransitionChange(state, symbol, e.target.value)
                        }
                        className={inputClass}
                        placeholder="–"
                        aria-label={`δ(${state}, ${symbol})`}
                      />
                    </td>
                  );
                })}
                {onAddState && <td aria-hidden="true" />}
              </tr>
            ))}
            {program.type === "NFA" && !symbols.includes(EPSILON) && (
              <tr className="bg-muted/10 border-b last:border-b-0">
                <td
                  colSpan={program.states.length + 1 + (onAddState ? 1 : 0)}
                  className="p-2 text-center"
                >
                  <button
                    type="button"
                    onClick={() => setShowEpsilon(true)}
                    className="text-primary hover:text-primary/80 text-xs font-semibold tracking-wide"
                  >
                    + {t("fa.config.addEpsilon", "Add ε-Transitions")}
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
