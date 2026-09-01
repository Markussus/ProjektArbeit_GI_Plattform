/** @vitest-environment jsdom */

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DnfSimulator,
  type DnfSimulatorHandle,
} from "../../../../src/pages/FundamentalsCS/Dnf/components/DnfSimulator";
import { dnfExercises } from "../../../../src/pages/FundamentalsCS/Dnf/exercises";
import { dnfWalkthroughExamples } from "../../../../src/pages/FundamentalsCS/Dnf/examples/walkthroughExamples";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
  }),
}));

describe("DnfSimulator", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders with tabs and allows switching mode", () => {
    render(<DnfSimulator />);

    expect(screen.getByTestId("dnf-simulator")).toBeInTheDocument();
    expect(screen.getByTestId("dnf-simulator")).toHaveAttribute(
      "data-mode",
      "expression_to_truth_table",
    );

    const tableTab = screen.getByTestId("dnf-mode-tab-truth_table_to_dnf");
    fireEvent.click(tableTab);

    expect(screen.getByTestId("dnf-simulator")).toHaveAttribute(
      "data-mode",
      "truth_table_to_dnf",
    );
  });

  it("renders with a selected exercise", () => {
    const exercise = dnfExercises[0];
    render(<DnfSimulator selectedExercise={exercise} />);

    expect(screen.getByTestId("dnf-simulator")).toBeInTheDocument();
    expect(screen.getByTestId("dnf-exercise-workspace")).toBeInTheDocument();
  });

  it("renders with a selected walkthrough example", () => {
    const example = dnfWalkthroughExamples[0];
    render(<DnfSimulator selectedExample={example} />);

    expect(screen.getByTestId("dnf-simulator")).toBeInTheDocument();
  });

  it("exposes resetStoredState and loadSolution through ref", () => {
    const ref = createRef<DnfSimulatorHandle>();
    const exercise = dnfExercises[0];
    render(<DnfSimulator ref={ref} selectedExercise={exercise} />);

    expect(ref.current).toBeTruthy();
    act(() => {
      ref.current?.resetStoredState();
      ref.current?.loadSolution();
    });
  });
});
