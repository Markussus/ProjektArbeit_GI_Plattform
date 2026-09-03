/** @vitest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import "./arithmeticTestSetup.tsx";
import { Multiplication } from "@/pages/FundamentalsCS/NumberSystems/components/simulator/arithmetic/Multiplication.tsx";
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

describe("Multiplication", () => {
  describe("when rendering in free mode", () => {
    it("shows two binary inputs", () => {
      render(<Multiplication renderModeSelector={null} />);
      expect(getInputs().length).toBe(2);
    });

    it("defaults to 1101 and 101", () => {
      expectDefaultsTo(Multiplication, "1101", "101");
    });
  });

  describe("when computing binary multiplication", () => {
    it("renders the result panel", () => {
      render(<Multiplication renderModeSelector={null} />);
      changeBinaryInput(0, "00000010");
      changeBinaryInput(1, "00000011");
      expect(screen.getByTestId("mock-result-panel")).toBeTruthy();
    });
  });

  describe("when in exercise mode", () => {
    it("locks both inputs", () => {
      renderArithmeticExercise(Multiplication, {
        initialA: "00000010",
        initialB: "00000011",
      });
      expectInputsLocked();
    });

    it("shows validation panel with expected product", () => {
      renderArithmeticExercise(Multiplication, {
        initialA: "00000010",
        initialB: "00000011",
      });
      expectValidationResult("110");
    });
  });

  describe("when initialized with values", () => {
    it("sets initial operand A and B", () => {
      expectInitializedValues(Multiplication, "10101010", "01010101");
    });
  });
});
