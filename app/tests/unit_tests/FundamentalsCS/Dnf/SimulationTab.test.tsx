/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SimulationTab } from "../../../../src/pages/FundamentalsCS/Dnf/components/SimulationTab";
import { dnfExercises } from "../../../../src/pages/FundamentalsCS/Dnf/exercises";
import { dnfWalkthroughExamples } from "../../../../src/pages/FundamentalsCS/Dnf/examples/walkthroughExamples";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
  }),
}));

describe("SimulationTab", () => {
  afterEach(() => {
    cleanup();
  });

  const baseProps = {
    selectedExercise: null,
    selectedItem: null,
    onExitExercise: vi.fn(),
    onExitExample: vi.fn(),
    onReset: vi.fn(),
    onOpenExercise: vi.fn(),
    onOpenExample: vi.fn(),
  };

  it("renders in free simulation mode without load solution button", () => {
    render(<SimulationTab {...baseProps} />);

    expect(screen.getByTestId("dnf-simulator")).toBeInTheDocument();
    expect(screen.queryByTestId("dnf-load-solution")).not.toBeInTheDocument();
  });

  it("renders with a selected exercise and provides load solution action", () => {
    const exercise = dnfExercises[0];
    render(
      <SimulationTab
        {...baseProps}
        selectedExercise={exercise}
        selectedItem={{ kind: "exercise", exercise }}
      />,
    );

    expect(screen.getByTestId("dnf-simulator")).toBeInTheDocument();
    const loadSolutionBtn = screen.getByTestId("dnf-load-solution");
    expect(loadSolutionBtn).toBeInTheDocument();

    fireEvent.click(loadSolutionBtn);
  });

  it("renders with a selected walkthrough example", () => {
    const example = dnfWalkthroughExamples[0];
    render(
      <SimulationTab
        {...baseProps}
        selectedItem={{ kind: "example", ...example }}
      />,
    );

    expect(screen.getByTestId("dnf-simulator")).toBeInTheDocument();
    expect(screen.queryByTestId("dnf-load-solution")).not.toBeInTheDocument();
  });
});
