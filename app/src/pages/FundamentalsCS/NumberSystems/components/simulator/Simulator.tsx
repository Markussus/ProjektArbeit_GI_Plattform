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
  const [initialBase, setInitialBase] = useState<"dec"|"bin"|"oct"|"hex">("dec");

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
    <div className="flex flex-col h-full space-y-6">
      {/* Dashboard Navigation */}
      <div className="flex flex-wrap gap-2 pb-4 border-b border-border/50">
        <button
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeMode === "integers"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          }`}
          onClick={() => setActiveMode("integers")}
        >
           {t("simulator.tabs.integers", "Ganzzahlen")}
        </button>
        <button
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeMode === "negative"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          }`}
          onClick={() => setActiveMode("negative")}
        >
          {t("simulator.tabs.negative", "Negative Zahlen")}
        </button>
        <button
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeMode === "ieee754"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          }`}
          onClick={() => setActiveMode("ieee754")}
        >
          {t("simulator.tabs.ieee754", "IEEE 754 (32-bit)")}
        </button>
        <button
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
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
        {activeMode === "integers" && <IntegerConverter isExerciseMode={isExerciseMode} showSolution={showSolution} onShowSolution={() => setShowSolution(true)} initialValue={initialValue} initialBase={initialBase} />}
        {activeMode === "negative" && <NegativeNumbers isExerciseMode={isExerciseMode} showSolution={showSolution} onShowSolution={() => setShowSolution(true)} initialValue={initialValue} />}
        {activeMode === "ieee754" && <IEEE754Converter isExerciseMode={isExerciseMode} showSolution={showSolution} onShowSolution={() => setShowSolution(true)} initialValue={initialValue} />}
        {activeMode === "arithmetic" && <ArithmeticMode isExerciseMode={isExerciseMode} showSolution={showSolution} onShowSolution={() => setShowSolution(true)} />}
      </div>
    </div>
  );
}
