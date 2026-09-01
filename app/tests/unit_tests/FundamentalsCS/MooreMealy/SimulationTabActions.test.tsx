/** @vitest-environment jsdom */

import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  MEALY_EXAMPLE_ID,
  MOORE_EXAMPLE_ID,
  SimulationTab,
} from "@/pages/FundamentalsCS/MooreMealy/components/SimulationTab";
import {
  mealyExerciseScenarios,
  mooreExerciseScenarios,
} from "@/pages/FundamentalsCS/MooreMealy/exercises";

const simulatorSpies = vi.hoisted(() => ({
  mooreCheck: vi.fn(),
  mooreLoad: vi.fn(),
  mooreReset: vi.fn(),
  mealyCheck: vi.fn(),
  mealyLoad: vi.fn(),
  mealyReset: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock(
  "@/pages/FundamentalsCS/MooreMealy/components/Simulator/MooreSimulator",
  () => ({
    MooreSimulator: React.forwardRef(function MockMooreSimulator(
      props: { transferActive: boolean; isExample: boolean },
      ref: React.ForwardedRef<unknown>,
    ) {
      React.useImperativeHandle(ref, () => ({
        checkSolution: simulatorSpies.mooreCheck,
        loadSolution: simulatorSpies.mooreLoad,
        resetStoredState: simulatorSpies.mooreReset,
      }));
      return (
        <div
          data-testid="mock-moore-simulator"
          data-transfer-active={String(props.transferActive)}
          data-example={String(props.isExample)}
        />
      );
    }),
  }),
);

vi.mock(
  "@/pages/FundamentalsCS/MooreMealy/components/Simulator/MealySimulator",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("@/pages/FundamentalsCS/MooreMealy/components/Simulator/MealySimulator")
      >();
    return {
      ...actual,
      MealySimulator: React.forwardRef(function MockMealySimulator(
        props: {
          transferActive: boolean;
          isExample: boolean;
          storageEnabled: boolean;
        },
        ref: React.ForwardedRef<unknown>,
      ) {
        React.useImperativeHandle(ref, () => ({
          checkSolution: simulatorSpies.mealyCheck,
          loadSolution: simulatorSpies.mealyLoad,
          resetStoredState: simulatorSpies.mealyReset,
        }));
        return (
          <div
            data-testid="mock-mealy-simulator"
            data-transfer-active={String(props.transferActive)}
            data-example={String(props.isExample)}
            data-storage-enabled={String(props.storageEnabled)}
          />
        );
      }),
    };
  },
);

const commonProps = {
  onSelectExercise: vi.fn(),
  onResetActiveSimulator: vi.fn(),
};

describe("SimulationTab solution actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    simulatorSpies.mooreCheck.mockResolvedValue({
      rows: [],
      passed: true,
      error: null,
    });
    simulatorSpies.mealyCheck.mockResolvedValue({
      rows: [
        {
          passed: false,
          input: [],
          outputCodes: [],
          expectedOutputCodes: [],
          error: "missing-transition",
        },
      ],
      passed: false,
      error: "validation failed",
    });
  });

  afterEach(cleanup);

  it("loads, checks, closes, and resets a Moore exercise via test ids", async () => {
    render(
      <SimulationTab
        {...commonProps}
        selectedExercise={mooreExerciseScenarios[0]}
      />,
    );

    fireEvent.click(screen.getByTestId("automata-load-solution"));
    fireEvent.click(screen.getByTestId("automata-check-solution"));

    expect(simulatorSpies.mooreLoad).toHaveBeenCalledOnce();
    await waitFor(() =>
      expect(simulatorSpies.mooreCheck).toHaveBeenCalledOnce(),
    );
    expect(
      await screen.findByTestId("automata-solution-check-dialog"),
    ).toBeVisible();

    fireEvent.click(screen.getByTestId("automata-solution-check-dialog-close"));
    fireEvent.click(screen.getByTestId("simulation-reset"));

    expect(screen.queryByTestId("automata-solution-check-dialog")).toBeNull();
    expect(simulatorSpies.mooreReset).toHaveBeenCalledOnce();
    expect(simulatorSpies.mealyReset).not.toHaveBeenCalled();
  });

  it("uses the Mealy handle for a Mealy exercise", async () => {
    render(
      <SimulationTab
        {...commonProps}
        selectedExercise={mealyExerciseScenarios[0]}
      />,
    );

    fireEvent.click(screen.getByTestId("automata-load-solution"));
    fireEvent.click(screen.getByTestId("automata-check-solution"));
    fireEvent.click(screen.getByTestId("simulation-reset"));

    expect(simulatorSpies.mealyLoad).toHaveBeenCalledOnce();
    await waitFor(() =>
      expect(simulatorSpies.mealyCheck).toHaveBeenCalledOnce(),
    );
    expect(simulatorSpies.mealyReset).toHaveBeenCalledOnce();
    expect(
      await screen.findByTestId("automata-solution-check-dialog"),
    ).toBeVisible();
  });

  it("switches the free simulator and disables example storage", () => {
    const { rerender } = render(
      <SimulationTab {...commonProps} selectedExercise={null} />,
    );

    fireEvent.click(screen.getByTestId("moore-machine-tab-mealy"));
    fireEvent.click(screen.getByTestId("simulation-reset"));

    expect(screen.getByTestId("mock-mealy-simulator")).toHaveAttribute(
      "data-transfer-active",
      "true",
    );
    expect(simulatorSpies.mealyReset).toHaveBeenCalledOnce();

    rerender(
      <SimulationTab
        {...commonProps}
        selectedExercise={null}
        selectedItem={{
          id: MEALY_EXAMPLE_ID,
          kind: "example",
          title: "Mealy example",
          description: "Example machine",
        }}
      />,
    );

    expect(screen.getByTestId("mock-mealy-simulator")).toHaveAttribute(
      "data-example",
      "true",
    );
    expect(screen.getByTestId("mock-mealy-simulator")).toHaveAttribute(
      "data-storage-enabled",
      "false",
    );

    rerender(
      <SimulationTab
        {...commonProps}
        selectedExercise={null}
        selectedItem={{
          id: MOORE_EXAMPLE_ID,
          kind: "example",
          title: "Moore example",
          description: "Example machine",
        }}
      />,
    );
    expect(screen.getByTestId("mock-moore-simulator")).toHaveAttribute(
      "data-example",
      "true",
    );
  });
});
