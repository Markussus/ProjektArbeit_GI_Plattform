/** @vitest-environment jsdom */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import "./arithmeticTestSetup.tsx";
import { Compare } from "@/pages/FundamentalsCS/NumberSystems/components/simulator/arithmetic/Compare.tsx";
import {
  changeBinaryInput,
  expectDefaultsTo,
  expectInitializedValues,
  expectInputsLocked,
  expectValidationResult,
  getInputs,
  renderArithmeticExercise,
  setupArithmeticTests,
} from "./arithmeticTestSetup.tsx";

setupArithmeticTests();

describe("Compare", () => {
  describe("when rendering in free mode", () => {
    it("shows two binary inputs", () => {
      render(<Compare renderModeSelector={null} />);
      expect(getInputs().length).toBe(2);
    });

    it("defaults to 10110 and 10011", () => {
      expectDefaultsTo(Compare, "10110", "10011");
    });
  });

  describe("when comparing binary numbers", () => {
    it("renders the result panel", () => {
      render(<Compare renderModeSelector={null} />);
      changeBinaryInput(0, "00000100");
      changeBinaryInput(1, "00000010");
      expect(screen.getByTestId("mock-result-panel")).toBeTruthy();
    });

    it("shows the greater result when A is larger", () => {
      render(<Compare renderModeSelector={null} />);
      changeBinaryInput(0, "00000100");
      changeBinaryInput(1, "00000010");
      expect(
        screen.getByText(
          "number-systems.simulator.arithmetic.compare.resultGreater",
        ),
      ).toBeTruthy();
    });

    it("shows the less result when A is smaller", () => {
      render(<Compare renderModeSelector={null} />);
      changeBinaryInput(0, "00000010");
      changeBinaryInput(1, "00000100");
      expect(
        screen.getByText(
          "number-systems.simulator.arithmetic.compare.resultLess",
        ),
      ).toBeTruthy();
    });

    it("shows the equal result when both operands are identical", () => {
      render(<Compare renderModeSelector={null} />);
      changeBinaryInput(0, "00000100");
      changeBinaryInput(1, "00000100");
      expect(
        screen.getByText(
          "number-systems.simulator.arithmetic.compare.resultEq",
        ),
      ).toBeTruthy();
    });

    it("renders step-by-step comparison headers", () => {
      render(<Compare renderModeSelector={null} />);
      changeBinaryInput(0, "00000100");
      changeBinaryInput(1, "00000010");
      fireEvent.click(screen.getByTestId("mock-step-toggle"));
      const headers = screen.getAllByTestId("mock-step-header");
      expect(headers.length).toBeGreaterThan(0);
    });
  });

  describe("when in exercise mode", () => {
    it("locks both inputs", () => {
      renderArithmeticExercise(Compare, {
        initialA: "00000100",
        initialB: "00000010",
      });
      expectInputsLocked();
    });

    it("shows validation panel with expected comparison result", () => {
      renderArithmeticExercise(Compare, {
        initialA: "00000100",
        initialB: "00000010",
      });
      expectValidationResult(">");
    });
  });

  describe("when initialized with values", () => {
    it("sets initial operand A and B", () => {
      expectInitializedValues(Compare, "10101010", "01010101");
    });
  });
});
