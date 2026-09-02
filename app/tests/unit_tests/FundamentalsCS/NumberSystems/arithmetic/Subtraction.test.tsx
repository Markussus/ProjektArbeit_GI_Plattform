/** @vitest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import "./arithmeticTestSetup.tsx";
import { Subtraction } from "@/pages/FundamentalsCS/NumberSystems/components/simulator/arithmetic/Subtraction.tsx";
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

describe("Subtraction", () => {
  describe("when rendering in free mode", () => {
    it("shows two binary inputs", () => {
      render(<Subtraction renderModeSelector={null} />);
      expect(getInputs().length).toBe(2);
    });

    it("defaults to 00101010 and 00001010", () => {
      expectDefaultsTo(Subtraction, "00101010", "00001010");
    });
  });

  describe("when computing binary subtraction", () => {
    it("renders the result panel", () => {
      render(<Subtraction renderModeSelector={null} />);
      changeBinaryInput(0, "00000010");
      changeBinaryInput(1, "00000001");
      expect(screen.getByTestId("mock-result-panel")).toBeTruthy();
    });
  });

  describe("when in exercise mode", () => {
    it("locks both inputs", () => {
      renderArithmeticExercise(Subtraction, {
        initialA: "00001010",
        initialB: "00000101",
      });
      expectInputsLocked();
    });

    it("shows validation panel with expected difference", () => {
      renderArithmeticExercise(Subtraction, {
        initialA: "00001010",
        initialB: "00000101",
      });
      expectValidationResult("00000101");
    });
  });

  describe("when initialized with values", () => {
    it("sets initial operand A and B", () => {
      expectInitializedValues(Subtraction, "10101010", "01010101");
    });
  });
});
