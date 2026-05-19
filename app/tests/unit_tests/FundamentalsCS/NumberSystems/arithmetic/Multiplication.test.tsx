/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Multiplication } from "@/pages/FundamentalsCS/NumberSystems/components/simulator/arithmetic/Multiplication.tsx";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) =>
      typeof fallback === "string" ? fallback : key,
  }),
}));

vi.mock(
  "../../../../../src/pages/FundamentalsCS/NumberSystems/components/simulator/shared",
  () => ({
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
    }: {
      value: string;
      onChange: (v: string) => void;
      locked: boolean;
    }) => (
      <input
        data-testid="mock-binary-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={locked}
      />
    ),
    StepByStepToggle: ({
      onToggle,
    }: {
      open: boolean;
      onToggle: () => void;
    }) => (
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
        {isOpen && <div data-testid="mock-step-content">{children}</div>}
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
  }),
);

vi.mock(
  "@/components/shared/ExerciseValidationPanel/ExerciseValidationPanel",
  () => ({
    ExerciseValidationPanel: ({
      expectedResult,
    }: {
      expectedResult: string | string[];
    }) => (
      <div data-testid="mock-validation-panel">
        <span data-testid="mock-validation-expected-result">
          {Array.isArray(expectedResult)
            ? expectedResult.join(",")
            : expectedResult}
        </span>
      </div>
    ),
  }),
);

function getInputs() {
  return screen.getAllByTestId("mock-binary-input") as HTMLInputElement[];
}

describe("Multiplication", () => {
  afterEach(() => {
    cleanup();
  });

  describe("when rendering in free mode", () => {
    it("shows two binary inputs", () => {
      render(<Multiplication renderModeSelector={null} />);
      expect(getInputs().length).toBe(2);
    });
  });

  describe("when computing binary multiplication", () => {
    it("renders the result panel", () => {
      render(<Multiplication renderModeSelector={null} />);
      const inputs = getInputs();
      fireEvent.change(inputs[0], { target: { value: "00000010" } });
      fireEvent.change(inputs[1], { target: { value: "00000011" } });
      expect(screen.getByTestId("mock-result-panel")).toBeTruthy();
    });
  });

  describe("when in exercise mode", () => {
    it("locks both inputs", () => {
      render(
        <Multiplication
          isExerciseMode
          showSolution={false}
          onShowSolution={vi.fn()}
          initialA="00001011"
          initialB="00000100"
          renderModeSelector={null}
        />,
      );
      const inputs = getInputs();
      expect(inputs[0].hasAttribute("readonly")).toBe(true);
      expect(inputs[1].hasAttribute("readonly")).toBe(true);
    });

    it("shows validation panel with expected product", () => {
      render(
        <Multiplication
          isExerciseMode
          showSolution={false}
          onShowSolution={vi.fn()}
          initialA="00001011"
          initialB="00000100"
          renderModeSelector={null}
        />,
      );
      expect(screen.getByTestId("mock-validation-panel")).toBeTruthy();
      expect(
        screen.getByTestId("mock-validation-expected-result").textContent,
      ).toContain("101100");
    });
  });

  describe("when initialized with values", () => {
    it("sets initial operands", () => {
      render(
        <Multiplication
          initialA="1011"
          initialB="11001"
          renderModeSelector={null}
        />,
      );
      const inputs = getInputs();
      expect(inputs[0].value).toBe("1011");
      expect(inputs[1].value).toBe("11001");
    });
  });
});
