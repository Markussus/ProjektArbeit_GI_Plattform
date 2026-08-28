import { useEffect, useRef } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SearchableCreatableSelect } from "@/components/shared/SearchableCreatableSelect";
import { cn } from "@/lib/utils";
import { useDragScroll } from "@/hooks/useDragScroll";
import {
  formatInternalNumber,
  parseInternalNumber,
} from "../domain/mooreProgram";
import type { MooreOutput, MooreProgram } from "../domain/mooreTypes";
import { MooreOutputTable } from "./MooreOutputTable";

type TransitionProgram = Pick<
  MooreProgram,
  "states" | "inputSymbols" | "transitions" | "initialState" | "representation"
>;

interface MooreTransitionTableProps {
  program: TransitionProgram;
  onTransitionChange: (
    inputSymbol: string,
    state: string,
    targetState: string,
  ) => void;
  onStateRename: (previousName: string, nextName: string) => boolean;
  onInputSymbolRename: (previousSymbol: string, nextSymbol: string) => boolean;
  onAddState: (requestedName?: string) => string;
  onRemoveState: (state: string) => void;
  onAddInputSymbol: () => void;
  onRemoveInputSymbol: (symbol: string) => void;
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
  mooreOutputControls?: {
    outputs: Record<string, MooreOutput>;
    outputAlphabet: MooreOutput[];
    onSymbolChange: (state: string, symbol: string) => void;
    onSymbolCreate: (state: string, symbol: string) => void;
    onCodeChange: (state: string, code: number) => void;
  };
}

