import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Base64Encoder } from "./Base64Encoder";
import { UTF8Encoder } from "./UTF8Encoder";
import type { TopicItem } from "@/types/exercise";
import { cn } from "@/lib/utils";
import type { GeneratedExercise } from "../utils/exerciseGenerator";
import { useTrainingCenterPersistence } from "@/hooks/useTrainingCenterPersistence";
import { TOPIC_STORAGE_IDS } from "@/data/topicStorageIds";
import { encTransferCodec } from "./encTransferCodec";
import type { EncoderState } from "./encTransferCodec";

type EncoderMode = "base64" | "utf8";

export interface EncoderSimulatorHandle {
  resetStoredState: () => void;
}

interface EncoderSimulatorProps {
  selectedExercise?: TopicItem | null;
  onExitExercise?: () => void;
}

function getGeneratedExerciseData(item: TopicItem | null | undefined): {
  isGenerated: boolean;
  mode?: "base64" | "utf8";
  converterMode?: "encode" | "decode";
  initialValue?: string;
  answer?: string;
} {
  if (!item) return { isGenerated: false };
  if ("exerciseType" in item && "mode" in item && "initialValue" in item) {
    const gen = item as unknown as GeneratedExercise;
    return {
      isGenerated: true,
      mode: gen.mode,
      converterMode: gen.converterMode,
      initialValue: gen.initialValue,
      answer: gen.answer,
    };
  }
  return { isGenerated: false };
}

function getSelectedEncoderScenario(item: TopicItem): {
  mode: EncoderMode;
  converterMode: "encode" | "decode";
  initialValue: string;
  answer: string;
} | null {
  const generated = getGeneratedExerciseData(item);
  if (generated.isGenerated && generated.mode) {
    return {
      mode: generated.mode,
      converterMode: generated.converterMode ?? "encode",
      initialValue: generated.initialValue ?? "",
      answer: generated.answer ?? "",
    };
  }

  const examples: Record<
    string,
    {
      mode: EncoderMode;
      converterMode: "encode" | "decode";
      initialValue: string;
      answer: string;
    }
  > = {
    "encoding.example_base64_2": {
      mode: "base64",
      converterMode: "encode",
      initialValue: "THWS",
      answer: "",
    },
    "encoding.example_base64_3": {
      mode: "base64",
      converterMode: "decode",
      initialValue: "RklY",
      answer: "",
    },
    "encoding.example_utf8_2": {
      mode: "utf8",
      converterMode: "encode",
      initialValue: "\u1090",
      answer: "",
    },
    "encoding.example_utf8_3": {
      mode: "utf8",
      converterMode: "decode",
      initialValue: "E1 A0 A0",
      answer: "",
    },
  };

  return examples[item.id] ?? null;
}

export const EncoderSimulator = forwardRef<
  EncoderSimulatorHandle,
  EncoderSimulatorProps
