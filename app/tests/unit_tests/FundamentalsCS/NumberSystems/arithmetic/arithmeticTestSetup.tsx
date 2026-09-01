import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import type { BaseArithmeticProps } from "@/pages/FundamentalsCS/NumberSystems/components/simulator/arithmetic/types";
import { mockSimulatorShared } from "../../../shared/simulatorSharedMock";

export function setupArithmeticTests() {
  afterEach(() => {
    cleanup();
  });
}

export function mockReactI18next() {
  return {
    useTranslation: () => ({
      t: (key: string, fallback?: string) =>
        typeof fallback === "string" ? fallback : key,
    }),
  };
}

export { mockSimulatorShared };

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
