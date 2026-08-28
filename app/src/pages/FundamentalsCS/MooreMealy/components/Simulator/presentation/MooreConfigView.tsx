import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { DropdownSelect } from "@/components/shared/DropdownSelect/DropdownSelect";
import { SymbolSetPanel } from "@/components/shared/SymbolSetPanel";
import { formatInternalNumber } from "../domain/mooreProgram";
import type {
  InternalRepresentation,
  MooreProgram,
} from "../domain/mooreTypes";
import { MooreInputBuilder } from "./MooreInputBuilder";
import { MooreTransitionTable } from "./MooreTransitionTable";

export interface MooreConfigViewProps {
  program: MooreProgram;
  issues: string[];
  onChange: (program: MooreProgram) => void;
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
  onOutputSymbolChange: (state: string, symbol: string) => void;
  onOutputSymbolCreate: (state: string, symbol: string) => void;
  onOutputCodeChange: (state: string, code: number) => void;
}

export function MooreConfigView({
  program,
  issues,
  onChange,
  onTransitionChange,
  onStateRename,
  onInputSymbolRename,
  onAddState,
  onRemoveState,
  onAddInputSymbol,
  onRemoveInputSymbol,
  onOutputSymbolChange,
  onOutputSymbolCreate,
  onOutputCodeChange,
}: MooreConfigViewProps) {
  const { t } = useTranslation();
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
  const representationOptions = [
    {
      value: "decimal" as const,
      label: t("moore-mealy.sim.decimal"),
    },
    {
      value: "binary" as const,
      label: t("moore-mealy.sim.binary"),
    },
  ];
  const outputAlphabet = useMemo(() => {
    const seen = new Set<string>();
    return program.states.flatMap((state) => {
      const output = program.outputs[state];
      if (!output?.symbol || seen.has(output.symbol)) {
        return [];
      }
      seen.add(output.symbol);
      return [output];
    });
  }, [program.outputs, program.states]);

  return (
    <div data-testid="moore-config-view" className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">{t("moore-mealy.sim.configureTitle")}</h2>
        <p className="text-muted-foreground text-sm">
          {t("moore-mealy.sim.configureHelp")}
        </p>
      </div>

      {issues.length > 0 && (
        <div
          data-testid="moore-config-error"
          className="bg-destructive/10 text-destructive rounded-lg border border-current/20 p-3 text-sm"
        >
          {issues
            .map((issue) => t(`moore-mealy.sim.validation.${issue}` as never))
            .join(" ")}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_15rem]">
        <MooreInputBuilder
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
              options={representationOptions}
              onChange={(representation) =>
                onChange({ ...program, representation })
              }
              ariaLabel={t("moore-mealy.sim.representation")}
              triggerClassName="h-11 w-full px-3"
              menuClassName="right-0 left-0"
              triggerTestId="moore-representation-select"
              optionTestIdPrefix="moore-representation-option"
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
              triggerTestId="moore-start-state-select"
              optionTestIdPrefix="moore-start-state-option"
            />
          </div>
        </div>
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_15rem] xl:items-start">
        <MooreTransitionTable
          program={program}
          onTransitionChange={onTransitionChange}
          onStateRename={onStateRename}
          onInputSymbolRename={onInputSymbolRename}
          onAddState={onAddState}
          onRemoveState={onRemoveState}
          onAddInputSymbol={onAddInputSymbol}
          onRemoveInputSymbol={onRemoveInputSymbol}
          mooreOutputControls={{
            outputs: program.outputs,
            outputAlphabet,
            onSymbolChange: onOutputSymbolChange,
            onSymbolCreate: onOutputSymbolCreate,
            onCodeChange: onOutputCodeChange,
          }}
        />
        <div className="space-y-4">
          <SymbolSetPanel
            title={t("moore-mealy.sim.states")}
            emptyText={t("moore-mealy.sim.noSymbols")}
            testId="moore-state-set"
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
            testId="moore-output-alphabet"
            items={outputAlphabet.map((output) => ({
              key: output.symbol,
              content: (
                <>
                  {output.symbol}
                  <span className="text-muted-foreground ml-1 text-xs">
                    {formatInternalNumber(output.code, program.representation)}
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
