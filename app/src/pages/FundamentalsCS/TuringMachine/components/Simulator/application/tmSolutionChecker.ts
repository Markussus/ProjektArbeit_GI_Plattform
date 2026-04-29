import type { TMValidationCase } from "../../../scenarios";
import { TuringMachineSimulator } from "./tmSimulator.ts";
import type { TMProgram } from "../domain/tmProgram";

export interface TMValidationResultRow {
  passed: boolean;
  input: string;
  output: string;
  expectedOutput: string;
  endedInValidHaltState: boolean;
}

export interface TMValidationRunResult {
  rows: TMValidationResultRow[];
  error: string | null;
}

export const MAX_VALIDATION_STEPS = 1000;

export function runTMValidation(
  program: TMProgram,
  validationCases: TMValidationCase[],
  maxSteps: number = MAX_VALIDATION_STEPS,
): TMValidationRunResult {
  const rows = validationCases.map((validationCase) =>
    runValidationCase(program, validationCase, maxSteps),
  );

  return {
    rows,
    error: null,
  };
}

function runValidationCase(
  program: TMProgram,
  validationCase: TMValidationCase,
  maxSteps: number,
): TMValidationResultRow {
  const simulator = new TuringMachineSimulator();
  const programForInput: TMProgram = {
    ...program,
    initialTape: validationCase.input.split(""),
  };

  try {
    simulator.initialize(programForInput);

    let steps = 0;
    while (!simulator.isFinished() && steps < maxSteps) {
      simulator.step();
      steps += 1;
    }

    if (!simulator.isFinished()) {
      return {
        passed: false,
        input: validationCase.input,
        output: `Timeout (${maxSteps} steps)`,
        expectedOutput: validationCase.expectedOutput,
        endedInValidHaltState: false,
      };
    }

    const runtime = simulator.getCurrentState();
    const output = serializeTapeOutput(
      simulator.getConfig().blankSymbol,
      runtime.tape,
    );

    return {
      passed: output === validationCase.expectedOutput,
      input: validationCase.input,
      output,
      expectedOutput: validationCase.expectedOutput,
      endedInValidHaltState: runtime.haltReason?.type === "halt_state",
    };
  } catch (error) {
    return {
      passed: false,
      input: validationCase.input,
      output:
        error instanceof Error
          ? error.message
          : "Validation failed unexpectedly.",
      expectedOutput: validationCase.expectedOutput,
      endedInValidHaltState: false,
    };
  }
}

function serializeTapeOutput(
  blankSymbol: string,
  tape: Record<number, string>,
): string {
  const nonBlankIndexes = Object.entries(tape)
    .filter(([, value]) => value !== blankSymbol)
    .map(([index]) => Number(index))
    .sort((left, right) => left - right);

  if (nonBlankIndexes.length === 0) {
    return "";
  }

  const minIndex = nonBlankIndexes[0];
  const maxIndex = nonBlankIndexes[nonBlankIndexes.length - 1];
  let output = "";

  for (let index = minIndex; index <= maxIndex; index += 1) {
    const symbol = tape[index] ?? blankSymbol;
    output += symbol === blankSymbol ? "" : symbol;
  }

  return output;
}
