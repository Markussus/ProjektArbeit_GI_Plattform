import { useState, useMemo } from "react";
import { useSimulationEngine } from "@/hooks/useSimulationEngine";
import { TuringMachineSimulator } from "./TuringMachineSimulator";
import { SimulatorControls } from "@/components/shared/SimulatorControls/SimulatorControls";
import { ArrayView } from "@/components/shared/ArrayVisual/ArrayView";
import { TMConfigView } from "./TMConfigView";
import { TableView } from "@/components/shared/TableVisual/TableView";
import type { TMConfig } from "./types";
import { formatState, formatTransition, DEFAULT_BLANK_SYMBOL } from "./types";
import { useTranslation } from "react-i18next";

const defaultConfig: TMConfig = {
  states: ["q0", "q1", "q2", "q3"],
  inputAlphabet: ["0", "1"],
  tapeAlphabet: ["0", "1", DEFAULT_BLANK_SYMBOL],
  blankSymbol: DEFAULT_BLANK_SYMBOL,
  initialState: "q0",
  haltStates: ["q3"],
  initialTape: ["1", "0", "1", "1"],
  transitions: {
    [DEFAULT_BLANK_SYMBOL]: {
      q0: { nextState: "q3", writeSymbol: DEFAULT_BLANK_SYMBOL, movement: "N" },
      q1: { nextState: "q3", writeSymbol: DEFAULT_BLANK_SYMBOL, movement: "N" },
    },
    "0": {
      q0: { nextState: "q0", writeSymbol: "1", movement: "R" },
      q1: { nextState: "q1", writeSymbol: "0", movement: "R" },
    },
    "1": {
      q0: { nextState: "q1", writeSymbol: "0", movement: "R" },
      q1: { nextState: "q0", writeSymbol: "1", movement: "R" },
    },
  },
};

const simulator = new TuringMachineSimulator();

export function TMSimulator() {
  const { t } = useTranslation();
  const [config, setConfig] = useState<TMConfig>(defaultConfig);
  const [isEditMode, setIsEditMode] = useState<boolean>(true);

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

  // For readonly table in simulation mode
  const tableHeaders = useMemo(
    () => ["δ", ...config.states.map(formatState)],
    [config.states],
  );

  const tableRows = useMemo(() => {
    return config.tapeAlphabet.map((symbol) => {
      const row = [symbol];
      config.states.forEach((state) => {
        const trans = config.transitions[symbol]?.[state];
        row.push(formatTransition(trans));
      });
      return row;
    });
  }, [config.tapeAlphabet, config.states, config.transitions]);

  const activeCell = useMemo(() => {
    if (!currentState) return null;
    const currentSymbol =
      currentState.tape[currentState.headPosition] || config.blankSymbol;
    const symbolIndex = config.tapeAlphabet.indexOf(currentSymbol);
    const stateIndex = config.states.indexOf(currentState.currentState);

    if (symbolIndex >= 0 && stateIndex >= 0) {
      return { row: symbolIndex, col: stateIndex + 1 };
    }
    return null;
  }, [currentState, config]);

  const handleApplyConfig = () => {
    reset(config);
    setIsEditMode(false);
  };

  const handleEditConfig = () => {
    setIsEditMode(true);
    pause();
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4">
      {isEditMode ? (
        <div className="flex flex-col gap-4">
          <TMConfigView config={config} onChange={setConfig} />
          <button
            onClick={handleApplyConfig}
            className="bg-primary text-primary-foreground hover:bg-primary/90 self-center rounded-md px-4 py-2"
          >
            {t("tm.config.apply", "Start Simulation")}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
              {t("tm.sim.title", "Turing Machine Simulator")}
            </h2>
            <button
              onClick={handleEditConfig}
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
                onPlay={play}
                onPause={pause}
                onStep={step}
                onStepBack={stepBack}
                onReset={() => reset()}
                onSpeedChange={setSpeed}
              />

              <div className="bg-card mt-4 rounded-lg border p-4">
                <h3 className="mb-2 font-semibold">
                  {t("tm.sim.status", "Status")}
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">
                    {t("tm.sim.state", "Current State")}:
                  </div>
                  <div className="font-mono">
                    {formatState(currentState.currentState)}
                  </div>
                  <div className="text-muted-foreground">
                    {t("tm.sim.symbol", "Current Symbol")}:
                  </div>
                  <div className="font-mono">
                    {currentState.tape[currentState.headPosition] ||
                      config.blankSymbol}
                  </div>
                  <div className="text-muted-foreground">
                    {t("tm.sim.halt", "Halted")}:
                  </div>
                  <div>{currentState.isHalted ? "Yes" : "No"}</div>
                </div>
                {currentState.errorMessage && (
                  <div className="bg-destructive/10 text-destructive mt-4 rounded p-2 text-sm">
                    {currentState.errorMessage}
                  </div>
                )}
                {error && (
                  <div className="bg-destructive/10 text-destructive mt-4 rounded p-2 text-sm">
                    {error.message}
                  </div>
                )}
              </div>
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
      )}
    </div>
  );
}
