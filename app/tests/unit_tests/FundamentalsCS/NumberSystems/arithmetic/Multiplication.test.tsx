/** @vitest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Multiplication } from "@/pages/FundamentalsCS/NumberSystems/components/simulator/arithmetic/Multiplication.tsx";
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

describe("Multiplication", () => {
  describe("when rendering in free mode", () => {
    it("shows two binary inputs", () => {
      render(<Multiplication renderModeSelector={null} />);
      expect(getInputs().length).toBe(2);
    });

    it("defaults to 1101 and 101", () => {
      render(<Multiplication renderModeSelector={null} />);
      const inputs = getInputs();
      expect(inputs[0].value).toBe("1101");
      expect(inputs[1].value).toBe("101");
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
      render(
        <Multiplication
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
