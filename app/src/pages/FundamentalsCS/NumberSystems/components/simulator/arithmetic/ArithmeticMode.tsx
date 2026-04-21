import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Addition } from "./Addition";
import { Subtraction } from "./Subtraction";
import { Multiplication } from "./Multiplication";
import { Division } from "./Division";
import { Shifting } from "./Shifting";
import { IEEEAddition } from "./IEEEAddition";
import { Compare } from "./Compare";

type ArithmeticModeType = "addition" | "subtraction" | "multiplication" | "division" | "shifting" | "ieee754" | "compare";

interface ArithmeticModeProps {
  isExerciseMode?: boolean;
  showSolution?: boolean;
  onShowSolution?: () => void;
  initialMode?: ArithmeticModeType;
  initialValueA?: string;
  initialValueB?: string;
}

export function ArithmeticMode({ isExerciseMode, showSolution = true, onShowSolution, initialMode = "addition", initialValueA, initialValueB }: ArithmeticModeProps) {
  const { t } = useTranslation("translation");
  const [activeSubMode, setActiveSubMode] = useState<ArithmeticModeType>(initialMode);

  return (
    <div className="space-y-6">
      {/* Sub-Mode Selector */}
      <div className="bg-card border border-border/50 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <label className="text-sm font-medium text-foreground whitespace-nowrap">
          {t("simulator.arithmetic.selectMode", "Rechenoperation wählen")}:
        </label>
        <select
          value={activeSubMode}
          onChange={(e) => setActiveSubMode(e.target.value as ArithmeticModeType)}
          disabled={!!isExerciseMode && !showSolution}
          className="bg-background border border-input rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm text-foreground w-full sm:w-auto disabled:opacity-50"
        >
          <option value="addition">{t("simulator.arithmetic.modes.addition", "Addition")}</option>
          <option value="subtraction">{t("simulator.arithmetic.modes.subtraction", "Subtraktion via 2er-Komplement")}</option>
          <option value="multiplication">{t("simulator.arithmetic.modes.multiplication", "Multiplikation")}</option>
          <option value="division">{t("simulator.arithmetic.modes.division", "Division")}</option>
          <option value="shifting">{t("simulator.arithmetic.modes.shifting", "Bit-Shifting")}</option>
          <option value="ieee754">{t("simulator.arithmetic.modes.ieee754", "IEEE 754 Addition")}</option>
          <option value="compare">{t("simulator.arithmetic.modes.compare", "Vergleich (Bit für Bit)")}</option>
        </select>
      </div>

      {/* Render Active Operation Component */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeSubMode === "addition" && <Addition isExerciseMode={isExerciseMode} showSolution={showSolution} onShowSolution={onShowSolution} initialA={initialValueA} initialB={initialValueB} />}
        {activeSubMode === "subtraction" && <Subtraction isExerciseMode={isExerciseMode} showSolution={showSolution} onShowSolution={onShowSolution} initialA={initialValueA} initialB={initialValueB} />}
        {activeSubMode === "multiplication" && <Multiplication isExerciseMode={isExerciseMode} showSolution={showSolution} onShowSolution={onShowSolution} initialA={initialValueA} initialB={initialValueB} />}
        {activeSubMode === "division" && <Division isExerciseMode={isExerciseMode} showSolution={showSolution} onShowSolution={onShowSolution} initialA={initialValueA} initialB={initialValueB} />}
        {activeSubMode === "shifting" && <Shifting isExerciseMode={isExerciseMode} showSolution={showSolution} onShowSolution={onShowSolution} initialA={initialValueA} />}
        {activeSubMode === "ieee754" && <IEEEAddition isExerciseMode={isExerciseMode} showSolution={showSolution} onShowSolution={onShowSolution} />}
        {activeSubMode === "compare" && <Compare isExerciseMode={isExerciseMode} showSolution={showSolution} onShowSolution={onShowSolution} initialA={initialValueA} initialB={initialValueB} />}
      </div>
    </div>
  );
}
