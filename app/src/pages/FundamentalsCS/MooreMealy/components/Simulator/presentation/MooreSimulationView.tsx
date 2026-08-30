import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { SimulatorControls } from "@/components/shared/SimulatorControls/SimulatorControls";
import { StateMachineGraph } from "@/components/shared/StateMachineGraph";
import { TableView } from "@/components/shared/TableVisual/TableView";
import type { SimulationStatus } from "@/hooks/useSimulationEngine";
import { cn } from "@/lib/utils";
import {
  buildMooreTableHeaders,
  buildMooreTableRows,
  getActiveMooreTransitionCell,
} from "../adapters/automataTableAdapter";
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

export function MooreSimulationView(props: MooreSimulationViewProps) {
  const { t } = useTranslation();
  const { program, runtime } = props;
  const nextInput = program.inputWord[runtime.inputPosition];
  const nextState =
    nextInput !== undefined
      ? program.transitions[nextInput]?.[runtime.currentState]
      : undefined;

  const graphNodes = useMemo(
    () =>
      program.states.map((state) => ({
        id: state,
        label: state,
        output: program.outputs[state].symbol,
        isStart: state === program.initialState,
        isActive: state === runtime.currentState,
        isPreview: state === nextState && state !== runtime.currentState,
      })),
    [nextState, program, runtime.currentState],
  );

  const graphEdges = useMemo(
    () =>
      program.inputSymbols.flatMap((inputSymbol) =>
        program.states.map((state) => ({
          from: state,
          to: program.transitions[inputSymbol][state],
          label: inputSymbol,
          isActive: state === runtime.currentState && inputSymbol === nextInput,
        })),
      ),
    [nextInput, program, runtime.currentState],
  );

  const tableHeaders = useMemo(
    () =>
      buildMooreTableHeaders(
        program.states,
        t("moore-mealy.sim.event", "Event"),
      ),
    [program.states, t],
  );

  const tableRows = useMemo(() => buildMooreTableRows(program), [program]);

  const activeCell = useMemo(
    () => getActiveMooreTransitionCell(program, runtime),
    [program, runtime],
  );

  return (
    <div data-testid="moore-simulation-view" className="space-y-5">
      <h2 className="text-lg font-bold">
        {t("moore-mealy.sim.simulationTitle")}
      </h2>

      <div className="grid gap-3 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <div className="space-y-3">
          <SimulatorControls
            status={props.status}
            speed={props.speed}
            onPlay={props.onPlay}
            onPause={props.onPause}
            onStep={props.onStep}
            onStepBack={props.onStepBack}
            onReset={props.onReset}
            onSpeedChange={props.onSpeedChange}
            testIdPrefix="moore-controls"
            className="max-w-none"
          />
          <div className="border-border bg-card space-y-2 rounded-xl border p-3">
            <StatusRow
              label={t("moore-mealy.sim.currentState")}
              value={runtime.currentState}
            />
            <StatusRow
              label={t("moore-mealy.sim.progress")}
              value={`${runtime.inputPosition} / ${program.inputWord.length}`}
            />
            <StatusRow
              label={t("moore-mealy.sim.status")}
              value={
                props.error
                  ? t("moore-mealy.sim.error")
                  : runtime.halted
                    ? t("moore-mealy.sim.finished")
                    : t("moore-mealy.sim.ready")
              }
            />
          </div>
        </div>
        <div className="grid grid-rows-2 gap-3">
          <SymbolSequence
            title={t("moore-mealy.sim.inputWord")}
            symbols={program.inputWord}
            activeIndex={runtime.inputPosition}
            testId="moore-runtime-input"
          />
          <SymbolSequence
            title={t("moore-mealy.sim.outputWord")}
            symbols={runtime.outputSymbols}
            activeIndex={runtime.outputSymbols.length - 1}
            testId="moore-runtime-output"
            showEmptyWord={false}
          />
        </div>
      </div>

      <StateMachineGraph
        nodes={graphNodes}
        edges={graphEdges}
        ariaLabel={t("moore-mealy.sim.diagram")}
        testId="moore-state-diagram"
        className="w-full"
        compact
      />

      <TableView
        testIdPrefix="moore-runtime-transition-table"
        headers={tableHeaders}
        rows={tableRows}
        activeCell={activeCell}
        className="w-full"
        tableClassName="w-full table-auto"
        firstColumnWidthClassName=""
        dataColumnWidthClassName=""
        disableActiveCellAutoScroll
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
  showEmptyWord = true,
}: {
  title: string;
  symbols: string[];
  activeIndex: number;
  testId: string;
  showEmptyWord?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <section data-testid={testId} className="space-y-1">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="border-border bg-card flex min-h-12 items-center gap-2 overflow-x-auto rounded-lg border p-2">
        {symbols.length ? (
          symbols.map((symbol, index) => (
            <span
              key={`${symbol}-${index}`}
              className={cn(
                "border-border bg-background rounded-md border px-3 py-1.5 font-mono",
                index < activeIndex && "bg-muted text-muted-foreground",
                index === activeIndex &&
                  "border-brand bg-brand/10 text-brand border-2 font-semibold",
              )}
            >
              {symbol}
            </span>
          ))
        ) : showEmptyWord ? (
          <span className="text-muted-foreground text-sm italic">
            {t("moore-mealy.sim.emptyWord")}
          </span>
        ) : null}
      </div>
    </section>
  );
}
