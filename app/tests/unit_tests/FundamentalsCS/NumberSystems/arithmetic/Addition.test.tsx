/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Addition } from "@/pages/FundamentalsCS/NumberSystems/components/simulator/arithmetic/Addition.tsx";
import {
  changeBinaryInput,
  expectInputsLocked,
  expectValidationResult,
  getInputs,
  renderArithmeticExercise,
} from "./arithmeticTestSetup.tsx";

vi.mock("react-i18next", async () => {
  const { mockReactI18next } = await import("./arithmeticTestSetup");
  return mockReactI18next();
});
vi.mock("@/components/shared/SimulatorShared", async () => {
  const { mockSimulatorShared } =
    await import("../../../shared/simulatorSharedMock");
  return mockSimulatorShared();
});
vi.mock(
  "@/components/shared/ExerciseValidationPanel/ExerciseValidationPanel",
  async () => {
    const { mockExerciseValidationPanel } =
      await import("./arithmeticTestSetup");
    return mockExerciseValidationPanel();
  },
);

describe("Addition", () => {
  afterEach(() => {
    cleanup();
  });

  describe("when rendering in free mode", () => {
    it("shows two binary inputs", () => {
      render(<Addition renderModeSelector={null} />);
      expect(getInputs().length).toBe(2);
    });

    it("defaults to 01100101 and 00111100", () => {
      render(<Addition renderModeSelector={null} />);
      const inputs = getInputs();
      expect(inputs[0].value).toBe("01100101");
      expect(inputs[1].value).toBe("00111100");
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
      render(
        <Addition
          initialA="10101010"
          initialB="01010101"
          renderModeSelector={null}
        />,
      );
      const inputs = getInputs();
      expect(inputs[0].value).toBe("10101010");
      expect(inputs[1].value).toBe("01010101");
    });
  });
});
