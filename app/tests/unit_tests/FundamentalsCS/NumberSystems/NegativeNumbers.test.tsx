/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NegativeNumbers } from "@/pages/FundamentalsCS/NumberSystems/components/simulator/NegativeNumbers.tsx";

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
          {Array.isArray(expectedResult)
            ? expectedResult.join(",")
            : expectedResult}
        </span>
        <button
          data-testid="mock-validation-show-solution"
          onClick={onShowSolution}
        >
          show solution
        </button>
      </div>
    ),
  }),
);

describe("NegativeNumbers", () => {
  afterEach(() => {
    cleanup();
  });

  describe("when rendering in free mode", () => {
    it("shows the decimal input field", () => {
      render(<NegativeNumbers />);
      expect(screen.getByTestId("ns-negative-decimal-input")).toBeTruthy();
    });

    it("shows all three representation rows", () => {
      render(<NegativeNumbers />);
      expect(screen.getByTestId("ns-negative-sign-magnitude")).toBeTruthy();
      expect(screen.getByTestId("ns-negative-ones-complement")).toBeTruthy();
      expect(screen.getByTestId("ns-negative-twos-complement")).toBeTruthy();
    });
  });

  describe("when entering a positive number", () => {
    it("shows identical representations for 5", () => {
      render(<NegativeNumbers />);
      const input = screen.getByTestId("ns-negative-decimal-input");
      fireEvent.change(input, { target: { value: "5" } });
      expect(
        screen.getByTestId("ns-negative-sign-magnitude").textContent,
      ).toContain("00000101");
      expect(
        screen.getByTestId("ns-negative-ones-complement").textContent,
      ).toContain("00000101");
      expect(
        screen.getByTestId("ns-negative-twos-complement").textContent,
      ).toContain("00000101");
    });
  });

  describe("when entering a negative number", () => {
    it("computes twos complement for -5", () => {
      render(<NegativeNumbers />);
      const input = screen.getByTestId("ns-negative-decimal-input");
      fireEvent.change(input, { target: { value: "-5" } });
      expect(
        screen.getByTestId("ns-negative-twos-complement").textContent,
      ).toContain("11111011");
    });

    it("computes twos complement for -1", () => {
      render(<NegativeNumbers />);
      const input = screen.getByTestId("ns-negative-decimal-input");
      fireEvent.change(input, { target: { value: "-1" } });
      expect(
        screen.getByTestId("ns-negative-twos-complement").textContent,
      ).toContain("11111111");
    });

    it("computes twos complement for -128 (minimum)", () => {
      render(<NegativeNumbers />);
      const input = screen.getByTestId("ns-negative-decimal-input");
      fireEvent.change(input, { target: { value: "-128" } });
      expect(
        screen.getByTestId("ns-negative-twos-complement").textContent,
      ).toContain("10000000");
    });

    it("computes twos complement for 127 (maximum)", () => {
      render(<NegativeNumbers />);
      const input = screen.getByTestId("ns-negative-decimal-input");
      fireEvent.change(input, { target: { value: "127" } });
      expect(
        screen.getByTestId("ns-negative-twos-complement").textContent,
      ).toContain("01111111");
    });
  });

  describe("when entering an out-of-range value", () => {
    it("shows dashes for values above 127", () => {
      render(<NegativeNumbers />);
      const input = screen.getByTestId("ns-negative-decimal-input");
      fireEvent.change(input, { target: { value: "128" } });
      expect(
        screen.getByTestId("ns-negative-twos-complement").textContent,
      ).toContain("--------");
    });

    it("shows dashes for values below -128", () => {
      render(<NegativeNumbers />);
      const input = screen.getByTestId("ns-negative-decimal-input");
      fireEvent.change(input, { target: { value: "-129" } });
      expect(
        screen.getByTestId("ns-negative-twos-complement").textContent,
      ).toContain("--------");
    });
  });

  describe("when in exercise mode", () => {
    it("locks the input field", () => {
      render(
        <NegativeNumbers
          isExerciseMode
          showSolution={false}
          onShowSolution={vi.fn()}
          initialValue="-5"
        />,
      );
      const input = screen.getByTestId("ns-negative-decimal-input");
      expect(input.hasAttribute("readonly")).toBe(true);
    });

    it("shows the validation panel", () => {
      render(
        <NegativeNumbers
          isExerciseMode
          showSolution={false}
          onShowSolution={vi.fn()}
          initialValue="-5"
        />,
      );
      expect(screen.getByTestId("mock-validation-panel")).toBeTruthy();
    });

    it("passes the twos complement as expected result", () => {
      render(
        <NegativeNumbers
          isExerciseMode
          showSolution={false}
          onShowSolution={vi.fn()}
          initialValue="-5"
        />,
      );
      expect(
        screen.getByTestId("mock-validation-expected-result").textContent,
      ).toContain("11111011");
    });
  });
});
