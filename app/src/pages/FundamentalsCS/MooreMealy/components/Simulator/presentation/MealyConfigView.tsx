import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { DropdownSelect } from "@/components/shared/DropdownSelect/DropdownSelect";
import { SymbolSetPanel } from "@/components/shared/SymbolSetPanel";
import { formatInternalNumber } from "../domain/mooreProgram";
import type { InternalRepresentation } from "../domain/mooreTypes";
import type { MealyProgram } from "../domain/mealyTypes";
import { MooreInputBuilder } from "./MooreInputBuilder";
import { MooreTransitionTable } from "./MooreTransitionTable";
import { MealyOutputTable } from "./MealyOutputTable";

interface Props {
  program: MealyProgram;
  issues: string[];
  onChange: (program: MealyProgram) => void;
  onTransitionChange: (input: string, state: string, target: string) => void;
  onStateRename: (previous: string, next: string) => boolean;
  onInputRename: (previous: string, next: string) => boolean;
  onAddState: (name?: string) => string;
  onRemoveState: (state: string) => void;
  onAddInput: () => void;
  onRemoveInput: (input: string) => void;
  onOutputSymbolChange: (input: string, state: string, symbol: string) => void;
  onOutputCodeChange: (input: string, state: string, code: number) => void;
}

export function MealyConfigView(props: Props) {
  const { t } = useTranslation();
  const { program } = props;
  const outputs = useMemo(() => {
    const unique = new Map<number, string>();
    for (const input of program.inputSymbols)
      for (const state of program.states) {
        const output = program.outputs[input][state];
        if (!unique.has(output.code)) unique.set(output.code, output.symbol);
      }
    return [...unique];
  }, [program]);
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
        <h2 className="text-lg font-bold">{t("moore.mealy.configureTitle")}</h2>
        <p className="text-muted-foreground text-sm">
          {t("moore.sim.configureHelp")}
        </p>
      </div>
      {props.issues.length > 0 && (
        <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
          {props.issues
            .map((issue) => t(`moore.sim.validation.${issue}` as never))
            .join(" ")}
        </div>
      )}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_15rem]">
        <MooreInputBuilder
          inputSymbols={program.inputSymbols}
          inputWord={program.inputWord}
          onChange={(inputWord) => props.onChange({ ...program, inputWord })}
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <div className="space-y-2">
            <label className="text-sm font-semibold">
              {t("moore.sim.representation")}
            </label>
            <DropdownSelect<InternalRepresentation>
              value={program.representation}
              options={[
                { value: "decimal", label: t("moore.sim.decimal") },
                { value: "binary", label: t("moore.sim.binary") },
              ]}
              onChange={(representation) =>
                props.onChange({ ...program, representation })
              }
              ariaLabel={t("moore.sim.representation")}
              triggerClassName="h-11 w-full px-3"
              menuClassName="right-0 left-0"
              triggerTestId="mealy-representation-select"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">
              {t("moore.sim.startState")}
            </label>
            <DropdownSelect
              value={program.initialState}
              options={stateOptions}
              onChange={(initialState) =>
                props.onChange({ ...program, initialState })
              }
              ariaLabel={t("moore.sim.startState")}
              triggerClassName="h-11 w-full px-3"
              menuClassName="right-0 left-0"
              triggerTestId="mealy-start-state-select"
            />
          </div>
        </div>
      </div>
      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_15rem]">
        <MooreTransitionTable
          program={program}
          onTransitionChange={props.onTransitionChange}
          onStateRename={props.onStateRename}
          onInputSymbolRename={props.onInputRename}
          onAddState={props.onAddState}
          onRemoveState={props.onRemoveState}
          onAddInputSymbol={props.onAddInput}
          onRemoveInputSymbol={props.onRemoveInput}
        />
        <SymbolSetPanel
          title={t("moore.sim.states")}
          emptyText={t("moore.sim.noSymbols")}
          items={program.states.map((state, index) => ({
            key: state,
            content: `${state} ${formatInternalNumber(index, program.representation)}`,
          }))}
        />
      </div>
      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_15rem]">
        <MealyOutputTable
          program={program}
          onSymbolChange={props.onOutputSymbolChange}
          onCodeChange={props.onOutputCodeChange}
        />
        <SymbolSetPanel
          title={t("moore.sim.outputAlphabet")}
          emptyText={t("moore.sim.noSymbols")}
          items={outputs.map(([code, symbol]) => ({
            key: String(code),
            content: `${symbol} ${formatInternalNumber(code, program.representation)}`,
          }))}
        />
      </div>
    </div>
  );
}
