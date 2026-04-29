import { useMemo, type RefObject } from "react";
import { useTranslation } from "react-i18next";
import { SimulatorControls } from "@/components/shared/SimulatorControls/SimulatorControls";
import { TableView } from "@/components/shared/TableVisual/TableView";
import type { SimulationStatus } from "@/hooks/useSimulationEngine";
import {
  buildTransitionTableHeaders,
  buildTransitionTableRows,
  getActiveTransitionCell,
} from "../adapters/tmTableAdapter";
import type { TMProgram } from "../domain/tmProgram";
import type { TMRuntime } from "../domain/tmRuntime";
import { TMSimulationStatusCard } from "./TMSimulationStatusCard";
import { TMTapeView } from "./TMTapeView";

export interface TMSimulationViewProps {
  program: TMProgram;
  runtime: TMRuntime;
  status: SimulationStatus;
  speed: number;
  error: Error | null;
  responsiveBoundaryRef?: RefObject<HTMLDivElement | null>;
  onEditConfig: () => void;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onStepBack: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
}

export function TMSimulationView({
  program,
  runtime,
  status,
  speed,
  error,
  responsiveBoundaryRef,
  onEditConfig,
  onPlay,
  onPause,
  onStep,
  onStepBack,
  onReset,
  onSpeedChange,
}: TMSimulationViewProps) {
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
    <div className="flex flex-col gap-8">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <h2 className="text-xl font-bold">{t("tm.sim.screen.title")}</h2>
        <button
          onClick={onEditConfig}
          className="hover:bg-accent rounded-md border px-4 py-2"
        >
          {t("tm.sim.screen.edit")}
        </button>
      </div>

      <div className="w-full">
        <TMTapeView
          tape={runtime.tape}
          headPosition={runtime.headPosition}
          stepDurationMs={speed}
          blankSymbol={program.blankSymbol}
          responsiveBoundaryRef={responsiveBoundaryRef}
        />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 lg:flex-row">
        <div className="flex w-full flex-col gap-4 lg:w-1/3">
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

          <TMSimulationStatusCard
            program={{ blankSymbol: program.blankSymbol }}
            runtime={runtime}
            error={error}
          />
        </div>

        <div className="w-full lg:w-2/3">
          <TableView
            headers={tableHeaders}
            rows={tableRows}
            activeCell={activeCell}
          />
        </div>
      </div>
    </div>
  );
}
