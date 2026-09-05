/** @vitest-environment jsdom */

import { createRef } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  FASimulator,
  type FASimulatorHandle,
} from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/FASimulator";
import { faExamples } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/config/faExamples";
import { emptyFAProgram } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/config/emptyFAProgram";
import { faExercises } from "@/pages/FundamentalsCS/FiniteAutomata/exercises/faExerciseDefinitions";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: unknown) =>
      typeof fallback === "string" ? fallback : key,
  }),
}));

const exercise = faExercises[0];
const example = faExamples.find((e) => e.category === "dfa")!;

function renderSimulator(
  props: Partial<Parameters<typeof FASimulator>[0]> = {},
) {
  const ref = createRef<FASimulatorHandle>();
  render(<FASimulator ref={ref} {...props} />);
  return ref;
}

afterEach(() => cleanup());

describe("FASimulator — seeding", () => {
  it("starts from the blank program in free mode", () => {
    const ref = renderSimulator();

    expect(ref.current!.getCurrentProgram()).toEqual(emptyFAProgram);
  });

  it("starts from the exercise starter when an exercise is open", () => {
    const ref = renderSimulator({ exercise });

    expect(ref.current!.getCurrentProgram()).toEqual(exercise.starter);
  });

  it("starts from the example program and its input word", () => {
    const ref = renderSimulator({ example });

    expect(ref.current!.getCurrentProgram()).toEqual(example.program);
    expect(screen.getByDisplayValue(example.inputWord)).toBeInTheDocument();
  });
});

describe("FASimulator — editor modes", () => {
  it("opens in the manual editor with the start button available", () => {
    renderSimulator();

    expect(screen.getByTestId("fa-start-simulation")).toBeInTheDocument();
    expect(screen.queryByTestId("fa-convert-grammar")).not.toBeInTheDocument();
  });

  it("switches to the grammar editor and back", () => {
    renderSimulator();

    fireEvent.click(screen.getByTestId("fa-mode-tab-grammar"));
    expect(screen.getByTestId("fa-convert-grammar")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("fa-mode-tab-manual"));
    expect(screen.getByTestId("fa-start-simulation")).toBeInTheDocument();
  });

  it("adopts the automaton a converted grammar produces", () => {
    const ref = renderSimulator();

    fireEvent.click(screen.getByTestId("fa-mode-tab-grammar"));
    fireEvent.change(screen.getByLabelText("Grammar"), {
      target: { value: "S -> 0S | 1" },
    });
    fireEvent.click(screen.getByTestId("fa-convert-grammar"));

    const program = ref.current!.getCurrentProgram();
    expect(program.startState).toBe("S");
    expect(program.alphabet).toEqual(["0", "1"]);
    // Conversion drops back into the manual editor.
    expect(screen.getByTestId("fa-start-simulation")).toBeInTheDocument();
  });

  it("blocks starting a simulation while the draft is invalid", () => {
    renderSimulator();

    // The blank program is structurally valid, so make it invalid by emptying
    // the alphabet.
    fireEvent.change(screen.getByPlaceholderText("a, b"), {
      target: { value: "" },
    });

    expect(screen.getByTestId("fa-start-simulation")).toBeDisabled();
  });

  it("switches into the simulation view and back to the editor", () => {
    renderSimulator({ example });

    fireEvent.click(screen.getByTestId("fa-start-simulation"));
    expect(screen.queryByTestId("fa-start-simulation")).not.toBeInTheDocument();
    expect(screen.getByTestId("fa-state-diagram")).toBeInTheDocument();
  });
});

describe("FASimulator — exercise handle", () => {
  it("returns 'unbuilt' for an untouched starter", () => {
    const ref = renderSimulator({ exercise });

    expect(ref.current!.checkSolution()).toBe("unbuilt");
  });

  it("returns 'unbuilt' when there is no exercise at all", () => {
    const ref = renderSimulator();

    expect(ref.current!.checkSolution()).toBe("unbuilt");
  });

  it("validates the drafted automaton against the reference solution", () => {
    const ref = renderSimulator({ exercise });

    act(() => ref.current!.loadSolution());

    const result = ref.current!.checkSolution();
    expect(result).not.toBe("unbuilt");
    expect(result).toMatchObject({ passed: true, failedCount: 0 });
  });

  it("loads the reference solution into the editor", () => {
    const ref = renderSimulator({ exercise });

    act(() => ref.current!.loadSolution());

    expect(ref.current!.getCurrentProgram()).toEqual(exercise.solution);
  });

  it("ignores loadSolution outside an exercise", () => {
    const ref = renderSimulator();

    act(() => ref.current!.loadSolution());

    expect(ref.current!.getCurrentProgram()).toEqual(emptyFAProgram);
  });

  it("resets an exercise back to its starter", () => {
    const ref = renderSimulator({ exercise });

    act(() => ref.current!.loadSolution());
    act(() => ref.current!.resetStoredState());

    expect(ref.current!.getCurrentProgram()).toEqual(exercise.starter);
  });

  it("resets free mode back to the blank program", () => {
    const ref = renderSimulator();

    fireEvent.click(screen.getByTestId("fa-mode-tab-grammar"));
    fireEvent.change(screen.getByLabelText("Grammar"), {
      target: { value: "S -> 0S | 1" },
    });
    fireEvent.click(screen.getByTestId("fa-convert-grammar"));
    act(() => ref.current!.resetStoredState());

    expect(ref.current!.getCurrentProgram()).toEqual(emptyFAProgram);
  });
});
