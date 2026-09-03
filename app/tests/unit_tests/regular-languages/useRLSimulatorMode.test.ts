/** @vitest-environment jsdom */

import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  modeForImportedTask,
  resolveInitialMode,
  useRLSimulatorMode,
  type RLSimulatorSelection,
} from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/application/useRLSimulatorMode";
import { RL_STORAGE_TASK_IDS } from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/useRLPersistedSource";
import { rlExamples } from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/config/rlExamples";
import { rlExercises } from "@/pages/FundamentalsCS/RegularLanguages/exercises/rlExerciseDefinitions";

const grammarExercise = rlExercises.find(
  (e) => e.mode === "grammarToLanguage",
)!;
const languageExercise = rlExercises.find(
  (e) => e.mode === "languageToGrammar",
)!;
const recognizeExample = rlExamples.find((e) => e.mode === "recognizeWord")!;

describe("modeForImportedTask", () => {
  it("maps each storage id back to its mode", () => {
    expect(modeForImportedTask(RL_STORAGE_TASK_IDS.languageToGrammar)).toBe(
      "languageToGrammar",
    );
    expect(modeForImportedTask(RL_STORAGE_TASK_IDS.recognizeWord)).toBe(
      "recognizeWord",
    );
  });

  it("returns undefined for an unknown id", () => {
    expect(modeForImportedTask(99)).toBeUndefined();
  });

  it("returns undefined when no task was imported", () => {
    expect(modeForImportedTask(undefined)).toBeUndefined();
  });

  it("treats storage id 0 as 'no import', not as grammarToLanguage", () => {
    // 0 is grammarToLanguage's id but also the falsy "nothing imported" value;
    // the default mode is the same either way, so the check stays simple.
    expect(modeForImportedTask(0)).toBeUndefined();
  });
});

describe("resolveInitialMode", () => {
  it("defaults to grammar → language", () => {
    expect(resolveInitialMode({})).toBe("grammarToLanguage");
  });

  it("takes the mode of an open exercise", () => {
    expect(resolveInitialMode({ exercise: languageExercise })).toBe(
      "languageToGrammar",
    );
  });

  it("takes the mode of an open example", () => {
    expect(resolveInitialMode({ example: recognizeExample })).toBe(
      "recognizeWord",
    );
  });

  it("lets an exercise win over an example", () => {
    expect(
      resolveInitialMode({
        exercise: languageExercise,
        example: recognizeExample,
      }),
    ).toBe("languageToGrammar");
  });

  it("falls back to an imported task when nothing is selected", () => {
    expect(
      resolveInitialMode({
        importedTaskStorageId: RL_STORAGE_TASK_IDS.recognizeWord,
      }),
    ).toBe("recognizeWord");
  });

  it("lets a selection win over a lingering import id", () => {
    expect(
      resolveInitialMode({
        exercise: grammarExercise,
        importedTaskStorageId: RL_STORAGE_TASK_IDS.recognizeWord,
      }),
    ).toBe("grammarToLanguage");
  });
});

describe("useRLSimulatorMode", () => {
  function setup(initial: RLSimulatorSelection = {}) {
    return renderHook(
      (selection: RLSimulatorSelection) => useRLSimulatorMode(selection),
      { initialProps: initial },
    );
  }

  it("starts on the resolved initial mode", () => {
    const { result } = setup({ example: recognizeExample });

    expect(result.current.mode).toBe("recognizeWord");
  });

  it("adopts the mode of a freshly imported task", () => {
    const { result, rerender } = setup();

    rerender({ importedTaskStorageId: RL_STORAGE_TASK_IDS.languageToGrammar });

    expect(result.current.mode).toBe("languageToGrammar");
  });

  it("ignores an import id that maps to no mode", () => {
    const { result, rerender } = setup();

    rerender({ importedTaskStorageId: 42 });

    expect(result.current.mode).toBe("grammarToLanguage");
  });

  it("adopts the mode of a newly picked exercise", () => {
    const { result, rerender } = setup();

    rerender({ exercise: languageExercise });

    expect(result.current.mode).toBe("languageToGrammar");
  });

  it("adopts the mode of a newly picked example", () => {
    const { result, rerender } = setup();

    rerender({ example: recognizeExample });

    expect(result.current.mode).toBe("recognizeWord");
  });

  it("keeps the current mode when the selection is merely cleared", () => {
    const { result, rerender } = setup({ example: recognizeExample });

    rerender({});

    expect(result.current.mode).toBe("recognizeWord");
  });

  it("lets the caller switch modes by hand", () => {
    const { result, rerender } = setup();

    result.current.setMode("recognizeWord");
    rerender({});

    expect(result.current.mode).toBe("recognizeWord");
  });
});
