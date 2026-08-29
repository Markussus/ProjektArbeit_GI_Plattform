/** @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import {
  SimulationTab,
  buildValidationTableRows,
} from "@/pages/Programming1/Java/components/SimulationTab";
import type { ModuleSimulationTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { TerminalSquare } from "lucide-react";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockLoadSolution = vi.fn();
const mockResetStoredState = vi.fn();
const mockCheckSolution = vi.fn();

vi.mock("@/pages/Programming1/Java/components/Simulator/JavaSimulator", () => {
  return {
    JavaSimulator: ({ ref }: any) => {
      // simulate exposing handle
      if (ref) {
        if (typeof ref === "function") {
          ref({
            loadSolution: mockLoadSolution,
            resetStoredState: mockResetStoredState,
            checkSolution: mockCheckSolution,
          });
        } else if ("current" in ref) {
          ref.current = {
            loadSolution: mockLoadSolution,
            resetStoredState: mockResetStoredState,
            checkSolution: mockCheckSolution,
          };
        }
      }
      return <div data-testid="mock-java-simulator-component" />;
    },
  };
});

describe("SimulationTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("buildValidationTableRows", () => {
    it("returns empty array when checkResult is null", () => {
      expect(buildValidationTableRows(null, (k) => k as string)).toEqual([]);
    });

    it("formats passed and failed validation rows properly", () => {
      const rows = buildValidationTableRows(
        {
          rows: [
            {
              id: "case-1",
              passed: true,
              output: "Hello\r\n",
              expectedOutput: "Hello\n",
              phase: "done",
            },
            {
              id: "case-2",
              passed: false,
              output: "",
              expectedOutput: "Expected",
              phase: "error",
            },
          ],
        },
        (k) => k as string,
      );

      expect(rows).toHaveLength(2);
      expect(rows[0]).toEqual([
        "java-programming.validation.pass",
        "case-1",
        "Hello",
        "Hello",
        "done",
      ]);
      expect(rows[1]).toEqual([
        "java-programming.validation.fail",
        "case-2",
        "java-programming.validation.emptyOutput",
        "Expected",
        "error",
      ]);
    });
  });

  describe("component rendering and interaction", () => {
    const exerciseItem = {
      id: "java-programming.exercise1",
      title: "Exercise 1",
      description: "Desc",
      difficulty: "easy" as const,
      icon: TerminalSquare,
    };

    const defaultProps: ModuleSimulationTabProps = {
      isFocused: false,
      selectedItem: exerciseItem,
      selectedExercise: exerciseItem,
      onSelectExercise: vi.fn(),
      completedExerciseIds: new Set(),
      items: [exerciseItem],
      activeTab: "simulation",
      onTabChange: vi.fn(),
    };

    it("renders header actions when an exercise is selected", () => {
      render(<SimulationTab {...defaultProps} />);

      expect(screen.getByTestId("java-load-solution")).toBeInTheDocument();
      expect(screen.getByTestId("java-check-solution")).toBeInTheDocument();
    });

    it("calls loadSolution when load-solution button is clicked", () => {
      render(<SimulationTab {...defaultProps} />);

      fireEvent.click(screen.getByTestId("java-load-solution"));
      expect(mockLoadSolution).toHaveBeenCalledTimes(1);
    });

    it("runs checkSolution and opens the dialog when check-solution button is clicked", async () => {
      mockCheckSolution.mockResolvedValueOnce({
        rows: [
          {
            id: "case-1",
            passed: true,
            output: "Output",
            expectedOutput: "Output",
            phase: "done",
          },
        ],
      });

      render(<SimulationTab {...defaultProps} />);

      await act(async () => {
        fireEvent.click(screen.getByTestId("java-check-solution"));
      });

      expect(mockCheckSolution).toHaveBeenCalledTimes(1);
      expect(
        screen.getByTestId("java-solution-check-dialog"),
      ).toBeInTheDocument();
    });
  });
});
