import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Base64Encoder } from "./Base64Encoder";
import { UTF8Encoder } from "./UTF8Encoder";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog/ConfirmDialog";
import type { TopicItem } from "@/types/exercise";
import { cn } from "@/lib/utils";
import type { GeneratedExercise } from "../utils/exerciseGenerator";
import { SimulatorStringTransferBox } from "@/components/shared/SimulatorStringTransferBox/SimulatorStringTransferBox";
import { useTrainingCenterAutoSave } from "@/hooks/useTrainingCenterAutoSave";
import {
  createTrainingCenterIdentifier,
  createTrainingCenterTransferCodec,
  loadTrainingCenterValue,
} from "@/lib/trainingCenter";
import { TOPIC_STORAGE_IDS } from "@/data/moduleCatalog";
import { encTransferCodec } from "./encTransferCodec";
import type { EncoderState } from "./encTransferCodec";

const ENCODING_SIMULATOR_TASK_STORAGE_ID = createTrainingCenterIdentifier(
  TOPIC_STORAGE_IDS.encoding,
);

type EncoderMode = "base64" | "utf8";

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

export function EncoderSimulator({
  selectedExercise,
  onExitExercise,
}: EncoderSimulatorProps) {
  const { t } = useTranslation("translation");

  const [simulatorState, setSimulatorState] = useState<EncoderState>(() => {
    return {
      activeMode: "base64",
    };
  });
  const [isStorageReady, setIsStorageReady] = useState(false);
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

  const [pendingMode, setPendingMode] = useState<EncoderMode | null>(null);
  const [showTabConfirm, setShowTabConfirm] = useState(false);

  const [initialValue, setInitialValue] = useState<string>("");
  const [initialConverterMode, setInitialConverterMode] = useState<
    "encode" | "decode"
  >("encode");
  const [expectedAnswer, setExpectedAnswer] = useState<string>("");

  useEffect(() => {
    let active = true;

    async function initStorage() {
      if (selectedExercise) {
        setIsStorageReady(true);
        return;
      }

      try {
        const tcCodec = createTrainingCenterTransferCodec(
          ENCODING_SIMULATOR_TASK_STORAGE_ID,
          encTransferCodec,
        );
        const stored = await loadTrainingCenterValue(
          ENCODING_SIMULATOR_TASK_STORAGE_ID,
          tcCodec,
        );

        if (active && stored) {
          setSimulatorState(stored);
          setLoadVersion((v) => v + 1);

          if (stored.activeMode === "base64" && stored.base64) {
            setInitialValue(stored.base64.inputValue);
            setInitialConverterMode(stored.base64.converterMode);
          } else if (stored.activeMode === "utf8" && stored.utf8) {
            setInitialValue(stored.utf8.inputValue);
            setInitialConverterMode(stored.utf8.converterMode);
          }
        }
      } catch (err) {
        console.error("Failed to load initial storage state:", err);
      } finally {
        if (active) {
          setIsStorageReady(true);
        }
      }
    }
    initStorage();

    return () => {
      active = false;
    };
  }, [selectedExercise]);

  const tcCodec = useMemo(() => {
    return createTrainingCenterTransferCodec(
      ENCODING_SIMULATOR_TASK_STORAGE_ID,
      encTransferCodec,
    );
  }, []);

  useTrainingCenterAutoSave({
    identifier: ENCODING_SIMULATOR_TASK_STORAGE_ID,
    value: simulatorState,
    codec: tcCodec,
    enabled: isStorageReady && !isExerciseMode,
    intervalMs: 500,
  });

  useEffect(() => {
    if (selectedExercise) {
      const isExample = selectedExercise.id.includes(".example");
      const genData = getGeneratedExerciseData(selectedExercise);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsExerciseMode(!isExample);
      setShowSolution(isExample);

      if (genData.isGenerated && genData.mode) {
        setActiveMode(genData.mode);
        setInitialConverterMode(genData.converterMode || "encode");
        setInitialValue(genData.initialValue || "");
        setExpectedAnswer(genData.answer || "");
      } else if (selectedExercise.id === "encoding.example_base64_1") {
        setActiveMode("base64");
        setInitialConverterMode("encode");
        setInitialValue("Hello");
        setExpectedAnswer("");
      } else if (selectedExercise.id === "encoding.example_utf8_1") {
        setActiveMode("utf8");
        setInitialConverterMode("encode");
        setInitialValue("Hello");
        setExpectedAnswer("");
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
    if (isExerciseMode && !showSolution) {
      setPendingMode(mode);
      setShowTabConfirm(true);
    } else {
      setActiveMode(mode);
    }
  };

  const handleTabConfirm = () => {
    setShowTabConfirm(false);
    handleExitExercise();
    if (pendingMode) {
      setActiveMode(pendingMode);
      setPendingMode(null);
    }
  };

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
      {isStorageReady && !isExerciseMode && (
        <SimulatorStringTransferBox
          testIdPrefix="encoding-transfer"
          value={simulatorState}
          codec={tcCodec}
          onLoad={(newState) => {
            setSimulatorState(newState);
            setLoadVersion((v) => v + 1);
            setActiveMode(newState.activeMode);

            if (newState.activeMode === "base64" && newState.base64) {
              setInitialValue(newState.base64.inputValue);
              setInitialConverterMode(newState.base64.converterMode);
            } else if (newState.activeMode === "utf8" && newState.utf8) {
              setInitialValue(newState.utf8.inputValue);
              setInitialConverterMode(newState.utf8.converterMode);
            }
          }}
          className="shrink-0"
        />
      )}
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
            {t(`simulator.encoding.tabs.${mode}`)}
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
            onChangeState={(state) => {
              setSimulatorState((prev) => ({
                ...prev,
                base64: { ...state },
              }));
            }}
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
            onChangeState={(state) => {
              setSimulatorState((prev) => ({
                ...prev,
                utf8: { ...state },
              }));
            }}
          />
        )}
      </div>

      <ConfirmDialog
        isOpen={showTabConfirm}
        title={t("simulator.validation.exitTabTitle")}
        description={t("simulator.validation.exitTabDesc")}
        confirmLabel={t("simulator.validation.exitTabConfirm")}
        onConfirm={handleTabConfirm}
        onCancel={() => {
          setShowTabConfirm(false);
          setPendingMode(null);
        }}
        variant="warning"
      />
    </div>
  );
}
