import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  formatInternalNumber,
  parseInternalNumber,
} from "../domain/mooreProgram";
import type { MooreProgram } from "../domain/mooreTypes";

interface MooreOutputTableProps {
  program: MooreProgram;
  onOutputSymbolChange: (state: string, symbol: string) => void;
  onOutputCodeChange: (state: string, code: number) => void;
}

export function MooreOutputTable({
  program,
  onOutputSymbolChange,
  onOutputCodeChange,
}: MooreOutputTableProps) {
  const { t } = useTranslation();

  return (
    <section className="min-w-0 space-y-2">
      <div>
        <h3 className="font-semibold">{t("moore.sim.outputFunction")}</h3>
        <p className="text-muted-foreground text-sm">
          {t("moore.sim.outputFunctionHelp")}
        </p>
      </div>

      <div className="border-border overflow-x-auto rounded-lg border shadow-sm">
        <table
          data-testid="moore-output-table"
          className="w-full min-w-[32rem] border-collapse text-sm"
        >
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="w-2/5 border-r p-3 text-left font-semibold">
                {t("moore.sim.state")}
              </th>
              <th className="w-2/5 border-r p-3 text-left font-semibold">
                {t("moore.sim.symbolOutput")}
              </th>
              <th className="w-1/5 p-3 text-left font-semibold">
                {t("moore.sim.internalOutputCode")}
              </th>
            </tr>
          </thead>
          <tbody>
            {program.states.map((state, stateIndex) => {
              const output = program.outputs[state];
              return (
                <tr
                  key={state}
                  className={cn(
                    "border-b last:border-b-0",
                    state === program.initialState && "bg-brand/5",
                  )}
                >
                  <td className="border-r p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-semibold">{state}</span>
                      <span className="text-muted-foreground font-mono text-xs">
                        {formatInternalNumber(
                          stateIndex,
                          program.representation,
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="border-r p-2">
                    <input
                      value={output?.symbol ?? ""}
                      onChange={(event) =>
                        onOutputSymbolChange(state, event.target.value)
                      }
                      aria-label={t("moore.sim.outputForState", { state })}
                      data-testid={`moore-output-symbol-${stateIndex}`}
                      className="border-input bg-background focus:ring-ring h-9 w-full min-w-0 rounded-md border px-2 font-mono outline-none focus:ring-1"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      key={`${program.representation}-${output?.code ?? 0}`}
                      defaultValue={formatInternalNumber(
                        output?.code ?? 0,
                        program.representation,
                      )}
                      onBlur={(event) => {
                        const code = parseInternalNumber(
                          event.currentTarget.value,
                          program.representation,
                        );
                        if (code === null) {
                          event.currentTarget.value = formatInternalNumber(
                            output?.code ?? 0,
                            program.representation,
                          );
                          return;
                        }
                        onOutputCodeChange(state, code);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.currentTarget.blur();
                        }
                      }}
                      aria-label={t("moore.sim.outputCodeForState", {
                        state,
                      })}
                      data-testid={`moore-output-code-${stateIndex}`}
                      className="border-input bg-background focus:ring-ring h-9 w-full rounded-md border px-2 font-mono outline-none focus:ring-1"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
