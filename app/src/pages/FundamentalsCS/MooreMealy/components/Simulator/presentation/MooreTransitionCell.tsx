import { useTranslation } from "react-i18next";
import { SearchableCreatableSelect } from "@/components/shared/SearchableCreatableSelect";
import { cn } from "@/lib/utils";
import {
  formatInternalNumber,
  parseInternalNumber,
} from "../domain/mooreProgram";
import type { MooreOutput, MooreProgram } from "../domain/mooreTypes";
import { resizeColumnTextInputs } from "./transitionTableDom";

interface MooreTransitionCellProps {
  target: string;
  states: string[];
  inputSymbol: string;
  state: string;
  inputIndex: number;
  stateIndex: number;
  dropdownWidth: string;
  isInitialState: boolean;
  representation: MooreProgram["representation"];
  outputColumnWidth?: { symbol: string; code: string };
  outputControls?: {
    getOutput: (inputSymbol: string, state: string) => MooreOutput | undefined;
    onSymbolChange: (
      inputSymbol: string,
      state: string,
      symbol: string,
    ) => void;
    onCodeChange: (inputSymbol: string, state: string, code: number) => void;
    testIdPrefix: string;
  };
  onTransitionChange: (
    inputSymbol: string,
    state: string,
    targetState: string,
  ) => void;
  onAddState: (requestedName?: string) => string;
}

export function MooreTransitionCell({
  target,
  states,
  inputSymbol,
  state,
  inputIndex,
  stateIndex,
  dropdownWidth,
  isInitialState,
  representation,
  outputColumnWidth,
  outputControls,
  onTransitionChange,
  onAddState,
}: MooreTransitionCellProps) {
  const { t } = useTranslation();
  const output = outputControls?.getOutput(inputSymbol, state);
  const symbolColumnKey = `${stateIndex}-symbol`;
  const codeColumnKey = `${stateIndex}-code`;

  return (
    <td
      key={`${inputSymbol}-${state}`}
      className={cn("border-r p-2", isInitialState && "bg-brand/5")}
    >
      <div className="inline-flex w-max items-center gap-2">
        <SearchableCreatableSelect
          value={target}
          options={states}
          onChange={(nextState) =>
            onTransitionChange(inputSymbol, state, nextState)
          }
          onCreate={(requestedName) => {
            const createdState = onAddState(requestedName);
            onTransitionChange(inputSymbol, state, createdState);
          }}
          ariaLabel={t("moore-mealy.sim.transitionForStateInput", {
            state,
            input: inputSymbol,
          })}
          createLabel={(value) =>
            t("moore-mealy.sim.createNamedState", { value })
          }
          emptyCreateLabel={t("moore-mealy.sim.createState")}
          notFoundLabel={t("moore-mealy.sim.stateNotFound")}
          searchPlaceholder={t("moore-mealy.sim.search")}
          testId={`moore-transition-${inputIndex}-${stateIndex}`}
          className="w-full min-w-0"
          style={{ width: dropdownWidth }}
        />
        {outputControls && (
          <>
            <input
              value={output?.symbol ?? ""}
              onChange={(event) =>
                outputControls.onSymbolChange(
                  inputSymbol,
                  state,
                  event.target.value,
                )
              }
              onInput={(event) =>
                resizeColumnTextInputs(event.currentTarget, symbolColumnKey)
              }
              aria-label={`${t("moore-mealy.sim.symbolOutput")} ${state} ${inputSymbol}`}
              data-testid={`${outputControls.testIdPrefix}-symbol-${inputIndex}-${stateIndex}`}
              data-output-column={symbolColumnKey}
              style={{
                width: outputColumnWidth?.symbol,
              }}
              className="border-input bg-background focus:ring-ring h-9 min-w-0 rounded-md border px-2 font-mono outline-none focus:ring-1"
            />
            <input
              key={`${representation}-${inputSymbol}-${state}-${output?.code ?? 0}`}
              defaultValue={formatInternalNumber(
                output?.code ?? 0,
                representation,
              )}
              onBlur={(event) => {
                const code = parseInternalNumber(
                  event.currentTarget.value,
                  representation,
                );
                if (code === null) {
                  event.currentTarget.value = formatInternalNumber(
                    output?.code ?? 0,
                    representation,
                  );
                  return;
                }
                outputControls.onCodeChange(inputSymbol, state, code);
              }}
              onInput={(event) =>
                resizeColumnTextInputs(event.currentTarget, codeColumnKey)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.currentTarget.blur();
                }
              }}
              aria-label={`${t("moore-mealy.sim.internalOutputCode")} ${state} ${inputSymbol}`}
              data-testid={`${outputControls.testIdPrefix}-code-${inputIndex}-${stateIndex}`}
              data-output-column={codeColumnKey}
              style={{
                width: outputColumnWidth?.code,
              }}
              className="border-input bg-background focus:ring-ring h-9 min-w-0 rounded-md border px-2 font-mono outline-none focus:ring-1"
            />
          </>
        )}
      </div>
    </td>
  );
}
