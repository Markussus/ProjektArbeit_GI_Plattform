import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { IntegerConverter } from "./IntegerConverter";
import { NegativeNumbers } from "./NegativeNumbers";
import { IEEE754Converter } from "./IEEE754Converter";
import { FractionalConverter } from "./FractionalConverter";
import { ArithmeticMode } from "./arithmetic";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog/ConfirmDialog";
import type { TopicItem } from "@/types/exercise";
import { cn } from "@/lib/utils";
import { useTrainingCenterAutoSave } from "@/hooks/useTrainingCenterAutoSave";
import { useActiveSimulatorTransfer } from "@/hooks/useActiveSimulatorTransfer";
import {
  SIMULATOR_TASK_STORAGE_ID,
  createTrainingCenterIdentifier,
  loadTrainingCenterValue,
  trainingCenterStorage,
} from "@/lib/trainingCenter";
import { TOPIC_STORAGE_IDS } from "@/data/topicStorageIds";
import { numberSystemsExercises } from "../../exercises";
import { nsTransferCodec } from "./nsTransferCodec";
import type { NumberSystemState } from "./nsTransferCodec";

type SimulatorMode =
  | "integers"
  | "negative"
  | "fractional"
  | "ieee754"
  | "arithmetic";

export interface SimulatorHandle {
  resetStoredState: () => void;
}

interface SimulatorProps {
  selectedExercise?: TopicItem | null;
  /** Callback zum Verlassen des Übungsmodus auf Seite des Elternelementes */
  onExitExercise?: () => void;
}

