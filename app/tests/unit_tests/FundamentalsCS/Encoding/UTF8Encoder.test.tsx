/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UTF8Encoder } from "@/pages/FundamentalsCS/Encoding/simulator/UTF8Encoder.tsx";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) =>
      typeof fallback === "string" ? fallback : key,
  }),
}));

vi.mock("@/components/shared/SimulatorShared", () => ({
  SimulatorLayout: ({
    inputPanel,
    resultPanel,
  }: {
    inputPanel: React.ReactNode;
    resultPanel: React.ReactNode;
  }) => (
    <div data-testid="mock-simulator-layout">
      <div data-testid="mock-input-panel">{inputPanel}</div>
      <div data-testid="mock-result-panel">{resultPanel}</div>
    </div>
  ),
  BinaryInput: ({
    value,
    onChange,
    locked,
    "data-testid": testId,
  }: {
    value: string;
    onChange: (v: string) => void;
    locked: boolean;
    "data-testid"?: string;
  }) => (
    <input
      data-testid={testId ?? "mock-binary-input"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      readOnly={locked}
    />
  ),
  ModeToggle: ({
    value,
    onChange,
    options,
    disabled,
  }: {
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
    disabled?: boolean;
  }) => (
    <div>
      {options.map((option) => (
        <button
          key={option.value}
          data-testid={`mode-toggle-${option.value}`}
          data-active={value === option.value}
          onClick={() => onChange(option.value)}
          disabled={disabled}
        >
          {option.label}
        </button>
      ))}
    </div>
  ),
  StepByStepToggle: ({ onToggle }: { open: boolean; onToggle: () => void }) => (
    <button data-testid="mock-step-toggle" onClick={onToggle}>
      toggle
    </button>
  ),
  CollapsibleStep: ({
    header,
    children,
    isOpen,
  }: {
    header: React.ReactNode;
    children: React.ReactNode;
    isOpen: boolean;
  }) => (
    <div data-testid="mock-collapsible-step" data-open={isOpen}>
      <div data-testid="mock-step-header">{header}</div>
      {children}
    </div>
  ),
  WarningBanner: ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <div data-testid="mock-warning-banner">
      <span>{title}</span>
      <span>{children}</span>
    </div>
  ),
  ResultSectionHeader: ({ title }: { title: string }) => (
    <div data-testid="mock-result-header">{title}</div>
  ),
  useToggleSet: (initial: string[]) => ({
    expanded: new Set(initial),
    toggle: vi.fn(),
  }),
}));

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
  return screen.getByTestId("utf8-input") as HTMLInputElement;
}

