import { useTranslation } from "react-i18next";
import { SearchableCreatableSelect } from "@/components/shared/SearchableCreatableSelect";
import { cn } from "@/lib/utils";
import {
  formatInternalNumber,
  parseInternalNumber,
} from "../domain/mooreProgram";
import type { MooreOutput, MooreProgram } from "../domain/mooreTypes";

interface MooreOutputTableProps {
  program: Pick<
    MooreProgram,
    "states" | "outputs" | "initialState" | "representation"
  >;
  outputAlphabet: MooreOutput[];
  onOutputSymbolChange: (state: string, symbol: string) => void;
  onOutputSymbolCreate: (state: string, symbol: string) => void;
  onOutputCodeChange: (state: string, code: number) => void;
}

export function MooreOutputTable({
  program,
  outputAlphabet,
  onOutputSymbolChange,
  onOutputSymbolCreate,
  onOutputCodeChange,
}: MooreOutputTableProps) {
  const { t } = useTranslation();
  const outputOptions = outputAlphabet.map((output) => output.symbol);
  const symbolWidth = `${Math.max(
    10,
    ...outputOptions.map((symbol) => symbol.length + 4),
  )}ch`;

  return (
    <tr data-testid="moore-output-row" className="bg-muted/20 border-b">
      <th scope="row" className="min-w-[10rem] border-r p-3 text-left">
        {t("moore.sim.outputLambda")}
      </th>
      {program.states.map((state, stateIndex) => {
        const output = program.outputs[state];
        return (
          <td
            key={state}
            className={cn(
              "border-r p-2",
              state === program.initialState && "bg-brand/5",
            )}
          >
            <div className="inline-flex w-max items-center gap-2">
              <SearchableCreatableSelect
                value={output?.symbol ?? ""}
                options={outputOptions}
                onChange={(symbol) => onOutputSymbolChange(state, symbol)}
                onCreate={(symbol) => onOutputSymbolCreate(state, symbol)}
                ariaLabel={t("moore.sim.outputForState", { state })}
                createLabel={(symbol) =>
                  t("moore.sim.createNamedOutput", { symbol })
                }
                emptyCreateLabel={t("moore.sim.createOutput")}
                notFoundLabel={t("moore.sim.outputNotFound")}
                searchPlaceholder={t("moore.sim.search")}
                testId={`moore-output-symbol-${stateIndex}`}
                className="min-w-0"
                style={{ width: symbolWidth }}
              />
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
                  if (event.key === "Enter") event.currentTarget.blur();
                }}
                aria-label={t("moore.sim.outputCodeForState", { state })}
                data-testid={`moore-output-code-${stateIndex}`}
                className="border-input bg-background focus:ring-ring h-9 w-[7ch] rounded-md border px-2 font-mono outline-none focus:ring-1"
              />
            </div>
          </td>
        );
      })}
      <td aria-hidden="true" />
    </tr>
  );
}
