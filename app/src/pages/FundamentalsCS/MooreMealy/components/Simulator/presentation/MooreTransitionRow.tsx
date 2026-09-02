import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatInternalNumber } from "../domain/mooreProgram";
import type { MooreOutput, MooreProgram } from "../domain/mooreTypes";
import { MooreTransitionCell } from "./MooreTransitionCell";
import { getTextInputWidth, resizeTextInput } from "./transitionTableDom";

type TransitionProgram = Pick<
  MooreProgram,
  "states" | "inputSymbols" | "transitions" | "initialState" | "representation"
>;

interface MooreTransitionRowProps {
  inputSymbol: string;
  inputIndex: number;
  program: TransitionProgram;
  dropdownWidth: string;
  outputColumnWidths?: { symbol: string; code: string }[];
  outputControls?: {
    getOutput: (inputSymbol: string, state: string) => MooreOutput | undefined;
    outputOptions: string[];
    onSymbolChange: (
      inputSymbol: string,
      state: string,
      symbol: string,
    ) => void;
    onSymbolCreate?: (
      inputSymbol: string,
      state: string,
      symbol: string,
    ) => void;
    onSymbolRename?: (previousSymbol: string, nextSymbol: string) => void;
    onCodeChange: (inputSymbol: string, state: string, code: number) => void;
    testIdPrefix: string;
  };
  onInputSymbolRename: (previousSymbol: string, nextSymbol: string) => boolean;
  onRemoveInputSymbol: (symbol: string) => void;
  onTransitionChange: (
    inputSymbol: string,
    state: string,
    targetState: string,
  ) => void;
  onAddState: (requestedName?: string) => string;
}

export function MooreTransitionRow({
  inputSymbol,
  inputIndex,
  program,
  dropdownWidth,
  outputColumnWidths,
  outputControls,
  onInputSymbolRename,
  onRemoveInputSymbol,
  onTransitionChange,
  onAddState,
}: MooreTransitionRowProps) {
  const { t } = useTranslation();

  return (
    <tr key={inputSymbol} className="group border-b last:border-b-0">
      <td className="min-w-[10rem] border-r p-2">
        <div className="flex items-center gap-2">
          <input
            key={inputSymbol}
            defaultValue={inputSymbol}
            onInput={(event) => resizeTextInput(event.currentTarget)}
            onBlur={(event) => {
              if (
                !onInputSymbolRename(inputSymbol, event.currentTarget.value)
              ) {
                event.currentTarget.value = inputSymbol;
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.currentTarget.blur();
              }
            }}
            aria-label={t("moore-mealy.sim.renameInput", {
              symbol: inputSymbol,
            })}
            data-testid={`moore-input-symbol-${inputIndex}`}
            style={{ width: getTextInputWidth(inputSymbol) }}
            className="border-input bg-background focus:ring-ring h-9 min-w-0 flex-1 rounded-md border px-2 font-mono outline-none focus:ring-1"
          />
          <span
            className="text-muted-foreground font-mono text-xs"
            title={t("moore-mealy.sim.internalValue")}
          >
            {formatInternalNumber(inputIndex, program.representation)}
          </span>
        </div>
      </td>
      {program.states.map((state, stateIndex) => {
        const target = program.transitions[inputSymbol]?.[state] ?? "";
        return (
          <MooreTransitionCell
            key={`${inputSymbol}-${state}`}
            target={target}
            states={program.states}
            inputSymbol={inputSymbol}
            state={state}
            inputIndex={inputIndex}
            stateIndex={stateIndex}
            dropdownWidth={dropdownWidth}
            isInitialState={state === program.initialState}
            representation={program.representation}
            outputColumnWidth={outputColumnWidths?.[stateIndex]}
            outputControls={outputControls}
            onTransitionChange={onTransitionChange}
            onAddState={onAddState}
          />
        );
      })}
      <td className="w-12 p-1 text-center align-middle">
        <button
          type="button"
          onClick={() => onRemoveInputSymbol(inputSymbol)}
          aria-label={t("moore-mealy.sim.removeInput", {
            symbol: inputSymbol,
          })}
          data-testid={`moore-remove-input-symbol-${inputIndex}`}
          className="text-muted-foreground hover:text-destructive mx-auto flex items-center justify-center rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          title={t("moore-mealy.sim.removeInput", {
            symbol: inputSymbol,
          })}
        >
          <Trash2 className="size-3.5" />
        </button>
      </td>
    </tr>
  );
}
