/** @vitest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Subtraction } from "@/pages/FundamentalsCS/NumberSystems/components/simulator/arithmetic/Subtraction.tsx";
import {
  changeBinaryInput,
  expectInputsLocked,
  expectValidationResult,
  getInputs,
  renderArithmeticExercise,
  setupArithmeticTests,
} from "./arithmeticTestSetup.tsx";
import { vi } from "vitest";

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

setupArithmeticTests();

describe("Subtraction", () => {
  describe("when rendering in free mode", () => {
    it("shows two binary inputs", () => {
      render(<Subtraction renderModeSelector={null} />);
      expect(getInputs().length).toBe(2);
    });

    it("defaults to 00101010 and 00001010", () => {
      render(<Subtraction renderModeSelector={null} />);
      const inputs = getInputs();
      expect(inputs[0].value).toBe("00101010");
      expect(inputs[1].value).toBe("00001010");
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
      render(
        <Subtraction
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
