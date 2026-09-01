/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
