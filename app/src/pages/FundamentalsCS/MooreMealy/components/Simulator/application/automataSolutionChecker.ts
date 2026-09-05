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
  return runAutomataValidation(
    "Moore",
    program,
    validationCases,
    validateMooreProgram,
    runMooreProgram,
  );
}

export function runMealyValidation(
  program: MealyProgram,
  validationCases: AutomataValidationCase[],
): AutomataValidationResult {
  return runAutomataValidation(
    "Mealy",
    program,
    validationCases,
    validateMealyProgram,
    runMealyProgram,
  );
}

interface AutomataProgram {
  inputSymbols: string[];
}

function runAutomataValidation<TProgram extends AutomataProgram>(
  automataType: "Moore" | "Mealy",
  program: TProgram,
  validationCases: AutomataValidationCase[],
  validateProgram: (program: TProgram) => string[],
  runProgram: (program: TProgram, inputWord: string[]) => number[],
): AutomataValidationResult {
  const issues = validateProgram(program);
  if (issues.length > 0) {
    return {
      rows: [],
      passed: false,
      error: `Invalid ${automataType} program: ${issues.join(", ")}`,
    };
  }

  const rows = validationCases.map<AutomataValidationResultRow>(
    (validationCase) => {
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
        const outputCodes = runProgram(program, validationCase.input);
        return {
          passed: numberArraysEqual(
            validationCase.expectedOutputCodes,
            outputCodes,
          ),
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
    },
  );

  return {
    rows,
    passed: rows.every((row) => row.passed),
    error: null,
  };
}

function numberArraysEqual(left: number[], right: number[]): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
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
