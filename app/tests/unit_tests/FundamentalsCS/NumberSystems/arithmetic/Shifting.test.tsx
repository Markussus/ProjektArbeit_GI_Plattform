/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Shifting } from "@/pages/FundamentalsCS/NumberSystems/components/simulator/arithmetic/Shifting.tsx";
import { getInput } from "./arithmeticTestSetup.tsx";

vi.mock("react-i18next", async () => {
  const { mockReactI18next } = await import("./arithmeticTestSetup");
  return mockReactI18next();
});
vi.mock("@/components/shared/SimulatorShared", async () => {
  const { mockSimulatorShared } = await import("./arithmeticTestSetup");
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

describe("Shifting", () => {
  afterEach(() => {
    cleanup();
  });

  describe("when rendering in free mode", () => {
    it("shows binary input", () => {
      render(<Shifting renderModeSelector={null} />);
      expect(getInput()).toBeTruthy();
    });
  });

  describe("when in exercise mode", () => {
    it("locks the input", () => {
      render(
        <Shifting
          isExerciseMode
          showSolution={false}
          onShowSolution={vi.fn()}
          initialA="00001010"
          renderModeSelector={null}
        />,
      );
      expect(getInput().hasAttribute("readonly")).toBe(true);
    });

    it("shows validation panel with expected shift result", () => {
      render(
        <Shifting
          isExerciseMode
          showSolution={false}
          onShowSolution={vi.fn()}
          initialA="00000010"
          renderModeSelector={null}
        />,
      );
      expect(screen.getByTestId("mock-validation-panel")).toBeTruthy();
      expect(
        screen.getByTestId("mock-validation-expected-result").textContent,
      ).toContain("00001000");
    });
  });

  describe("when initialized with a value", () => {
    it("sets initial operand A", () => {
      render(<Shifting initialA="10101010" renderModeSelector={null} />);
      expect(getInput().value).toBe("10101010");
    });
  });
});
