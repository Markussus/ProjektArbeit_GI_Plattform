/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EncoderSimulator } from "@/pages/FundamentalsCS/Encoding/simulator/EncoderSimulator";
import type { TopicItem } from "@/types/exercise";
import type {
  GeneratedExercise,
  EncodingExerciseType,
} from "@/pages/FundamentalsCS/Encoding/utils/exerciseGenerator";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) =>
      typeof fallback === "string" ? fallback : key,
  }),
}));

vi.mock(
  "../../../../src/pages/FundamentalsCS/Encoding/simulator/Base64Encoder",
  () => ({
    Base64Encoder: (props: Record<string, unknown>) => (
      <div data-testid="mock-base64-encoder">
        <div data-testid="mock-base64-is-exercise">
          {String(props.isExerciseMode)}
        </div>
        <div data-testid="mock-base64-show-solution">
          {String(props.showSolution)}
        </div>
        <div data-testid="mock-base64-initial-value">
          {String(props.initialValue)}
        </div>
        <div data-testid="mock-base64-initial-mode">
          {String(props.initialConverterMode)}
        </div>
        <button
          data-testid="mock-base64-show-solution-button"
          onClick={props.onShowSolution}
        >
          show solution
        </button>
        <button
          data-testid="mock-base64-exit-exercise-button"
          onClick={props.onExitExercise}
        >
          exit exercise
        </button>
      </div>
    ),
  }),
);

vi.mock(
  "../../../../src/pages/FundamentalsCS/Encoding/simulator/UTF8Encoder",
  () => ({
    UTF8Encoder: (props: Record<string, unknown>) => (
      <div data-testid="mock-utf8-encoder">
        <div data-testid="mock-utf8-is-exercise">
          {String(props.isExerciseMode)}
        </div>
        <div data-testid="mock-utf8-initial-value">
          {String(props.initialValue)}
        </div>
        <div data-testid="mock-utf8-initial-mode">
          {String(props.initialConverterMode)}
        </div>
        <button
          data-testid="mock-utf8-exit-exercise-button"
          onClick={props.onExitExercise}
        >
          exit exercise
        </button>
      </div>
    ),
  }),
);

vi.mock("@/components/shared/ConfirmDialog/ConfirmDialog", () => ({
  ConfirmDialog: (props: {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
  }) =>
    props.isOpen ? (
      <div data-testid="mock-confirm-dialog">
        <button data-testid="mock-confirm" onClick={props.onConfirm}>
          confirm
        </button>
        <button data-testid="mock-cancel" onClick={props.onCancel}>
          cancel
        </button>
      </div>
    ) : null,
}));

function createGeneratedExercise(
  mode: "base64" | "utf8",
  converterMode: "encode" | "decode",
  initialValue: string,
): TopicItem {
  return {
    id: `encoding.ex_generated_${mode}_${converterMode}`,
    titleKey: "some_title",
    descriptionKey: "some_desc",
    difficulty: "easy",
    icon: { name: "FileText" } as never,
    exerciseType: `${mode}_${converterMode}_easy` as EncodingExerciseType,
    mode,
    converterMode,
    initialValue,
    answer: "some_answer",
  } as unknown as GeneratedExercise;
}

function createExample(id: string): TopicItem {
  return {
    id,
    titleKey: "some_title",
    descriptionKey: "some_desc",
    difficulty: "easy",
    icon: { name: "FileText" } as never,
  };
}

