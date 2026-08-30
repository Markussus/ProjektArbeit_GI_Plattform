/** @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OverviewTab } from "@/pages/Programming1/Java/components/OverviewTab";
import { ExamplesTab } from "@/pages/Programming1/Java/components/ExamplesTab";
import { ExercisesTab } from "@/pages/Programming1/Java/components/ExercisesTab";
import { JavaProgrammingPage } from "@/pages/Programming1/Java/JavaProgrammingPage";
import { Programming1Page } from "@/pages/Programming1/Programming1Page";
import { trainingCenterStorage } from "@/lib/trainingCenter";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock(
  "@/components/shared/TopicTutorialVideoSection/TopicTutorialVideoSection",
  () => ({
    TopicTutorialVideoSection: () => <div data-testid="mock-tutorial-video" />,
  }),
);

vi.mock("@/components/shared/ModuleOverviewPage/ModuleOverviewPage", () => ({
  ModuleOverviewPage: ({ moduleId }: { moduleId: string }) => (
    <div data-testid="mock-module-overview" data-module-id={moduleId} />
  ),
}));

vi.mock("@/components/shared/ModuleTopicPage/ModuleTopicPage", () => ({
  ModuleTopicPage: ({
    testId,
    titleKey,
  }: {
    testId?: string;
    titleKey?: string;
  }) => <div data-testid={testId} data-title-key={titleKey} />,
}));

describe("Java Tabs and Pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("OverviewTab", () => {
    it("renders tutorial video section", () => {
      render(<OverviewTab />);
      expect(screen.getByTestId("mock-tutorial-video")).toBeInTheDocument();
    });
  });

  describe("ExamplesTab", () => {
    it("renders examples list with example cards", () => {
      const onSelectExample = vi.fn();
      const onOpenExampleInSimulation = vi.fn();

      render(
        <ExamplesTab
          selectedExample={null}
          onSelectExample={onSelectExample}
          onOpenExampleInSimulation={onOpenExampleInSimulation}
        />,
      );

      expect(screen.getByTestId("java-examples-tab")).toBeInTheDocument();
      expect(screen.getByTestId("java-examples-list")).toBeInTheDocument();
    });
  });

  describe("ExercisesTab", () => {
    it("renders topic exercises tab and allows resetting all exercises", () => {
      const storageDeleteSpy = vi.spyOn(trainingCenterStorage, "delete");

      render(
        <ExercisesTab
          selectedExercise={null}
          onSelectExercise={vi.fn()}
          onOpenExerciseInSimulation={vi.fn()}
          completedExerciseIds={new Set()}
        />,
      );

      expect(screen.getByTestId("java-exercises-tab")).toBeInTheDocument();

      const resetButton = screen.getByTestId("java-reset-all-exercises");
      expect(resetButton).toBeInTheDocument();
      fireEvent.click(resetButton);

      // Click confirm button
      const confirmButton = screen.getByTestId(
        "java-reset-all-exercises-confirm",
      );
      fireEvent.click(confirmButton);

      expect(storageDeleteSpy).toHaveBeenCalled();
    });
  });

  describe("JavaProgrammingPage", () => {
    it("renders module topic page with java provider", () => {
      render(<JavaProgrammingPage />);
      expect(screen.getByTestId("java-topic-page")).toBeInTheDocument();
    });
  });

  describe("Programming1Page", () => {
    it("renders module overview page with programming-1 module id", () => {
      render(<Programming1Page />);
      expect(screen.getByTestId("mock-module-overview")).toHaveAttribute(
        "data-module-id",
        "programming-1",
      );
    });
  });
});
