import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { SimulatorControls } from "@/components/shared/SimulatorControls/SimulatorControls";
import { StateMachineGraph } from "@/components/shared/StateMachineGraph";
import type { SimulationStatus } from "@/hooks/useSimulationEngine";
import type { MealyProgram, MealyRuntime } from "../domain/mealyTypes";
import { useDragScroll } from "@/hooks/useDragScroll";
import { cn } from "@/lib/utils";

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
      <MealyRuntimeTable
        program={props.program}
        currentState={props.runtime.currentState}
        nextInput={nextInput}
        nextState={nextState}
      />
    </div>
  );
}

function MealyRuntimeTable({
  program,
  currentState,
  nextInput,
  nextState,
}: {
  program: MealyProgram;
  currentState: string;
  nextInput?: string;
  nextState?: string;
}) {
  const { t } = useTranslation();
  const { setElementRef, onMouseDown, isDragging } =
    useDragScroll<HTMLDivElement>();
  return (
    <div
      ref={setElementRef}
      onMouseDown={onMouseDown}
      data-testid="mealy-runtime-table-scroll"
      className={cn(
        "border-border max-h-72 overflow-auto rounded-xl border select-none",
        isDragging ? "cursor-grabbing" : "cursor-grab",
      )}
    >
      <table
        data-testid="mealy-runtime-transition-table"
        className="w-full min-w-max border-collapse text-center text-sm"
      >
        <thead>
          <tr className="bg-muted/50 border-b">
            <th className="border-r p-2">{t("moore-mealy.sim.state")}</th>
            <th className="border-r p-2">{t("moore-mealy.sim.event")}</th>
            <th className="border-r p-2">
              {t("moore-mealy.conversion.nextState")}
            </th>
            <th className="p-2">{t("moore-mealy.sim.output")}</th>
          </tr>
        </thead>
        <tbody>
          {program.states.flatMap((state) =>
            program.inputSymbols.map((input) => {
              const active = state === currentState && input === nextInput;
              const target = program.transitions[input][state];
              return (
                <tr
                  key={`${state}-${input}`}
                  className={cn(
                    "border-b last:border-b-0",
                    active && "bg-brand/20 text-brand font-bold",
                  )}
                >
                  <td className="border-r p-2 font-mono">{state}</td>
                  <td className="border-r p-2 font-mono">{input}</td>
                  <td
                    className={cn(
                      "border-r p-2 font-mono",
                      active &&
                        target === nextState &&
                        "outline-brand outline-2 -outline-offset-4 outline-dashed",
                    )}
                  >
                    {target}
                  </td>
                  <td className="p-2 font-mono">
                    {program.outputs[input][state].symbol}
                  </td>
                </tr>
              );
            }),
          )}
        </tbody>
      </table>
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
