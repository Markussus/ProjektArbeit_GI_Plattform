/** @vitest-environment jsdom */

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useExerciseTabs } from "@/hooks/useExerciseTabs";
import type { Example, Exercise } from "@/types/exercise";

describe("useExerciseTabs", () => {
  const dummyExercise1: Exercise = {
    id: "ex-1",
    label: "Exercise 1",
    description: "Desc 1",
    difficulty: "easy",
  };

  const dummyExercise2: Exercise = {
    id: "ex-2",
    label: "Exercise 2",
    description: "Desc 2",
    difficulty: "medium",
  };

  const dummyExample1: Example = {
    id: "eg-1",
    label: "Example 1",
    description: "Example Desc 1",
  };

  const dummyExample2: Example = {
    id: "eg-2",
    label: "Example 2",
    description: "Example Desc 2",
  };

  it("initializes with default active tab or given initial tab", () => {
    const { result: defaultResult } = renderHook(() => useExerciseTabs());
    expect(defaultResult.current.activeTab).toBe("overview");
    expect(defaultResult.current.selectedExercise).toBeNull();
    expect(defaultResult.current.selectedExample).toBeNull();
    expect(defaultResult.current.simulationExercise).toBeNull();
    expect(defaultResult.current.simulationItem).toBeNull();

    const { result: customResult } = renderHook(() =>
      useExerciseTabs("simulation"),
    );
    expect(customResult.current.activeTab).toBe("simulation");
  });

  it("updates active tab with setActiveTab", () => {
    const { result } = renderHook(() => useExerciseTabs());
    act(() => {
      result.current.setActiveTab("exercises");
    });
    expect(result.current.activeTab).toBe("exercises");
  });

  it("selects and toggles exercise selection", () => {
    const { result } = renderHook(() => useExerciseTabs());

    act(() => {
      result.current.selectExercise(dummyExercise1);
    });
    expect(result.current.selectedExercise).toBe(dummyExercise1);

    // Clicking same exercise toggles it off
    act(() => {
      result.current.selectExercise(dummyExercise1);
    });
    expect(result.current.selectedExercise).toBeNull();

    // Clicking different exercise selects new exercise
    act(() => {
      result.current.selectExercise(dummyExercise1);
    });
    act(() => {
      result.current.selectExercise(dummyExercise2);
    });
    expect(result.current.selectedExercise).toBe(dummyExercise2);
  });

  it("opens exercise in simulation tab", () => {
    const { result } = renderHook(() => useExerciseTabs());

    act(() => {
      result.current.openInSimulation(dummyExercise1);
    });
    expect(result.current.selectedExercise).toBe(dummyExercise1);
    expect(result.current.simulationExercise).toBe(dummyExercise1);
    expect(result.current.simulationItem).toBe(dummyExercise1);
    expect(result.current.activeTab).toBe("simulation");
  });

  it("selects and toggles example selection", () => {
    const { result } = renderHook(() => useExerciseTabs());

    act(() => {
      result.current.selectExample(dummyExample1);
    });
    expect(result.current.selectedExample).toBe(dummyExample1);

    // Clicking same example toggles it off
    act(() => {
      result.current.selectExample(dummyExample1);
    });
    expect(result.current.selectedExample).toBeNull();

    act(() => {
      result.current.selectExample(dummyExample1);
    });
    act(() => {
      result.current.selectExample(dummyExample2);
    });
    expect(result.current.selectedExample).toBe(dummyExample2);
  });

  it("opens example in simulation tab", () => {
    const { result } = renderHook(() => useExerciseTabs());

    act(() => {
      result.current.openExampleInSimulation(dummyExample1);
    });
    expect(result.current.selectedExample).toBe(dummyExample1);
    expect(result.current.simulationItem).toBe(dummyExample1);
    expect(result.current.simulationExercise).toBeNull();
    expect(result.current.activeTab).toBe("simulation");
  });

  it("clears simulation items and selections properly", () => {
    const { result } = renderHook(() => useExerciseTabs());

    act(() => {
      result.current.openInSimulation(dummyExercise1);
    });
    expect(result.current.simulationExercise).toBe(dummyExercise1);

    act(() => {
      result.current.clearSimulationExercise();
    });
    expect(result.current.simulationExercise).toBeNull();
    expect(result.current.selectedExercise).toBeNull();
    expect(result.current.simulationItem).toBeNull();

    act(() => {
      result.current.openExampleInSimulation(dummyExample1);
    });
    expect(result.current.selectedExample).toBe(dummyExample1);

    act(() => {
      result.current.clearSimulationItem();
    });
    expect(result.current.simulationItem).toBeNull();
    expect(result.current.selectedExample).toBeNull();

    // Test clearSimulationSelection
    act(() => {
      result.current.openInSimulation(dummyExercise1);
    });
    act(() => {
      result.current.clearSimulationSelection();
    });
    expect(result.current.selectedExercise).toBeNull();
    expect(result.current.selectedExample).toBeNull();
    expect(result.current.simulationExercise).toBeNull();
    expect(result.current.simulationItem).toBeNull();
  });
});
