import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { DropdownSelect } from "@/components/shared/DropdownSelect/DropdownSelect";
import { Addition } from "./Addition";
import { Subtraction } from "./Subtraction";
import { Multiplication } from "./Multiplication";
import { Division } from "./Division";
import { Shifting } from "./Shifting";
import { Compare } from "./Compare";

import type {
  ArithmeticModeState,
  ArithmeticModeType,
} from "../nsTransferCodec";
import type { BaseArithmeticProps } from "./types";

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

const MODE_COMPONENTS: Record<
  ArithmeticModeType,
  React.ComponentType<BaseArithmeticProps>
> = {
  addition: Addition,
  subtraction: Subtraction,
  multiplication: Multiplication,
  division: Division,
  shifting: Shifting,
  compare: Compare,
};

function useArithmeticModeState(
  initialMode: ArithmeticModeType,
  initialValueA: string,
  initialValueB: string,
  initialState: ArithmeticModeState | undefined,
  isExerciseMode: boolean | undefined,
  showSolution: boolean | undefined,
  onChangeState: ((state: ArithmeticModeState) => void) | undefined,
) {
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

  return {
    activeSubMode,
    setActiveSubMode,
    valA,
    valB,
    handleChangeValues,
    locked,
  };
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
  const {
    activeSubMode,
    setActiveSubMode,
    valA,
    valB,
    handleChangeValues,
    locked,
  } = useArithmeticModeState(
    initialMode,
    initialValueA || "",
    initialValueB || "",
    initialState,
    isExerciseMode,
    showSolution,
    onChangeState,
  );

  const modeSelector = (
    <div>
      <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
        {t("number-systems.simulator.arithmetic.selectMode")}
      </label>
      <DropdownSelect
        value={activeSubMode}
        options={[
          {
            value: "addition",
            label: t("number-systems.simulator.arithmetic.modes.addition"),
          },
          {
            value: "subtraction",
            label: t("number-systems.simulator.arithmetic.modes.subtraction"),
          },
          {
            value: "multiplication",
            label: t(
              "number-systems.simulator.arithmetic.modes.multiplication",
            ),
          },
          {
            value: "division",
            label: t("number-systems.simulator.arithmetic.modes.division"),
          },
          {
            value: "shifting",
            label: t("number-systems.simulator.arithmetic.modes.shifting"),
          },
          {
            value: "compare",
            label: t("number-systems.simulator.arithmetic.modes.compare"),
          },
        ]}
        onChange={(val) => setActiveSubMode(val as ArithmeticModeType)}
        ariaLabel={t("number-systems.simulator.arithmetic.selectMode")}
        disabled={locked}
        triggerClassName="w-full px-3 py-2 text-sm font-normal"
        menuClassName="w-full"
      />
    </div>
  );

  const ActiveComponent = MODE_COMPONENTS[activeSubMode];

  return (
    <div className="space-y-6">
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <ActiveComponent
          isExerciseMode={isExerciseMode}
          showSolution={showSolution}
          onShowSolution={onShowSolution}
          onExitExercise={onExitExercise}
          initialA={valA}
          initialB={valB}
          onChangeValues={handleChangeValues}
          renderModeSelector={modeSelector}
        />
      </div>
    </div>
  );
}
