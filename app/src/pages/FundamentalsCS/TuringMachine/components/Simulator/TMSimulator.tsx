import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSimulationEngine } from "@/hooks/useSimulationEngine";
import { cloneJson } from "@/lib/utils";
import { defaultTMConfig } from "./config/defaultTMConfig";
import { TuringMachineSimulator } from "./model/TuringMachineSimulator";
import {
  buildTransitionTableHeaders,
  buildTransitionTableRows,
  getActiveTransitionCell,
} from "./model/tmTable";
import { validateTMConfig } from "./model/tmConfigValidation";
import type { TMConfig } from "./types";
import { TMConfigView } from "./views/TMConfigView";
import { TMSimulationView } from "./views/TMSimulationView";

export function TMSimulator() {
  const { t } = useTranslation();
  const [config, setConfig] = useState<TMConfig>(() =>
    cloneJson(defaultTMConfig),
  );
  const [configError, setConfigError] = useState<string | null>(null);
  const [tableEditError, setTableEditError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(true);
  const simulator = useMemo(() => new TuringMachineSimulator(), []);

  const {
    status,
    speed,
    error,
    currentState,
    play,
    pause,
    step,
    stepBack,
    reset,
    setSpeed,
  } = useSimulationEngine(simulator, config);

  const tableHeaders = useMemo(
    () => buildTransitionTableHeaders(config.states),
    [config.states],
  );
  const tableRows = useMemo(() => buildTransitionTableRows(config), [config]);
  const activeCell = useMemo(
    () => getActiveTransitionCell(config, currentState),
    [config, currentState],
  );

  const handleApplyConfig = () => {
    if (tableEditError) {
      return;
    }

    try {
      validateTMConfig(config);
    } catch (err) {
      setConfigError(err instanceof Error ? err.message : String(err));
      return;
    }

    reset(config);
    setConfigError(null);
    setIsEditMode(false);
  };

  const handleEditConfig = () => {
    setConfigError(null);
    setTableEditError(null);
    setIsEditMode(true);
    pause();
  };

  const handleConfigChange = (newConfig: TMConfig) => {
    setConfig(newConfig);
    setConfigError(null);
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4">
      {isEditMode ? (
        <div className="flex flex-col gap-4">
          <TMConfigView
            config={config}
            onChange={handleConfigChange}
            validationError={configError}
            onTableEditErrorChange={setTableEditError}
          />
          <button
            onClick={handleApplyConfig}
            disabled={!!tableEditError}
            className="bg-primary text-primary-foreground hover:bg-primary/90 self-center rounded-md px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("tm.config.apply", "Start Simulation")}
          </button>
        </div>
      ) : (
        <TMSimulationView
          config={config}
          currentState={currentState}
          tableHeaders={tableHeaders}
          tableRows={tableRows}
          activeCell={activeCell}
          status={status}
          speed={speed}
          error={error}
          onEditConfig={handleEditConfig}
          onPlay={play}
          onPause={pause}
          onStep={step}
          onStepBack={stepBack}
          onReset={() => reset()}
          onSpeedChange={setSpeed}
        />
      )}
    </div>
  );
}
