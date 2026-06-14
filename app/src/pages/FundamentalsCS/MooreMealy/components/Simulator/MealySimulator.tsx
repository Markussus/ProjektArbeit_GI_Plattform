import { useCallback, useEffect, useMemo, useState } from "react";
import { CircuitBoard, Pencil, Play, TableProperties } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SimulatorStringTransferBox } from "@/components/shared/SimulatorStringTransferBox";
import { TOPIC_STORAGE_IDS } from "@/data/moduleCatalog";
import { useTrainingCenterAutoSave } from "@/hooks/useTrainingCenterAutoSave";
import {
  createTrainingCenterIdentifier,
  createTrainingCenterTransferCodec,
  loadTrainingCenterValue,
} from "@/lib/trainingCenter";
import { cloneJson } from "@/lib/utils";
import { useMealySimulator } from "./application/useMealySimulator";
import { defaultMealyProgram } from "./config/defaultMealyProgram";
import { buildMealyConversion } from "./domain/mealyConversion";
import {
  createNextInputSymbol,
  createNextStateName,
  normalizeMealyProgram,
  renameMealyInput,
  renameMealyState,
  validateMealyProgram,
} from "./domain/mealyProgram";
import { mealyProgramTransferCodec } from "./domain/mealyProgramTransfer";
import type { MealyProgram } from "./domain/mealyTypes";
import { MealyConfigView } from "./presentation/MealyConfigView";
import { MealySimulationView } from "./presentation/MealySimulationView";
import { MooreConversionView } from "./presentation/MooreConversionView";
import { MooreLogicGateView } from "./presentation/MooreLogicGateView";
import { MooreViewActions } from "./presentation/MooreViewActions";

