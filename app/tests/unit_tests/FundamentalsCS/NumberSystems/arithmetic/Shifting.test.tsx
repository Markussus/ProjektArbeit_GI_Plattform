/** @vitest-environment jsdom */

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "./arithmeticTestSetup.tsx";
import { Shifting } from "@/pages/FundamentalsCS/NumberSystems/components/simulator/arithmetic/Shifting.tsx";
import {
  expectInputLocked,
  expectValidationResult,
  getInput,
} from "./arithmeticTestSetup.tsx";

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
      expectInputLocked();
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
      expectValidationResult("00001000");
    });
  });

  describe("when initialized with a value", () => {
    it("sets initial operand A", () => {
      render(<Shifting initialA="10101010" renderModeSelector={null} />);
      expect(getInput().value).toBe("10101010");
    });
  });
});
