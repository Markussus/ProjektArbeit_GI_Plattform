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

  const modeSelector = (
    <div>
      <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
        {t("simulator.arithmetic.selectMode")}
      </label>
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
        menuClassName="w-full"
      />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Render Active Operation Component */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeSubMode === "addition" && (
          <Addition
            isExerciseMode={isExerciseMode}
            showSolution={showSolution}
            onShowSolution={onShowSolution}
            initialA={initialValueA}
            initialB={initialValueB}
            renderModeSelector={modeSelector}
          />
        )}
        {activeSubMode === "subtraction" && (
          <Subtraction
            isExerciseMode={isExerciseMode}
            showSolution={showSolution}
            onShowSolution={onShowSolution}
            initialA={initialValueA}
            initialB={initialValueB}
            renderModeSelector={modeSelector}
          />
        )}
        {activeSubMode === "multiplication" && (
          <Multiplication
            isExerciseMode={isExerciseMode}
            showSolution={showSolution}
            onShowSolution={onShowSolution}
            initialA={initialValueA}
            initialB={initialValueB}
            renderModeSelector={modeSelector}
          />
        )}
        {activeSubMode === "division" && (
          <Division
            isExerciseMode={isExerciseMode}
            showSolution={showSolution}
            onShowSolution={onShowSolution}
            initialA={initialValueA}
            initialB={initialValueB}
            renderModeSelector={modeSelector}
          />
        )}
        {activeSubMode === "shifting" && (
          <Shifting
            isExerciseMode={isExerciseMode}
            showSolution={showSolution}
            onShowSolution={onShowSolution}
            initialA={initialValueA}
            renderModeSelector={modeSelector}
          />
        )}
        {activeSubMode === "ieee754" && (
          <IEEEAddition
            isExerciseMode={isExerciseMode}
            showSolution={showSolution}
            onShowSolution={onShowSolution}
            renderModeSelector={modeSelector}
          />
        )}
        {activeSubMode === "compare" && (
          <Compare
            isExerciseMode={isExerciseMode}
            showSolution={showSolution}
            onShowSolution={onShowSolution}
            initialA={initialValueA}
            initialB={initialValueB}
            renderModeSelector={modeSelector}
          />
        )}
      </div>
    </div>
  );
}
