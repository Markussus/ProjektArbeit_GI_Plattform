import { describe, expect, it } from "vitest";
import { tmEditorReducer } from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/application/tmEditorReducer";
import {
  formatTMStateName,
  formatTMTransition,
  normalizeTMStateName,
} from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/domain/tmFormatting";
import type { TMProgram } from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/domain/tmProgram";

describe("tmFormatting", () => {
  describe("formatTMStateName", () => {
    it("formats digits in state names as unicode subscripts", () => {
      expect(formatTMStateName("q10")).toBe("q\u2081\u2080");
      expect(formatTMStateName("halt")).toBe("halt");
    });
  });

  describe("normalizeTMStateName", () => {
    it("normalizes formatted state names back to ASCII", () => {
      expect(normalizeTMStateName("q₀")).toBe("q0");
      expect(normalizeTMStateName("qA₁₂")).toBe("qA12");
      expect(normalizeTMStateName(formatTMStateName("q123"))).toBe("q123");
    });

    it("stores pasted subscript state names as ASCII everywhere", () => {
      const program: TMProgram = {
        states: ["q0", "q1"],
        inputAlphabet: ["0"],
        tapeAlphabet: ["0"],
        blankSymbol: "0",
        initialState: "q0",
        haltStates: ["q0"],
        initialTape: ["0"],
        transitions: {
          "0": {
            q0: { nextState: "q0", writeSymbol: "0", movement: "N" },
            q1: { nextState: "q0", writeSymbol: "0", movement: "N" },
          },
        },
      };

      const renamed = tmEditorReducer(program, {
        type: "rename_state",
        currentState: "q0",
        nextState: "q₂",
      });

      expect(renamed.states).toEqual(["q2", "q1"]);
      expect(renamed.haltStates).toEqual(["q2"]);
      expect(renamed.initialState).toBe("q2");
      expect(renamed.transitions["0"]).toEqual({
        q2: { nextState: "q2", writeSymbol: "0", movement: "N" },
        q1: { nextState: "q2", writeSymbol: "0", movement: "N" },
      });
    });
  });

  describe("formatTMTransition", () => {
    it("formats transitions with a formatted next state", () => {
      expect(
        formatTMTransition({
          nextState: "q10",
          writeSymbol: "1",
          movement: "L",
        }),
      ).toBe("(q\u2081\u2080, 1, L)");
    });

    it("returns an empty string for a missing transition", () => {
      expect(formatTMTransition()).toBe("");
      expect(formatTMTransition(null)).toBe("");
    });
  });
});