export const Simulator = forwardRef<SimulatorHandle, SimulatorProps>(
  function Simulator({ selectedExercise, onExitExercise }, ref) {
    const { t } = useTranslation("translation");
    const getInitialActiveMode = (id: string): SimulatorMode => {
      if (
        id.includes("floatToBin") ||
        id.includes("example_u05_1") ||
        id.includes("example_u05_2")
      )
        return "fractional";
      if (
        id.includes("ieee") ||
        id.includes("example_u05_3") ||
        id.includes("example_u05_4") ||
        id.includes("example_u07_5")
      )
        return "ieee754";
      if (
        id.includes("Add") ||
        id.includes("Sub") ||
        id.includes("mult") ||
        id.includes("example_u06") ||
        id.includes("example_u03_2") ||
        id.includes("example_u07_2") ||
        id.includes("example_u07_4")
      )
        return "arithmetic";
      if (id.includes("example_u07_3")) return "negative";
      return "integers";
    };

    const [simulatorState, setSimulatorState] = useState<NumberSystemState>(
      () => {
        return {
          activeMode: selectedExercise
            ? getInitialActiveMode(selectedExercise.id)
            : "integers",
        };
      },
    );
    const [isStorageReady, setIsStorageReady] = useState(false);
    const [loadVersion, setLoadVersion] = useState(0);
    const activeMode = simulatorState.activeMode;

    const setActiveMode = (mode: SimulatorMode) => {
      setSimulatorState((prev) => ({ ...prev, activeMode: mode }));
    };

    // Exercise mode states
    const [isExerciseMode, setIsExerciseMode] = useState(() => {
      return selectedExercise
        ? !selectedExercise.id.includes(".example")
        : false;
    });
    const [showSolution, setShowSolution] = useState(() => {
      return selectedExercise ? selectedExercise.id.includes(".example") : true;
    });

    // Tab-change confirm dialog state
    const [pendingMode, setPendingMode] = useState<SimulatorMode | null>(null);
    const [showTabConfirm, setShowTabConfirm] = useState(false);

    // Initial values for converters when launched via exercise
    const [initialValue, setInitialValue] = useState<string>("");
    const [initialBase, setInitialBase] = useState<
      "dec" | "bin" | "oct" | "hex"
    >("dec");
    const [initialTargetBase, setInitialTargetBase] = useState<
      "dec" | "bin" | "oct" | "hex"
    >("bin");
    const [initialValueA, setInitialValueA] = useState<string>("");
    const [initialValueB, setInitialValueB] = useState<string>("");
    const [initialSubMode, setInitialSubMode] = useState<
      | "addition"
      | "subtraction"
      | "multiplication"
      | "division"
      | "shifting"
      | "compare"
    >("addition");
    const [initialConverterMode, setInitialConverterMode] = useState<
      "decToIeee" | "ieeeToDec"
    >("decToIeee");

    useEffect(() => {
      if (selectedExercise) {
        const isExample = selectedExercise.id.includes(".example");

        setIsExerciseMode(!isExample);
        setShowSolution(isExample);

        const randInt = (min: number, max: number) =>
          Math.floor(Math.random() * (max - min + 1)) + min;
        const decToBin = (n: number) => n.toString(2);

        // Match exercise id using prefix/contains or exact matching logic based on data.
        if (selectedExercise.id === "number-systems.ex_u03_decToBin") {
          setActiveMode("integers");
          setInitialBase("dec");
          setInitialTargetBase("bin");
          setInitialValue(randInt(1, 63).toString());
        } else if (selectedExercise.id === "number-systems.ex_u03_binAdd") {
          setActiveMode("arithmetic");
          setInitialSubMode("addition");
          setInitialValueA(decToBin(randInt(10, 100)));
          setInitialValueB(decToBin(randInt(10, 100)));
        } else if (
          selectedExercise.id === "number-systems.ex_u04_binToHexOct"
        ) {
          setActiveMode("integers");
          setInitialBase("bin");
          setInitialTargetBase(Math.random() > 0.5 ? "hex" : "oct");
          setInitialValue(
            Array.from({ length: 8 }, () =>
              Math.random() < 0.5 ? "1" : "0",
            ).join(""),
          );
        } else if (selectedExercise.id === "number-systems.ex_u04_octToHex") {
          setActiveMode("integers");
          setInitialBase("oct");
          setInitialTargetBase("hex");
          setInitialValue(randInt(64, 511).toString(8).padStart(3, "0"));
        } else if (selectedExercise.id === "number-systems.ex_u04_hexToBin") {
          setActiveMode("integers");
          setInitialBase("hex");
          setInitialTargetBase("bin");
          setInitialValue(
            randInt(16, 255).toString(16).toUpperCase().padStart(2, "0"),
          );
        } else if (selectedExercise.id === "number-systems.ex_u05_floatToBin") {
          setActiveMode("fractional");
          const wholes = randInt(-20, 20);
          const fracs = [0.5, 0.25, 0.75, 0.125, 0.375, 0.625, 0.875];
          setInitialValue(
            (wholes + fracs[randInt(0, fracs.length - 1)]).toString(),
          );
        } else if (selectedExercise.id === "number-systems.ex_u05_ieeeEncode") {
          setActiveMode("ieee754");
          setInitialConverterMode("decToIeee");
          setInitialValue((Math.random() * 200 - 100).toFixed(4));
        } else if (selectedExercise.id === "number-systems.ex_u05_ieeeDecode") {
          setActiveMode("ieee754");
          setInitialConverterMode("ieeeToDec");
          const sign = Math.random() < 0.5 ? "1" : "0";
          const exp = randInt(1, 254).toString(2).padStart(8, "0");
          const mant = Array.from({ length: 23 }, () =>
            Math.random() < 0.5 ? "1" : "0",
          ).join("");
          setInitialValue(sign + exp + mant);
        } else if (selectedExercise.id === "number-systems.ex_u06_addSub") {
          setActiveMode("arithmetic");
          setInitialSubMode(Math.random() > 0.5 ? "addition" : "subtraction");
          setInitialValueA(decToBin(randInt(10, 100)).padStart(8, "0"));
          setInitialValueB(decToBin(randInt(10, 100)).padStart(8, "0"));
        } else if (selectedExercise.id === "number-systems.ex_u06_mult") {
          setActiveMode("arithmetic");
          setInitialSubMode("multiplication");
          setInitialValueA(decToBin(randInt(8, 15)));
          setInitialValueB(decToBin(randInt(16, 31)));
        } else if (selectedExercise.id === "number-systems.example_u03_1") {
          setActiveMode("integers");
          setInitialBase("dec");
          setInitialTargetBase("bin");
          setInitialValue("26"); // Picked 26 as an example
        } else if (selectedExercise.id === "number-systems.example_u03_2") {
          setActiveMode("arithmetic");
          setInitialSubMode("addition");
          setInitialValueA("110010"); // 50
          setInitialValueB("1101"); // 13
        } else if (selectedExercise.id === "number-systems.example_u04_1") {
          setActiveMode("integers");
          setInitialBase("bin");
          setInitialTargetBase("hex");
          setInitialValue("01111010");
        } else if (selectedExercise.id === "number-systems.example_u04_2") {
          setActiveMode("integers");
          setInitialBase("bin");
          setInitialTargetBase("oct");
          setInitialValue("00111100");
        } else if (selectedExercise.id === "number-systems.example_u04_3") {
          setActiveMode("integers");
          setInitialBase("oct");
          setInitialTargetBase("hex");
          setInitialValue("760");
        } else if (selectedExercise.id === "number-systems.example_u04_4") {
          setActiveMode("integers");
          setInitialBase("hex");
          setInitialTargetBase("bin");
          setInitialValue("7F");
        } else if (selectedExercise.id === "number-systems.example_u05_1") {
          setActiveMode("fractional");
          setInitialValue("10.5");
        } else if (selectedExercise.id === "number-systems.example_u05_2") {
          // Unnormalized is fractional converter, normalized is IEEE without bias? IEEE is normalized
          setActiveMode("fractional");
          setInitialValue("3.375");
        } else if (selectedExercise.id === "number-systems.example_u05_3") {
          setActiveMode("ieee754");
          setInitialConverterMode("decToIeee");
          setInitialValue("-4.4375");
        } else if (selectedExercise.id === "number-systems.example_u05_4") {
          setActiveMode("ieee754");
          setInitialConverterMode("ieeeToDec");
          setInitialValue("01000001010101000000000000000000"); // padded with zeros
        } else if (selectedExercise.id === "number-systems.example_u06_1_add") {
          setActiveMode("arithmetic");
          setInitialSubMode("addition");
          setInitialValueA("01101101");
          setInitialValueB("00100111");
        } else if (selectedExercise.id === "number-systems.example_u06_1_sub") {
          setActiveMode("arithmetic");
          setInitialSubMode("subtraction");
          setInitialValueA("01101101");
          setInitialValueB("00100111");
        } else if (selectedExercise.id === "number-systems.example_u06_2") {
          setActiveMode("arithmetic");
          setInitialSubMode("multiplication");
          setInitialValueA("1011");
          setInitialValueB("11001");
        } else if (selectedExercise.id === "number-systems.example_u07_1_1") {
          setActiveMode("integers");
          setInitialBase("dec");
          setInitialTargetBase("bin");
          setInitialValue("127");
        } else if (selectedExercise.id === "number-systems.example_u07_1_2") {
          setActiveMode("integers");
          setInitialBase("dec");
          setInitialTargetBase("bin");
          setInitialValue("45");
        } else if (selectedExercise.id === "number-systems.example_u07_1_3") {
          setActiveMode("integers");
          setInitialBase("dec");
          setInitialTargetBase("bin");
          setInitialValue("456");
        } else if (selectedExercise.id === "number-systems.example_u07_1_4") {
          setActiveMode("integers");
          setInitialBase("dec");
          setInitialTargetBase("bin");
          setInitialValue("255");
        } else if (selectedExercise.id === "number-systems.example_u07_1_5") {
          setActiveMode("integers");
          setInitialBase("dec");
          setInitialTargetBase("bin");
          setInitialValue("110");
        } else if (selectedExercise.id === "number-systems.example_u07_2_1") {
          setActiveMode("arithmetic");
          setInitialSubMode("addition");
          setInitialValueA("110101");
          setInitialValueB("100110");
        } else if (selectedExercise.id === "number-systems.example_u07_2_2") {
          setActiveMode("arithmetic");
          setInitialSubMode("addition");
          setInitialValueA("10000000");
          setInitialValueB("111111");
        } else if (selectedExercise.id === "number-systems.example_u07_2_3") {
          setActiveMode("arithmetic");
          setInitialSubMode("addition");
          setInitialValueA("11111111");
          setInitialValueB("11001000");
        } else if (selectedExercise.id === "number-systems.example_u07_3_1") {
          setActiveMode("negative");
          setInitialValue("-5");
        } else if (selectedExercise.id === "number-systems.example_u07_3_2") {
          setActiveMode("negative");
          setInitialValue("-125");
        } else if (selectedExercise.id === "number-systems.example_u07_3_3") {
          setActiveMode("negative");
          setInitialValue("0");
        } else if (selectedExercise.id === "number-systems.example_u07_3_4") {
          setActiveMode("negative");
          setInitialValue("-63");
        } else if (selectedExercise.id === "number-systems.example_u07_3_5") {
          setActiveMode("negative");
          setInitialValue("-128");
        } else if (selectedExercise.id === "number-systems.example_u07_4_1") {
          setActiveMode("arithmetic");
          setInitialSubMode("subtraction");
          setInitialValueA("110010");
          setInitialValueB("100110");
        } else if (selectedExercise.id === "number-systems.example_u07_4_2") {
          setActiveMode("arithmetic");
          setInitialSubMode("subtraction");
          setInitialValueA("1000011");
          setInitialValueB("1000100");
        } else if (selectedExercise.id === "number-systems.example_u07_4_3") {
          setActiveMode("arithmetic");
          setInitialSubMode("subtraction");
          setInitialValueA("101");
          setInitialValueB("1000");
        } else if (selectedExercise.id === "number-systems.example_u07_4_4") {
          setActiveMode("arithmetic");
          setInitialSubMode("subtraction");
          setInitialValueA("1111");
          setInitialValueB("1111");
        } else if (selectedExercise.id === "number-systems.example_u07_5_1") {
          setActiveMode("ieee754");
          setInitialConverterMode("decToIeee");
          setInitialValue("5.75");
        } else if (selectedExercise.id === "number-systems.example_u07_5_2") {
          setActiveMode("ieee754");
          setInitialConverterMode("decToIeee");
          setInitialValue("24.25");
        } else if (selectedExercise.id === "number-systems.example_u07_5_3") {
          setActiveMode("ieee754");
          setInitialConverterMode("decToIeee");
          setInitialValue("18.375");
        } else if (selectedExercise.id === "number-systems.example_u07_5_4") {
          setActiveMode("ieee754");
          setInitialConverterMode("decToIeee");
          setInitialValue("-2.8125");
        } else if (selectedExercise.id === "number-systems.example_u07_5_5") {
          setActiveMode("ieee754");
          setInitialConverterMode("decToIeee");
          setInitialValue("-10.9375");
        }
      } else {
        setIsExerciseMode(false);
        setShowSolution(true);
        setInitialValue("");
        setInitialBase("dec");
        setInitialTargetBase("bin");
        setInitialValueA("");
        setInitialValueB("");
        setInitialSubMode("addition");
        setInitialConverterMode("decToIeee");
      }
    }, [selectedExercise]);

    /** Verlässt den Übungsmodus vollständig: lokaler State + übergeordneter State */
    const handleExitExercise = () => {
      setIsExerciseMode(false);
      setShowSolution(true);
      // Elternelement (ModuleTopicPage) informieren → simulationExercise wird genullt
      onExitExercise?.();
    };

    const isExample = selectedExercise?.id.includes(".example");
    const isStorageEnabled = !isExample;
    const exerciseIndex = selectedExercise
      ? numberSystemsExercises.findIndex(
          (ex) => ex.titleKey === selectedExercise.id,
        )
      : -1;
    const taskStorageId =
      exerciseIndex >= 0 ? exerciseIndex : SIMULATOR_TASK_STORAGE_ID;

    const storageIdentifier = createTrainingCenterIdentifier(
      TOPIC_STORAGE_IDS.numberSystems,
      taskStorageId,
    );

    useActiveSimulatorTransfer({
      identifier: storageIdentifier,
      value: simulatorState,
      codec: nsTransferCodec,
    });

    useEffect(() => {
      let isCancelled = false;

      setIsStorageReady(false);

      if (!isStorageEnabled) {
        return;
      }

      void loadTrainingCenterValue(storageIdentifier, nsTransferCodec)
        .then((storedState) => {
          if (!isCancelled && storedState) {
            setSimulatorState(() => {
              const nextState = { ...storedState };
              if (selectedExercise) {
                nextState.activeMode = getInitialActiveMode(
                  selectedExercise.id,
                );
              }
              return nextState;
            });
            setLoadVersion((v) => v + 1);
          }
        })
        .catch(() => undefined)
        .finally(() => {
          if (!isCancelled) {
            setIsStorageReady(true);
          }
        });

      return () => {
        isCancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isStorageEnabled, storageIdentifier]);

    useTrainingCenterAutoSave({
      identifier: storageIdentifier,
      value: simulatorState,
      codec: nsTransferCodec,
      enabled: isStorageEnabled && isStorageReady,
    });

    /**
     * Tab-Click Handler: Wenn im Übungsmodus, Dialog anzeigen.
     * Andernfalls direkt wechseln.
     */
    const handleTabClick = (mode: SimulatorMode) => {
      if (mode === activeMode) return;
      if (isExerciseMode && !showSolution) {
        setPendingMode(mode);
        setShowTabConfirm(true);
      } else {
        setActiveMode(mode);
      }
    };

    /** Bestätigter Tab-Wechsel: Übungsmodus verlassen + Tab wechseln */
    const handleTabConfirm = () => {
      setShowTabConfirm(false);
      handleExitExercise();
      if (pendingMode) {
        setActiveMode(pendingMode);
        setPendingMode(null);
      }
    };

    const resetStoredState = useCallback(() => {
      if (isStorageEnabled) {
        trainingCenterStorage.delete(storageIdentifier);
      }

      setSimulatorState({
        activeMode: selectedExercise
          ? getInitialActiveMode(selectedExercise.id)
          : "integers",
      });
      setLoadVersion((v) => v + 1);
    }, [isStorageEnabled, storageIdentifier, selectedExercise]);

    useImperativeHandle(
      ref,
      () => ({
        resetStoredState,
      }),
      [resetStoredState],
    );

    return (
      <div
        data-testid="ns-simulator"
        className="flex h-full flex-col space-y-6"
      >
        {/* Dashboard Navigation */}
        <div className="border-border flex gap-1 border-b">
          {(
            [
              "integers",
              "fractional",
              "negative",
              "ieee754",
              "arithmetic",
            ] as SimulatorMode[]
          ).map((mode) => (
            <button
              key={mode}
              data-testid={`ns-tab-${mode}`}
              className={cn(
                "relative px-4 py-2.5 text-sm font-medium",
                activeMode === mode
                  ? "text-tab-active"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => handleTabClick(mode)}
            >
              {t(`number-systems.simulator.tabs.${mode}`)}
              {activeMode === mode && (
                <span className="bg-tab-indicator absolute inset-x-0 -bottom-px h-0.5" />
              )}
            </button>
          ))}
        </div>

        {/* Simulator Content */}
        <div className="flex-1 overflow-auto">
          {activeMode === "integers" && (
            <IntegerConverter
              key={
                selectedExercise?.id
                  ? `${selectedExercise.id}-${initialValue}-${loadVersion}`
                  : `free-int-${loadVersion}`
              }
              isExerciseMode={isExerciseMode}
              showSolution={showSolution}
              onShowSolution={() => setShowSolution(true)}
              onExitExercise={isExerciseMode ? handleExitExercise : undefined}
              initialValue={initialValue}
              initialBase={initialBase}
              initialTargetBase={initialTargetBase}
              initialState={
                selectedExercise ? undefined : simulatorState.integers
              }
              onChangeState={(state) =>
                setSimulatorState((p) => ({ ...p, integers: state }))
              }
            />
          )}
          {activeMode === "negative" && (
            <NegativeNumbers
              key={
                selectedExercise?.id
                  ? `${selectedExercise.id}-${initialValue}-${loadVersion}`
                  : `free-neg-${loadVersion}`
              }
              isExerciseMode={isExerciseMode}
              showSolution={showSolution}
              onShowSolution={() => setShowSolution(true)}
              onExitExercise={isExerciseMode ? handleExitExercise : undefined}
              initialValue={initialValue}
              initialState={
                selectedExercise ? undefined : simulatorState.negative
              }
              onChangeState={(state) =>
                setSimulatorState((p) => ({ ...p, negative: state }))
              }
            />
          )}
          {activeMode === "fractional" && (
            <FractionalConverter
              key={
                selectedExercise?.id
                  ? `${selectedExercise.id}-${initialValue}-${loadVersion}`
                  : `free-frac-${loadVersion}`
              }
              isExerciseMode={isExerciseMode}
              showSolution={showSolution}
              onShowSolution={() => setShowSolution(true)}
              onExitExercise={isExerciseMode ? handleExitExercise : undefined}
              initialValue={initialValue}
              initialState={
                selectedExercise ? undefined : simulatorState.fractional
              }
              onChangeState={(state) =>
                setSimulatorState((p) => ({ ...p, fractional: state }))
              }
            />
          )}
          {activeMode === "ieee754" && (
            <IEEE754Converter
              key={
                selectedExercise?.id
                  ? `${selectedExercise.id}-${initialValue}-${loadVersion}`
                  : `free-ieee-${loadVersion}`
              }
              isExerciseMode={isExerciseMode}
              showSolution={showSolution}
              onShowSolution={() => setShowSolution(true)}
              onExitExercise={isExerciseMode ? handleExitExercise : undefined}
              initialValue={initialValue}
              initialConverterMode={initialConverterMode}
              initialState={
                selectedExercise ? undefined : simulatorState.ieee754
              }
              onChangeState={(state) =>
                setSimulatorState((p) => ({ ...p, ieee754: state }))
              }
            />
          )}
          {activeMode === "arithmetic" && (
            <ArithmeticMode
              key={
                selectedExercise?.id
                  ? `${selectedExercise.id}-${initialValueA}-${initialValueB}-${loadVersion}`
                  : `free-arith-${loadVersion}`
              }
              isExerciseMode={isExerciseMode}
              showSolution={showSolution}
              onShowSolution={() => setShowSolution(true)}
              onExitExercise={isExerciseMode ? handleExitExercise : undefined}
              initialMode={
                initialSubMode as
                  | "addition"
                  | "subtraction"
                  | "multiplication"
                  | "division"
                  | "shifting"
                  | "compare"
              }
              initialValueA={initialValueA}
              initialValueB={initialValueB}
              initialState={
                selectedExercise ? undefined : simulatorState.arithmetic
              }
              onChangeState={(state) =>
                setSimulatorState((p) => ({ ...p, arithmetic: state }))
              }
            />
          )}
        </div>

        {/* Tab-Wechsel Bestätigungsdialog */}
        <ConfirmDialog
          isOpen={showTabConfirm}
          title={t("common.exerciseValidation.exitTabTitle")}
          description={t("common.exerciseValidation.exitTabDesc")}
          confirmLabel={t("common.exerciseValidation.exitTabConfirm")}
          onConfirm={handleTabConfirm}
          onCancel={() => {
            setShowTabConfirm(false);
            setPendingMode(null);
          }}
          variant="warning"
        />
      </div>
    );
  },
);
