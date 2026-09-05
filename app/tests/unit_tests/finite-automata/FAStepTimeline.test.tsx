// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FAStepTimeline } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/presentation/FAStepTimeline";
import type { FARuntime } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faRuntime";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: unknown) =>
      typeof fallback === "string" ? fallback : key,
  }),
}));

function runtime(overrides: Partial<FARuntime> = {}): FARuntime {
  return {
    activeStates: ["S0"],
    inputWord: ["a", "a", "b"],
    inputPosition: 0,
    stepCount: 0,
    halted: false,
    haltReason: null,
    stateHistory: [["S0"]],
    transitionHistory: [],
    ...overrides,
  };
}

function stepButtons(container: HTMLElement) {
  return [...container.querySelectorAll("button")];
}

afterEach(() => cleanup());

describe("FAStepTimeline", () => {
  it("renders one slot per step of the run, plus the start slot", () => {
    const { container } = render(
      <FAStepTimeline runtime={runtime()} onJumpToStep={vi.fn()} />,
    );

    expect(stepButtons(container)).toHaveLength(4);
    expect(screen.getByText("Start")).toBeInTheDocument();
  });

  it("marks the current step and leaves unreached steps disabled", () => {
    const { container } = render(
      <FAStepTimeline
        runtime={runtime({
          stepCount: 1,
          inputPosition: 1,
          stateHistory: [["S0"], ["S1"]],
        })}
        onJumpToStep={vi.fn()}
      />,
    );

    const buttons = stepButtons(container);
    expect(buttons[0]).toBeEnabled();
    expect(buttons[1]).toHaveAttribute("data-active", "true");
    expect(buttons[2]).toBeDisabled();
    expect(buttons[3]).toBeDisabled();
  });

  it("jumps to a reached step when its dot is clicked", () => {
    const onJumpToStep = vi.fn();
    const { container } = render(
      <FAStepTimeline
        runtime={runtime({
          stepCount: 2,
          stateHistory: [["S0"], ["S1"], ["S2"]],
        })}
        onJumpToStep={onJumpToStep}
      />,
    );

    fireEvent.click(stepButtons(container)[1]);

    expect(onJumpToStep).toHaveBeenCalledWith(1);
  });

  it("ignores clicks on a step the run has not reached", () => {
    const onJumpToStep = vi.fn();
    const { container } = render(
      <FAStepTimeline runtime={runtime()} onJumpToStep={onJumpToStep} />,
    );

    fireEvent.click(stepButtons(container)[3]);

    expect(onJumpToStep).not.toHaveBeenCalled();
  });

  it("appends the accept marker when the run halted on an accept state", () => {
    render(
      <FAStepTimeline
        runtime={runtime({
          halted: true,
          haltReason: { type: "accepted", states: ["S2"] },
          stepCount: 3,
          stateHistory: [["S0"], ["S1"], ["S2"], ["S2"]],
        })}
        onJumpToStep={vi.fn()}
      />,
    );

    expect(screen.getByText("✓")).toBeInTheDocument();
  });

  it("appends the reject marker when the run halted without accepting", () => {
    render(
      <FAStepTimeline
        runtime={runtime({
          halted: true,
          haltReason: { type: "rejected", states: [] },
          stepCount: 2,
          stateHistory: [["S0"], ["S1"], []],
        })}
        onJumpToStep={vi.fn()}
      />,
    );

    expect(screen.getByText("✗")).toBeInTheDocument();
  });

  it("shows a single start slot for the empty word", () => {
    const { container } = render(
      <FAStepTimeline
        runtime={runtime({ inputWord: [] })}
        onJumpToStep={vi.fn()}
      />,
    );

    expect(stepButtons(container)).toHaveLength(1);
  });
});
