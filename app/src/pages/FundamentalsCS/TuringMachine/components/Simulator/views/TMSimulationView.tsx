import { useTranslation } from "react-i18next";
import type { SimulationStatus } from "@/hooks/useSimulationEngine";
import { ArrayView } from "@/components/shared/ArrayVisual/ArrayView";
import { SimulatorControls } from "@/components/shared/SimulatorControls/SimulatorControls";
import {
  TableView,
  type TablePosition,
} from "@/components/shared/TableVisual/TableView";
import type { TMConfig, TMState } from "../types";
import { TMSimulationStatusCard } from "./TMSimulationStatusCard";

export interface TMSimulationViewProps {
  config: TMConfig;
  currentState: TMState;
  tableHeaders: string[];
  tableRows: string[][];
  activeCell: TablePosition | null;
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
}

export function TMSimulationView({
  config,
  currentState,
  tableHeaders,
  tableRows,
  activeCell,
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
}: TMSimulationViewProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">
          {t("tm.sim.title", "Turing Machine Simulator")}
        </h2>
        <button
          onClick={onEditConfig}
          className="hover:bg-accent rounded-md border px-4 py-2"
        >
          {t("tm.sim.edit", "Edit Configuration")}
        </button>
      </div>

      <div className="w-full">
        <ArrayView
          data={currentState.tape}
          focusIndex={currentState.headPosition}
          emptySymbol={config.blankSymbol}
        />
      </div>

      <div className="flex flex-col items-start gap-6 lg:flex-row">
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
            currentState={currentState}
            blankSymbol={config.blankSymbol}
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