describe("EncoderSimulator", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when no exercise is selected", () => {
    it("renders the base64 encoder by default", () => {
      render(<EncoderSimulator />);
      expect(screen.getByTestId("mock-base64-encoder")).toBeTruthy();
    });

    it("shows both mode tabs", () => {
      render(<EncoderSimulator />);
      expect(screen.getByTestId("encoding-tab-base64")).toBeTruthy();
      expect(screen.getByTestId("encoding-tab-utf8")).toBeTruthy();
    });
  });

  describe("when switching between mode tabs", () => {
    it("switches to utf8 encoder when utf8 tab is clicked", () => {
      render(<EncoderSimulator />);
      fireEvent.click(screen.getByTestId("encoding-tab-utf8"));
      expect(screen.getByTestId("mock-utf8-encoder")).toBeTruthy();
    });

    it("switches back to base64 encoder when base64 tab is clicked", () => {
      render(<EncoderSimulator />);
      fireEvent.click(screen.getByTestId("encoding-tab-utf8"));
      fireEvent.click(screen.getByTestId("encoding-tab-base64"));
      expect(screen.getByTestId("mock-base64-encoder")).toBeTruthy();
    });
  });

  describe("when an exercise is selected", () => {
    it("maps generated base64 exercise to base64 mode", () => {
      render(
        <EncoderSimulator
          selectedExercise={createGeneratedExercise(
            "base64",
            "decode",
            "SGVsbG8=",
          )}
        />,
      );

      expect(screen.getByTestId("mock-base64-encoder")).toBeTruthy();
      expect(
        screen.getByTestId("mock-base64-initial-mode").textContent,
      ).toContain("decode");
      expect(
        screen.getByTestId("mock-base64-initial-value").textContent,
      ).toContain("SGVsbG8=");
      expect(
        screen.getByTestId("mock-base64-is-exercise").textContent,
      ).toContain("true");
    });

    it("maps generated utf8 exercise to utf8 mode", () => {
      render(
        <EncoderSimulator
          selectedExercise={createGeneratedExercise("utf8", "encode", "A")}
        />,
      );

      expect(screen.getByTestId("mock-utf8-encoder")).toBeTruthy();
      expect(
        screen.getByTestId("mock-utf8-initial-mode").textContent,
      ).toContain("encode");
      expect(
        screen.getByTestId("mock-utf8-initial-value").textContent,
      ).toContain("A");
      expect(screen.getByTestId("mock-utf8-is-exercise").textContent).toContain(
        "true",
      );
    });
  });

  describe("when an example is selected", () => {
    it("sets showSolution to true and mode to base64 for example_base64_1", () => {
      render(
        <EncoderSimulator
          selectedExercise={createExample("encoding.example_base64_1")}
        />,
      );

      expect(screen.getByTestId("mock-base64-encoder")).toBeTruthy();
      expect(
        screen.getByTestId("mock-base64-show-solution").textContent,
      ).toContain("true");
      expect(
        screen.getByTestId("mock-base64-is-exercise").textContent,
      ).toContain("false");
    });
  });

  describe("when in exercise mode without solution shown", () => {
    it("shows confirm dialog when switching tabs", () => {
      const onExitExercise = vi.fn();
      render(
        <EncoderSimulator
          selectedExercise={createGeneratedExercise(
            "base64",
            "encode",
            "Hello",
          )}
          onExitExercise={onExitExercise}
        />,
      );

      fireEvent.click(screen.getByTestId("encoding-tab-utf8"));
      expect(screen.getByTestId("mock-confirm-dialog")).toBeTruthy();
    });

    it("exits exercise and switches tab on confirm", () => {
      const onExitExercise = vi.fn();
      render(
        <EncoderSimulator
          selectedExercise={createGeneratedExercise(
            "base64",
            "encode",
            "Hello",
          )}
          onExitExercise={onExitExercise}
        />,
      );

      fireEvent.click(screen.getByTestId("encoding-tab-utf8"));
      fireEvent.click(screen.getByTestId("mock-confirm"));

      expect(onExitExercise).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("mock-utf8-encoder")).toBeTruthy();
    });

    it("stays on current tab when cancel is clicked", () => {
      const onExitExercise = vi.fn();
      render(
        <EncoderSimulator
          selectedExercise={createGeneratedExercise(
            "base64",
            "encode",
            "Hello",
          )}
          onExitExercise={onExitExercise}
        />,
      );

      fireEvent.click(screen.getByTestId("encoding-tab-utf8"));
      fireEvent.click(screen.getByTestId("mock-cancel"));

      expect(onExitExercise).not.toHaveBeenCalled();
      expect(screen.getByTestId("mock-base64-encoder")).toBeTruthy();
    });
  });

  describe("when exiting exercise mode", () => {
    it("calls onExitExercise callback", () => {
      const onExitExercise = vi.fn();
      render(
        <EncoderSimulator
          selectedExercise={createGeneratedExercise(
            "base64",
            "encode",
            "Hello",
          )}
          onExitExercise={onExitExercise}
        />,
      );

      fireEvent.click(screen.getByTestId("mock-base64-exit-exercise-button"));

      expect(onExitExercise).toHaveBeenCalledTimes(1);
    });
  });
});
