/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Division } from "@/pages/FundamentalsCS/NumberSystems/components/simulator/arithmetic/Division.tsx";
import { getInputs } from "./arithmeticTestSetup.tsx";

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
      const inputs = getInputs();
      fireEvent.change(inputs[0], { target: { value: "00000100" } });
      fireEvent.change(inputs[1], { target: { value: "00000010" } });
      expect(screen.getByTestId("mock-result-panel")).toBeTruthy();
    });
  });

  describe("when in exercise mode", () => {
    it("locks both inputs", () => {
      render(
        <Division
          isExerciseMode
          showSolution={false}
          onShowSolution={vi.fn()}
          initialA="00000100"
          initialB="00000010"
          renderModeSelector={null}
        />,
      );
      const inputs = getInputs();
      expect(inputs[0].hasAttribute("readonly")).toBe(true);
      expect(inputs[1].hasAttribute("readonly")).toBe(true);
    });

    it("shows validation panel with expected quotient", () => {
      render(
        <Division
          isExerciseMode
          showSolution={false}
          onShowSolution={vi.fn()}
          initialA="00000100"
          initialB="00000010"
          renderModeSelector={null}
        />,
      );
      expect(screen.getByTestId("mock-validation-panel")).toBeTruthy();
      expect(
        screen.getByTestId("mock-validation-expected-result").textContent,
      ).toContain("10");
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
