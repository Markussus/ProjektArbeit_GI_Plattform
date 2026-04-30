import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DropdownSelect } from "@/components/shared/DropdownSelect/DropdownSelect";
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
        <div className="w-full sm:w-auto sm:min-w-48">
          <DropdownSelect
            value={activeSubMode}
            options={[
              { value: "addition", label: t("simulator.arithmetic.modes.addition") },
              { value: "subtraction", label: t("simulator.arithmetic.modes.subtraction") },
              { value: "multiplication", label: t("simulator.arithmetic.modes.multiplication") },
              { value: "division", label: t("simulator.arithmetic.modes.division") },
              { value: "shifting", label: t("simulator.arithmetic.modes.shifting") },
              { value: "ieee754", label: t("simulator.arithmetic.modes.ieee754") },
              { value: "compare", label: t("simulator.arithmetic.modes.compare") },
            ]}
            onChange={(val) => setActiveSubMode(val as ArithmeticModeType)}
            ariaLabel={t("simulator.arithmetic.selectMode")}
            disabled={!!isExerciseMode && !showSolution}
            triggerClassName="w-full px-3 py-2 text-sm font-normal"
            menuClassName="w-full sm:min-w-48"
          />
        </div>
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
