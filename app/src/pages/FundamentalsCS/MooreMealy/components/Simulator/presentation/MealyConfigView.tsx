import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { DropdownSelect } from "@/components/shared/DropdownSelect/DropdownSelect";
import { SymbolSetPanel } from "@/components/shared/SymbolSetPanel";
import { formatInternalNumber } from "../domain/programCommon";
import type {
  InternalRepresentation,
  MealyProgram,
} from "../domain/mealyTypes";
import { AutomataInputBuilder } from "./AutomataInputBuilder";
import { MooreTransitionTable } from "./MooreTransitionTable";

export interface MealyConfigViewProps {
  program: MealyProgram;
  issues: string[];
  onChange: (program: MealyProgram) => void;
  onTransitionChange: (
    inputSymbol: string,
    state: string,
    targetState: string,
  ) => void;
  onStateRename: (previousName: string, nextName: string) => boolean;
  onInputRename: (previousSymbol: string, nextSymbol: string) => boolean;
  onAddState: (requestedName?: string) => string;
  onRemoveState: (state: string) => void;
  onAddInput: () => void;
  onRemoveInput: (symbol: string) => void;
  onOutputSymbolChange: (
    inputSymbol: string,
    state: string,
    symbol: string,
  ) => void;
  onOutputSymbolCreate?: (
    inputSymbol: string,
    state: string,
    symbol: string,
  ) => void;
  onOutputSymbolRename?: (
    previousSymbol: string,
    nextSymbol: string,
  ) => boolean;
  onOutputCodeChange: (
    inputSymbol: string,
    state: string,
    code: number,
  ) => void;
}

export function MealyConfigView({
  program,
  issues,
  onChange,
  onTransitionChange,
  onStateRename,
  onInputRename,
  onAddState,
  onRemoveState,
  onAddInput,
  onRemoveInput,
  onOutputSymbolChange,
  onOutputSymbolCreate,
  onOutputSymbolRename,
  onOutputCodeChange,
}: MealyConfigViewProps) {
  const { t } = useTranslation();
  const outputs = useMemo(() => {
    const unique = new Map<string, number>();
    for (const input of program.inputSymbols) {
      for (const state of program.states) {
        const output = program.outputs[input]?.[state];
        if (output?.symbol && !unique.has(output.symbol)) {
          unique.set(output.symbol, output.code);
        }
      }
    }
    return [...unique.entries()].map(([symbol, code]) => ({ symbol, code }));
  }, [program]);

  const outputOptions = useMemo(
    () => outputs.map((out) => out.symbol),
    [outputs],
  );

  const stateOptions = useMemo(
    () =>
      program.states.map((state, index) => ({
        value: state,
        label: (
          <span className="flex items-center justify-between gap-4 font-mono">
            <span>{state}</span>
            <span className="text-muted-foreground text-xs">
              {formatInternalNumber(index, program.representation)}
            </span>
          </span>
        ),
      })),
    [program.representation, program.states],
  );

  return (
    <div data-testid="mealy-config-view" className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">
          {t("moore-mealy.mealy.configureTitle")}
        </h2>
        <p className="text-muted-foreground text-sm">
          {t("moore-mealy.sim.configureHelp")}
        </p>
      </div>
      {issues.length > 0 && (
        <div
          data-testid="mealy-config-error"
          className="bg-destructive/10 text-destructive rounded-lg border border-current/20 p-3 text-sm"
        >
          {issues
            .map((issue) => t(`moore-mealy.sim.validation.${issue}` as never))
            .join(" ")}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_15rem]">
        <AutomataInputBuilder
          inputSymbols={program.inputSymbols}
          inputWord={program.inputWord}
          onChange={(inputWord) => onChange({ ...program, inputWord })}
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <div className="space-y-2">
            <label className="text-sm font-semibold">
              {t("moore-mealy.sim.representation")}
            </label>
            <DropdownSelect<InternalRepresentation>
              value={program.representation}
              options={[
                {
                  value: "decimal" as const,
                  label: t("moore-mealy.sim.decimal"),
                },
                {
                  value: "binary" as const,
                  label: t("moore-mealy.sim.binary"),
                },
              ]}
              onChange={(representation) =>
                onChange({ ...program, representation })
              }
              ariaLabel={t("moore-mealy.sim.representation")}
              triggerClassName="h-11 w-full px-3"
              menuClassName="right-0 left-0"
              triggerTestId="mealy-representation-select"
              optionTestIdPrefix="mealy-representation-option"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">
              {t("moore-mealy.sim.startState")}
            </label>
            <DropdownSelect
              value={program.initialState}
              options={stateOptions}
              onChange={(initialState) =>
                onChange({ ...program, initialState })
              }
              ariaLabel={t("moore-mealy.sim.startState")}
              triggerClassName="h-11 w-full px-3"
              menuClassName="right-0 left-0"
              triggerTestId="mealy-start-state-select"
              optionTestIdPrefix="mealy-start-state-option"
            />
          </div>
        </div>
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_15rem] xl:items-start">
        <MooreTransitionTable
          program={program}
          onTransitionChange={onTransitionChange}
          onStateRename={onStateRename}
          onInputSymbolRename={onInputRename}
          onAddState={onAddState}
          onRemoveState={onRemoveState}
          onAddInputSymbol={onAddInput}
          onRemoveInputSymbol={onRemoveInput}
          outputControls={{
            getOutput: (input, state) => program.outputs[input]?.[state],
            outputOptions,
            onSymbolChange: onOutputSymbolChange,
            onSymbolCreate: onOutputSymbolCreate,
            onSymbolRename: onOutputSymbolRename,
            onCodeChange: onOutputCodeChange,
            testIdPrefix: "mealy-transition-output",
          }}
        />
        <div className="space-y-4">
          <SymbolSetPanel
            title={t("moore-mealy.sim.states")}
            emptyText={t("moore-mealy.sim.noSymbols")}
            testId="mealy-state-set"
            items={program.states.map((state, index) => ({
              key: state,
              content: (
                <>
                  {state}
                  <span className="text-muted-foreground ml-1 text-xs">
                    {formatInternalNumber(index, program.representation)}
                  </span>
                </>
              ),
            }))}
          />
          <SymbolSetPanel
            title={t("moore-mealy.sim.outputAlphabet")}
            emptyText={t("moore-mealy.sim.noSymbols")}
            testId="mealy-output-alphabet"
            items={outputs.map(({ symbol, code }) => ({
              key: symbol,
              content: (
                <>
                  {symbol}
                  <span className="text-muted-foreground ml-1 text-xs">
                    {formatInternalNumber(code, program.representation)}
                  </span>
                </>
              ),
            }))}
          />
        </div>
      </div>
    </div>
  );
}
