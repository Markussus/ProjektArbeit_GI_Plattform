// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useMooreSimulator } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/application/useMooreSimulator";
import { useMealySimulator } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/application/useMealySimulator";
import { defaultMooreProgram } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/config/defaultMooreProgram";
import { defaultMealyProgram } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/config/defaultMealyProgram";

describe("useMooreSimulator and useMealySimulator hooks", () => {
  describe("useMooreSimulator", () => {
    it("initializes runtime and steps through Moore program", () => {
      const program = {
        ...defaultMooreProgram,
        inputWord: ["0", "1"],
      };
      const { result } = renderHook(() => useMooreSimulator(program));

      expect(result.current.runtime.currentState).toBe("HALT");
      expect(result.current.runtime.inputPosition).toBe(0);

      act(() => {
        result.current.step();
      });

      expect(result.current.runtime.inputPosition).toBe(1);

      act(() => {
        result.current.step();
      });

      expect(result.current.runtime.inputPosition).toBe(2);
      expect(result.current.runtime.halted).toBe(true);

      act(() => {
        result.current.stepBack();
      });

      expect(result.current.runtime.inputPosition).toBe(1);

      act(() => {
        result.current.setSpeed(2);
      });
      expect(result.current.speed).toBe(2);

      act(() => {
        result.current.reset();
      });
      expect(result.current.runtime.inputPosition).toBe(0);
    });
  });

  describe("useMealySimulator", () => {
    it("initializes runtime and steps through Mealy program", () => {
      const program = {
        ...defaultMealyProgram,
        inputWord: ["0", "1"],
      };
      const { result } = renderHook(() => useMealySimulator(program));

      expect(result.current.runtime.currentState).toBe("START");
      expect(result.current.runtime.inputPosition).toBe(0);

      act(() => {
        result.current.step();
      });

      expect(result.current.runtime.inputPosition).toBe(1);
      expect(result.current.runtime.outputSymbols.length).toBe(1);

      act(() => {
        result.current.reset();
      });
      expect(result.current.runtime.inputPosition).toBe(0);
      expect(result.current.runtime.outputSymbols.length).toBe(0);
    });
  });
});
