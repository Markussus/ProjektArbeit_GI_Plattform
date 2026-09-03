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
import {
  MEALY_EXAMPLE_ID,
  MOORE_EXAMPLE_ID,
  resolveAutomataSimulationContext,
  resolveInitialMachineType,
} from "@/pages/FundamentalsCS/MooreMealy/components/automataSimulationContext";
import { MEALY_SIMULATOR_TASK_STORAGE_ID } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/MealySimulator";
import {
  mealyExerciseScenarios,
  mooreExerciseScenarios,
} from "@/pages/FundamentalsCS/MooreMealy/exercises";

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

  it("resolves the initial machine type for exercises, examples, and imports", () => {
    expect(
      resolveInitialMachineType({
        exerciseScenario: mealyExerciseScenarios[0],
        isMealyExample: false,
      }),
    ).toBe("mealy");
    expect(
      resolveInitialMachineType({
        exerciseScenario: null,
        isMealyExample: true,
      }),
    ).toBe("mealy");
    expect(
      resolveInitialMachineType({
        exerciseScenario: null,
        isMealyExample: false,
        importedTaskStorageId: MEALY_SIMULATOR_TASK_STORAGE_ID,
      }),
    ).toBe("mealy");
    expect(
      resolveInitialMachineType({
        exerciseScenario: null,
        isMealyExample: false,
      }),
    ).toBe("moore");
  });

  it("resolves the complete free, example, and exercise contexts", () => {
    expect(
      resolveAutomataSimulationContext({
        exerciseScenario: null,
        selectedItemId: MOORE_EXAMPLE_ID,
        machineType: "moore",
      }),
    ).toMatchObject({
      isMooreExample: true,
      isMealyExample: false,
      storageEnabled: false,
      activeMachineType: "moore",
    });
    expect(
      resolveAutomataSimulationContext({
        exerciseScenario: mealyExerciseScenarios[0],
        selectedItemId: MEALY_EXAMPLE_ID,
        machineType: "moore",
      }),
    ).toMatchObject({
      isMooreExample: false,
      isMealyExample: true,
      storageEnabled: false,
      activeMachineType: "mealy",
      mealyExerciseScenario: mealyExerciseScenarios[0],
    });
    expect(
      resolveAutomataSimulationContext({
        exerciseScenario: null,
        machineType: "mealy",
      }),
    ).toMatchObject({
      storageEnabled: true,
      activeMachineType: "mealy",
    });
  });

  it("renders MooreMealyPage and switches between tabs", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <MooreMealyPage />
        </MemoryRouter>,
      );
    });
    expect(screen.getByTestId("tab-button-overview")).toBeInTheDocument();

    const examplesTabBtn = screen.getByTestId("tab-button-examples");
    await act(async () => {
      fireEvent.click(examplesTabBtn);
    });
    expect(screen.getByTestId("tab-button-examples")).toBeInTheDocument();

    const exercisesTabBtn = screen.getByTestId("tab-button-exercises");
    await act(async () => {
      fireEvent.click(exercisesTabBtn);
    });
    expect(screen.getByTestId("tab-button-exercises")).toBeInTheDocument();

    const simulationTabBtn = screen.getByTestId("tab-button-simulation");
    await act(async () => {
      fireEvent.click(simulationTabBtn);
    });
    expect(screen.getByTestId("simulation-workspace")).toBeInTheDocument();
  });

  it("renders OverviewTab", () => {
    render(<OverviewTab />);
    expect(screen.getByTestId("moore-tutorial-video")).toBeInTheDocument();
  });

  it("renders ExamplesTab and triggers card selection", () => {
    const onSelectExample = vi.fn();
    const onOpenExampleInSimulation = vi.fn();
    render(
      <ExamplesTab
        selectedExample={null}
        onSelectExample={onSelectExample}
        onOpenExampleInSimulation={onOpenExampleInSimulation}
      />,
    );
    expect(
      screen.getByTestId(
        "moore-mealy-example-moore-mealy.examples.mooreDefault-select",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("moore-mealy-examples-section-moore"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("moore-mealy-examples-section-mealy"),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByTestId(
        "moore-mealy-example-moore-mealy.examples.mooreDefault-select",
      ),
    );
    fireEvent.doubleClick(
      screen.getByTestId(
        "moore-mealy-example-moore-mealy.examples.mealyDefault-select",
      ),
    );

    expect(onSelectExample).toHaveBeenCalledOnce();
    expect(onOpenExampleInSimulation).toHaveBeenCalledOnce();
  });

  it("renders ExercisesTab and triggers exercise open and reset", () => {
    const onOpenExercise = vi.fn();
    render(<ExercisesTab onOpenExercise={onOpenExercise} />);
    expect(
      screen.getByTestId(
        "automata-exercise-card-moore-mealy.exercises.turnstile.title-select",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(
        "automata-exercise-card-moore-mealy.exercises.edgeDetector.title-select",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("moore-mealy-exercises-tab-section-moore"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("moore-mealy-exercises-tab-section-mealy"),
    ).toBeInTheDocument();
  });

  it("renders SimulationTab in free simulator and exercise mode", async () => {
    const onSelectExercise = vi.fn();
    let rerenderFn: ReturnType<typeof render>["rerender"];
    await act(async () => {
      const { rerender } = render(
        <SimulationTab
          selectedExercise={null}
          onSelectExercise={onSelectExercise}
          onResetActiveSimulator={vi.fn()}
        />,
      );
      rerenderFn = rerender;
    });
    expect(screen.getByTestId("simulation-workspace")).toBeInTheDocument();

    // Rerender with an exercise scenario
    await act(async () => {
      rerenderFn(
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

  it("opens a Mealy exercise in the Mealy simulator", async () => {
    await act(async () => {
      render(
        <SimulationTab
          selectedExercise={mealyExerciseScenarios[0]}
          onSelectExercise={vi.fn()}
          onResetActiveSimulator={vi.fn()}
        />,
      );
    });

    expect(await screen.findByTestId("mealy-config-view")).toBeVisible();
    expect(screen.getByTestId("automata-load-solution")).toBeEnabled();
  });
});
