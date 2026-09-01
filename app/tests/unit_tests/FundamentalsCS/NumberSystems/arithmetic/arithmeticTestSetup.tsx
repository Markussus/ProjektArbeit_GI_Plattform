import { cleanup, render, screen } from "@testing-library/react";
import { vi } from "vitest";

export function mockReactI18next() {
  return {
    useTranslation: () => ({
      t: (key: string, fallback?: string) =>
        typeof fallback === "string" ? fallback : key,
    }),
  };
}

export function mockSimulatorShared() {
  return {
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
  };
}

export function mockExerciseValidationPanel() {
  return {
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
  };
}

export function renderWithCleanup(component: React.ReactElement) {
  cleanup();
  return render(component);
}

export function getInputs() {
  return screen.getAllByTestId("mock-binary-input") as HTMLInputElement[];
}

export function getInput() {
  return screen.getAllByTestId("mock-binary-input")[0] as HTMLInputElement;
}
