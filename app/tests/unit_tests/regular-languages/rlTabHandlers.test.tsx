/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ExamplesTab } from "@/pages/FundamentalsCS/RegularLanguages/components/ExamplesTab";
import { ExercisesTab } from "@/pages/FundamentalsCS/RegularLanguages/components/ExercisesTab";
import { RLGrammarEnumerationExercise } from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/presentation/RLGrammarEnumerationExercise";
import { RLLanguageToGrammar } from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/presentation/RLLanguageToGrammar";
import { rlExamples } from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/config/rlExamples";
import { rlExercises } from "@/pages/FundamentalsCS/RegularLanguages/exercises/rlExerciseDefinitions";
import { RL_STORAGE_TASK_IDS } from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/useRLPersistedSource";
import { TOPIC_STORAGE_IDS } from "@/data/topicStorageIds";
import {
  createTrainingCenterIdentifier,
  trainingCenterStorage,
} from "@/lib/trainingCenter";
import type { Example } from "@/types/exercise";
import type { TranslationKey } from "@/types/i18n";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: unknown) =>
      typeof fallback === "string" ? fallback : key,
  }),
}));

const grammarExercise = rlExercises.find(
  (e) => e.mode === "grammarToLanguage",
)!;

afterEach(() => cleanup());

describe("RegularLanguages ExamplesTab — handlers", () => {
  function asSelected(example: (typeof rlExamples)[number]): Example {
    return {
      id: example.titleKey as TranslationKey,
      titleKey: example.titleKey as TranslationKey,
      descriptionKey: example.descriptionKey as TranslationKey,
      title: "",
      description: "",
      icon: example.icon,
      kind: "example",
    };
  }

  it("opens the selected example in the simulation tab", () => {
    const example = rlExamples[0];
    const onOpenExampleInSimulation = vi.fn();
    render(
      <ExamplesTab
        selectedExample={asSelected(example)}
        onSelectExample={vi.fn()}
        onOpenExampleInSimulation={onOpenExampleInSimulation}
      />,
    );

    fireEvent.click(screen.getByTestId(`rl-example-card-${example.id}-open`));

    expect(onOpenExampleInSimulation).toHaveBeenCalledWith(
      expect.objectContaining({ id: example.titleKey, kind: "example" }),
    );
  });

  it("marks the selected card as selected", () => {
    const example = rlExamples[0];
    render(
      <ExamplesTab
        selectedExample={asSelected(example)}
        onSelectExample={vi.fn()}
        onOpenExampleInSimulation={vi.fn()}
      />,
    );

    expect(screen.getByTestId(`rl-example-card-${example.id}`)).toHaveAttribute(
      "data-selected",
      "true",
    );
  });
});

describe("RegularLanguages ExercisesTab — handlers", () => {
  it("forwards an opened exercise to the page", () => {
    const onOpenExerciseInSimulation = vi.fn();
    render(
      <ExercisesTab
        selectedExercise={{
          id: grammarExercise.titleKey,
          titleKey: grammarExercise.titleKey,
          descriptionKey: grammarExercise.descriptionKey,
          title: "",
          description: "",
          icon: grammarExercise.icon,
          kind: "exercise",
          difficulty: grammarExercise.difficulty,
        }}
        onSelectExercise={vi.fn()}
        onOpenExerciseInSimulation={onOpenExerciseInSimulation}
      />,
    );

    fireEvent.click(
      screen.getByTestId(`exercise-card-${grammarExercise.titleKey}-open`),
    );

    expect(onOpenExerciseInSimulation).toHaveBeenCalledWith(
      expect.objectContaining({ id: grammarExercise.titleKey }),
    );
  });

  it("clears every exercise's stored draft on reset", () => {
    const remove = vi.spyOn(trainingCenterStorage, "delete");
    render(
      <ExercisesTab
        selectedExercise={null}
        onSelectExercise={vi.fn()}
        onOpenExerciseInSimulation={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId("rl-reset-all-exercises"));
    fireEvent.click(screen.getByTestId("rl-reset-all-exercises-confirm"));

    expect(remove).toHaveBeenCalledTimes(rlExercises.length);
    for (const exercise of rlExercises) {
      expect(remove).toHaveBeenCalledWith(
        createTrainingCenterIdentifier(
          TOPIC_STORAGE_IDS.regularLanguages,
          exercise.storageId,
        ),
      );
    }
    remove.mockRestore();
  });

  it("leaves the free simulator's three mode drafts alone", () => {
    const remove = vi.spyOn(trainingCenterStorage, "delete");
    render(
      <ExercisesTab
        selectedExercise={null}
        onSelectExercise={vi.fn()}
        onOpenExerciseInSimulation={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId("rl-reset-all-exercises"));
    fireEvent.click(screen.getByTestId("rl-reset-all-exercises-confirm"));

    for (const taskStorageId of Object.values(RL_STORAGE_TASK_IDS)) {
      expect(remove).not.toHaveBeenCalledWith(
        createTrainingCenterIdentifier(
          TOPIC_STORAGE_IDS.regularLanguages,
          taskStorageId,
        ),
      );
    }
    remove.mockRestore();
  });
});

describe("RLGrammarEnumerationExercise", () => {
  it("shows the given grammar and reports what the learner types", () => {
    const onChange = vi.fn();
    const { container } = render(
      <RLGrammarEnumerationExercise
        exercise={grammarExercise}
        value=""
        onChange={onChange}
      />,
    );

    fireEvent.change(screen.getByTestId("rl-g2l-enumeration-input"), {
      target: { value: "ab, aab" },
    });

    expect(onChange).toHaveBeenCalledWith("ab, aab");
    // The panel shows the seeded grammar, newlines intact, for the learner to
    // enumerate.
    expect(container.querySelector("pre")?.textContent).toBe(
      grammarExercise.seed.grammarSource,
    );
  });

  it("falls back to a dash when the exercise seeds no grammar", () => {
    render(
      <RLGrammarEnumerationExercise
        exercise={{ ...grammarExercise, seed: {} }}
        value=""
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText("—")).toBeInTheDocument();
  });
});

describe("RLLanguageToGrammar — remaining controls", () => {
  it("reports what the learner types into the language field", () => {
    render(<RLLanguageToGrammar />);

    const field = screen.getByTestId("rl-language-to-grammar-source");
    fireEvent.change(field, { target: { value: 'L = {"ab"}' } });

    expect(field).toHaveValue('L = {"ab"}');
  });

  it("opens the supported-formats panel", () => {
    const { container } = render(<RLLanguageToGrammar />);

    const details = container.querySelector("details")!;
    expect(details.open).toBe(false);

    fireEvent.click(details.querySelector("summary")!);

    expect(screen.getByText(/L = \{a\^n c b\^m/)).toBeInTheDocument();
  });

  it("simplifies a set-builder grammar when asked", () => {
    render(<RLLanguageToGrammar initialSource="L = {a^n c b^m | n, m > 0}" />);

    fireEvent.click(screen.getByTestId("rl-grammar-mode-simplified"));

    expect(screen.getByTestId("rl-grammar-mode-simplified")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByTestId("rl-grammar-mode-detailed")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
});