export function MooreTransitionTable({
  program,
  onTransitionChange,
  onStateRename,
  onInputSymbolRename,
  onAddState,
  onRemoveState,
  onAddInputSymbol,
  onRemoveInputSymbol,
  outputControls,
  mooreOutputControls,
}: MooreTransitionTableProps) {
  const { t } = useTranslation();
  const { setElementRef, onMouseDown, isDragging, scrollToEnd } =
    useDragScroll<HTMLDivElement>();
  const previousStateCountRef = useRef(program.states.length);
  const dropdownWidth = `${Math.max(
    10,
    Math.max(...program.states.map((state) => state.length), 0) + 4,
  )}ch`;
  const outputColumnWidths = program.states.map((state) => ({
    symbol: getTextInputWidth(
      getLongestValue(
        program.inputSymbols.map(
          (inputSymbol) =>
            outputControls?.getOutput(inputSymbol, state)?.symbol ?? "",
        ),
      ),
    ),
    code: getTextInputWidth(
      getLongestValue(
        program.inputSymbols.map((inputSymbol) =>
          formatInternalNumber(
            outputControls?.getOutput(inputSymbol, state)?.code ?? 0,
            program.representation,
          ),
        ),
      ),
    ),
  }));

  useEffect(() => {
    if (program.states.length > previousStateCountRef.current) {
      scrollToEnd();
    }
    previousStateCountRef.current = program.states.length;
  }, [program.states.length, scrollToEnd]);

  return (
    <section className="min-w-0 space-y-2">
      <div>
        <h3 className="font-semibold">
          {t("moore-mealy.sim.transitionTable")}
        </h3>
        <p className="text-muted-foreground text-sm">
          {t("moore-mealy.sim.transitionTableHelp")}
        </p>
      </div>

      <div
        ref={setElementRef}
        onMouseDown={onMouseDown}
        data-testid="moore-transition-table-scroll"
        className={cn(
          "border-border max-w-full overflow-x-auto rounded-lg border shadow-sm select-none",
          isDragging ? "cursor-grabbing" : "cursor-grab",
        )}
      >
        <table
          data-testid="moore-transition-table"
          className="w-max min-w-full border-collapse text-sm"
        >
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="border-r p-3 text-left font-semibold">
                {!mooreOutputControls && t("moore-mealy.sim.event")}
              </th>
              {program.states.map((state, stateIndex) => (
                <th
                  key={state}
                  className={cn(
                    "group border-r p-2 text-left",
                    state === program.initialState && "bg-brand/10",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <input
                      key={state}
                      defaultValue={state}
                      onInput={(event) => resizeTextInput(event.currentTarget)}
                      onBlur={(event) => {
                        if (!onStateRename(state, event.currentTarget.value)) {
                          event.currentTarget.value = state;
                        }
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.currentTarget.blur();
                        }
                      }}
                      aria-label={t("moore-mealy.sim.renameState", { state })}
                      data-testid={`moore-state-name-${stateIndex}`}
                      style={{ width: getTextInputWidth(state) }}
                      className="focus:ring-ring min-w-0 flex-1 rounded bg-transparent px-1 py-1 font-mono font-semibold outline-none focus:ring-1"
                    />
                    <span
                      className="text-muted-foreground font-mono text-xs"
                      title={t("moore-mealy.sim.internalValue")}
                    >
                      {formatInternalNumber(stateIndex, program.representation)}
                    </span>
                    {program.states.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onRemoveState(state)}
                        aria-label={t("moore-mealy.sim.removeState", { state })}
                        data-testid={`moore-remove-state-${stateIndex}`}
                        className="text-muted-foreground hover:text-destructive rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                </th>
              ))}
              <th className="w-12 p-2">
                <button
                  type="button"
                  onClick={() => onAddState()}
                  aria-label={t("moore-mealy.sim.addState")}
                  data-testid="moore-add-state"
                  className="text-brand hover:bg-brand/10 inline-flex size-8 items-center justify-center rounded-md"
                >
                  <Plus className="size-4" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {mooreOutputControls && (
              <MooreOutputTable
                program={{ ...program, outputs: mooreOutputControls.outputs }}
                outputAlphabet={mooreOutputControls.outputAlphabet}
                onOutputSymbolChange={mooreOutputControls.onSymbolChange}
                onOutputSymbolCreate={mooreOutputControls.onSymbolCreate}
                onOutputCodeChange={mooreOutputControls.onCodeChange}
              />
            )}
            {program.inputSymbols.map((inputSymbol, inputIndex) => (
              <tr key={inputSymbol} className="group border-b last:border-b-0">
                <td className="min-w-[10rem] border-r p-2">
                  <div className="flex items-center gap-2">
                    <input
                      key={inputSymbol}
                      defaultValue={inputSymbol}
                      onInput={(event) => resizeTextInput(event.currentTarget)}
                      onBlur={(event) => {
                        if (
                          !onInputSymbolRename(
                            inputSymbol,
                            event.currentTarget.value,
                          )
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
                    <button
                      type="button"
                      onClick={() => onRemoveInputSymbol(inputSymbol)}
                      aria-label={t("moore-mealy.sim.removeInput", {
                        symbol: inputSymbol,
                      })}
                      data-testid={`moore-remove-input-symbol-${inputIndex}`}
                      className="text-muted-foreground hover:text-destructive rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </td>
                {program.states.map((state, stateIndex) => {
                  const target =
                    program.transitions[inputSymbol]?.[state] ?? "";
                  const output = outputControls?.getOutput(inputSymbol, state);
                  const symbolColumnKey = `${stateIndex}-symbol`;
                  const codeColumnKey = `${stateIndex}-code`;
                  return (
                    <td
                      key={`${inputSymbol}-${state}`}
                      className={cn(
                        "border-r p-2",
                        state === program.initialState && "bg-brand/5",
                      )}
                    >
                      <div className="inline-flex w-max items-center gap-2">
                        <SearchableCreatableSelect
                          value={target}
                          options={program.states}
                          onChange={(nextState) =>
                            onTransitionChange(inputSymbol, state, nextState)
                          }
                          onCreate={(requestedName) => {
                            const createdState = onAddState(requestedName);
                            onTransitionChange(
                              inputSymbol,
                              state,
                              createdState,
                            );
                          }}
                          ariaLabel={t(
                            "moore-mealy.sim.transitionForStateInput",
                            {
                              state,
                              input: inputSymbol,
                            },
                          )}
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
                                resizeColumnTextInputs(
                                  event.currentTarget,
                                  symbolColumnKey,
                                )
                              }
                              aria-label={`${t("moore-mealy.sim.symbolOutput")} ${state} ${inputSymbol}`}
                              data-testid={`${outputControls.testIdPrefix}-symbol-${inputIndex}-${stateIndex}`}
                              data-output-column={symbolColumnKey}
                              style={{
                                width: outputColumnWidths[stateIndex].symbol,
                              }}
                              className="border-input bg-background focus:ring-ring h-9 min-w-0 rounded-md border px-2 font-mono outline-none focus:ring-1"
                            />
                            <input
                              key={`${program.representation}-${inputSymbol}-${state}-${output?.code ?? 0}`}
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
                                  event.currentTarget.value =
                                    formatInternalNumber(
                                      output?.code ?? 0,
                                      program.representation,
                                    );
                                  return;
                                }
                                outputControls.onCodeChange(
                                  inputSymbol,
                                  state,
                                  code,
                                );
                              }}
                              onInput={(event) =>
                                resizeColumnTextInputs(
                                  event.currentTarget,
                                  codeColumnKey,
                                )
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
                                width: outputColumnWidths[stateIndex].code,
                              }}
                              className="border-input bg-background focus:ring-ring h-9 min-w-0 rounded-md border px-2 font-mono outline-none focus:ring-1"
                            />
                          </>
                        )}
                      </div>
                    </td>
                  );
                })}
                <td aria-hidden="true" />
              </tr>
            ))}
            <tr className="bg-muted/10">
              <td colSpan={program.states.length + 2} className="p-2">
                <button
                  type="button"
                  onClick={onAddInputSymbol}
                  data-testid="moore-add-input-symbol"
                  className="border-border text-muted-foreground hover:border-brand hover:text-brand flex w-full items-center justify-center gap-2 rounded-md border border-dashed px-3 py-2 text-sm font-medium"
                >
                  <Plus className="size-4" />
                  {t("moore-mealy.sim.addInput")}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

function getTextInputWidth(value: string | undefined): string {
  return `${Math.max(7, (value ?? "").length + 3)}ch`;
}

function getLongestValue(values: string[]): string {
  return values.reduce(
    (longest, value) => (value.length > longest.length ? value : longest),
    "",
  );
}

function resizeTextInput(input: HTMLInputElement): void {
  input.style.width = "0px";
  input.style.width = `${Math.max(56, input.scrollWidth + 2)}px`;
}

function resizeColumnTextInputs(
  input: HTMLInputElement,
  columnKey: string,
): void {
  const table = input.closest("table");
  if (!table) {
    resizeTextInput(input);
    return;
  }
  const columnInputs = Array.from(
    table.querySelectorAll<HTMLInputElement>(
      `input[data-output-column="${columnKey}"]`,
    ),
  );
  const maxWidth = Math.max(
    56,
    ...columnInputs.map((candidate) => {
      const previousWidth = candidate.style.width;
      candidate.style.width = "0px";
      const width = candidate.scrollWidth + 2;
      candidate.style.width = previousWidth;
      return width;
    }),
  );
  for (const candidate of columnInputs) {
    candidate.style.width = `${maxWidth}px`;
  }
}
