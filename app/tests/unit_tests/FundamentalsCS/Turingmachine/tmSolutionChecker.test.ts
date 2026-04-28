import { describe, expect, it } from "vitest";

import { runTMValidation } from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/application/tmSolutionChecker";
import { turingMachineExercises } from "@/pages/FundamentalsCS/TuringMachine/scenarios";

describe("tmSolutionChecker", () => {
  // Tests that the shipped reference solution for an exercise passes all predefined validation inputs and halts via a real halt state.
  it("accepts the reference solution for exercise 1", () => {
    const exercise = turingMachineExercises[0];
    const result = runTMValidation(
      exercise.solutionProgram,
      exercise.validationCases,
    );

    expect(result.error).toBeNull();
    expect(result.rows).toHaveLength(exercise.validationCases.length);
    expect(result.rows.every((row) => row.passed)).toBe(true);
    expect(result.rows.every((row) => row.endedInValidHaltState)).toBe(true);
  });

  // Tests that a starter exercise machine without transitions fails the validation and reports that it did not end in a valid halt state.
  it("reports invalid halt outcomes for an unfinished starter machine", () => {
    const exercise = turingMachineExercises[1];
    const result = runTMValidation(exercise.starterProgram, [
      exercise.validationCases[1],
    ]);

    expect(result.error).toBeNull();
    expect(result.rows).toEqual([
      {
        passed: false,
        input: "0",
        output: "Invalid TM program: initial_tape_invalid_symbol",
        expectedOutput: "1",
        endedInValidHaltState: false,
      },
    ]);
  });
});
