/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Compare } from "@/pages/FundamentalsCS/NumberSystems/components/simulator/arithmetic/Compare.tsx";
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

describe("Compare", () => {
  afterEach(() => {
    cleanup();
  });

  describe("when rendering in free mode", () => {
    it("shows two binary inputs", () => {
      render(<Compare renderModeSelector={null} />);
      expect(getInputs().length).toBe(2);
    });

    it("defaults to 10110 and 10011", () => {
      render(<Compare renderModeSelector={null} />);
      const inputs = getInputs();
      expect(inputs[0].value).toBe("10110");
      expect(inputs[1].value).toBe("10011");
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
      render(
        <Compare
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
