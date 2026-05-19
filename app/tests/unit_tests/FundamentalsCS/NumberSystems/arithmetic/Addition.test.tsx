/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Addition } from "../../../../../src/pages/FundamentalsCS/NumberSystems/components/simulator/arithmetic/Addition";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) =>
      typeof fallback === "string" ? fallback : key,
  }),
}));

vi.mock(
  "../../../../../src/pages/FundamentalsCS/NumberSystems/components/simulator/shared",
  () => ({
    SimulatorLayout: ({ inputPanel, resultPanel }: { inputPanel: React.ReactNode; resultPanel: React.ReactNode }) => (
      <div data-testid="mock-simulator-layout">
        <div data-testid="mock-input-panel">{inputPanel}</div>
        <div data-testid="mock-result-panel">{resultPanel}</div>
      </div>
    ),
    BinaryInput: ({ value, onChange, locked }: { value: string; onChange: (v: string) => void; locked: boolean }) => (
      <input data-testid="mock-binary-input" value={value} onChange={(e) => onChange(e.target.value)} readOnly={locked} />
    ),
    StepByStepToggle: ({ open, onToggle }: { open: boolean; onToggle: () => void }) => (
      <button data-testid="mock-step-toggle" onClick={onToggle}>toggle</button>
    ),
    CollapsibleStep: ({ header, children, isOpen }: { header: React.ReactNode; children: React.ReactNode; isOpen: boolean }) => (
      <div data-testid="mock-collapsible-step" data-open={isOpen}>
        <div data-testid="mock-step-header">{header}</div>
        {isOpen && <div data-testid="mock-step-content">{children}</div>}
      </div>
    ),
    WarningBanner: ({ title, children }: { title: string; children: React.ReactNode }) => (
      <div data-testid="mock-warning-banner"><span>{title}</span><span>{children}</span></div>
    ),
    ResultSectionHeader: ({ title }: { title: string }) => (<div data-testid="mock-result-header">{title}</div>),
    useToggleSet: (initial: string[]) => ({ expanded: new Set(initial), toggle: vi.fn() }),
  }),
);

vi.mock(
  "@/components/shared/ExerciseValidationPanel/ExerciseValidationPanel",
  () => ({
    ExerciseValidationPanel: ({ expectedResult }: { expectedResult: string | string[] }) => (
      <div data-testid="mock-validation-panel">
        <span data-testid="mock-validation-expected-result">
          {Array.isArray(expectedResult) ? expectedResult.join(",") : expectedResult}
        </span>
      </div>
    ),
  }),
);

function getInputs() {
  return screen.getAllByTestId("mock-binary-input") as HTMLInputElement[];
}

describe("Addition", () => {
  afterEach(() => { cleanup(); });

  describe("when rendering in free mode", () => {
    it("shows two binary inputs", () => {
      render(<Addition renderModeSelector={null} />);
      expect(getInputs().length).toBe(2);
    });

    it("defaults to 01100101 and 00111100", () => {
      render(<Addition renderModeSelector={null} />);
      const inputs = getInputs();
      expect(inputs[0].value).toBe("01100101");
      expect(inputs[1].value).toBe("00111100");
    });
  });

  describe("when computing binary addition", () => {
    it("renders the result panel", () => {
      render(<Addition renderModeSelector={null} />);
      const inputs = getInputs();
      fireEvent.change(inputs[0], { target: { value: "00000001" } });
      fireEvent.change(inputs[1], { target: { value: "00000001" } });
      expect(screen.getByTestId("mock-result-panel")).toBeTruthy();
    });
  });

  describe("when in exercise mode", () => {
    it("locks both inputs", () => {
      render(<Addition isExerciseMode showSolution={false} onShowSolution={vi.fn()} initialA="00001010" initialB="00000101" renderModeSelector={null} />);
      const inputs = getInputs();
      expect(inputs[0].hasAttribute("readonly")).toBe(true);
      expect(inputs[1].hasAttribute("readonly")).toBe(true);
    });

    it("shows validation panel with expected sum", () => {
      render(<Addition isExerciseMode showSolution={false} onShowSolution={vi.fn()} initialA="00001010" initialB="00000101" renderModeSelector={null} />);
      expect(screen.getByTestId("mock-validation-panel")).toBeTruthy();
      expect(screen.getByTestId("mock-validation-expected-result").textContent).toContain("00001111");
    });
  });

  describe("when initialized with values", () => {
    it("sets initial operand A and B", () => {
      render(<Addition initialA="10101010" initialB="01010101" renderModeSelector={null} />);
      const inputs = getInputs();
      expect(inputs[0].value).toBe("10101010");
      expect(inputs[1].value).toBe("01010101");
    });
  });
});
