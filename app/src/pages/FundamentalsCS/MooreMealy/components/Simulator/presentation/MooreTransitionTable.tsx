import { useEffect, useRef } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SearchableCreatableSelect } from "@/components/shared/SearchableCreatableSelect";
import { cn } from "@/lib/utils";
import { useDragScroll } from "@/hooks/useDragScroll";
import { formatInternalNumber } from "../domain/mooreProgram";
import type { MooreProgram } from "../domain/mooreTypes";

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
}: MooreTransitionTableProps) {
  const { t } = useTranslation();
  const { setElementRef, onMouseDown, isDragging, scrollToEnd } =
    useDragScroll<HTMLDivElement>();
  const previousStateCountRef = useRef(program.states.length);

  useEffect(() => {
    if (program.states.length > previousStateCountRef.current) {
      scrollToEnd();
    }
    previousStateCountRef.current = program.states.length;
  }, [program.states.length, scrollToEnd]);

  return (
    <section className="min-w-0 space-y-2">
      <div>
        <h3 className="font-semibold">{t("moore.sim.transitionTable")}</h3>
        <p className="text-muted-foreground text-sm">
          {t("moore.sim.transitionTableHelp")}
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
                {t("moore.sim.event")}
              </th>
              {program.states.map((state, stateIndex) => (
                <th
                  key={state}
                  className={cn(
                    "group min-w-44 border-r p-2 text-left",
                    state === program.initialState && "bg-brand/10",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <input
                      key={state}
                      defaultValue={state}
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
                      aria-label={t("moore.sim.renameState", { state })}
                      data-testid={`moore-state-name-${stateIndex}`}
                      className="focus:ring-ring min-w-0 flex-1 rounded bg-transparent px-1 py-1 font-mono font-semibold outline-none focus:ring-1"
                    />
                    <span
                      className="text-muted-foreground font-mono text-xs"
                      title={t("moore.sim.internalValue")}
                    >
                      {formatInternalNumber(stateIndex, program.representation)}
                    </span>
                    {program.states.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onRemoveState(state)}
                        aria-label={t("moore.sim.removeState", { state })}
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
                  aria-label={t("moore.sim.addState")}
                  data-testid="moore-add-state"
                  className="text-brand hover:bg-brand/10 inline-flex size-8 items-center justify-center rounded-md"
                >
                  <Plus className="size-4" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {program.inputSymbols.map((inputSymbol, inputIndex) => (
              <tr key={inputSymbol} className="group border-b last:border-b-0">
                <td className="min-w-40 border-r p-2">
                  <div className="flex items-center gap-2">
                    <input
                      key={inputSymbol}
                      defaultValue={inputSymbol}
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
                      aria-label={t("moore.sim.renameInput", {
                        symbol: inputSymbol,
                      })}
                      data-testid={`moore-input-symbol-${inputIndex}`}
                      className="focus:ring-ring min-w-0 flex-1 rounded bg-transparent px-2 py-1 font-mono outline-none focus:ring-1"
                    />
                    <span
                      className="text-muted-foreground font-mono text-xs"
                      title={t("moore.sim.internalValue")}
                    >
                      {formatInternalNumber(inputIndex, program.representation)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveInputSymbol(inputSymbol)}
                      aria-label={t("moore.sim.removeInput", {
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
                  return (
                    <td
                      key={`${inputSymbol}-${state}`}
                      className={cn(
                        "border-r p-2",
                        state === program.initialState && "bg-brand/5",
                      )}
                    >
                      <SearchableCreatableSelect
                        value={target}
                        options={program.states}
                        onChange={(nextState) =>
                          onTransitionChange(inputSymbol, state, nextState)
                        }
                        onCreate={(requestedName) => {
                          const createdState = onAddState(requestedName);
                          onTransitionChange(inputSymbol, state, createdState);
                        }}
                        ariaLabel={`δ(${state}, ${inputSymbol})`}
                        createLabel={t("moore.sim.createState")}
                        notFoundLabel={t("moore.sim.stateNotFound")}
                        testId={`moore-transition-${inputIndex}-${stateIndex}`}
                      />
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
                  {t("moore.sim.addInput")}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
