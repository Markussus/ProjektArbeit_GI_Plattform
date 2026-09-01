/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Base64Encoder } from "@/pages/FundamentalsCS/Encoding/simulator/Base64Encoder.tsx";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) =>
      typeof fallback === "string" ? fallback : key,
  }),
}));

vi.mock("@/components/shared/SimulatorShared", async () => {
  const { mockSimulatorShared } =
    await import("../../shared/simulatorSharedMock");
  return mockSimulatorShared({ includeModeToggle: true });
});

vi.mock(
  "@/components/shared/ExerciseValidationPanel/ExerciseValidationPanel",
  () => ({
    ExerciseValidationPanel: ({
      expectedResult,
      inputMode,
      onShowSolution,
      onExitExercise,
    }: {
      expectedResult: string | string[];
      inputMode: string;
      onShowSolution: () => void;
      onExitExercise: () => void;
    }) => (
      <div data-testid="mock-validation-panel">
        <span data-testid="mock-validation-expected-result">
          {Array.isArray(expectedResult)
            ? expectedResult.join(",")
            : expectedResult}
        </span>
        <span data-testid="mock-validation-input-mode">{inputMode}</span>
        <button
          data-testid="mock-validation-show-solution"
          onClick={onShowSolution}
        >
          show solution
        </button>
        <button data-testid="mock-validation-exit" onClick={onExitExercise}>
          exit
        </button>
      </div>
    ),
  }),
);

function getInput(): HTMLInputElement {
  return screen.getByTestId("base64-input") as HTMLInputElement;
}

