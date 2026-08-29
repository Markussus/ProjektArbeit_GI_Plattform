import { MooreMachineSimulator } from "../domain/mooreMachine";
import { validateMooreProgram } from "../domain/mooreProgram";
import type { MooreProgram } from "../domain/mooreTypes";
import { MealyMachineSimulator } from "../domain/mealyMachine";
import { validateMealyProgram } from "../domain/mealyProgram";
import type { MealyProgram } from "../domain/mealyTypes";

export interface AutomataValidationCase {
  input: string[];
  expectedOutputCodes: number[];
}

export interface AutomataValidationResult {
  rows: AutomataValidationResultRow[];
  passed: boolean;
  error: string | null;
}

export interface AutomataValidationResultRow {
  passed: boolean;
  input: string[];
  outputCodes: number[];
  expectedOutputCodes: number[];
  error: string | null;
}

export function runMooreValidation(
  program: MooreProgram,
  validationCases: AutomataValidationCase[],
): AutomataValidationResult {
  const issues = validateMooreProgram(program);
  if (issues.length > 0) {
    return {
      rows: [],
      passed: false,
      error: `Invalid Moore program: ${issues.join(", ")}`,
    };
  }

  const rows = validationCases.map((validationCase) => {
    if (
      validationCase.input.some(
        (symbol) => !program.inputSymbols.includes(symbol),
      )
    ) {
      return {
        passed: false,
        input: validationCase.input,
        outputCodes: [],
        expectedOutputCodes: validationCase.expectedOutputCodes,
        error: "input_symbol_missing",
      };
    }

    try {
      const outputCodes = runMooreProgram(program, validationCase.input);
      return {
        passed:
          validationCase.expectedOutputCodes.join("|") ===
          outputCodes.join("|"),
        input: validationCase.input,
        outputCodes,
        expectedOutputCodes: validationCase.expectedOutputCodes,
        error: null,
      };
    } catch (error) {
      return {
        passed: false,
        input: validationCase.input,
        outputCodes: [],
        expectedOutputCodes: validationCase.expectedOutputCodes,
        error: error instanceof Error ? error.message : "validation_failed",
      };
    }
  });

  return {
    rows,
    passed: rows.every((row) => row.passed),
    error: null,
  };
}

export function runMealyValidation(
  program: MealyProgram,
  validationCases: AutomataValidationCase[],
): AutomataValidationResult {
  const issues = validateMealyProgram(program);
  if (issues.length > 0) {
    return {
      rows: [],
      passed: false,
      error: `Invalid Mealy program: ${issues.join(", ")}`,
    };
  }

  const rows = validationCases.map((validationCase) => {
    if (
      validationCase.input.some(
        (symbol) => !program.inputSymbols.includes(symbol),
      )
    ) {
      return {
        passed: false,
        input: validationCase.input,
        outputCodes: [],
        expectedOutputCodes: validationCase.expectedOutputCodes,
        error: "input_symbol_missing",
      };
    }

    try {
      const outputCodes = runMealyProgram(program, validationCase.input);
      return {
        passed:
          validationCase.expectedOutputCodes.join("|") ===
          outputCodes.join("|"),
        input: validationCase.input,
        outputCodes,
        expectedOutputCodes: validationCase.expectedOutputCodes,
        error: null,
      };
    } catch (error) {
      return {
        passed: false,
        input: validationCase.input,
        outputCodes: [],
        expectedOutputCodes: validationCase.expectedOutputCodes,
        error: error instanceof Error ? error.message : "validation_failed",
      };
    }
  });

  return {
    rows,
    passed: rows.every((row) => row.passed),
    error: null,
  };
}

function runMooreProgram(program: MooreProgram, inputWord: string[]): number[] {
  const simulator = new MooreMachineSimulator();
  simulator.initialize({ ...program, inputWord });

  const outputCodes = [program.outputs[program.initialState].code];
  while (!simulator.isFinished()) {
    simulator.step();
    const runtime = simulator.getCurrentState();
    outputCodes.push(program.outputs[runtime.currentState].code);
  }
  return outputCodes;
}

function runMealyProgram(program: MealyProgram, inputWord: string[]): number[] {
  const simulator = new MealyMachineSimulator();
  simulator.initialize({ ...program, inputWord });

  const outputCodes: number[] = [];
  while (!simulator.isFinished()) {
    const runtimeBefore = simulator.getCurrentState();
    const inputSymbol = inputWord[runtimeBefore.inputPosition];
    simulator.step();
    const code =
      program.outputs[inputSymbol]?.[runtimeBefore.currentState]?.code;
    if (code !== undefined) {
      outputCodes.push(code);
    }
  }
  return outputCodes;
}
