/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TMSimulationStatusCard } from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/presentation/TMSimulationStatusCard";
import type { TMRuntime } from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/domain/tmRuntime";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (
        key === "turing-machine.sim.haltReason.missingTransition" &&
        options
      ) {
        return `Missing transition: state ${String(options.state)}, symbol ${String(options.symbol)}`;
      }
      return key;
    },
  }),
}));

describe("TMSimulationStatusCard", () => {
  afterEach(() => {
    cleanup();
  });

  const baseRuntime: TMRuntime = {
    currentState: "q0",
    headPosition: 0,
    tape: { 0: "1", 1: "0" },
    stepCount: 5,
    halted: false,
    haltReason: null,
  };

  it("renders status details correctly during running state", () => {
    render(
      <TMSimulationStatusCard
        program={{ blankSymbol: "_" }}
        runtime={baseRuntime}
        error={null}
      />,
    );

    expect(screen.getByTestId("tm-status-current-state")).toHaveTextContent(
      "q₀",
    );
    expect(screen.getByTestId("tm-status-current-symbol")).toHaveTextContent(
      "1",
    );
    expect(screen.getByTestId("tm-status-step-count")).toHaveTextContent("5");
    expect(screen.getByTestId("tm-status-halted")).toHaveTextContent(
      "turing-machine.sim.status.no",
    );
    expect(
      screen.queryByTestId("tm-status-halt-reason"),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("tm-status-error")).not.toBeInTheDocument();
  });

  it("renders missing transition halt reason when halted due to missing transition", () => {
    const haltedRuntime: TMRuntime = {
      ...baseRuntime,
      halted: true,
      haltReason: {
        type: "missing_transition",
        state: "q1",
        symbol: "0",
      },
    };

    render(
      <TMSimulationStatusCard
        program={{ blankSymbol: "_" }}
        runtime={haltedRuntime}
        error={null}
      />,
    );

    expect(screen.getByTestId("tm-status-halted")).toHaveTextContent(
      "turing-machine.sim.status.yes",
    );
    expect(screen.getByTestId("tm-status-halt-reason")).toHaveTextContent(
      "Missing transition: state q₁, symbol 0",
    );
  });

  it("renders error message when error prop is supplied", () => {
    render(
      <TMSimulationStatusCard
        program={{ blankSymbol: "_" }}
        runtime={baseRuntime}
        error={new Error("Simulation step failed")}
      />,
    );

    expect(screen.getByTestId("tm-status-error")).toHaveTextContent(
      "Simulation step failed",
    );
  });
});
