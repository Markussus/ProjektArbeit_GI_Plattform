/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ExercisesTab } from "@/pages/FundamentalsCS/FiniteAutomata/components/ExercisesTab";
import { FAConfigView } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/presentation/FAConfigView";
import { FATransitionTableEditor } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/presentation/FATransitionTableEditor";
import { useFAConfigEditor } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/application/useFAConfigEditor";
import { defaultDFAProgram } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/config/defaultFAProgram";
import {
  allFAExercises,
  faExercises,
} from "@/pages/FundamentalsCS/FiniteAutomata/exercises/faExerciseDefinitions";
import { TOPIC_STORAGE_IDS } from "@/data/topicStorageIds";
import {
  SIMULATOR_TASK_STORAGE_ID,
  createTrainingCenterIdentifier,
  trainingCenterStorage,
} from "@/lib/trainingCenter";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: unknown) =>
      typeof fallback === "string" ? fallback : key,
  }),
}));

afterEach(() => cleanup());

describe("FiniteAutomata ExercisesTab — handlers", () => {
  it("forwards an opened exercise to the page", () => {
    const first = faExercises[0];
    const onOpenExerciseInSimulation = vi.fn();
    render(
      <ExercisesTab
        // Cards keep a stable id from their translation key, and only the
        // selected card exposes its "open in simulation" action.
        selectedExercise={{
          id: first.titleKey,
          titleKey: first.titleKey,
          descriptionKey: first.descriptionKey,
          title: "",
          description: "",
          icon: first.icon,
          kind: "exercise",
          difficulty: first.difficulty,
        }}
        onSelectExercise={vi.fn()}
        onOpenExerciseInSimulation={onOpenExerciseInSimulation}
      />,
    );

    fireEvent.click(screen.getByTestId(`exercise-card-${first.titleKey}-open`));

    expect(onOpenExerciseInSimulation).toHaveBeenCalledWith(
      expect.objectContaining({ id: first.titleKey, kind: "exercise" }),
    );
  });

  it("deletes every exercise's stored draft when all exercises are reset", () => {
    const remove = vi.spyOn(trainingCenterStorage, "delete");
    render(
      <ExercisesTab
        selectedExercise={null}
        onSelectExercise={vi.fn()}
        onOpenExerciseInSimulation={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId("fa-reset-all-exercises"));
    // The control asks for confirmation before it deletes anything.
    fireEvent.click(screen.getByTestId("fa-reset-all-exercises-confirm"));

    expect(remove).toHaveBeenCalledTimes(allFAExercises.length);
    for (const exercise of allFAExercises) {
      expect(remove).toHaveBeenCalledWith(
        createTrainingCenterIdentifier(
          TOPIC_STORAGE_IDS.finiteAutomata,
          exercise.storageId,
        ),
      );
    }
    remove.mockRestore();
  });

  it("leaves the free simulator's own draft alone", () => {
    const remove = vi.spyOn(trainingCenterStorage, "delete");
    render(
      <ExercisesTab
        selectedExercise={null}
        onSelectExercise={vi.fn()}
        onOpenExerciseInSimulation={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId("fa-reset-all-exercises"));
    fireEvent.click(screen.getByTestId("fa-reset-all-exercises-confirm"));

    expect(remove).not.toHaveBeenCalledWith(
      createTrainingCenterIdentifier(
        TOPIC_STORAGE_IDS.finiteAutomata,
        SIMULATOR_TASK_STORAGE_ID,
      ),
    );
    remove.mockRestore();
  });
});

/** Renders the config view over a live editor so its controls really work. */
function ConfigHarness() {
  const editor = useFAConfigEditor(structuredClone(defaultDFAProgram));
  return <FAConfigView editor={editor} />;
}

describe("FAConfigView — dropdown handlers", () => {
  beforeEach(() => {
    render(<ConfigHarness />);
  });

  it("switches the automaton type through the dropdown", () => {
    fireEvent.click(screen.getByTestId("fa-type-select"));
    fireEvent.click(screen.getByTestId("fa-type-option-NFA"));

    expect(screen.getByTestId("fa-type-select")).toHaveTextContent("NFA");
  });

  it("switches the start state through the dropdown", () => {
    fireEvent.click(screen.getByTestId("fa-start-state-select"));
    fireEvent.click(screen.getByTestId("fa-start-state-option-S1"));

    expect(screen.getByTestId("fa-start-state-select")).toHaveTextContent("S1");
  });
});

describe("FATransitionTableEditor — state controls", () => {
  it("reports the cell being edited as it is typed", () => {
    const onTransitionChange = vi.fn();
    render(
      <FATransitionTableEditor
        program={defaultDFAProgram}
        onTransitionChange={onTransitionChange}
      />,
    );

    const cell = screen.getByLabelText("δ(S0, a)");
    fireEvent.change(cell, { target: { value: "S2" } });

    expect(onTransitionChange).toHaveBeenCalledWith("S0", "a", "S2");
    expect(cell).toHaveValue("S2");
  });

  it("drops the local draft again on blur", () => {
    render(
      <FATransitionTableEditor
        program={defaultDFAProgram}
        onTransitionChange={vi.fn()}
      />,
    );

    const cell = screen.getByLabelText("δ(S0, a)");
    fireEvent.change(cell, { target: { value: "S2" } });
    fireEvent.blur(cell);

    // Back to the committed program, which still routes S0 --a--> S1.
    expect(cell).toHaveValue("S1");
  });

  it("adds a state when the add control is used", () => {
    const onAddState = vi.fn();
    render(
      <FATransitionTableEditor
        program={defaultDFAProgram}
        onTransitionChange={vi.fn()}
        onAddState={onAddState}
      />,
    );

    fireEvent.click(screen.getByTitle("Add state"));

    expect(onAddState).toHaveBeenCalledTimes(1);
  });

  it("removes the state its header button belongs to", () => {
    const onRemoveState = vi.fn();
    render(
      <FATransitionTableEditor
        program={defaultDFAProgram}
        onTransitionChange={vi.fn()}
        onRemoveState={onRemoveState}
      />,
    );

    fireEvent.click(
      screen.getAllByTitle("finite-automata.config.removeState")[1],
    );

    expect(onRemoveState).toHaveBeenCalledWith("S1");
  });

  it("hides the remove controls while only one state is left", () => {
    render(
      <FATransitionTableEditor
        program={{ ...defaultDFAProgram, states: ["S0"] }}
        onTransitionChange={vi.fn()}
        onRemoveState={vi.fn()}
      />,
    );

    expect(
      screen.queryAllByTitle("finite-automata.config.removeState"),
    ).toHaveLength(0);
  });

  it("offers an epsilon row for an NFA on request", () => {
    render(
      <FATransitionTableEditor
        program={{ ...defaultDFAProgram, type: "NFA" }}
        onTransitionChange={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText("δ(S0, ε)")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("fa-add-epsilon-transitions"));
    expect(screen.getByLabelText("δ(S0, ε)")).toBeInTheDocument();
  });
});
