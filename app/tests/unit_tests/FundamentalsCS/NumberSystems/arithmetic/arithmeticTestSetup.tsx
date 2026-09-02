import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import type { BaseArithmeticProps } from "@/pages/FundamentalsCS/NumberSystems/components/simulator/arithmetic/types";
import "../../../shared/mockReactI18next";

vi.mock("@/components/shared/SimulatorShared", () => {
  const mocks: Record<string, unknown> = {
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
        {<div data-testid="mock-step-content">{children}</div>}
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
  return mocks;
});

// fallow-ignore-next-line unresolved-import
vi.mock("./ArithmeticInputPanel", () => ({
  ArithmeticInputPanel: ({
    operandA,
    operandB,
    locked,
  }: {
    operandA: { value: string; onChange: (v: string) => void };
    operandB: { value: string; onChange: (v: string) => void };
    locked: boolean;
  }) => (
    <>
      <input
        data-testid="mock-binary-input"
        value={operandA.value}
        onChange={(e) => operandA.onChange(e.target.value)}
        readOnly={locked}
      />
      <input
        data-testid="mock-binary-input"
        value={operandB.value}
        onChange={(e) => operandB.onChange(e.target.value)}
        readOnly={locked}
      />
    </>
  ),
}));

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

export function setupArithmeticTests() {
  afterEach(() => {
    cleanup();
  });
}

export function getInputs() {
  return screen.getAllByTestId("mock-binary-input") as HTMLInputElement[];
}

export function getInput() {
  return screen.getAllByTestId("mock-binary-input")[0] as HTMLInputElement;
}

export interface ArithmeticExerciseOptions {
  initialA: string;
  initialB?: string;
}

export function expectInputsLocked() {
  const inputs = getInputs();
  inputs.forEach((input) => {
    expect(input.hasAttribute("readonly")).toBe(true);
  });
}

export function expectInputLocked() {
  expect(getInput().hasAttribute("readonly")).toBe(true);
}

export function renderArithmeticExercise(
  Component: React.ComponentType<BaseArithmeticProps>,
  { initialA, initialB }: ArithmeticExerciseOptions,
) {
  render(
    <Component
      isExerciseMode
      showSolution={false}
      onShowSolution={vi.fn()}
      initialA={initialA}
      initialB={initialB}
      renderModeSelector={null}
    />,
  );
}

export function expectValidationResult(expected: string) {
  expect(screen.getByTestId("mock-validation-panel")).toBeTruthy();
  expect(
    screen.getByTestId("mock-validation-expected-result").textContent,
  ).toContain(expected);
}

export function changeBinaryInput(index: number, value: string) {
  const inputs = getInputs();
  fireEvent.change(inputs[index], { target: { value } });
}

export function expectDefaultsTo(
  Component: React.ComponentType<BaseArithmeticProps>,
  defaultA: string,
  defaultB: string,
) {
  render(<Component renderModeSelector={null} />);
  const inputs = getInputs();
  expect(inputs[0].value).toBe(defaultA);
  expect(inputs[1].value).toBe(defaultB);
}

export function expectInitializedValues(
  Component: React.ComponentType<BaseArithmeticProps>,
  initialA: string,
  initialB: string,
) {
  render(
    <Component
      initialA={initialA}
      initialB={initialB}
      renderModeSelector={null}
    />,
  );
  const inputs = getInputs();
  expect(inputs[0].value).toBe(initialA);
  expect(inputs[1].value).toBe(initialB);
}
