import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { IntegerConverter } from "./IntegerConverter";
import { NegativeNumbers } from "./NegativeNumbers";
import { IEEE754Converter } from "./IEEE754Converter";
import { ArithmeticMode } from "./arithmetic";
import type { Exercise } from "@/types/exercise";

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
      <div className="border-border/50 flex flex-wrap gap-2 border-b pb-4">
        <button
          className={`rounded-md px-4 py-2 font-medium transition-colors ${
            activeMode === "integers"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          }`}
          onClick={() => setActiveMode("integers")}
        >
          {t("simulator.tabs.integers", "Ganzzahlen")}
        </button>
        <button
          className={`rounded-md px-4 py-2 font-medium transition-colors ${
            activeMode === "negative"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          }`}
          onClick={() => setActiveMode("negative")}
        >
          {t("simulator.tabs.negative", "Negative Zahlen")}
        </button>
        <button
          className={`rounded-md px-4 py-2 font-medium transition-colors ${
            activeMode === "ieee754"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          }`}
          onClick={() => setActiveMode("ieee754")}
        >
          {t("simulator.tabs.ieee754", "IEEE 754 (32-bit)")}
        </button>
        <button
          className={`rounded-md px-4 py-2 font-medium transition-colors ${
            activeMode === "arithmetic"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          }`}
          onClick={() => setActiveMode("arithmetic")}
        >
          {t("simulator.tabs.arithmetic", "Arithmetik")}
        </button>
      </div>

      {/* Simulator Content */}
      <div className="flex-1 overflow-auto">
        {activeMode === "integers" && (
          <IntegerConverter
            key={`integers-${selectedExercise?.id ?? "free"}-${initialBase}-${initialValue}`}
            isExerciseMode={isExerciseMode}
            showSolution={showSolution}
            onShowSolution={() => setShowSolution(true)}
            initialValue={initialValue}
            initialBase={initialBase}
          />
        )}
        {activeMode === "negative" && (
          <NegativeNumbers
            key={`negative-${selectedExercise?.id ?? "free"}-${initialValue}`}
            isExerciseMode={isExerciseMode}
            showSolution={showSolution}
            onShowSolution={() => setShowSolution(true)}
            initialValue={initialValue}
          />
        )}
        {activeMode === "ieee754" && (
          <IEEE754Converter
            key={`ieee754-${selectedExercise?.id ?? "free"}-${initialValue}`}
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