describe("UTF8Encoder", () => {
  afterEach(() => {
    cleanup();
  });

  describe("encode mode", () => {
    it("encodes an ASCII character as a single byte", () => {
      render(<UTF8Encoder />);
      fireEvent.change(getInput(), { target: { value: "A" } });
      expect(screen.getByTestId("utf8-result-hex").textContent).toBe("41");
    });

    it("encodes a 2-byte character correctly", () => {
      render(<UTF8Encoder />);
      fireEvent.change(getInput(), { target: { value: "ä" } });
      expect(screen.getByTestId("utf8-result-hex").textContent).toBe("C3 A4");
    });

    it("encodes a 3-byte character correctly", () => {
      render(<UTF8Encoder />);
      fireEvent.change(getInput(), { target: { value: "中" } });
      expect(screen.getByTestId("utf8-result-hex").textContent).toBe(
        "E4 B8 AD",
      );
    });

    it("encodes a 4-byte emoji correctly", () => {
      render(<UTF8Encoder />);
      fireEvent.change(getInput(), { target: { value: "😀" } });
      expect(screen.getByTestId("utf8-result-hex").textContent).toBe(
        "F0 9F 98 80",
      );
    });

    it("encodes multi-character strings byte by byte", () => {
      render(<UTF8Encoder />);
      fireEvent.change(getInput(), { target: { value: "Aä" } });
      expect(screen.getByTestId("utf8-result-hex").textContent).toBe(
        "41 C3 A4",
      );
    });

    it("reports state changes via onChangeState", () => {
      const onChangeState = vi.fn();
      render(<UTF8Encoder onChangeState={onChangeState} />);
      fireEvent.change(getInput(), { target: { value: "A" } });
      expect(onChangeState).toHaveBeenLastCalledWith({
        converterMode: "encode",
        inputValue: "A",
      });
    });

    it("renders code point steps for each character", () => {
      render(<UTF8Encoder />);
      fireEvent.change(getInput(), { target: { value: "中" } });
      expect(screen.getByText(/'中' → U\+4E2D/)).toBeTruthy();
    });

    it("renders byte pattern steps for 4-byte characters", () => {
      render(<UTF8Encoder />);
      fireEvent.change(getInput(), { target: { value: "😀" } });
      expect(screen.getByText(/'😀' → U\+1F600/)).toBeTruthy();
      expect(screen.getAllByText(/F0 9F 98 80/).length).toBeGreaterThan(0);
    });
  });

  describe("decode mode", () => {
    it("switches mode via toggle and clears the input", () => {
      render(<UTF8Encoder />);
      fireEvent.change(getInput(), { target: { value: "A" } });
      fireEvent.click(screen.getByTestId("mode-toggle-decode"));
      expect(getInput().value).toBe("");
    });

    it("decodes a single-byte sequence", () => {
      render(<UTF8Encoder />);
      fireEvent.click(screen.getByTestId("mode-toggle-decode"));
      fireEvent.change(getInput(), { target: { value: "41" } });
      expect(screen.getByTestId("utf8-result-ascii").textContent).toBe("A");
    });

    it("decodes a multi-byte sequence", () => {
      render(<UTF8Encoder />);
      fireEvent.click(screen.getByTestId("mode-toggle-decode"));
      fireEvent.change(getInput(), { target: { value: "C3 A4" } });
      expect(screen.getByTestId("utf8-result-ascii").textContent).toBe("ä");
    });

    it("decodes a 4-byte emoji sequence", () => {
      render(<UTF8Encoder />);
      fireEvent.click(screen.getByTestId("mode-toggle-decode"));
      fireEvent.change(getInput(), { target: { value: "F0 9F 98 80" } });
      expect(screen.getByTestId("utf8-result-ascii").textContent).toBe("😀");
    });

    it("formats hex input into space separated byte pairs", () => {
      render(<UTF8Encoder />);
      fireEvent.click(screen.getByTestId("mode-toggle-decode"));
      fireEvent.change(getInput(), { target: { value: "414243" } });
      expect(getInput().value).toBe("41 42 43");
    });

    it("strips non-hex characters from the input in decode mode", () => {
      render(<UTF8Encoder />);
      fireEvent.click(screen.getByTestId("mode-toggle-decode"));
      fireEvent.change(getInput(), { target: { value: "4G1" } });
      expect(getInput().value).toBe("41");
    });

    it("renders byte-type steps for multi-byte sequences", () => {
      render(<UTF8Encoder />);
      fireEvent.click(screen.getByTestId("mode-toggle-decode"));
      fireEvent.change(getInput(), { target: { value: "C3 A4" } });
      expect(screen.getByText(/C3 \(11000011\) →/)).toBeTruthy();
      expect(screen.getByText(/A4 \(10100100\) →/)).toBeTruthy();
    });

    it("renders decoded character steps", () => {
      render(<UTF8Encoder />);
      fireEvent.click(screen.getByTestId("mode-toggle-decode"));
      fireEvent.change(getInput(), { target: { value: "C3 A4" } });
      expect(screen.getByText(/C3 A4 → 'ä' \(U\+00E4\)/)).toBeTruthy();
    });

    it("shows a warning banner for an isolated continuation byte", () => {
      render(<UTF8Encoder />);
      fireEvent.click(screen.getByTestId("mode-toggle-decode"));
      fireEvent.change(getInput(), { target: { value: "80" } });
      expect(screen.getByTestId("mock-warning-banner").textContent).toContain(
        "Invalid UTF-8 Sequence",
      );
      expect(screen.queryByTestId("utf8-result-ascii")).toBeNull();
    });

    it("shows a warning banner for a truncated sequence", () => {
      render(<UTF8Encoder />);
      fireEvent.click(screen.getByTestId("mode-toggle-decode"));
      fireEvent.change(getInput(), { target: { value: "C3" } });
      expect(screen.getByTestId("mock-warning-banner")).toBeTruthy();
    });

    it("shows a warning banner for an overlong sequence", () => {
      render(<UTF8Encoder />);
      fireEvent.click(screen.getByTestId("mode-toggle-decode"));
      fireEvent.change(getInput(), { target: { value: "C0 80" } });
      expect(screen.getByTestId("mock-warning-banner")).toBeTruthy();
    });
  });

  describe("initial values", () => {
    it("applies initialValue and initialConverterMode", () => {
      render(
        <UTF8Encoder initialValue="E4 B8 AD" initialConverterMode="decode" />,
      );
      expect(getInput().value).toBe("E4 B8 AD");
      expect(screen.getByTestId("utf8-result-ascii").textContent).toBe("中");
    });
  });

  describe("exercise mode", () => {
    it("locks the input while the solution is hidden", () => {
      render(
        <UTF8Encoder isExerciseMode showSolution={false} initialValue="A" />,
      );
      expect(getInput().hasAttribute("readonly")).toBe(true);
    });

    it("unlocks the input when the solution is shown", () => {
      render(<UTF8Encoder isExerciseMode showSolution initialValue="A" />);
      expect(getInput().hasAttribute("readonly")).toBe(false);
    });

    it("ignores input changes while the solution is hidden", () => {
      render(
        <UTF8Encoder isExerciseMode showSolution={false} initialValue="A" />,
      );
      fireEvent.change(getInput(), { target: { value: "B" } });
      expect(getInput().value).toBe("A");
    });

    it("disables the mode toggle in exercise mode", () => {
      render(
        <UTF8Encoder isExerciseMode showSolution={false} initialValue="A" />,
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

    it("shows the validation panel with the expected answer in encode mode", () => {
      render(
        <UTF8Encoder
          isExerciseMode
          showSolution={false}
          initialValue="A"
          expectedAnswer="01000001"
        />,
      );
      expect(screen.getByTestId("mock-validation-panel")).toBeTruthy();
      expect(
        screen.getByTestId("mock-validation-expected-result").textContent,
      ).toBe("01000001");
      expect(screen.getByTestId("mock-validation-input-mode").textContent).toBe(
        "hex-bytes",
      );
      expect(screen.queryByTestId("utf8-result-hex")).toBeNull();
    });

    it("uses text input mode for decode exercises", () => {
      render(
        <UTF8Encoder
          isExerciseMode
          showSolution={false}
          initialConverterMode="decode"
          initialValue="41"
          expectedAnswer="A"
        />,
      );
      expect(screen.getByTestId("mock-validation-input-mode").textContent).toBe(
        "text",
      );
    });

    it("uses the computed result when no expected answer is given", () => {
      render(
        <UTF8Encoder
          isExerciseMode
          showSolution={false}
          initialConverterMode="decode"
          initialValue="41"
        />,
      );
      expect(
        screen.getByTestId("mock-validation-expected-result").textContent,
      ).toContain("A");
    });

    it("calls onShowSolution and onExitExercise", () => {
      const onShowSolution = vi.fn();
      const onExitExercise = vi.fn();
      render(
        <UTF8Encoder
          isExerciseMode
          showSolution={false}
          initialValue="A"
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
      render(<UTF8Encoder isExerciseMode showSolution initialValue="A" />);
      expect(screen.getByTestId("utf8-result-hex").textContent).toBe("41");
      expect(screen.queryByTestId("mock-validation-panel")).toBeNull();
    });
  });
});
