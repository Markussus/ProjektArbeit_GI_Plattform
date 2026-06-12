import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { SimulatorControls } from "@/components/shared/SimulatorControls/SimulatorControls";
import { StateMachineGraph } from "@/components/shared/StateMachineGraph";
import { TableView } from "@/components/shared/TableVisual/TableView";
import type { SimulationStatus } from "@/hooks/useSimulationEngine";
import type { MooreProgram, MooreRuntime } from "../domain/mooreTypes";

interface MooreSimulationViewProps {
  program: MooreProgram;
  runtime: MooreRuntime;
  status: SimulationStatus;
  speed: number;
  error: Error | null;
  onEdit: () => void;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onStepBack: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
}

export function MooreSimulationView({
  program,
  runtime,
  status,
  speed,
  error,
  onEdit,
  onPlay,
  onPause,
  onStep,
  onStepBack,
  onReset,
  onSpeedChange,
}: MooreSimulationViewProps) {
  const { t } = useTranslation();
  const lastTransition =
    runtime.transitionHistory[runtime.transitionHistory.length - 1];
  const graphNodes = useMemo(
    () =>
      program.states.map((state) => ({
        id: state,
        label: state,
        output: program.outputs[state].symbol,
        isStart: state === program.initialState,
        isActive: state === runtime.currentState,
      })),
    [program, runtime.currentState],
  );
  const graphEdges = useMemo(
    () =>
      program.inputSymbols.flatMap((inputSymbol) =>
        program.states.map((state) => ({
          from: state,
          to: program.transitions[inputSymbol][state],
          label: inputSymbol,
          isActive:
            lastTransition?.fromState === state &&
            lastTransition.inputSymbol === inputSymbol,
        })),
      ),
    [lastTransition, program],
  );
  const tableRows = program.inputSymbols.map((inputSymbol) => [
    inputSymbol,
    ...program.states.map(
      (state) => program.transitions[inputSymbol]?.[state] ?? "",
    ),
  ]);
  const activeCell = lastTransition
    ? {
        row: program.inputSymbols.indexOf(lastTransition.inputSymbol),
        col: program.states.indexOf(lastTransition.fromState) + 1,
      }
    : null;

  return (
    <div data-testid="moore-simulation-view" className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">
            {t("moore.sim.simulationTitle")}
          </h2>
          <p className="text-muted-foreground text-sm">
            {t("moore.sim.mooreOutputHint")}
          </p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          data-testid="moore-edit-configuration"
          className="border-border bg-background hover:bg-muted rounded-md border px-4 py-2 text-sm font-medium"
        >
          {t("moore.sim.editConfiguration")}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <div className="space-y-4">
          <SimulatorControls
            status={status}
            speed={speed}
            onPlay={onPlay}
            onPause={onPause}
            onStep={onStep}
            onStepBack={onStepBack}
            onReset={onReset}
            onSpeedChange={onSpeedChange}
            testIdPrefix="moore-controls"
          />

          <div className="border-border bg-card space-y-3 rounded-xl border p-4">
            <StatusRow
              label={t("moore.sim.currentState")}
              value={runtime.currentState}
            />
            <StatusRow
              label={t("moore.sim.progress")}
              value={`${runtime.inputPosition} / ${program.inputWord.length}`}
            />
            <StatusRow
              label={t("moore.sim.status")}
              value={
                error
                  ? t("moore.sim.error")
                  : runtime.halted
                    ? t("moore.sim.finished")
                    : t("moore.sim.ready")
              }
            />
          </div>
        </div>

        <StateMachineGraph
          nodes={graphNodes}
          edges={graphEdges}
          ariaLabel={t("moore.sim.diagram")}
          testId="moore-state-diagram"
        />
      </div>

      <SymbolSequence
        title={t("moore.sim.inputWord")}
        symbols={program.inputWord}
        activeIndex={runtime.inputPosition}
        testId="moore-runtime-input"
      />
      <SymbolSequence
        title={t("moore.sim.outputWord")}
        symbols={runtime.outputSymbols}
        activeIndex={runtime.outputSymbols.length - 1}
        testId="moore-runtime-output"
      />

      <TableView
        headers={[t("moore.sim.event"), ...program.states]}
        rows={tableRows}
        activeCell={activeCell}
        activeCol={program.states.indexOf(runtime.currentState) + 1}
        className="w-full"
        tableClassName="w-full table-auto"
        firstColumnWidthClassName=""
        dataColumnWidthClassName=""
        testIdPrefix="moore-runtime-transition-table"
      />
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-semibold">{value}</span>
    </div>
  );
}

function SymbolSequence({
  title,
  symbols,
  activeIndex,
  testId,
}: {
  title: string;
  symbols: string[];
  activeIndex: number;
  testId: string;
}) {
  const { t } = useTranslation();

  return (
    <section data-testid={testId} className="space-y-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="border-border bg-card flex min-h-14 items-center gap-2 overflow-x-auto rounded-xl border p-3">
        {symbols.length > 0 ? (
          symbols.map((symbol, index) => (
            <span
              key={`${symbol}-${index}`}
              className={
                index === activeIndex
                  ? "border-brand bg-brand/10 text-brand rounded-md border-2 px-3 py-2 font-mono font-semibold"
                  : index < activeIndex
                    ? "border-border bg-muted text-muted-foreground rounded-md border px-3 py-2 font-mono"
                    : "border-border bg-background rounded-md border px-3 py-2 font-mono"
              }
            >
              {symbol}
            </span>
          ))
        ) : (
          <span className="text-muted-foreground text-sm italic">
            {t("moore.sim.emptyWord")}
          </span>
        )}
      </div>
    </section>
  );
}