>(function EncoderSimulator({ selectedExercise, onExitExercise }, ref) {
  const { t } = useTranslation("translation");

  const [simulatorState, setSimulatorState] = useState<EncoderState>(() => {
    return {
      activeMode: "base64",
      base64: {
        inputValue: "",
        converterMode: "encode",
      },
    };
  });
  const [loadVersion, setLoadVersion] = useState(0);

  const activeMode = simulatorState.activeMode;
  const setActiveMode = (mode: EncoderMode) => {
    setSimulatorState((prev) => ({ ...prev, activeMode: mode }));
  };

  const [isExerciseMode, setIsExerciseMode] = useState(() => {
    return selectedExercise ? !selectedExercise.id.includes(".example") : false;
  });
  const [showSolution, setShowSolution] = useState(() => {
    return selectedExercise ? selectedExercise.id.includes(".example") : true;
  });

  const [initialValue, setInitialValue] = useState<string>("");
  const [initialConverterMode, setInitialConverterMode] = useState<
    "encode" | "decode"
  >("encode");
  const [expectedAnswer, setExpectedAnswer] = useState<string>("");

  const restoreSimulatorState = useCallback((stored: EncoderState) => {
    setSimulatorState(stored);
    setLoadVersion((version) => version + 1);

    const activeState = stored[stored.activeMode];
    if (activeState) {
      setInitialValue(activeState.inputValue);
      setInitialConverterMode(activeState.converterMode);
    }
  }, []);

  const { clear: clearStoredState, isReady: isStorageReady } =
    useTrainingCenterPersistence({
      topicStorageId: TOPIC_STORAGE_IDS.encoding,
      codec: encTransferCodec,
      value: simulatorState,
      onRestore: restoreSimulatorState,
      enabled: !selectedExercise,
      intervalMs: 500,
    });

  const handleEncoderStateChange = useCallback(
    (mode: EncoderMode, state: NonNullable<EncoderState[EncoderMode]>) => {
      setSimulatorState((previous) => {
        const previousModeState = previous[mode];
        if (
          previousModeState?.inputValue === state.inputValue &&
          previousModeState.converterMode === state.converterMode
        ) {
          return previous;
        }

        return { ...previous, [mode]: { ...state } };
      });
    },
    [],
  );

  useEffect(() => {
    if (selectedExercise) {
      const isExample = selectedExercise.id.includes(".example");
      const scenario = getSelectedEncoderScenario(selectedExercise);

      setIsExerciseMode(!isExample);
      setShowSolution(isExample);

      if (scenario) {
        setActiveMode(scenario.mode);
        setInitialConverterMode(scenario.converterMode);
        setInitialValue(scenario.initialValue);
        setExpectedAnswer(scenario.answer);
      }
    } else {
      setIsExerciseMode(false);
      setShowSolution(true);
      // We only reset to default if we aren't loading from storage
      // To avoid flashing/overwriting loaded state on mount
      if (isStorageReady) {
        setExpectedAnswer("");
      }
    }
  }, [selectedExercise, isStorageReady]);

  const handleExitExercise = () => {
    setIsExerciseMode(false);
    setShowSolution(true);
    onExitExercise?.();
  };

  const handleTabClick = (mode: EncoderMode) => {
    if (mode === activeMode) return;
    handleExitExercise();
    setActiveMode(mode);
  };

  const resetStoredState = useCallback(() => {
    if (selectedExercise) {
      const scenario = getSelectedEncoderScenario(selectedExercise);
      if (scenario) {
        setSimulatorState({ activeMode: scenario.mode });
        setInitialValue(scenario.initialValue);
        setInitialConverterMode(scenario.converterMode);
        setExpectedAnswer(scenario.answer);
      }
      setLoadVersion((version) => version + 1);
      return;
    }

    clearStoredState();

    setSimulatorState({
      activeMode: "base64",
      base64: { inputValue: "", converterMode: "encode" },
    });
    setInitialValue("");
    setInitialConverterMode("encode");
    setExpectedAnswer("");
    setLoadVersion((v) => v + 1);
  }, [clearStoredState, selectedExercise]);

  useImperativeHandle(
    ref,
    () => ({
      resetStoredState,
    }),
    [resetStoredState],
  );

  const currentKey = useMemo(() => {
    if (selectedExercise?.id) {
      return `${selectedExercise.id}-${initialValue}-${loadVersion}`;
    }
    return `free-${activeMode}-${loadVersion}`;
  }, [selectedExercise?.id, activeMode, initialValue, loadVersion]);

  return (
    <div
      data-testid="encoding-simulator"
      className="flex h-full flex-col space-y-6"
    >
      <div className="border-border flex gap-1 border-b">
        {(["base64", "utf8"] as EncoderMode[]).map((mode) => (
          <button
            key={mode}
            data-testid={`encoding-tab-${mode}`}
            className={cn(
              "relative px-4 py-2.5 text-sm font-medium",
              activeMode === mode
                ? "text-tab-active"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => handleTabClick(mode)}
          >
            {t(`encoding.simulator.tabs.${mode}`)}
            {activeMode === mode && (
              <span className="bg-tab-indicator absolute inset-x-0 -bottom-px h-0.5" />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        {activeMode === "base64" && (
          <Base64Encoder
            key={currentKey}
            isExerciseMode={isExerciseMode}
            showSolution={showSolution}
            onShowSolution={() => setShowSolution(true)}
            onExitExercise={isExerciseMode ? handleExitExercise : undefined}
            initialValue={initialValue}
            initialConverterMode={initialConverterMode}
            expectedAnswer={expectedAnswer || undefined}
            onChangeState={(state) => handleEncoderStateChange("base64", state)}
          />
        )}
        {activeMode === "utf8" && (
          <UTF8Encoder
            key={currentKey}
            isExerciseMode={isExerciseMode}
            showSolution={showSolution}
            onShowSolution={() => setShowSolution(true)}
            onExitExercise={isExerciseMode ? handleExitExercise : undefined}
            initialValue={initialValue}
            initialConverterMode={initialConverterMode}
            expectedAnswer={expectedAnswer || undefined}
            onChangeState={(state) => handleEncoderStateChange("utf8", state)}
          />
        )}
      </div>
    </div>
  );
});
