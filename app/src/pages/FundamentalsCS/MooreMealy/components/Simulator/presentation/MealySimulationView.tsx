import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { SimulatorControls } from "@/components/shared/SimulatorControls/SimulatorControls";
import { StateMachineGraph } from "@/components/shared/StateMachineGraph";
import { TableView } from "@/components/shared/TableVisual/TableView";
import type { SimulationStatus } from "@/hooks/useSimulationEngine";
import {
  buildMealyTableHeaders,
  buildMealyTableRows,
  getActiveMealyTransitionCell,
} from "../adapters/automataTableAdapter";
import type { MealyProgram, MealyRuntime } from "../domain/mealyTypes";

interface Props {
  program: MealyProgram;
  runtime: MealyRuntime;
  status: SimulationStatus;
  speed: number;
  error: Error | null;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onStepBack: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
}

export function MealySimulationView(props: Props) {
  const { t } = useTranslation();
  const nextInput = props.program.inputWord[props.runtime.inputPosition];
  const nextState = nextInput
    ? props.program.transitions[nextInput][props.runtime.currentState]
    : undefined;
  const nodes = useMemo(
    () =>
      props.program.states.map((state) => ({
        id: state,
        label: state,
        isStart: state === props.program.initialState,
        isActive: state === props.runtime.currentState,
        isPreview: state === nextState && state !== props.runtime.currentState,
      })),
    [nextState, props.program, props.runtime.currentState],
  );
  const edges = useMemo(
    () =>
      props.program.inputSymbols.flatMap((input) =>
        props.program.states.map((state) => ({
          from: state,
          to: props.program.transitions[input][state],
          label: `${input} / ${props.program.outputs[input][state].symbol}`,
          isActive: state === props.runtime.currentState && input === nextInput,
        })),
      ),
    [nextInput, props.program, props.runtime.currentState],
  );

  const tableHeaders = useMemo(
    () =>
      buildMealyTableHeaders(
        props.program.states,
        t("moore-mealy.sim.event", "Event"),
      ),
    [props.program.states, t],
  );

  const tableRows = useMemo(
    () => buildMealyTableRows(props.program),
    [props.program],
  );

  const activeCell = useMemo(
    () => getActiveMealyTransitionCell(props.program, props.runtime),
    [props.program, props.runtime],
  );

  return (
    <div data-testid="mealy-simulation-view" className="space-y-5">
      <h2 className="text-lg font-bold">
        {t("moore-mealy.mealy.simulationTitle")}
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
            testIdPrefix="mealy-controls"
          />
          <div className="border-border bg-card rounded-xl border p-3 text-sm">
            <strong>{t("moore-mealy.sim.currentState")}:</strong>{" "}
            {props.runtime.currentState}
          </div>
        </div>
        <div className="space-y-3">
          <Sequence
            title={t("moore-mealy.sim.inputWord")}
            values={props.program.inputWord}
            testId="mealy-runtime-input"
          />
          <Sequence
            title={t("moore-mealy.sim.outputWord")}
            values={props.runtime.outputSymbols}
            testId="mealy-runtime-output"
          />
        </div>
      </div>
      <StateMachineGraph
        nodes={nodes}
        edges={edges}
        ariaLabel={t("moore-mealy.mealy.diagram")}
        testId="mealy-state-diagram"
        compact
        defaultLabelLayout="list"
      />
      <TableView
        testIdPrefix="mealy-runtime-transition-table"
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

function Sequence({
  title,
  values,
  testId,
}: {
  title: string;
  values: string[];
  testId: string;
}) {
  return (
    <section data-testid={testId}>
      <h3 className="mb-1 text-sm font-semibold">{title}</h3>
      <div className="border-border bg-card flex min-h-12 gap-2 overflow-x-auto rounded-lg border p-2">
        {values.map((value, index) => (
          <span
            key={`${value}-${index}`}
            className="bg-background rounded border px-3 py-1 font-mono"
          >
            {value}
          </span>
        ))}
      </div>
    </section>
  );
}
