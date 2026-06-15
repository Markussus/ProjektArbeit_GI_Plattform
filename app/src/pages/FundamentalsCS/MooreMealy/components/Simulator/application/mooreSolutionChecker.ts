import { MooreMachineSimulator } from "../domain/mooreMachine";
import { validateMooreProgram } from "../domain/mooreProgram";
import type { MooreProgram } from "../domain/mooreTypes";
import type { MooreValidationCase } from "../../../exercises";

export interface MooreValidationResult {
  rows: MooreValidationResultRow[];
  passed: boolean;
  error: string | null;
}

export interface MooreValidationResultRow {
  passed: boolean;
  input: string[];
  outputCodes: number[];
  expectedOutputCodes: number[];
  error: string | null;
}

export function runMooreValidation(
  program: MooreProgram,
  validationCases: MooreValidationCase[],
): MooreValidationResult {
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
      const outputCodes = runProgram(program, validationCase.input);
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
        error:
          error instanceof Error ? error.message : "validation_failed",
      };
    }
  });

  return {
    rows,
    passed: rows.every((row) => row.passed),
    error: null,
  };
}

function runProgram(program: MooreProgram, inputWord: string[]): number[] {
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