export function MealySimulator() {
  const { t } = useTranslation();
  const [program, setProgram] = useState(() => cloneJson(defaultMealyProgram));
  const [committed, setCommitted] = useState(() =>
    cloneJson(defaultMealyProgram),
  );
  const [mode, setMode] = useState<
    "edit" | "simulation" | "conversion" | "logic"
  >("edit");
  const [storageReady, setStorageReady] = useState(false);
  const simulation = useMealySimulator(committed);
  const issues = useMemo(() => validateMealyProgram(program), [program]);
  const conversion = useMemo(
    () => (issues.length ? null : buildMealyConversion(program)),
    [issues.length, program],
  );
  const identifier = useMemo(
    () => createTrainingCenterIdentifier(TOPIC_STORAGE_IDS.mooreMealy, 0x3e),
    [],
  );
  const transferCodec = useMemo(
    () =>
      createTrainingCenterTransferCodec(identifier, mealyProgramTransferCodec),
    [identifier],
  );
  const loadProgram = useCallback((value: MealyProgram) => {
    setProgram(normalizeMealyProgram(value));
    setMode("edit");
  }, []);
  useEffect(() => {
    let cancelled = false;
    void loadTrainingCenterValue(identifier, mealyProgramTransferCodec)
      .then((value) => {
        if (!cancelled && value) loadProgram(value);
      })
      .finally(() => {
        if (!cancelled) setStorageReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [identifier, loadProgram]);
  useTrainingCenterAutoSave({
    identifier,
    value: program,
    codec: mealyProgramTransferCodec,
    enabled: storageReady,
  });

  const updateOutput = (
    input: string,
    state: string,
    patch: Partial<{ symbol: string; code: number }>,
  ) =>
    setProgram((current) => ({
      ...current,
      outputs: {
        ...current.outputs,
        [input]: {
          ...current.outputs[input],
          [state]: { ...current.outputs[input][state], ...patch },
        },
      },
    }));
  const start = () => {
    const normalized = normalizeMealyProgram(program);
    if (validateMealyProgram(normalized).length) return;
    setProgram(normalized);
    setCommitted(normalized);
    setMode("simulation");
  };
  const edit = () => {
    simulation.pause();
    setProgram(cloneJson(committed));
    setMode("edit");
  };
  const showSimulation = () => {
    setCommitted(normalizeMealyProgram(program));
    setMode("simulation");
  };

  if (mode === "conversion" && conversion)
    return (
      <MooreConversionView
        conversion={conversion}
        onBackToEditor={() => setMode("edit")}
        onShowSimulator={showSimulation}
        onShowLogic={() => setMode("logic")}
      />
    );
  if (mode === "logic" && conversion)
    return (
      <MooreLogicGateView
        conversion={conversion}
        onEditDefinition={() => setMode("edit")}
        onShowSimulator={showSimulation}
        onShowConversion={() => setMode("conversion")}
      />
    );

  return (
    <div
      data-testid="mealy-simulator"
      className="mx-auto w-full max-w-[100rem] space-y-6"
    >
      {mode === "edit" ? (
        <>
          <MealyConfigView
            program={program}
            issues={issues}
            onChange={setProgram}
            onTransitionChange={(input, state, target) =>
              setProgram((current) => ({
                ...current,
                transitions: {
                  ...current.transitions,
                  [input]: { ...current.transitions[input], [state]: target },
                },
              }))
            }
            onStateRename={(previous, next) => {
              const renamed = renameMealyState(program, previous, next);
              if (!renamed) return false;
              setProgram(renamed);
              return true;
            }}
            onInputRename={(previous, next) => {
              const renamed = renameMealyInput(program, previous, next);
              if (!renamed) return false;
              setProgram(renamed);
              return true;
            }}
            onAddState={(requested) => {
              const state =
                requested?.trim() || createNextStateName(program.states);
              if (program.states.includes(state)) return state;
              setProgram((current) => ({
                ...current,
                states: [...current.states, state],
                transitions: Object.fromEntries(
                  current.inputSymbols.map((input) => [
                    input,
                    {
                      ...current.transitions[input],
                      [state]: current.initialState,
                    },
                  ]),
                ),
                outputs: Object.fromEntries(
                  current.inputSymbols.map((input) => [
                    input,
                    {
                      ...current.outputs[input],
                      [state]: {
                        symbol: `OUT_${current.states.length}`,
                        code: current.states.length,
                      },
                    },
                  ]),
                ),
              }));
              return state;
            }}
            onRemoveState={(removed) =>
              setProgram((current) => {
                if (current.states.length <= 1) return current;
                const states = current.states.filter(
                  (state) => state !== removed,
                );
                const fallback = states[0];
                return {
                  ...current,
                  states,
                  initialState:
                    current.initialState === removed
                      ? fallback
                      : current.initialState,
                  transitions: Object.fromEntries(
                    current.inputSymbols.map((input) => [
                      input,
                      Object.fromEntries(
                        states.map((state) => [
                          state,
                          current.transitions[input][state] === removed
                            ? fallback
                            : current.transitions[input][state],
                        ]),
                      ),
                    ]),
                  ),
                  outputs: Object.fromEntries(
                    current.inputSymbols.map((input) => [
                      input,
                      Object.fromEntries(
                        states.map((state) => [
                          state,
                          current.outputs[input][state],
                        ]),
                      ),
                    ]),
                  ),
                };
              })
            }
            onAddInput={() =>
              setProgram((current) => {
                const input = createNextInputSymbol(current.inputSymbols);
                return {
                  ...current,
                  inputSymbols: [...current.inputSymbols, input],
                  transitions: {
                    ...current.transitions,
                    [input]: Object.fromEntries(
                      current.states.map((state) => [
                        state,
                        current.initialState,
                      ]),
                    ),
                  },
                  outputs: {
                    ...current.outputs,
                    [input]: Object.fromEntries(
                      current.states.map((state, index) => [
                        state,
                        current.outputs[current.inputSymbols[0]]?.[state] ?? {
                          symbol: `OUT_${current.inputSymbols.length}_${index}`,
                          code:
                            current.inputSymbols.length *
                              current.states.length +
                            index,
                        },
                      ]),
                    ),
                  },
                };
              })
            }
            onRemoveInput={(removed) =>
              setProgram((current) => {
                const transitions = { ...current.transitions };
                const outputs = { ...current.outputs };
                delete transitions[removed];
                delete outputs[removed];
                return {
                  ...current,
                  inputSymbols: current.inputSymbols.filter(
                    (input) => input !== removed,
                  ),
                  inputWord: current.inputWord.filter(
                    (input) => input !== removed,
                  ),
                  transitions,
                  outputs,
                };
              })
            }
            onOutputSymbolChange={(input, state, symbol) =>
              updateOutput(input, state, { symbol })
            }
            onOutputCodeChange={(input, state, code) =>
              updateOutput(input, state, { code })
            }
          />
          <SimulatorStringTransferBox
            value={program}
            codec={transferCodec}
            onLoad={loadProgram}
            testIdPrefix="mealy-transfer"
          />
          <MooreViewActions
            actions={[
              {
                label: t("moore.conversion.open"),
                onClick: () => setMode("conversion"),
                icon: TableProperties,
                testId: "mealy-open-conversion",
                disabled: !conversion,
              },
              {
                label: t("moore.sim.startSimulation"),
                onClick: start,
                icon: Play,
                testId: "mealy-start-simulation",
                disabled: !!issues.length,
              },
              {
                label: t("moore.logic.open"),
                onClick: () => setMode("logic"),
                icon: CircuitBoard,
                testId: "mealy-open-logic",
                disabled: !conversion,
              },
            ]}
          />
        </>
      ) : (
        <>
          <MealySimulationView
            program={committed}
            runtime={simulation.runtime}
            status={simulation.status}
            speed={simulation.speed}
            error={simulation.error}
            onPlay={simulation.play}
            onPause={simulation.pause}
            onStep={simulation.step}
            onStepBack={simulation.stepBack}
            onReset={() => simulation.reset(committed)}
            onSpeedChange={simulation.setSpeed}
          />
          <MooreViewActions
            actions={[
              {
                label: t("moore.navigation.editDefinition"),
                onClick: edit,
                icon: Pencil,
                testId: "mealy-edit-definition",
              },
              {
                label: t("moore.navigation.showConversion"),
                onClick: () => setMode("conversion"),
                icon: TableProperties,
                testId: "mealy-open-conversion",
              },
              {
                label: t("moore.navigation.showLogic"),
                onClick: () => setMode("logic"),
                icon: CircuitBoard,
                testId: "mealy-open-logic",
              },
            ]}
          />
        </>
      )}
    </div>
  );
}
