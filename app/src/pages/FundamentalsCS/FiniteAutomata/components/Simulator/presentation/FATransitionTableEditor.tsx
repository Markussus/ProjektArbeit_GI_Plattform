import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { FAProgram } from "../domain/faTypes";
import { EPSILON } from "../domain/faTypes";
import { canonicalizeTargetStates } from "../domain/faStateNames";
import { buildTransitionTableSymbols } from "../adapters/faTableAdapter";

interface FATransitionTableEditorProps {
  program: FAProgram;
  onTransitionChange: (from: string, symbol: string, targets: string) => void;
  onAddState?: () => void;
  onRemoveState?: (state: string) => void;
}

/** Editable transition table: one row per symbol, one column per state. */
export function FATransitionTableEditor({
  program,
  onTransitionChange,
  onAddState,
  onRemoveState,
}: FATransitionTableEditorProps) {
  const { t } = useTranslation();
  const canRemoveState = program.states.length > 1;

  const [showEpsilon, setShowEpsilon] = useState(false);
  const [editedCell, setEditedCell] = useState<{
    key: string;
    text: string;
  } | null>(null);

  // Same rows as the read-only table, plus an empty ε row once the user has
  const symbols = buildTransitionTableSymbols(program);
  if (program.type === "NFA" && showEpsilon && !symbols.includes(EPSILON)) {
    symbols.push(EPSILON);
  }

  const inputClass =
    "w-full rounded border border-input bg-background px-2 py-1 font-mono text-sm focus:ring-1 focus:ring-primary focus:outline-none";

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">
        {t("finite-automata.config.transitionTable", "Transition Table")}
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
                        aria-label={t("finite-automata.config.removeState", {
                          state,
                          defaultValue: "Remove state {{state}}",
                        })}
                        title={t("finite-automata.config.removeState", {
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
                    aria-label={t(
                      "finite-automata.config.addState",
                      "Add state",
                    )}
                    title={t("finite-automata.config.addState", "Add state")}
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
                  const cellKey = `${state}-${symbol}`;
                  return (
                    <td key={cellKey} className="border-r p-1">
                      <input
                        value={
                          editedCell?.key === cellKey
                            ? editedCell.text
                            : targets.join(", ")
                        }
                        onChange={(e) => {
                          setEditedCell({ key: cellKey, text: e.target.value });
                          onTransitionChange(state, symbol, e.target.value);
                        }}
                        onBlur={() => {
                          if (editedCell?.key === cellKey) {
                            const canonical = canonicalizeTargetStates(
                              editedCell.text,
                              program.states,
                            );
                            if (canonical !== editedCell.text) {
                              onTransitionChange(state, symbol, canonical);
                            }
                          }
                          setEditedCell(null);
                        }}
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
                    data-testid="fa-add-epsilon-transitions"
                    onClick={() => setShowEpsilon(true)}
                    className="text-primary hover:text-primary/80 text-xs font-semibold tracking-wide"
                  >
                    +{" "}
                    {t(
                      "finite-automata.config.addEpsilon",
                      "Add ε-Transitions",
                    )}
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
