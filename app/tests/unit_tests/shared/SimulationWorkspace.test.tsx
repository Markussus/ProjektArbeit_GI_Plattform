// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SimulationWorkspace } from "@/components/shared/SimulationWorkspace/SimulationWorkspace";
import type { Exercise, TopicItem } from "@/types/exercise";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: unknown) => {
      if (key === "common.simulation.selectedExercise")
        return "Ausgewählte Übung";
      if (key === "common.simulation.selectedExample")
        return "Ausgewähltes Beispiel";
      if (key === "common.simulation.close") return "Schließen";
      if (key === "common.simulation.expand") return "Simulation vergrößern";
      if (key === "common.simulation.exitFocus")
        return "Simulationsfokus verlassen";
      if (key === "common.trainingCenter.resetCurrent") return "Zurücksetzen";
      if (typeof options === "string") return options;
      if (options && typeof options === "object" && "count" in options) {
        return `${key} (${(options as { count: number }).count})`;
      }
      return key;
    },
  }),
}));

describe("SimulationWorkspace", () => {
  const mockExercise: Exercise = {
    id: "exercise-1",
    title: "Aufgabe 1: DFA erstellen",
    description: "Erstelle einen DFA für Sprache L.",
    difficulty: "medium",
  };

  const mockExample: TopicItem = {
    id: "example-1",
    title: "Beispiel 1: Moore Automat",
    description: "Ein Moore Automat für 101.",
    kind: "example",
  };

  it("renders active exercise with actions and close button inline without overlaying", () => {
    const onCloseItem = vi.fn();
    const onToggleFocus = vi.fn();

    render(
      <SimulationWorkspace
        selectedExercise={mockExercise}
        selectedItemActions={
          <>
            <button data-testid="load-solution-btn">Lösung laden</button>
            <button data-testid="check-solution-btn">Lösung prüfen</button>
          </>
        }
        emptyStateText="Kein Simulator geladen"
        isFocused={false}
        onToggleFocus={onToggleFocus}
        onCloseItem={onCloseItem}
      >
        <div data-testid="simulator-canvas">Canvas</div>
      </SimulationWorkspace>,
    );

    const banner = screen.getByTestId("simulation-selected-exercise");
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveAttribute("data-item-id", "exercise-1");

    expect(screen.getByText("Ausgewählte Übung")).toBeInTheDocument();
    expect(screen.getByText("Aufgabe 1: DFA erstellen")).toBeInTheDocument();
    expect(
      screen.getByText("Erstelle einen DFA für Sprache L."),
    ).toBeInTheDocument();

    const actionsContainer = screen.getByTestId(
      "simulation-selected-item-actions",
    );
    expect(actionsContainer).toBeInTheDocument();
    expect(screen.getByTestId("load-solution-btn")).toBeInTheDocument();
    expect(screen.getByTestId("check-solution-btn")).toBeInTheDocument();

    const closeBtn = screen.getByTestId("simulation-close-exercise");
    expect(closeBtn).toBeInTheDocument();
    expect(closeBtn).toHaveAttribute("aria-label", "Schließen");
    expect(closeBtn).not.toHaveClass("absolute");

    fireEvent.click(closeBtn);
    expect(onCloseItem).toHaveBeenCalledTimes(1);
  });

  it("renders active example with example label and close button", () => {
    const onCloseItem = vi.fn();
    const onToggleFocus = vi.fn();

    render(
      <SimulationWorkspace
        selectedExercise={null}
        selectedItem={mockExample}
        emptyStateText="Kein Simulator geladen"
        isFocused={false}
        onToggleFocus={onToggleFocus}
        onCloseItem={onCloseItem}
      >
        <div data-testid="simulator-canvas">Canvas</div>
      </SimulationWorkspace>,
    );

    expect(screen.getByText("Ausgewähltes Beispiel")).toBeInTheDocument();
    expect(screen.getByText("Beispiel 1: Moore Automat")).toBeInTheDocument();
    expect(screen.getByText("Ein Moore Automat für 101.")).toBeInTheDocument();

    const closeBtn = screen.getByTestId("simulation-close-exercise");
    expect(closeBtn).toBeInTheDocument();
    fireEvent.click(closeBtn);
    expect(onCloseItem).toHaveBeenCalledTimes(1);
  });

  it("handles reset and focus toggle controls without absolute overlay", () => {
    const onReset = vi.fn();
    const onToggleFocus = vi.fn();

    const { rerender } = render(
      <SimulationWorkspace
        selectedExercise={null}
        emptyStateText="Kein Simulator geladen"
        isFocused={false}
        onToggleFocus={onToggleFocus}
        onReset={onReset}
      />,
    );

    const controlsContainer = screen.getByTestId(
      "simulation-workspace-controls",
    );
    expect(controlsContainer).toBeInTheDocument();
    expect(controlsContainer).not.toHaveClass("absolute");

    const resetBtn = screen.getByTestId("simulation-reset");
    expect(resetBtn).toBeInTheDocument();
    fireEvent.click(resetBtn);
    expect(onReset).toHaveBeenCalledTimes(1);

    const focusBtn = screen.getByTestId("simulation-focus-toggle");
    expect(focusBtn).toHaveAttribute("aria-label", "Simulation vergrößern");
    fireEvent.click(focusBtn);
    expect(onToggleFocus).toHaveBeenCalledTimes(1);

    rerender(
      <SimulationWorkspace
        selectedExercise={null}
        emptyStateText="Kein Simulator geladen"
        isFocused={true}
        onToggleFocus={onToggleFocus}
        onReset={onReset}
      />,
    );

    const activeFocusBtn = screen.getByTestId("simulation-focus-toggle");
    expect(activeFocusBtn).toHaveAttribute(
      "aria-label",
      "Simulationsfokus verlassen",
    );
  });

  it("renders translated titleKey and descriptionKey when present", () => {
    const i18nExercise: Exercise = {
      id: "exercise-i18n",
      titleKey: "finite-automata.exercises.ex1.title" as never,
      descriptionKey: "finite-automata.exercises.ex1.desc" as never,
      difficulty: "easy",
    };

    render(
      <SimulationWorkspace
        selectedExercise={i18nExercise}
        emptyStateText="Kein Simulator"
        isFocused={false}
        onToggleFocus={vi.fn()}
      />,
    );

    expect(
      screen.getByText("finite-automata.exercises.ex1.title"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("finite-automata.exercises.ex1.desc"),
    ).toBeInTheDocument();
  });
});
