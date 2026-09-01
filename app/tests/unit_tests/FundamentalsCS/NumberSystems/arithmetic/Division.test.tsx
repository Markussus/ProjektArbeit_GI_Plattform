/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Division } from "@/pages/FundamentalsCS/NumberSystems/components/simulator/arithmetic/Division.tsx";
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

describe("Division", () => {
  afterEach(() => {
    cleanup();
  });

  describe("when rendering in free mode", () => {
    it("shows two binary inputs", () => {
      render(<Division renderModeSelector={null} />);
      expect(getInputs().length).toBe(2);
    });

    it("defaults to 11010 and 101", () => {
      render(<Division renderModeSelector={null} />);
      const inputs = getInputs();
      expect(inputs[0].value).toBe("11010");
      expect(inputs[1].value).toBe("101");
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
      render(
        <Division
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
