/** @vitest-environment jsdom */

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  TMSimulator,
  type TMSimulatorHandle,
} from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/TMSimulator";
import type { TMValidationRunResult } from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/application/tmSolutionChecker";
import {
  turingMachineExercises,
  turingMachineExampleDefinitions,
  getTuringMachineScenario,
} from "@/pages/FundamentalsCS/TuringMachine/scenarios";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("TMSimulator", () => {
  beforeEach(() => {
    global.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
    Element.prototype.scrollTo = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders in edit mode by default and allows switching to simulation mode", () => {
    render(<TMSimulator scenario={null} />);

    expect(screen.getByTestId("tm-simulator")).toHaveAttribute(
      "data-mode",
      "edit",
    );
    expect(screen.getByTestId("tm-config-view")).toBeInTheDocument();

    const startSimBtn = screen.getByTestId("tm-start-simulation");
    fireEvent.click(startSimBtn);

    expect(screen.getByTestId("tm-simulator")).toHaveAttribute(
      "data-mode",
      "simulation",
    );
    expect(screen.getByTestId("tm-simulation-view")).toBeInTheDocument();

    const editConfigBtn = screen.getByTestId("tm-edit-configuration");
    fireEvent.click(editConfigBtn);

    expect(screen.getByTestId("tm-simulator")).toHaveAttribute(
      "data-mode",
      "edit",
    );
  });

  it("provides imperative handle methods for exercise scenarios", async () => {
    const exercise = turingMachineExercises[0];
    const ref = createRef<TMSimulatorHandle>();

    render(<TMSimulator ref={ref} scenario={exercise} />);

    expect(ref.current).toBeDefined();

    // Check loadSolution
    act(() => {
      ref.current?.loadSolution();
    });

    // Check checkSolution
    let checkResult: TMValidationRunResult | undefined;
    await act(async () => {
      checkResult = await ref.current?.checkSolution();
    });

    expect(checkResult).toBeDefined();
    expect(checkResult?.rows.length).toBeGreaterThan(0);

    // Check resetStoredState
    act(() => {
      ref.current?.resetStoredState();
    });
  });

  it("returns error on checkSolution when scenario is example or null", async () => {
    const exampleDef = turingMachineExampleDefinitions[0];
    const exampleScenario = getTuringMachineScenario(exampleDef.id);
    const ref = createRef<TMSimulatorHandle>();

    render(<TMSimulator ref={ref} scenario={exampleScenario} />);

    let checkResult: TMValidationRunResult | undefined;
    await act(async () => {
      checkResult = await ref.current?.checkSolution();
    });

    expect(checkResult?.error).toBe(
      "turing-machine.validation.summary.exampleCheckUnavailable",
    );
  });
});
