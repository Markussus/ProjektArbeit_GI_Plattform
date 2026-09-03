// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useMooreProgramEditor } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/application/useMooreProgramEditor";
import { useMealyProgramEditor } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/application/useMealyProgramEditor";
import { defaultMooreProgram } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/config/defaultMooreProgram";
import { defaultMealyProgram } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/config/defaultMealyProgram";

describe("useMooreProgramEditor and useMealyProgramEditor hooks", () => {
  describe("useMooreProgramEditor", () => {
    it("handles all editor actions correctly", () => {
      const { result } = renderHook(() =>
        useMooreProgramEditor(defaultMooreProgram),
      );

      expect(result.current.issues).toHaveLength(0);

      act(() => {
        result.current.handleTransitionChange("0", "HALT", "READY");
      });
      expect(result.current.program.transitions["0"].HALT).toBe("READY");

      act(() => {
        const added = result.current.handleAddState("CUSTOM_ST");
        expect(added).toBe("CUSTOM_ST");
      });
      expect(result.current.program.states).toContain("CUSTOM_ST");

      act(() => {
        const success = result.current.handleStateRename(
          "CUSTOM_ST",
          "RENAMED_ST",
        );
        expect(success).toBe(true);
      });
      expect(result.current.program.states).toContain("RENAMED_ST");

      act(() => {
        result.current.handleRemoveState("RENAMED_ST");
      });
      expect(result.current.program.states).not.toContain("RENAMED_ST");

      act(() => {
        result.current.handleAddInputSymbol();
      });
      expect(result.current.program.inputSymbols).toContain("10");

      act(() => {
        const success = result.current.handleInputSymbolRename("10", "alpha");
        expect(success).toBe(true);
      });
      expect(result.current.program.inputSymbols).toContain("alpha");

      act(() => {
        result.current.handleRemoveInputSymbol("alpha");
      });
      expect(result.current.program.inputSymbols).not.toContain("alpha");

      act(() => {
        result.current.handleOutputSymbolChange("HALT", "OUT_0");
      });
      expect(result.current.program.outputs.HALT.symbol).toBe("OUT_0");

      act(() => {
        result.current.handleOutputCodeChange("HALT", 12);
      });
      expect(result.current.program.outputs.HALT.code).toBe(12);

      act(() => {
        result.current.handleOutputSymbolCreate("HALT", "NEW_OUT");
      });
      expect(result.current.program.outputs.HALT.symbol).toBe("NEW_OUT");
    });
  });

  describe("useMealyProgramEditor", () => {
    it("handles all Mealy editor actions correctly", () => {
      const { result } = renderHook(() =>
        useMealyProgramEditor(defaultMealyProgram),
      );

      expect(result.current.issues).toHaveLength(0);

      act(() => {
        result.current.handleTransitionChange("0", "START", "SEEN_1");
      });
      expect(result.current.program.transitions["0"].START).toBe("SEEN_1");

      act(() => {
        const added = result.current.handleAddState("M_STATE");
        expect(added).toBe("M_STATE");
      });
      expect(result.current.program.states).toContain("M_STATE");

      act(() => {
        const success = result.current.handleStateRename(
          "M_STATE",
          "M_RENAMED",
        );
        expect(success).toBe(true);
      });
      expect(result.current.program.states).toContain("M_RENAMED");

      act(() => {
        result.current.handleRemoveState("M_RENAMED");
      });
      expect(result.current.program.states).not.toContain("M_RENAMED");

      act(() => {
        result.current.handleAddInputSymbol();
      });
      expect(result.current.program.inputSymbols).toContain("10");

      act(() => {
        const success = result.current.handleInputSymbolRename("10", "alpha");
        expect(success).toBe(true);
      });
      expect(result.current.program.inputSymbols).toContain("alpha");

      act(() => {
        result.current.handleRemoveInputSymbol("alpha");
      });
      expect(result.current.program.inputSymbols).not.toContain("alpha");

      act(() => {
        result.current.handleOutputSymbolChange("0", "START", "O_NEW");
        result.current.handleOutputCodeChange("0", "START", 55);
      });
      expect(result.current.program.outputs["0"].START.symbol).toBe("O_NEW");
      expect(result.current.program.outputs["0"].START.code).toBe(55);
    });

    it("normalizes optional names and rejects invalid renames", () => {
      const { result } = renderHook(() =>
        useMealyProgramEditor(defaultMealyProgram),
      );

      act(() => {
        expect(result.current.handleStateRename("START", "SEEN_1")).toBe(false);
        expect(result.current.handleInputSymbolRename("0", "1")).toBe(false);
        expect(result.current.handleOutputSymbolRename("NO_MATCH", "")).toBe(
          false,
        );
      });

      let generatedState = "";
      act(() => {
        generatedState = result.current.handleAddState(" START ");
      });
      expect(generatedState).not.toBe("START");
      expect(result.current.program.states).toContain(generatedState);

      act(() => {
        result.current.handleOutputSymbolChange("0", "START", "MATCH_101");
      });
      expect(result.current.program.outputs["0"].START.code).toBe(1);

      act(() => {
        result.current.handleOutputSymbolCreate("0", "START", "   ");
      });
      expect(result.current.program.outputs["0"].START.symbol).toMatch(
        /^OUT_\d+$/,
      );
    });
  });
});
