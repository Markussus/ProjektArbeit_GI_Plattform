/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IEEE754Converter } from "@/pages/FundamentalsCS/NumberSystems/components/simulator/IEEE754Converter.tsx";
vi.mock(
  "@/components/shared/ExerciseValidationPanel/ExerciseValidationPanel",
  async () => {
    const { mockExerciseValidationPanelForConverters } =
      await import("./converterTestSetup");
    return mockExerciseValidationPanelForConverters();
  },
);

describe("IEEE754Converter", () => {
  afterEach(() => {
    cleanup();
  });

  describe("when rendering in decToIeee mode", () => {
    it("defaults to decToIeee mode with value 12.5", () => {
      render(<IEEE754Converter />);
      expect(
        (screen.getByTestId("ns-ieee-input") as HTMLInputElement).value,
      ).toBe("12.5");
      expect(screen.getByTestId("ns-ieee-result")).toBeTruthy();
    });

    it("produces a 32-bit IEEE754 representation for 12.5", () => {
      render(<IEEE754Converter />);
      const result = screen.getByTestId("ns-ieee-result");
      expect(result).toBeTruthy();
      expect(result.textContent).toContain("0");
      expect(result.textContent).toContain("10000010");
    });

    it("handles zero as a special case", () => {
      render(<IEEE754Converter />);
      const input = screen.getByTestId("ns-ieee-input");
      fireEvent.change(input, { target: { value: "0" } });
      const result = screen.getByTestId("ns-ieee-result");
      expect(result.textContent).toContain("00000000");
    });
  });

  describe("when switching to ieeeToDec mode", () => {
    it("changes input to 32-bit binary format", () => {
      render(<IEEE754Converter />);
      fireEvent.click(screen.getByTestId("ns-ieee-ieee-to-dec-button"));
      expect(screen.getByTestId("ns-ieee-input")).toBeTruthy();
    });

    it("decodes 01000001010010000000000000000000 to 12.5", () => {
      render(<IEEE754Converter />);
      fireEvent.click(screen.getByTestId("ns-ieee-ieee-to-dec-button"));
      const input = screen.getByTestId("ns-ieee-input");
      fireEvent.change(input, {
        target: { value: "01000001010010000000000000000000" },
      });
      expect(screen.getByTestId("ns-ieee-result").textContent).toContain(
        "12.5",
      );
    });
  });

  describe("when in exercise mode", () => {
    it("locks the input field when solution is hidden", () => {
      render(
        <IEEE754Converter
          isExerciseMode
          showSolution={false}
          onShowSolution={vi.fn()}
          initialValue="12.5"
        />,
      );
      const input = screen.getByTestId("ns-ieee-input");
      expect(input.hasAttribute("readonly")).toBe(true);
    });

    it("shows the validation panel when solution is hidden", () => {
      render(
        <IEEE754Converter
          isExerciseMode
          showSolution={false}
          onShowSolution={vi.fn()}
          initialValue="12.5"
        />,
      );
      expect(screen.getByTestId("mock-validation-panel")).toBeTruthy();
    });
  });

  describe("when initialized with exercise values", () => {
    it("sets the initial value and mode", () => {
      render(
        <IEEE754Converter
          initialValue="01000001010101000000000000000000"
          initialConverterMode="ieeeToDec"
        />,
      );
      expect(
        (screen.getByTestId("ns-ieee-input") as HTMLInputElement).value,
      ).toBe("01000001010101000000000000000000");
    });
  });
});
