import { useLayoutEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { SimulatorControls } from "@/components/shared/SimulatorControls/SimulatorControls";
import { StateMachineGraph } from "@/components/shared/StateMachineGraph";
import type { SimulationStatus } from "@/hooks/useSimulationEngine";
import { cn } from "@/lib/utils";
import { useDragScroll } from "@/hooks/useDragScroll";
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

  return (
    <div data-testid="moore-simulation-view" className="space-y-5">
      <h2 className="text-lg font-bold">{t("moore.sim.simulationTitle")}</h2>

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
                props.error
                  ? t("moore.sim.error")
                  : runtime.halted
                    ? t("moore.sim.finished")
                    : t("moore.sim.ready")
              }
            />
          </div>
        </div>
        <div className="grid grid-rows-2 gap-3">
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
            showEmptyWord={false}
          />
        </div>
      </div>

      <StateMachineGraph
        nodes={graphNodes}
        edges={graphEdges}
        ariaLabel={t("moore.sim.diagram")}
        testId="moore-state-diagram"
        className="w-full"
        compact
      />

      <MooreRuntimeTable
        program={program}
        currentState={runtime.currentState}
        nextInput={nextInput}
        nextState={nextState}
      />
    </div>
  );
}

function MooreRuntimeTable({
  program,
  currentState,
  nextInput,
  nextState,
}: {
  program: MooreProgram;
  currentState: string;
  nextInput?: string;
  nextState?: string;
}) {
  const { t } = useTranslation();
  const currentCol = program.states.indexOf(currentState);
  const nextCol = nextState ? program.states.indexOf(nextState) : -1;
  const currentRow = nextInput ? program.inputSymbols.indexOf(nextInput) : -1;
  const { setElementRef, onMouseDown, isDragging, scrollElementIntoView } =
    useDragScroll<HTMLDivElement>();

  useLayoutEffect(() => {
    if (currentRow < 0 || currentCol < 0) {
      return;
    }
    const cell = document.querySelector<HTMLElement>(
      `[data-testid="moore-runtime-cell-${currentRow}-${currentCol}"]`,
    );
    scrollElementIntoView(cell);
  }, [currentCol, currentRow, nextState, scrollElementIntoView]);

  return (
    <div
      ref={setElementRef}
      onMouseDown={onMouseDown}
      data-testid="moore-runtime-table-scroll"
      className={cn(
        "border-border max-h-64 overflow-auto rounded-xl border select-none",
        isDragging ? "cursor-grabbing" : "cursor-grab",
      )}
    >
      <table
        data-testid="moore-runtime-transition-table"
        className="w-full min-w-max border-collapse text-center text-sm"
      >
        <thead>
          <tr className="bg-muted/50 border-b">
            <th className="border-r p-2">{t("moore.sim.event")}</th>
            {program.states.map((state, index) => (
              <th
                key={state}
                className={cn(
                  "min-w-28 border-r p-2 last:border-r-0",
                  index === currentCol && "bg-brand/25 text-brand",
                  index === nextCol && index !== currentCol && "bg-brand/10",
                )}
              >
                {state}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {program.inputSymbols.map((symbol) => {
            const isCurrentRow = symbol === nextInput;
            return (
              <tr key={symbol} className="border-b last:border-b-0">
                <th
                  className={cn(
                    "border-r p-2 font-mono",
                    isCurrentRow && "bg-brand/25 text-brand",
                  )}
                >
                  {symbol}
                </th>
                {program.states.map((state, index) => {
                  const target = program.transitions[symbol][state];
                  const isSource = isCurrentRow && index === currentCol;
                  const isResult = isSource && target === nextState;
                  return (
                    <td
                      key={state}
                      data-testid={`moore-runtime-cell-${program.inputSymbols.indexOf(symbol)}-${index}`}
                      className={cn(
                        "border-r p-2 font-mono last:border-r-0",
                        index === nextCol && "bg-brand/5",
                        isSource && "bg-brand/25 text-brand font-bold",
                        isResult &&
                          "outline-brand bg-brand/15 outline-2 -outline-offset-4 outline-dashed",
                      )}
                    >
                      {target}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
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
            {t("moore.sim.emptyWord")}
          </span>
        ) : null}
      </div>
    </section>
  );
}
