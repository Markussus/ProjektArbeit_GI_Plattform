import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { IntegerConverter } from "./IntegerConverter";
import { NegativeNumbers } from "./NegativeNumbers";
import { IEEE754Converter } from "./IEEE754Converter";
import { ArithmeticMode } from "./arithmetic";
import type { Exercise } from "@/types/exercise";
import { cn } from "@/lib/utils";
type SimulatorMode = "integers" | "negative" | "ieee754" | "arithmetic";

interface SimulatorProps {
  selectedExercise?: Exercise | null;
}

export function Simulator({ selectedExercise }: SimulatorProps) {
  const { t } = useTranslation("translation");
  const [activeMode, setActiveMode] = useState<SimulatorMode>("integers");

  // Exercise mode states
  const [isExerciseMode, setIsExerciseMode] = useState(false);
  const [showSolution, setShowSolution] = useState(true);

  // Initial values for converters when launched via exercise
  const [initialValue, setInitialValue] = useState<string>("");
  const [initialBase, setInitialBase] = useState<"dec" | "bin" | "oct" | "hex">(
    "dec",
  );

  useEffect(() => {
    if (selectedExercise) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsExerciseMode(true);
      setShowSolution(false);

      // Match exercise id using prefix/contains or exact matching logic based on data.
      if (selectedExercise.id === "number.exercise1") {
        setActiveMode("integers");
        setInitialBase("bin");
        setInitialValue("10110");
      } else if (selectedExercise.id === "number.exercise2") {
        setActiveMode("integers");
        setInitialBase("dec");
        setInitialValue("42");
      } else if (selectedExercise.id === "number.exercise3") {
        setActiveMode("negative");
        setInitialValue("-15");
      } else if (selectedExercise.id === "number.exercise4") {
        setActiveMode("ieee754");
        setInitialValue("13.37");
      }
    } else {
      setIsExerciseMode(false);
      setShowSolution(true); // Free simulator mode
    }
  }, [selectedExercise]);

  return (
    <div className="flex h-full flex-col space-y-6">
      {/* Dashboard Navigation */}
      <div className="border-border flex gap-1 border-b">
        {(["integers", "negative", "ieee754", "arithmetic"] as SimulatorMode[]).map((mode) => (
          <button
            key={mode}
            className={cn(
              "relative px-4 py-2.5 text-sm font-medium",
              activeMode === mode
                ? "text-tab-active"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveMode(mode)}
          >
            {t(`simulator.tabs.${mode}`)}
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
            isExerciseMode={isExerciseMode}
            showSolution={showSolution}
            onShowSolution={() => setShowSolution(true)}
            initialValue={initialValue}
            initialBase={initialBase}
          />
        )}
        {activeMode === "negative" && (
          <NegativeNumbers
            isExerciseMode={isExerciseMode}
            showSolution={showSolution}
            onShowSolution={() => setShowSolution(true)}
            initialValue={initialValue}
          />
        )}
        {activeMode === "ieee754" && (
          <IEEE754Converter
            isExerciseMode={isExerciseMode}
            showSolution={showSolution}
            onShowSolution={() => setShowSolution(true)}
            initialValue={initialValue}
          />
        )}
        {activeMode === "arithmetic" && (
          <ArithmeticMode
            isExerciseMode={isExerciseMode}
            showSolution={showSolution}
            onShowSolution={() => setShowSolution(true)}
          />
        )}
      </div>
    </div>
  );
}
