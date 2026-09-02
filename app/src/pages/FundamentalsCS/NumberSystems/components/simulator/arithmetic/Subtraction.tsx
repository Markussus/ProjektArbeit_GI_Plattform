import { ExerciseValidationPanel } from "@/components/shared/ExerciseValidationPanel/ExerciseValidationPanel";
import { SimulatorLayout } from "@/components/shared/SimulatorShared";
import type { BaseArithmeticProps } from "./types";
import { ArithmeticInputPanel } from "./ArithmeticInputPanel";
import {
  useArithmeticExercise,
  type ArithmeticExerciseState,
} from "./useArithmeticExercise";
import { calculateSubtraction } from "./subtractionCalculation";
import { SubtractionResult } from "./SubtractionResult";

export function Subtraction(props: BaseArithmeticProps) {
  const state = useArithmeticExercise(props, {
    defaultA: "00101010",
    defaultB: "00001010",
    maxLengthA: 8,
    maxLengthB: 8,
  });
  const {
    t,
    valA,
    valB,
    locked,
    handleInputA,
    handleInputB,
    showStepByStep,
    setShowStepByStep,
    expanded,
    toggle,
    onShowSolution,
    onExitExercise,
    renderModeSelector,
  } = state satisfies ArithmeticExerciseState;

  const subtractionResult = calculateSubtraction(valA, valB, t);

  return (
    <SimulatorLayout
      inputPanel={
        <ArithmeticInputPanel
          titleKey="number-systems.simulator.arithmetic.common.operands8bit"
          descKey="number-systems.simulator.arithmetic.subtraction.desc"
          renderModeSelector={renderModeSelector}
          locked={locked}
          operandA={{
            value: valA,
            onChange: handleInputA,
            labelKey: "number-systems.simulator.arithmetic.subtraction.minuend",
          }}
          operandB={{
            value: valB,
            onChange: handleInputB,
            labelKey:
              "number-systems.simulator.arithmetic.subtraction.subtrahend",
          }}
        />
      }
      resultPanel={
        locked ? (
          <ExerciseValidationPanel
            expectedResult={subtractionResult.sum}
            onShowSolution={onShowSolution!}
            onExitExercise={onExitExercise}
            inputMode="binary"
            placeholder="z.B. 00100000"
          />
        ) : (
          <SubtractionResult
            t={t}
            showStepByStep={showStepByStep}
            setShowStepByStep={setShowStepByStep}
            expanded={expanded}
            toggle={toggle}
            {...subtractionResult}
          />
        )
      }
    />
  );
}
