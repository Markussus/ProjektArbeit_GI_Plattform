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
import { OverviewTab } from "@/pages/FundamentalsCS/RegularLanguages/components/OverviewTab";
import { ExamplesTab } from "@/pages/FundamentalsCS/RegularLanguages/components/ExamplesTab";
import { ExercisesTab } from "@/pages/FundamentalsCS/RegularLanguages/components/ExercisesTab";
import { SimulationTab } from "@/pages/FundamentalsCS/RegularLanguages/components/SimulationTab";
import { RegularLanguagesPage } from "@/pages/FundamentalsCS/RegularLanguages/RegularLanguagesPage";
import { rlExamples } from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/config/rlExamples";
import { rlExercises } from "@/pages/FundamentalsCS/RegularLanguages/exercises/rlExerciseDefinitions";
import type { Exercise } from "@/types/exercise";

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

const grammarExercise = rlExercises.find(
  (e) => e.mode === "grammarToLanguage",
)!;
const languageExercise = rlExercises.find(
  (e) => e.mode === "languageToGrammar" && e.referenceGrammar,
)!;

/** The exercise as the page hands it to the simulation tab. */
function asSelected(definition: typeof grammarExercise): Exercise {
  return {
    id: definition.titleKey,
    titleKey: definition.titleKey,
    descriptionKey: definition.descriptionKey,
    title: "",
    description: "",
    icon: definition.icon,
    kind: "exercise",
    difficulty: definition.difficulty,
  };
}

const simulationTabProps = {
  selectedExercise: null,
  selectedItem: null,
  isFocused: false,
  onToggleFocus: vi.fn(),
};

afterEach(() => cleanup());

describe("RegularLanguages OverviewTab", () => {
  it("renders the tutorial video section for the topic", () => {
    render(<OverviewTab />);

    expect(screen.getByTestId("mock-tutorial-section")).toHaveTextContent(
      "regular-languages",
    );
  });
});

describe("RegularLanguages ExamplesTab", () => {
  it("groups the examples into their category sections", () => {
    render(
      <ExamplesTab
        selectedExample={null}
        onSelectExample={vi.fn()}
        onOpenExampleInSimulation={vi.fn()}
      />,
    );

    expect(screen.getByTestId("rl-examples-tab")).toBeInTheDocument();
    expect(
      screen.getByTestId("rl-examples-section-grammarToLanguage"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("rl-examples-section-languageToGrammar"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("rl-examples-section-recognizeWord"),
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
      screen.getByTestId(`rl-example-card-${rlExamples[0].id}-select`),
    );

    expect(onSelectExample).toHaveBeenCalledWith(
      expect.objectContaining({ id: rlExamples[0].titleKey, kind: "example" }),
    );
  });
});

describe("RegularLanguages ExercisesTab", () => {
  it("renders the exercise groups and the reset control", () => {
    render(
      <ExercisesTab
        selectedExercise={null}
        onSelectExercise={vi.fn()}
        onOpenExerciseInSimulation={vi.fn()}
      />,
    );

    expect(screen.getByTestId("rl-exercises-tab")).toBeInTheDocument();
    expect(screen.getByTestId("rl-reset-all-exercises")).toBeInTheDocument();
  });
});

describe("RegularLanguages SimulationTab", () => {
  it("renders free mode without exercise actions", () => {
    render(<SimulationTab {...simulationTabProps} />);

    expect(
      screen.getByTestId("rl-mode-tab-grammarToLanguage"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("rl-check-solution")).not.toBeInTheDocument();
  });

  it("offers load and check actions for a gradable exercise", () => {
    const selected = asSelected(grammarExercise);
    render(
      <SimulationTab
        {...simulationTabProps}
        selectedExercise={selected}
        selectedItem={selected}
      />,
    );

    expect(screen.getByTestId("rl-load-solution")).toBeInTheDocument();
    expect(screen.getByTestId("rl-check-solution")).toBeInTheDocument();
  });

  it("rejects an empty answer for a grammar exercise", async () => {
    const selected = asSelected(grammarExercise);
    render(
      <SimulationTab
        {...simulationTabProps}
        selectedExercise={selected}
        selectedItem={selected}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId("rl-check-solution"));
    });

    expect(screen.getByTestId("rl-solution-check-dialog")).toBeInTheDocument();
    expect(
      screen.getByText("regular-languages.exerciseWorkspace.checkEmpty"),
    ).toBeInTheDocument();
  });

  it("accepts the revealed solution of a grammar exercise", async () => {
    const selected = asSelected(grammarExercise);
    render(
      <SimulationTab
        {...simulationTabProps}
        selectedExercise={selected}
        selectedItem={selected}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId("rl-load-solution"));
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("rl-check-solution"));
    });

    expect(
      screen.getByText("regular-languages.exerciseWorkspace.checkMatch"),
    ).toBeInTheDocument();
  });

  it("accepts the revealed solution of a language exercise", async () => {
    const selected = asSelected(languageExercise);
    render(
      <SimulationTab
        {...simulationTabProps}
        selectedExercise={selected}
        selectedItem={selected}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId("rl-load-solution"));
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("rl-check-solution"));
    });

    expect(
      screen.getByText("regular-languages.exerciseWorkspace.checkMatch"),
    ).toBeInTheDocument();
  });
});

describe("RegularLanguagesPage", () => {
  it("renders the topic page inside router context", () => {
    render(
      <MemoryRouter>
        <RegularLanguagesPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("regular-languages.title")).toBeInTheDocument();
  });
});
