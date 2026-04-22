import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Addition } from "./Addition";
import { Subtraction } from "./Subtraction";
import { Multiplication } from "./Multiplication";
import { Division } from "./Division";
import { Shifting } from "./Shifting";
import { IEEEAddition } from "./IEEEAddition";
import { Compare } from "./Compare";

type ArithmeticModeType =
  | "addition"
  | "subtraction"
  | "multiplication"
  | "division"
  | "shifting"
  | "ieee754"
  | "compare";

interface ArithmeticModeProps {
  isExerciseMode?: boolean;
  showSolution?: boolean;
  onShowSolution?: () => void;
  initialMode?: ArithmeticModeType;
  initialValueA?: string;
  initialValueB?: string;
}

export function ArithmeticMode({
  isExerciseMode,
  showSolution = true,
  onShowSolution,
  initialMode = "addition",
  initialValueA,
  initialValueB,
}: ArithmeticModeProps) {
  const { t } = useTranslation("translation");
  const [activeSubMode, setActiveSubMode] =
    useState<ArithmeticModeType>(initialMode);

  return (
    <div className="space-y-6">
      {/* Sub-Mode Selector */}
      <div className="bg-card border-border/50 flex flex-col justify-between gap-4 rounded-xl border p-4 shadow-sm sm:flex-row sm:items-center">
        <label className="text-foreground text-sm font-medium whitespace-nowrap">
          {t("simulator.arithmetic.selectMode")}:
        </label>
        <select
          value={activeSubMode}
          onChange={(e) =>
            setActiveSubMode(e.target.value as ArithmeticModeType)
          }
          disabled={!!isExerciseMode && !showSolution}
          className="bg-background border-input focus:ring-primary/50 text-foreground w-full rounded-md border px-3 py-2 text-sm focus:ring-1 focus:outline-none disabled:opacity-50 sm:w-auto"
        >
          <option value="addition">
            {t("simulator.arithmetic.modes.addition")}
          </option>
          <option value="subtraction">
            {t("simulator.arithmetic.modes.subtraction")}
          </option>
          <option value="multiplication">
            {t("simulator.arithmetic.modes.multiplication")}
          </option>
          <option value="division">
            {t("simulator.arithmetic.modes.division")}
          </option>
          <option value="shifting">
            {t("simulator.arithmetic.modes.shifting")}
          </option>
          <option value="ieee754">
            {t("simulator.arithmetic.modes.ieee754")}
          </option>
          <option value="compare">
            {t("simulator.arithmetic.modes.compare")}
          </option>
        </select>
      </div>

      {/* Render Active Operation Component */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeSubMode === "addition" && (
          <Addition
            isExerciseMode={isExerciseMode}
            showSolution={showSolution}
            onShowSolution={onShowSolution}
            initialA={initialValueA}
            initialB={initialValueB}
          />
        )}
        {activeSubMode === "subtraction" && (
          <Subtraction
            isExerciseMode={isExerciseMode}
            showSolution={showSolution}
            onShowSolution={onShowSolution}
            initialA={initialValueA}
            initialB={initialValueB}
          />
        )}
        {activeSubMode === "multiplication" && (
          <Multiplication
            isExerciseMode={isExerciseMode}
            showSolution={showSolution}
            onShowSolution={onShowSolution}
            initialA={initialValueA}
            initialB={initialValueB}
          />
        )}
        {activeSubMode === "division" && (
          <Division
            isExerciseMode={isExerciseMode}
            showSolution={showSolution}
            onShowSolution={onShowSolution}
            initialA={initialValueA}
            initialB={initialValueB}
          />
        )}
        {activeSubMode === "shifting" && (
          <Shifting
            isExerciseMode={isExerciseMode}
            showSolution={showSolution}
            onShowSolution={onShowSolution}
            initialA={initialValueA}
          />
        )}
        {activeSubMode === "ieee754" && (
          <IEEEAddition
            isExerciseMode={isExerciseMode}
            showSolution={showSolution}
            onShowSolution={onShowSolution}
          />
        )}
        {activeSubMode === "compare" && (
          <Compare
            isExerciseMode={isExerciseMode}
            showSolution={showSolution}
            onShowSolution={onShowSolution}
            initialA={initialValueA}
            initialB={initialValueB}
          />
        )}
      </div>
    </div>
  );
}
