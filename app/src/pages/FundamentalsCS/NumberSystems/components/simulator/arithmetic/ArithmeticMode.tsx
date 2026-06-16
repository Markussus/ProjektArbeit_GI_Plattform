import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { DropdownSelect } from "@/components/shared/DropdownSelect/DropdownSelect";
import { Addition } from "./Addition";
import { Subtraction } from "./Subtraction";
import { Multiplication } from "./Multiplication";
import { Division } from "./Division";
import { Shifting } from "./Shifting";
import { IEEEAddition } from "./IEEEAddition";
import { Compare } from "./Compare";

import type {
  ArithmeticModeState,
  ArithmeticModeType,
} from "../nsTransferCodec";

interface ArithmeticModeProps {
  isExerciseMode?: boolean;
  showSolution?: boolean;
  onShowSolution?: () => void;
  onExitExercise?: () => void;
  initialMode?: ArithmeticModeType;
  initialValueA?: string;
  initialValueB?: string;
  initialState?: ArithmeticModeState;
  onChangeState?: (state: ArithmeticModeState) => void;
}

export function ArithmeticMode({
  isExerciseMode,
  showSolution = true,
  onShowSolution,
  onExitExercise,
  initialMode = "addition",
  initialValueA,
  initialValueB,
  initialState,
  onChangeState,
}: ArithmeticModeProps) {
  const { t } = useTranslation("translation");
  const locked = !!isExerciseMode && !showSolution;
  const [activeSubMode, setActiveSubMode] = useState<ArithmeticModeType>(
    locked ? initialMode : (initialState?.activeSubMode ?? initialMode),
  );
  const [valA, setValA] = useState<string>(
    locked
      ? initialValueA || ""
      : (initialState?.valA ?? (initialValueA || "")),
  );
  const [valB, setValB] = useState<string>(
    locked
      ? initialValueB || ""
      : (initialState?.valB ?? (initialValueB || "")),
  );

  useEffect(() => {
    onChangeState?.({ activeSubMode, valA, valB });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSubMode, valA, valB]);

  const handleChangeValues = (a: string, b: string) => {
    setValA(a);
    setValB(b);
  };

  const modeSelector = (
    <div>
      <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
        {t("simulator.arithmetic.selectMode")}
      </label>
      <DropdownSelect
        value={activeSubMode}
        options={[
          {
            value: "addition",
            label: t("simulator.arithmetic.modes.addition"),
          },
          {
            value: "subtraction",
            label: t("simulator.arithmetic.modes.subtraction"),
          },
          {
            value: "multiplication",
            label: t("simulator.arithmetic.modes.multiplication"),
          },
          {
            value: "division",
            label: t("simulator.arithmetic.modes.division"),
          },
          {
            value: "shifting",
            label: t("simulator.arithmetic.modes.shifting"),
          },
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
            onExitExercise={onExitExercise}
            initialA={valA}
            initialB={valB}
            onChangeValues={handleChangeValues}
            renderModeSelector={modeSelector}
          />
        )}
        {activeSubMode === "subtraction" && (
          <Subtraction
            isExerciseMode={isExerciseMode}
            showSolution={showSolution}
            onShowSolution={onShowSolution}
            onExitExercise={onExitExercise}
            initialA={valA}
            initialB={valB}
            onChangeValues={handleChangeValues}
            renderModeSelector={modeSelector}
          />
        )}
        {activeSubMode === "multiplication" && (
          <Multiplication
            isExerciseMode={isExerciseMode}
            showSolution={showSolution}
            onShowSolution={onShowSolution}
            onExitExercise={onExitExercise}
            initialA={valA}
            initialB={valB}
            onChangeValues={handleChangeValues}
            renderModeSelector={modeSelector}
          />
        )}
        {activeSubMode === "division" && (
          <Division
            isExerciseMode={isExerciseMode}
            showSolution={showSolution}
            onShowSolution={onShowSolution}
            onExitExercise={onExitExercise}
            initialA={valA}
            initialB={valB}
            onChangeValues={handleChangeValues}
            renderModeSelector={modeSelector}
          />
        )}
        {activeSubMode === "shifting" && (
          <Shifting
            isExerciseMode={isExerciseMode}
            showSolution={showSolution}
            onShowSolution={onShowSolution}
            onExitExercise={onExitExercise}
            initialA={valA}
            onChangeValues={handleChangeValues}
            renderModeSelector={modeSelector}
          />
        )}
        {activeSubMode === "ieee754" && (
          <IEEEAddition
            isExerciseMode={isExerciseMode}
            showSolution={showSolution}
            onShowSolution={onShowSolution}
            onExitExercise={onExitExercise}
            initialA={valA}
            initialB={valB}
            onChangeValues={handleChangeValues}
            renderModeSelector={modeSelector}
          />
        )}
        {activeSubMode === "compare" && (
          <Compare
            isExerciseMode={isExerciseMode}
            showSolution={showSolution}
            onShowSolution={onShowSolution}
            onExitExercise={onExitExercise}
            initialA={valA}
            initialB={valB}
            onChangeValues={handleChangeValues}
            renderModeSelector={modeSelector}
          />
        )}
      </div>
    </div>
  );
}
