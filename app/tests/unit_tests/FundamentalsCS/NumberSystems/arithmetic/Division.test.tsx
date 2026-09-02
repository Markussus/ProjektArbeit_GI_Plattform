/** @vitest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import "./arithmeticTestSetup.tsx";
import { Division } from "@/pages/FundamentalsCS/NumberSystems/components/simulator/arithmetic/Division.tsx";
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

describe("Division", () => {
  describe("when rendering in free mode", () => {
    it("shows two binary inputs", () => {
      render(<Division renderModeSelector={null} />);
      expect(getInputs().length).toBe(2);
    });

    it("defaults to 11010 and 101", () => {
      expectDefaultsTo(Division, "11010", "101");
    });
  });

  describe("when computing binary division", () => {
    it("renders the result panel", () => {
      render(<Division renderModeSelector={null} />);
      changeBinaryInput(0, "00000100");
      changeBinaryInput(1, "00000010");
      expect(screen.getByTestId("mock-result-panel")).toBeTruthy();
    });
  });

  describe("when in exercise mode", () => {
    it("locks both inputs", () => {
      renderArithmeticExercise(Division, {
        initialA: "00000100",
        initialB: "00000010",
      });
      expectInputsLocked();
    });

    it("shows validation panel with expected quotient", () => {
      renderArithmeticExercise(Division, {
        initialA: "00000100",
        initialB: "00000010",
      });
      expectValidationResult("10");
    });
  });

  describe("when initialized with values", () => {
    it("sets initial operand A and B", () => {
      expectInitializedValues(Division, "10101010", "01010101");
    });
  });
});
