import {
  bitsNeeded,
  buildFormulas,
  createVariableNames,
  toBits,
  type MooreConversion,
  type MooreConversionRow,
} from "./mooreConversion";
import type { MealyProgram } from "./mealyTypes";

export function buildMealyConversion(program: MealyProgram): MooreConversion {
  const stateBitCount = bitsNeeded(program.states.length);
  const inputBitCount = bitsNeeded(program.inputSymbols.length);
  const outputCodes = program.inputSymbols.flatMap((input) =>
    program.states.map((state) => program.outputs[input][state].code),
  );
  const outputBitCount = bitsNeeded(Math.max(0, ...outputCodes) + 1);
  const stateVariables = createVariableNames("S", stateBitCount);
  const inputVariables = createVariableNames("E", inputBitCount);
  const targetVariables = createVariableNames("T", stateBitCount);
  const outputVariables = createVariableNames("y", outputBitCount);

  const transitionRows: MooreConversionRow[] = program.states.flatMap(
    (state, stateIndex) =>
      program.inputSymbols.map((inputSymbol, inputIndex) => {
        const nextState = program.transitions[inputSymbol][state];
        return {
          currentState: state,
          inputSymbol,
          nextState,
          currentBits: toBits(stateIndex, stateBitCount),
          inputBits: toBits(inputIndex, inputBitCount),
          resultBits: toBits(program.states.indexOf(nextState), stateBitCount),
        };
      }),
  );
  const outputRows: MooreConversionRow[] = program.states.flatMap(
    (state, stateIndex) =>
      program.inputSymbols.map((inputSymbol, inputIndex) => {
        const output = program.outputs[inputSymbol][state];
        return {
          currentState: state,
          inputSymbol,
          outputSymbol: output.symbol,
          currentBits: toBits(stateIndex, stateBitCount),
          inputBits: toBits(inputIndex, inputBitCount),
          resultBits: toBits(output.code, outputBitCount),
        };
      }),
  );
  const transitionFormulas = buildFormulas(
    targetVariables,
    [...stateVariables, ...inputVariables],
    transitionRows,
  );
  const outputFormulas = buildFormulas(
    outputVariables,
    [...stateVariables, ...inputVariables],
    outputRows,
  );
  return {
    transition: {
      stateVariables,
      inputVariables,
      targetVariables,
      rows: transitionRows,
      formulas: transitionFormulas,
    },
    output: {
      stateVariables,
      inputVariables,
      outputVariables,
      rows: outputRows,
      formulas: outputFormulas,
    },
    allFormulas: [...transitionFormulas, ...outputFormulas],
  };
}
