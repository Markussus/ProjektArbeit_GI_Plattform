import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { SimulatorControls } from "@/components/shared/SimulatorControls/SimulatorControls";
import { TableView } from "@/components/shared/TableVisual/TableView";
import type { SimulationStatus } from "@/hooks/useSimulationEngine";
import {
  buildTransitionTableHeaders,
  buildTransitionTableRows,
  getActiveTransitionCell,
} from "../adapters/faTableAdapter";
import type { FAProgram } from "../domain/faTypes";
import type { FARuntime } from "../domain/faRuntime";
import { FASimulationStatusCard } from "./FASimulationStatusCard";
import { FAInputWordView } from "./FAInputWordView";
import { FAStateDiagram } from "./FAStateDiagram";
import { FAStepTimeline } from "./FAStepTimeline";
import { FABatchTester } from "./FABatchTester";

export interface FASimulationViewProps {
  program: FAProgram;
  runtime: FARuntime;
  status: SimulationStatus;
  speed: number;
  error: Error | null;
  onEditConfig: () => void;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onStepBack: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onJumpToStep: (step: number) => void;
  onJumpToEnd: () => void;
  /** Called when a batch-test word is clicked for step-by-step debugging */
  onSelectBatchWord?: (word: string) => void;
}

export function FASimulationView({
  program,
  runtime,
  status,
  speed,
  error,
  onEditConfig,
  onPlay,
  onPause,
  onStep,
  onStepBack,
  onReset,
  onSpeedChange,
  onJumpToStep,
  onJumpToEnd,
  onSelectBatchWord,
}: FASimulationViewProps) {
  const { t } = useTranslation();

  const tableHeaders = useMemo(
    () => buildTransitionTableHeaders(program.states),
    [program.states],
  );
  const tableRows = useMemo(() => buildTransitionTableRows(program), [program]);
  const activeCell = useMemo(
    () => getActiveTransitionCell(program, runtime),
    [program, runtime],
  );

  return (
    <div className="fa-neon">
      {/* Top bar: title + edit button */}
      <div className="mb-4 flex items-center justify-between">
        <h2
          className="text-lg font-bold"
          style={{ color: "var(--fa-text-bright)" }}
        >
          {t("fa.sim.title", "Simulation")}
        </h2>
        <button type="button" className="fa-btn" onClick={onEditConfig}>
          {t("fa.sim.edit", "Edit Configuration")}
        </button>
      </div>

      {/* Input word + step timeline row */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row">
        <div className="flex-1">
          <FAInputWordView runtime={runtime} />
        </div>
        <div className="flex-1">
          <FAStepTimeline
            runtime={runtime}
            onJumpToStep={onJumpToStep}
            onJumpToEnd={onJumpToEnd}
          />
        </div>
      </div>

      {/* 3-panel layout — items-stretch keeps batch tester the same height as the state diagram */}
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-stretch">
        {/* Left: Controls + Status */}
        <div className="flex w-full flex-col gap-4 lg:w-1/4">
          <div className="fa-card p-3">
            <SimulatorControls
              status={status}
              speed={speed}
              onPlay={onPlay}
              onPause={onPause}
              onStep={onStep}
              onStepBack={onStepBack}
              onReset={onReset}
              onSpeedChange={onSpeedChange}
            />
          </div>

          <FASimulationStatusCard
            program={program}
            runtime={runtime}
            error={error}
          />
        </div>

        {/* Center: State Diagram (larger) */}
        <div className="w-full lg:w-1/2">
          <FAStateDiagram program={program} runtime={runtime} />
        </div>

        {/* Right: Batch Tester — stretches to match the diagram height */}
        <div className="flex min-h-0 w-full lg:w-1/4">
          <FABatchTester
            program={program}
            defaultWordLen={runtime.inputWord.length}
            onSelectWord={onSelectBatchWord}
          />
        </div>
      </div>

      {/* Transition Table */}
      <div className="fa-card overflow-hidden p-0">
        <TableView
          headers={tableHeaders}
          rows={tableRows}
          activeCell={activeCell}
        />
      </div>
    </div>
  );
}
