/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TMSimulationView } from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/presentation/TMSimulationView";
import type { TMProgram } from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/domain/tmProgram";
import type { TMRuntime } from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/domain/tmRuntime";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("TMSimulationView", () => {
  afterEach(() => {
    cleanup();
  });

  const baseProgram: TMProgram = {
    states: ["q0", "qS"],
    inputAlphabet: ["0"],
    tapeAlphabet: ["0", "_"],
    blankSymbol: "_",
    initialState: "q0",
    haltStates: ["qS"],
    transitions: {
      "0": {
        q0: { nextState: "qS", writeSymbol: "0", movement: "R" },
      },
    },
    initialTape: ["0"],
  };

  const baseRuntime: TMRuntime = {
    currentState: "q0",
    headPosition: 0,
    tape: { 0: "0" },
    stepCount: 0,
    halted: false,
    haltReason: null,
  };

  it("renders simulation controls, status card, and tape view", () => {
    const onEditConfig = vi.fn();
    const onPlay = vi.fn();
    const onPause = vi.fn();
    const onStep = vi.fn();
    const onStepBack = vi.fn();
    const onReset = vi.fn();
    const onSpeedChange = vi.fn();

    render(
      <TMSimulationView
        program={baseProgram}
        runtime={baseRuntime}
        status="idle"
        speed={100}
        error={null}
        onEditConfig={onEditConfig}
        onPlay={onPlay}
        onPause={onPause}
        onStep={onStep}
        onStepBack={onStepBack}
        onReset={onReset}
        onSpeedChange={onSpeedChange}
      />,
    );

    expect(screen.getByTestId("tm-simulation-view")).toBeInTheDocument();
    expect(screen.getByTestId("tm-simulation-title")).toBeInTheDocument();
    expect(screen.getByTestId("tm-tape-view")).toBeInTheDocument();
    expect(screen.getByTestId("tm-status-card")).toBeInTheDocument();

    const editBtn = screen.getByTestId("tm-edit-configuration");
    fireEvent.click(editBtn);
    expect(onEditConfig).toHaveBeenCalled();
  });
});
