import { useTranslation } from "react-i18next";
import type { FAProgram } from "../domain/faTypes";

interface FATransitionTableEditorProps {
  program: FAProgram;
  onTransitionChange: (from: string, symbol: string, targets: string) => void;
}

export function FATransitionTableEditor({
  program,
  onTransitionChange,
}: FATransitionTableEditorProps) {
  const { t } = useTranslation();

  const symbols = [...program.alphabet];
  if (program.type === "NFA") {
    if (!symbols.includes("ε")) {
      symbols.push("ε");
    }
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
                  className="border-r p-3 text-left font-semibold last:border-r-0"
                >
                  {state}
                  {state === program.startState && " →"}
                  {program.acceptStates.includes(state) && " *"}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {symbols.map((symbol) => (
              <tr key={symbol} className="border-b last:border-b-0">
                <td className="border-r p-2 font-mono font-medium">{symbol}</td>
                {program.states.map((state) => {
                  const targets = program.transitions[state]?.[symbol] ?? [];
                  return (
                    <td
                      key={`${state}-${symbol}`}
                      className="border-r p-1 last:border-r-0"
                    >
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
