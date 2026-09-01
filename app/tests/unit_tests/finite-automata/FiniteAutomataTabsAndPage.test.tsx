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
import { OverviewTab } from "@/pages/FundamentalsCS/FiniteAutomata/components/OverviewTab";
import { ExamplesTab } from "@/pages/FundamentalsCS/FiniteAutomata/components/ExamplesTab";
import { ExercisesTab } from "@/pages/FundamentalsCS/FiniteAutomata/components/ExercisesTab";
import { SimulationTab } from "@/pages/FundamentalsCS/FiniteAutomata/components/SimulationTab";
import { FiniteAutomataPage } from "@/pages/FundamentalsCS/FiniteAutomata/FiniteAutomataPage";
import { faExamples } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/config/faExamples";
import { faExercises } from "@/pages/FundamentalsCS/FiniteAutomata/exercises/faExerciseDefinitions";
import type { Example, Exercise } from "@/types/exercise";
import type { TranslationKey } from "@/types/i18n";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock(
  "@/components/shared/TopicTutorialVideoSection/TopicTutorialVideoSection",
  () => ({
    TopicTutorialVideoSection: ({ topicId }: { topicId: string }) => (
      <div data-testid="mock-tutorial-section">{topicId}</div>
    ),
  }),
);

const firstExercise = faExercises[0];

/** The exercise as the page hands it to the simulation tab. */
const selectedExercise: Exercise = {
  id: firstExercise.titleKey,
  titleKey: firstExercise.titleKey,
  descriptionKey: firstExercise.descriptionKey,
  title: "",
  description: "",
  icon: firstExercise.icon,
  kind: "exercise",
  difficulty: firstExercise.difficulty,
};

const simulationTabProps = {
  selectedExercise: null,
  selectedItem: null,
  isFocused: false,
  onToggleFocus: vi.fn(),
};

afterEach(() => cleanup());

describe("FiniteAutomata OverviewTab", () => {
  it("renders the tutorial video section for the topic", () => {
    render(<OverviewTab />);

    expect(screen.getByTestId("mock-tutorial-section")).toHaveTextContent(
      "finite-automata",
    );
  });
});

describe("FiniteAutomata ExamplesTab", () => {
  it("groups the examples into their category sections", () => {
    render(
      <ExamplesTab
        selectedExample={null}
        onSelectExample={vi.fn()}
        onOpenExampleInSimulation={vi.fn()}
      />,
    );

    expect(screen.getByTestId("fa-examples-tab")).toBeInTheDocument();
    expect(screen.getByTestId("fa-examples-section-dfa")).toBeInTheDocument();
    expect(screen.getByTestId("fa-examples-section-nfa")).toBeInTheDocument();
    expect(
      screen.getByTestId("fa-examples-section-grammarToAutomaton"),
    ).toBeInTheDocument();
  });

  it("reports the picked example back to the page", () => {
    const onSelectExample = vi.fn();
    render(
      <ExamplesTab
        selectedExample={null}
        onSelectExample={onSelectExample}
        onOpenExampleInSimulation={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByTestId(`fa-example-card-${faExamples[0].id}-select`),
    );

    expect(onSelectExample).toHaveBeenCalledWith(
      expect.objectContaining({ id: faExamples[0].titleKey, kind: "example" }),
    );
  });

  it("opens an example in the simulation tab", () => {
    const example = faExamples[0];
    const onOpenExampleInSimulation = vi.fn();
    render(
      <ExamplesTab
        selectedExample={{
          id: example.titleKey as TranslationKey,
          titleKey: example.titleKey as TranslationKey,
          descriptionKey: example.descriptionKey as TranslationKey,
          title: "",
          description: "",
          icon: firstExercise.icon,
          kind: "example",
        }}
        onSelectExample={vi.fn()}
        onOpenExampleInSimulation={onOpenExampleInSimulation}
      />,
    );

    // The open action only exists on the expanded (selected) card.
    fireEvent.click(screen.getByTestId(`fa-example-card-${example.id}-open`));

    expect(onOpenExampleInSimulation).toHaveBeenCalledTimes(1);
  });
});

describe("FiniteAutomata ExercisesTab", () => {
  it("renders both exercise groups and the reset control", () => {
    render(
      <ExercisesTab
        selectedExercise={null}
        onSelectExercise={vi.fn()}
        onOpenExerciseInSimulation={vi.fn()}
      />,
    );

    expect(screen.getByTestId("fa-exercises-tab")).toBeInTheDocument();
    expect(screen.getByTestId("fa-reset-all-exercises")).toBeInTheDocument();
  });
});

describe("FiniteAutomata SimulationTab", () => {
  it("renders the free-mode simulator without exercise actions", () => {
    render(<SimulationTab {...simulationTabProps} />);

    expect(screen.getByTestId("fa-start-simulation")).toBeInTheDocument();
    expect(screen.queryByTestId("fa-check-solution")).not.toBeInTheDocument();
  });

  it("offers load and check actions once an exercise is open", () => {
    render(
      <SimulationTab
        {...simulationTabProps}
        selectedExercise={selectedExercise}
        selectedItem={selectedExercise}
      />,
    );

    expect(screen.getByTestId("fa-load-solution")).toBeInTheDocument();
    expect(screen.getByTestId("fa-check-solution")).toBeInTheDocument();
  });

  it("reports an untouched starter as not built yet", async () => {
    render(
      <SimulationTab
        {...simulationTabProps}
        selectedExercise={selectedExercise}
        selectedItem={selectedExercise}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId("fa-check-solution"));
    });

    expect(screen.getByTestId("fa-solution-check-dialog")).toBeInTheDocument();
    expect(
      screen.getByText("finite-automata.exerciseWorkspace.unbuiltTitle"),
    ).toBeInTheDocument();
  });

  it("passes the check after the reference solution is loaded", async () => {
    render(
      <SimulationTab
        {...simulationTabProps}
        selectedExercise={selectedExercise}
        selectedItem={selectedExercise}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId("fa-load-solution"));
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("fa-check-solution"));
    });

    expect(
      screen.getByText("finite-automata.exerciseWorkspace.passed"),
    ).toBeInTheDocument();
  });

  it("loads the automaton of a selected example", () => {
    const example = faExamples[0];
    const selectedItem: Example = {
      id: example.titleKey as TranslationKey,
      titleKey: example.titleKey as TranslationKey,
      descriptionKey: example.descriptionKey as TranslationKey,
      title: "",
      description: "",
      icon: firstExercise.icon,
      kind: "example",
    };

    render(
      <SimulationTab {...simulationTabProps} selectedItem={selectedItem} />,
    );

    // The example seeds its own input word into the editor.
    expect(screen.getByDisplayValue(example.inputWord)).toBeInTheDocument();
  });
});

describe("FiniteAutomataPage", () => {
  it("renders the topic page inside router context", () => {
    render(
      <MemoryRouter>
        <FiniteAutomataPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("finite-automata.topic.title")).toBeInTheDocument();
  });
});
