/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FractionalConverter } from "../../../../src/pages/FundamentalsCS/NumberSystems/components/simulator/FractionalConverter";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) =>
      typeof fallback === "string" ? fallback : key,
  }),
}));

vi.mock(
  "@/components/shared/ExerciseValidationPanel/ExerciseValidationPanel",
  () => ({
    ExerciseValidationPanel: ({
      expectedResult,
      onShowSolution,
    }: {
      expectedResult: string | string[];
      onShowSolution: () => void;
    }) => (
      <div data-testid="mock-validation-panel">
        <span data-testid="mock-validation-expected-result">
          {Array.isArray(expectedResult) ? expectedResult.join(",") : expectedResult}
        </span>
        <button data-testid="mock-validation-show-solution" onClick={onShowSolution}>
          show solution
        </button>
      </div>
    ),
  }),
);

describe("FractionalConverter", () => {
  afterEach(() => {
    cleanup();
  });

  describe("when rendering in free mode", () => {
    it("defaults to decToBin mode with value 10.5", () => {
      render(<FractionalConverter />);
      expect((screen.getByTestId("ns-fractional-input") as HTMLInputElement).value).toBe("10.5");
      expect(screen.getByTestId("ns-fractional-result")).toBeTruthy();
    });

    it("converts 10.5 decimal to 1010.1 binary", () => {
      render(<FractionalConverter />);
      expect(screen.getByTestId("ns-fractional-result").textContent).toContain("1010.1");
    });

    it("converts 3.375 decimal to 11.011 binary", () => {
      render(<FractionalConverter />);
      const input = screen.getByTestId("ns-fractional-input");
      fireEvent.change(input, { target: { value: "3.375" } });
      expect(screen.getByTestId("ns-fractional-result").textContent).toContain("11.011");
    });

    it("handles negative decimal values", () => {
      render(<FractionalConverter />);
      const input = screen.getByTestId("ns-fractional-input");
      fireEvent.change(input, { target: { value: "-10.5" } });
      expect(screen.getByTestId("ns-fractional-result").textContent).toContain("-1010.1");
    });
  });

  describe("when switching to binToDec mode", () => {
    it("changes input to 1010.1 and result to 10.5", () => {
      render(<FractionalConverter />);
      fireEvent.click(screen.getByTestId("ns-frac-bin-to-dec-button"));
      expect((screen.getByTestId("ns-fractional-input") as HTMLInputElement).value).toContain("1010.1");
      expect(screen.getByTestId("ns-fractional-result").textContent).toContain("10.5");
    });
  });

  describe("when in exercise mode", () => {
    it("disables mode toggle buttons", () => {
      render(
        <FractionalConverter
          isExerciseMode
          showSolution={false}
          onShowSolution={vi.fn()}
          initialValue="10.5"
        />,
      );
      expect(
        screen.getByTestId("ns-frac-dec-to-bin-button").hasAttribute("disabled"),
      ).toBe(true);
      expect(
        screen.getByTestId("ns-frac-bin-to-dec-button").hasAttribute("disabled"),
      ).toBe(true);
    });

    it("shows the validation panel when solution is hidden", () => {
      render(
        <FractionalConverter
          isExerciseMode
          showSolution={false}
          onShowSolution={vi.fn()}
          initialValue="10.5"
        />,
      );
      expect(screen.getByTestId("mock-validation-panel")).toBeTruthy();
    });

    it("passes the expected binary result to validation", () => {
      render(
        <FractionalConverter
          isExerciseMode
          showSolution={false}
          onShowSolution={vi.fn()}
          initialValue="10.5"
        />,
      );
      expect(
        screen.getByTestId("mock-validation-expected-result").textContent,
      ).toContain("1010.1");
    });

    it("disables input when solution is hidden", () => {
      render(
        <FractionalConverter
          isExerciseMode
          showSolution={false}
          onShowSolution={vi.fn()}
          initialValue="10.5"
        />,
      );
      const input = screen.getByTestId("ns-fractional-input");
      expect(input.hasAttribute("disabled")).toBe(true);
    });
  });

  describe("when initialized with exercise value", () => {
    it("sets the initial value", () => {
      render(<FractionalConverter initialValue="3.375" />);
      expect((screen.getByTestId("ns-fractional-input") as HTMLInputElement).value).toBe("3.375");
    });
  });
});
