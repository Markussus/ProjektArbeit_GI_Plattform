import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Base64Encoder } from "./Base64Encoder";
import { UTF8Encoder } from "./UTF8Encoder";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog/ConfirmDialog";
import type { TopicItem } from "@/types/exercise";
import { cn } from "@/lib/utils";

type EncoderMode = "base64" | "utf8";

interface EncoderSimulatorProps {
  selectedExercise?: TopicItem | null;
  onExitExercise?: () => void;
}

export function EncoderSimulator({
  selectedExercise,
  onExitExercise,
}: EncoderSimulatorProps) {
  const { t } = useTranslation("translation");
  const [activeMode, setActiveMode] = useState<EncoderMode>("base64");

  const [isExerciseMode, setIsExerciseMode] = useState(false);
  const [showSolution, setShowSolution] = useState(true);

  const [pendingMode, setPendingMode] = useState<EncoderMode | null>(null);
  const [showTabConfirm, setShowTabConfirm] = useState(false);

  const [initialValue, setInitialValue] = useState<string>("");
  const [initialConverterMode, setInitialConverterMode] = useState<
    "encode" | "decode"
  >("encode");

  useEffect(() => {
    if (selectedExercise) {
      const isExample = selectedExercise.id.includes(".example");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsExerciseMode(!isExample);
      setShowSolution(isExample);

      if (selectedExercise.id === "encoding.ex_base64_placeholder") {
        setActiveMode("base64");
        setInitialConverterMode("encode");
        setInitialValue("Hello");
      } else if (selectedExercise.id === "encoding.ex_utf8_placeholder") {
        setActiveMode("utf8");
        setInitialConverterMode("encode");
        setInitialValue("A");
      } else if (selectedExercise.id === "encoding.example_base64_1") {
        setActiveMode("base64");
        setInitialConverterMode("encode");
        setInitialValue("Hello");
      } else if (selectedExercise.id === "encoding.example_utf8_1") {
        setActiveMode("utf8");
        setInitialConverterMode("encode");
        setInitialValue("Hello");
      }
    } else {
      setIsExerciseMode(false);
      setShowSolution(true);
      setInitialValue("");
      setInitialConverterMode("encode");
    }
  }, [selectedExercise]);

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
            key={
              selectedExercise?.id
                ? `${selectedExercise.id}-${initialValue}`
                : "free-base64"
            }
            isExerciseMode={isExerciseMode}
            showSolution={showSolution}
            onShowSolution={() => setShowSolution(true)}
            onExitExercise={isExerciseMode ? handleExitExercise : undefined}
            initialValue={initialValue}
            initialConverterMode={initialConverterMode}
          />
        )}
        {activeMode === "utf8" && (
          <UTF8Encoder
            key={
              selectedExercise?.id
                ? `${selectedExercise.id}-${initialValue}`
                : "free-utf8"
            }
            isExerciseMode={isExerciseMode}
            showSolution={showSolution}
            onShowSolution={() => setShowSolution(true)}
            onExitExercise={isExerciseMode ? handleExitExercise : undefined}
            initialValue={initialValue}
            initialConverterMode={initialConverterMode}
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
