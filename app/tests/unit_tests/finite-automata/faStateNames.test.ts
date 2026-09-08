import { describe, expect, it } from "vitest";
import { canonicalizeTargetStates } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faStateNames";

const HAND_BUILT = ["S0", "S1", "S2"];
// What the grammar converter produces: non-terminals verbatim plus its own
// lowercase final state.
const FROM_GRAMMAR = ["S", "A", "sF"];

describe("canonicalizeTargetStates", () => {
  it("snaps a lowercase target onto the real state", () => {
    expect(canonicalizeTargetStates("s0", HAND_BUILT)).toBe("S0");
  });

  it("snaps every target in a list", () => {
    expect(canonicalizeTargetStates("s0, s1", HAND_BUILT)).toBe("S0, S1");
  });

  it("leaves a correctly typed target untouched", () => {
    expect(canonicalizeTargetStates("S1", HAND_BUILT)).toBe("S1");
  });

  it("restores the grammar converter's lowercase final state", () => {
    // The case a plain toUpperCase() would break: "SF" matches no state.
    expect(canonicalizeTargetStates("sf", FROM_GRAMMAR)).toBe("sF");
    expect(canonicalizeTargetStates("SF", FROM_GRAMMAR)).toBe("sF");
  });

  it("does not uppercase a state that is genuinely lowercase", () => {
    expect(canonicalizeTargetStates("sF", FROM_GRAMMAR)).toBe("sF");
  });

  it("leaves an unknown target as typed, so validation still reports it", () => {
    expect(canonicalizeTargetStates("q9", HAND_BUILT)).toBe("q9");
  });

  it("leaves a token alone when two states differ only in case", () => {
    expect(canonicalizeTargetStates("sf", ["sF", "SF"])).toBe("sf");
  });

  it("preserves the spacing around the targets it rewrites", () => {
    expect(canonicalizeTargetStates(" s0 , s1 ", HAND_BUILT)).toBe(" S0 , S1 ");
  });

  it("passes an empty or partial cell straight through", () => {
    expect(canonicalizeTargetStates("", HAND_BUILT)).toBe("");
    expect(canonicalizeTargetStates("s0, ", HAND_BUILT)).toBe("S0, ");
  });
});
