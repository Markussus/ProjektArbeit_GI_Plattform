/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EncoderSimulator } from "@/pages/FundamentalsCS/Encoding/simulator/EncoderSimulator";
import type { Exercise, TopicItem } from "@/types/exercise";
import { FileText } from "lucide-react";
import type {
  GeneratedExercise,
  EncodingExerciseType,
} from "@/pages/FundamentalsCS/Encoding/utils/exerciseGenerator";
import type { MouseEventHandler } from "react";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) =>
      typeof fallback === "string" ? fallback : key,
  }),
}));

interface MockBase64Props {
  isExerciseMode?: boolean;
  showSolution?: boolean;
  initialValue?: string;
  initialConverterMode?: string;
  onShowSolution?: () => void;
  onExitExercise?: () => void;
}

interface MockUtf8Props {
  isExerciseMode?: boolean;
  initialValue?: string;
  initialConverterMode?: string;
  onExitExercise?: () => void;
}

vi.mock(
  "../../../../src/pages/FundamentalsCS/Encoding/simulator/Base64Encoder",
  () => ({
    Base64Encoder: (props: MockBase64Props) => (
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
          onClick={props.onShowSolution as MouseEventHandler<HTMLButtonElement>}
        >
          show solution
        </button>
        <button
          data-testid="mock-base64-exit-exercise-button"
          onClick={props.onExitExercise as MouseEventHandler<HTMLButtonElement>}
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
    UTF8Encoder: (props: MockUtf8Props) => (
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
          onClick={props.onExitExercise as MouseEventHandler<HTMLButtonElement>}
        >
          exit exercise
        </button>
      </div>
    ),
  }),
);

const mockIcon = FileText;

function createGeneratedExercise(
  mode: "base64" | "utf8",
  converterMode: "encode" | "decode",
  initialValue: string,
): GeneratedExercise & Exercise {
  return {
    id: `encoding.ex_generated_${mode}_${converterMode}` as never,
    titleKey: "encoding.ex_base64_encode_easy",
    descriptionKey: "encoding.ex_base64_encode_easy_desc",
    title: "Generated exercise title",
    description: "Generated exercise description",
    difficulty: "easy",
    icon: mockIcon,
    kind: "exercise",
    exerciseType: `${mode}_${converterMode}_easy` as EncodingExerciseType,
    mode,
    converterMode,
    initialValue,
    answer: "some_answer",
  };
}

function createExample(id: string): TopicItem {
  return {
    id: id as never,
    titleKey: "encoding.ex_base64_encode_easy",
    descriptionKey: "encoding.ex_base64_encode_easy_desc",
    title: "Example title",
    description: "Example description",
    difficulty: "easy",
    icon: mockIcon,
    kind: "exercise",
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
    it("exits exercise and switches tab immediately", () => {
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

      expect(onExitExercise).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("mock-utf8-encoder")).toBeTruthy();
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
