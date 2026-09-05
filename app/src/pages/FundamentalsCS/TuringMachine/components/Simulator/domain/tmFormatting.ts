import type { StateName, TMTransition } from "./tmTypes";

const SUBSCRIPT_ZERO_CODE_POINT = 0x2080;

export function formatTMStateName(state: StateName): string {
  return state.replace(/\d+/g, (match) => {
    return match
      .split("")
      .map((digit) =>
        String.fromCharCode(
          SUBSCRIPT_ZERO_CODE_POINT + Number.parseInt(digit, 10),
        ),
      )
      .join("");
  });
}

export function normalizeTMStateName(state: StateName): StateName {
  return state.replace(/[₀-₉]/g, (digit) =>
    String.fromCharCode(
      "0".charCodeAt(0) + digit.charCodeAt(0) - SUBSCRIPT_ZERO_CODE_POINT,
    ),
  );
}

export function formatTMTransition(transition?: TMTransition | null): string {
  if (!transition) {
    return "";
  }

  return `(${formatTMStateName(transition.nextState)}, ${transition.writeSymbol}, ${transition.movement})`;
}