describe("Base64Encoder", () => {
  afterEach(() => {
    cleanup();
  });

  describe("encode mode", () => {
    it("encodes a simple string without padding", () => {
      render(<Base64Encoder />);
      fireEvent.change(getInput(), { target: { value: "abc" } });
      expect(screen.getByTestId("base64-result").textContent).toBe("YWJj");
    });

    it("adds two padding characters for a single-char input", () => {
      render(<Base64Encoder />);
      fireEvent.change(getInput(), { target: { value: "A" } });
      expect(screen.getByTestId("base64-result").textContent).toBe("QQ==");
    });

    it("adds one padding character for a two-char input", () => {
      render(<Base64Encoder />);
      fireEvent.change(getInput(), { target: { value: "AB" } });
      expect(screen.getByTestId("base64-result").textContent).toBe("QUI=");
    });

    it("encodes a longer string correctly", () => {
      render(<Base64Encoder />);
      fireEvent.change(getInput(), { target: { value: "Hello" } });
      expect(screen.getByTestId("base64-result").textContent).toBe("SGVsbG8=");
    });

    it("reports state changes via onChangeState", () => {
      const onChangeState = vi.fn();
      render(<Base64Encoder onChangeState={onChangeState} />);
      fireEvent.change(getInput(), { target: { value: "Hello" } });
      expect(onChangeState).toHaveBeenLastCalledWith({
        converterMode: "encode",
        inputValue: "Hello",
      });
    });

    it("renders char-to-ascii steps for each character", () => {
      render(<Base64Encoder />);
      fireEvent.change(getInput(), { target: { value: "A" } });
      expect(screen.getByText(/'A' → 65 \(41\) → 01000001/)).toBeTruthy();
    });

    it("renders 6-bit groups including padding steps", () => {
      render(<Base64Encoder />);
      fireEvent.change(getInput(), { target: { value: "A" } });
      expect(screen.getAllByText(/010000 → Q/).length).toBe(2);
      expect(screen.getAllByText(/====== → =/).length).toBe(2);
      expect(screen.getAllByText("padding").length).toBe(2);
    });

    it("shows the final result block", () => {
      render(<Base64Encoder />);
      fireEvent.change(getInput(), { target: { value: "Hello" } });
      expect(screen.getAllByText("SGVsbG8=").length).toBeGreaterThan(1);
    });
  });

  describe("decode mode", () => {
    it("switches mode via toggle and clears the input", () => {
      render(<Base64Encoder />);
      fireEvent.change(getInput(), { target: { value: "Hello" } });
      fireEvent.click(screen.getByTestId("mode-toggle-decode"));
      expect(getInput().value).toBe("");
    });

    it("decodes a padded base64 string", () => {
      render(<Base64Encoder />);
      fireEvent.click(screen.getByTestId("mode-toggle-decode"));
      fireEvent.change(getInput(), { target: { value: "SGVsbG8=" } });
      expect(screen.getByTestId("base64-result").textContent).toBe("Hello");
    });

    it("strips invalid characters from the input in decode mode", () => {
      render(<Base64Encoder />);
      fireEvent.click(screen.getByTestId("mode-toggle-decode"));
      fireEvent.change(getInput(), { target: { value: "H$ll o!" } });
      expect(getInput().value).toBe("Hllo");
    });

    it("renders lookup steps for each base64 character", () => {
      render(<Base64Encoder />);
      fireEvent.click(screen.getByTestId("mode-toggle-decode"));
      fireEvent.change(getInput(), { target: { value: "SGVsbG8=" } });
      expect(screen.getByText(/S → 18 → 010010/)).toBeTruthy();
    });

    it("renders decoded byte steps", () => {
      render(<Base64Encoder />);
      fireEvent.click(screen.getByTestId("mode-toggle-decode"));
      fireEvent.change(getInput(), { target: { value: "SGVsbG8=" } });
      expect(screen.getByText(/01001000 → 'H'/)).toBeTruthy();
      expect(screen.getByText(/01100101 → 'e'/)).toBeTruthy();
    });

    it("shows a warning banner for invalid base64 input", () => {
      render(
        <Base64Encoder
          initialConverterMode="decode"
          initialValue="!!invalid!!"
        />,
      );
      expect(screen.getByTestId("mock-warning-banner").textContent).toContain(
        "Invalid Base64 Input",
      );
      expect(screen.queryByTestId("base64-result")).toBeNull();
    });
  });

  describe("initial values", () => {
    it("applies initialValue and initialConverterMode", () => {
      render(
        <Base64Encoder initialValue="SGVsbG8=" initialConverterMode="decode" />,
      );
      expect(getInput().value).toBe("SGVsbG8=");
      expect(screen.getByTestId("base64-result").textContent).toBe("Hello");
    });
  });

  describe("exercise mode", () => {
    it("locks the input while the solution is hidden", () => {
      render(
        <Base64Encoder
          isExerciseMode
          showSolution={false}
          initialValue="Hello"
        />,
      );
      expect(getInput().hasAttribute("readonly")).toBe(true);
    });

    it("unlocks the input when the solution is shown", () => {
      render(
        <Base64Encoder isExerciseMode showSolution initialValue="Hello" />,
      );
      expect(getInput().hasAttribute("readonly")).toBe(false);
    });

    it("ignores input changes while the solution is hidden", () => {
      render(
        <Base64Encoder
          isExerciseMode
          showSolution={false}
          initialValue="Hello"
        />,
      );
      fireEvent.change(getInput(), { target: { value: "World" } });
      expect(getInput().value).toBe("Hello");
    });

    it("disables the mode toggle in exercise mode", () => {
      render(
        <Base64Encoder
          isExerciseMode
          showSolution={false}
          initialValue="Hello"
        />,
      );
      expect(
        (screen.getByTestId("mode-toggle-encode") as HTMLButtonElement)
          .disabled,
      ).toBe(true);
      expect(
        (screen.getByTestId("mode-toggle-decode") as HTMLButtonElement)
          .disabled,
      ).toBe(true);
    });

    it("shows the validation panel with the expected answer", () => {
      render(
        <Base64Encoder
          isExerciseMode
          showSolution={false}
          initialValue="Hello"
          expectedAnswer="SGVsbG8="
        />,
      );
      expect(screen.getByTestId("mock-validation-panel")).toBeTruthy();
      expect(
        screen.getByTestId("mock-validation-expected-result").textContent,
      ).toBe("SGVsbG8=");
      expect(screen.getByTestId("mock-validation-input-mode").textContent).toBe(
        "base64",
      );
      expect(screen.queryByTestId("base64-result")).toBeNull();
    });

    it("uses the computed result when no expected answer is given", () => {
      render(
        <Base64Encoder
          isExerciseMode
          showSolution={false}
          initialValue="Hello"
        />,
      );
      expect(
        screen.getByTestId("mock-validation-expected-result").textContent,
      ).toContain("SGVsbG8=");
    });

    it("uses text input mode for decode exercises", () => {
      render(
        <Base64Encoder
          isExerciseMode
          showSolution={false}
          initialConverterMode="decode"
          initialValue="SGVsbG8="
          expectedAnswer="Hello"
        />,
      );
      expect(screen.getByTestId("mock-validation-input-mode").textContent).toBe(
        "text",
      );
    });

    it("calls onShowSolution and onExitExercise", () => {
      const onShowSolution = vi.fn();
      const onExitExercise = vi.fn();
      render(
        <Base64Encoder
          isExerciseMode
          showSolution={false}
          initialValue="Hello"
          onShowSolution={onShowSolution}
          onExitExercise={onExitExercise}
        />,
      );
      fireEvent.click(screen.getByTestId("mock-validation-show-solution"));
      expect(onShowSolution).toHaveBeenCalledTimes(1);
      fireEvent.click(screen.getByTestId("mock-validation-exit"));
      expect(onExitExercise).toHaveBeenCalledTimes(1);
    });

    it("shows the result when the solution is revealed", () => {
      render(
        <Base64Encoder isExerciseMode showSolution initialValue="Hello" />,
      );
      expect(screen.getByTestId("base64-result").textContent).toBe("SGVsbG8=");
      expect(screen.queryByTestId("mock-validation-panel")).toBeNull();
    });
  });
});
