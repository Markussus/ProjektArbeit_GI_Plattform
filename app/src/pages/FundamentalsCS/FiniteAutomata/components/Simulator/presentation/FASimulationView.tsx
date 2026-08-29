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
    <div className="rounded-[1rem] bg-(--fa-bg) p-6 text-(--fa-text)">
      {/* Top bar: title + edit button */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-(--fa-text-bright)">
          {t("finite-automata.sim.title", "Simulation")}
        </h2>
        <button
          type="button"
          className="cursor-pointer rounded-md border border-(--fa-border) bg-(--fa-surface-raised) px-4 py-2 text-[0.8125rem] font-semibold text-(--fa-text) transition-all duration-200 hover:border-(--fa-cyan) hover:text-(--fa-cyan)"
          onClick={onEditConfig}
        >
          {t("finite-automata.sim.edit", "Edit Configuration")}
        </button>
      </div>

      {/* Input word + step timeline row.
          The input word hugs its tiles (capped so a long word still scrolls
          inside its own panel), and the step timeline grows to take the
          remaining width so neither panel leaves a large empty gap.
          `min-w-0` lets both flex children shrink rather than blow out the row. */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-stretch">
        <div className="min-w-0 lg:max-w-[45%] lg:flex-[0_1_auto]">
          <FAInputWordView runtime={runtime} />
        </div>
        <div className="min-w-0 lg:flex-1">
          <FAStepTimeline runtime={runtime} onJumpToStep={onJumpToStep} />
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-stretch">
        {/* Left: Controls + Status */}
        <div className="flex w-full min-w-0 flex-col gap-4 lg:w-1/4">
          <div className="rounded-[0.75rem] border border-(--fa-border) bg-(--fa-surface) p-3">
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
        <div className="w-full min-w-0 lg:w-1/2">
          <FAStateDiagram program={program} runtime={runtime} />
        </div>

        {/* Right: Batch Tester — stretches to match the diagram height */}
        <div className="flex min-h-0 w-full min-w-0 lg:w-1/4">
          <FABatchTester program={program} onSelectWord={onSelectBatchWord} />
        </div>
      </div>

      <TableView
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
