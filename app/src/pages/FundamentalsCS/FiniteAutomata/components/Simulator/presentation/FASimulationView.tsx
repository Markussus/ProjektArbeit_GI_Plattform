import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Maximize2, RotateCcw, X } from "lucide-react";
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
  isFocused?: boolean;
  onToggleFocus?: () => void;
  onResetWorkspace?: () => void;
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
  isFocused,
  onToggleFocus,
  onResetWorkspace,
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
    <div className="rounded-[1rem] bg-(--fa-bg) p-3 text-(--fa-text) sm:p-6">
      {/* Top bar: title + action buttons (Edit Configuration, Reset, Expand) */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-(--fa-text-bright)">
          {t("finite-automata.sim.title", "Simulation")}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="cursor-pointer rounded-md border border-(--fa-border) bg-(--fa-surface-raised) px-3 py-1.5 text-[0.8125rem] font-semibold text-(--fa-text) transition-all duration-200 hover:border-(--fa-cyan) hover:text-(--fa-cyan) sm:px-4 sm:py-2"
            onClick={onEditConfig}
          >
            {t("finite-automata.sim.edit", "Edit Configuration")}
          </button>
          {onResetWorkspace && (
            <button
              type="button"
              onClick={onResetWorkspace}
              data-testid="simulation-reset"
              aria-label={t("common.trainingCenter.resetCurrent")}
              title={t("common.trainingCenter.resetCurrent")}
              className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-(--fa-border) bg-(--fa-surface-raised) text-(--fa-text) transition-all duration-200 hover:border-(--fa-cyan) hover:text-(--fa-cyan) focus-visible:ring-2 focus-visible:outline-none"
            >
              <RotateCcw className="size-4" />
            </button>
          )}
          {onToggleFocus && (
            <button
              type="button"
              onClick={onToggleFocus}
              data-testid="simulation-focus-toggle"
              aria-pressed={isFocused}
              aria-label={
                isFocused
                  ? t("common.simulation.exitFocus")
                  : t("common.simulation.expand")
              }
              title={
                isFocused
                  ? t("common.simulation.close")
                  : t("common.simulation.expand")
              }
              className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-(--fa-border) bg-(--fa-surface-raised) text-(--fa-text) transition-all duration-200 hover:border-(--fa-cyan) hover:text-(--fa-cyan) focus-visible:ring-2 focus-visible:outline-none"
            >
              {isFocused ? (
                <X className="size-4" />
              ) : (
                <Maximize2 className="size-4" />
              )}
            </button>
          )}
        </div>
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

      <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-[280px_minmax(0,1fr)_260px]">
        {/* Left on xl / 2-col on md-lg: Controls + Status */}
        <div className="flex w-full min-w-0 flex-col gap-4 md:grid md:grid-cols-2 xl:flex xl:flex-col">
          <SimulatorControls
            status={status}
            speed={speed}
            onPlay={onPlay}
            onPause={onPause}
            onStep={onStep}
            onStepBack={onStepBack}
            onReset={onReset}
            onSpeedChange={onSpeedChange}
            className="max-w-none rounded-[0.75rem] border border-(--fa-border) bg-(--fa-surface) p-3 shadow-none"
          />

          <FASimulationStatusCard
            program={program}
            runtime={runtime}
            error={error}
          />
        </div>

        {/* Center: State Diagram (prominent and spacious) */}
        <div className="flex min-h-[360px] w-full min-w-0">
          <FAStateDiagram program={program} runtime={runtime} />
        </div>

        {/* Right on xl / below on md-lg: Batch Tester */}
        <div className="flex min-h-0 w-full min-w-0">
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
