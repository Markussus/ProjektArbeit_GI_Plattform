import { describe, expect, it } from "vitest";

import { runTMValidation } from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/application/tmSolutionChecker";
import type { TMProgram } from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/domain/tmProgram";
import { turingMachineExercises } from "@/pages/FundamentalsCS/TuringMachine/scenarios";

describe("tmSolutionChecker", () => {
  const invertBinaryWordExercise = turingMachineExercises.find(
    (exercise) =>
      exercise.id === "turing-machine.exercises.exerciseInvertBinaryWord",
  );

  it("assigns a unique six-bit storage id to every exercise", () => {
    expect(
      [...turingMachineExercises]
        .map((exercise) => exercise.storageId)
        .sort((left, right) => left - right),
    ).toEqual(
      Array.from(
        { length: turingMachineExercises.length },
        (_, storageId) => storageId,
      ),
    );
  });

  // Tests that all shipped reference solutions pass their predefined validation inputs and halt via a real halt state.
  it.each(turingMachineExercises)(
    "accepts the reference solution for $id",
    (exercise) => {
      const result = runTMValidation(
        exercise.solutionProgram,
        exercise.validationCases,
      );

      expect(result.error).toBeNull();
      expect(result.rows).toHaveLength(exercise.validationCases.length);
      expect(result.rows.every((row) => row.passed)).toBe(true);
      expect(result.rows.every((row) => row.endedInValidHaltState)).toBe(true);
    },
  );

  // Tests the stale-input-alphabet regression: validation must re-derive the alphabet for each case instead of trusting whatever tape the editor currently holds.
  it("re-derives the input alphabet for each validation input", () => {
    expect(invertBinaryWordExercise).toBeDefined();
    const exercise = invertBinaryWordExercise!;
    const result = runTMValidation(
      {
        ...exercise.solutionProgram,
        initialTape: [],
        inputAlphabet: [],
      },
      [{ input: "10", expectedOutput: "01" }],
    );

    expect(result).toEqual({
      error: null,
      rows: [
        {
          passed: true,
          input: "10",
          output: "01",
          expectedOutput: "01",
          endedInValidHaltState: true,
        },
      ],
    });
  });

  // Tests that a starter exercise machine without transitions fails the validation and reports that it did not end in a valid halt state.
  it("reports invalid halt outcomes for an unfinished starter machine", () => {
    expect(invertBinaryWordExercise).toBeDefined();
    const exercise = invertBinaryWordExercise!;
    const result = runTMValidation(exercise.starterProgram, [
      exercise.validationCases[1],
    ]);

    expect(result.error).toBeNull();
    expect(result.rows).toEqual([
      {
        passed: false,
        input: "0",
        output: "0",
        expectedOutput: "1",
        endedInValidHaltState: false,
      },
    ]);
  });

  // Tests that matching output alone is not enough: the row must still fail when the machine halts because of a missing transition instead of a valid halt state.
  it("marks matching output as failed when the machine does not end in a halt state", () => {
    const program: TMProgram = {
      states: ["q0", "qS"],
      inputAlphabet: ["0"],
      tapeAlphabet: ["0", "_"],
      blankSymbol: "_",
      initialState: "q0",
      haltStates: ["qS"],
      transitions: {
        "0": {
          q0: { nextState: "q0", writeSymbol: "_", movement: "R" },
        },
      },
      initialTape: ["0"],
    };
    const result = runTMValidation(program, [
      { input: "0", expectedOutput: "" },
    ]);

    expect(result).toEqual({
      error: null,
      rows: [
        {
          passed: false,
          input: "0",
          output: "",
          expectedOutput: "",
          endedInValidHaltState: false,
        },
      ],
    });
  });
});
