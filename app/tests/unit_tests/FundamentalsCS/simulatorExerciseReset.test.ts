import { beforeEach, describe, expect, it } from "vitest";
import { defaultDFAProgram } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/config/defaultFAProgram";
import { useFASimulatorStore } from "@/pages/FundamentalsCS/FiniteAutomata/store/faSimulatorStore";
import { useRLSimulatorStore } from "@/pages/FundamentalsCS/RegularLanguages/store/rlSimulatorStore";
import { cloneJson } from "@/lib/utils";

describe("per-exercise simulator reset", () => {
  beforeEach(() => {
    useFASimulatorStore.setState({ exerciseDrafts: {} });
    useRLSimulatorStore.setState({ exerciseDrafts: {} });
  });

  it("removes only the selected Finite Automata exercise draft", () => {
    const first = cloneJson(defaultDFAProgram);
    const second = cloneJson(defaultDFAProgram);
    second.startState = "S1";
    const store = useFASimulatorStore.getState();
    store.setExerciseDraft("fa.exercise.1", first);
    store.setExerciseDraft("fa.exercise.2", second);

    useFASimulatorStore.getState().clearExerciseDraft("fa.exercise.1");

    expect(useFASimulatorStore.getState().exerciseDrafts).toEqual({
      "fa.exercise.2": second,
    });
  });

  it("removes only the selected Regular Languages exercise draft", () => {
    const store = useRLSimulatorStore.getState();
    store.setExerciseDraft("rl.exercise.1", "first answer");
    store.setExerciseDraft("rl.exercise.2", "second answer");

    useRLSimulatorStore.getState().clearExerciseDraft("rl.exercise.1");

    expect(useRLSimulatorStore.getState().exerciseDrafts).toEqual({
      "rl.exercise.2": "second answer",
    });
  });
});
