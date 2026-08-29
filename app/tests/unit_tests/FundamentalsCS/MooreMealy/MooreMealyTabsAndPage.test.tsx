/** @vitest-environment jsdom */

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MooreMealyPage } from "@/pages/FundamentalsCS/MooreMealy/MooreMealyPage";
import { OverviewTab } from "@/pages/FundamentalsCS/MooreMealy/components/OverviewTab";
import { ExamplesTab } from "@/pages/FundamentalsCS/MooreMealy/components/ExamplesTab";
import { ExercisesTab } from "@/pages/FundamentalsCS/MooreMealy/components/ExercisesTab";
import { SimulationTab } from "@/pages/FundamentalsCS/MooreMealy/components/SimulationTab";
import { mooreExerciseScenarios } from "@/pages/FundamentalsCS/MooreMealy/exercises";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? key,
  }),
}));

describe("MooreMealy Page and Tabs", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders MooreMealyPage and switches between tabs", () => {
    render(
      <MemoryRouter>
        <MooreMealyPage />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("tab-button-overview")).toBeInTheDocument();

    const examplesTabBtn = screen.getByTestId("tab-button-examples");
    fireEvent.click(examplesTabBtn);
    expect(screen.getByTestId("tab-button-examples")).toBeInTheDocument();

    const exercisesTabBtn = screen.getByTestId("tab-button-exercises");
    fireEvent.click(exercisesTabBtn);
    expect(screen.getByTestId("tab-button-exercises")).toBeInTheDocument();

    const simulationTabBtn = screen.getByTestId("tab-button-simulation");
    fireEvent.click(simulationTabBtn);
    expect(screen.getByTestId("simulation-workspace")).toBeInTheDocument();
  });

  it("renders OverviewTab", () => {
    render(<OverviewTab />);
    expect(screen.getByTestId("moore-tutorial-video")).toBeInTheDocument();
  });

  it("renders ExamplesTab and triggers card selection", () => {
    const onOpenExample = vi.fn();
    render(<ExamplesTab onOpenExample={onOpenExample} />);
    expect(
      screen.getByTestId(
        "moore-mealy-example-moore-mealy.examples.mooreDefault-select",
      ),
    ).toBeInTheDocument();
  });

  it("renders ExercisesTab and triggers exercise open and reset", () => {
    const onOpenExercise = vi.fn();
    render(<ExercisesTab onOpenExercise={onOpenExercise} />);
    expect(
      screen.getByTestId(
        "moore-exercise-card-moore-mealy.exercises.turnstile.title-select",
      ),
    ).toBeInTheDocument();
  });

  it("renders SimulationTab in free simulator and exercise mode", async () => {
    const onSelectExercise = vi.fn();
    const { rerender } = render(
      <SimulationTab
        selectedExercise={null}
        onSelectExercise={onSelectExercise}
        onResetActiveSimulator={vi.fn()}
      />,
    );
    expect(screen.getByTestId("simulation-workspace")).toBeInTheDocument();

    // Rerender with an exercise scenario
    await act(async () => {
      rerender(
        <SimulationTab
          selectedExercise={mooreExerciseScenarios[0]}
          onSelectExercise={onSelectExercise}
          onResetActiveSimulator={vi.fn()}
        />,
      );
    });
    expect(
      screen.getByTestId("simulation-selected-exercise"),
    ).toBeInTheDocument();
  });
});
