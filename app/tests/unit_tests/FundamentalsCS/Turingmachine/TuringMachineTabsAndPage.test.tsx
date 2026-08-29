/** @vitest-environment jsdom */

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OverviewTab } from "@/pages/FundamentalsCS/TuringMachine/components/OverviewTab";
import { ExamplesTab } from "@/pages/FundamentalsCS/TuringMachine/components/ExamplesTab";
import { ExercisesTab } from "@/pages/FundamentalsCS/TuringMachine/components/ExercisesTab";
import { SimulationTab } from "@/pages/FundamentalsCS/TuringMachine/components/SimulationTab";
import { TuringMachinePage } from "@/pages/FundamentalsCS/TuringMachine/TuringMachinePage";
import { turingMachineExamples } from "@/pages/FundamentalsCS/TuringMachine/examples";
import { turingMachineExercises } from "@/pages/FundamentalsCS/TuringMachine/exercises";
import type { TopicItem } from "@/types/exercise";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock(
  "@/components/shared/TopicTutorialVideoSection/TopicTutorialVideoSection",
  () => ({
    TopicTutorialVideoSection: ({
      topicId,
      videoTitleKey,
    }: {
      topicId: string;
      videoTitleKey: string;
    }) => (
      <div data-testid="mock-tutorial-section">
        <span>{topicId}</span>
        <span>{videoTitleKey}</span>
      </div>
    ),
  }),
);

describe("TuringMachine Tabs and Page", () => {
  beforeEach(() => {
    global.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
    Element.prototype.scrollTo = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  describe("OverviewTab", () => {
    it("renders tutorial video section", () => {
      render(<OverviewTab />);
      expect(screen.getByTestId("mock-tutorial-section")).toBeInTheDocument();
      expect(screen.getByText("turing-machine")).toBeInTheDocument();
    });
  });

  describe("ExamplesTab", () => {
    it("renders example cards and handles select and open", () => {
      const onSelectExample = vi.fn();
      const onOpenExampleInSimulation = vi.fn();

      render(
        <ExamplesTab
          selectedExample={null}
          onSelectExample={onSelectExample}
          onOpenExampleInSimulation={onOpenExampleInSimulation}
        />,
      );

      expect(screen.getByTestId("tm-examples-tab")).toBeInTheDocument();
      expect(screen.getByTestId("tm-examples-list")).toBeInTheDocument();

      const firstExample = turingMachineExamples[0];
      const selectBtn = screen.getByTestId(
        `tm-example-card-${firstExample.titleKey}-select`,
      );
      expect(selectBtn).toBeInTheDocument();

      fireEvent.click(selectBtn);
      expect(onSelectExample).toHaveBeenCalled();
    });
  });

  describe("ExercisesTab", () => {
    it("renders exercise list and handles reset all", () => {
      render(
        <ExercisesTab
          selectedExercise={null}
          onSelectExercise={vi.fn()}
          onOpenExerciseInSimulation={vi.fn()}
        />,
      );

      expect(screen.getByTestId("tm-exercises-tab")).toBeInTheDocument();
      expect(screen.getByTestId("tm-reset-all-exercises")).toBeInTheDocument();
    });
  });

  describe("SimulationTab", () => {
    it("renders simulation tab in free mode", () => {
      render(
        <SimulationTab selectedItem={null} onClearSelectedItem={vi.fn()} />,
      );

      expect(screen.getByTestId("tm-simulator")).toBeInTheDocument();
    });

    it("renders simulation tab with exercise and triggers solution check", async () => {
      const exercise = turingMachineExercises[0];
      const selectedItem: TopicItem = {
        id: exercise.titleKey,
        titleKey: exercise.titleKey,
        descriptionKey: exercise.descriptionKey,
        title: "",
        description: "",
        icon: exercise.icon,
        kind: "exercise",
        difficulty: exercise.difficulty,
      };

      render(
        <SimulationTab
          selectedItem={selectedItem}
          onClearSelectedItem={vi.fn()}
        />,
      );

      expect(screen.getByTestId("tm-load-solution")).toBeInTheDocument();
      expect(screen.getByTestId("tm-check-solution")).toBeInTheDocument();

      // Click load solution
      fireEvent.click(screen.getByTestId("tm-load-solution"));

      // Click check solution
      await act(async () => {
        fireEvent.click(screen.getByTestId("tm-check-solution"));
      });

      expect(
        screen.getByTestId("tm-solution-check-dialog"),
      ).toBeInTheDocument();
    });
  });

  describe("TuringMachinePage", () => {
    it("renders page container with tabs inside router context", () => {
      render(
        <MemoryRouter>
          <TuringMachinePage />
        </MemoryRouter>,
      );
      expect(screen.getByTestId("tm-page")).toBeInTheDocument();
    });
  });
});
