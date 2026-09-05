/** @vitest-environment jsdom */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import "./arithmeticTestSetup.tsx";
import { Addition } from "@/pages/FundamentalsCS/NumberSystems/components/simulator/arithmetic/Addition.tsx";
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

describe("Addition", () => {
  describe("when rendering in free mode", () => {
    it("shows two binary inputs", () => {
      render(<Addition renderModeSelector={null} />);
      expect(getInputs().length).toBe(2);
    });

    it("defaults to 01100101 and 00111100", () => {
      expectDefaultsTo(Addition, "01100101", "00111100");
    });
  });

  describe("when computing binary addition", () => {
    it("renders the result panel", () => {
      render(<Addition renderModeSelector={null} />);
      changeBinaryInput(0, "00000001");
      changeBinaryInput(1, "00000001");
      expect(screen.getByTestId("mock-result-panel")).toBeTruthy();
    });
  });

  describe("when in exercise mode", () => {
    it("locks both inputs", () => {
      renderArithmeticExercise(Addition, {
        initialA: "00001010",
        initialB: "00000101",
      });
      expectInputsLocked();
    });

    it("shows validation panel with expected sum", () => {
      renderArithmeticExercise(Addition, {
        initialA: "00001010",
        initialB: "00000101",
      });
      expectValidationResult("00001111");
    });
  });

  describe("when initialized with values", () => {
    it("sets initial operand A and B", () => {
      expectInitializedValues(Addition, "10101010", "01010101");
    });
  });

  describe("step-by-step explanation", () => {
    it("shows collapsible steps after toggling step-by-step", () => {
      render(<Addition renderModeSelector={null} />);
      fireEvent.click(screen.getByTestId("mock-step-toggle"));
      expect(
        screen.getAllByTestId("mock-collapsible-step").length,
      ).toBeGreaterThan(0);
    });

    it("renders step content including carry-out for a step", () => {
      render(
        <Addition
          initialA="00000001"
          initialB="00000001"
          renderModeSelector={null}
        />,
      );
      fireEvent.click(screen.getByTestId("mock-step-toggle"));
      const headers = screen.getAllByTestId("mock-step-header");
      expect(headers.length).toBeGreaterThan(0);
    });
  });

  describe("result warnings", () => {
    it("shows a carry-out warning when the sum exceeds 8 bits", () => {
      render(
        <Addition
          initialA="11111111"
          initialB="00000001"
          renderModeSelector={null}
        />,
      );
      expect(screen.getByTestId("mock-warning-banner")).toBeTruthy();
    });

    it("shows an overflow warning for two negative-looking operands", () => {
      render(
        <Addition
          initialA="10000000"
          initialB="10000000"
          renderModeSelector={null}
        />,
      );
      const banners = screen.getAllByTestId("mock-warning-banner");
      expect(banners.length).toBeGreaterThanOrEqual(1);
    });
  });
});
