import type { StateName, TMTransition } from "./tmTypes";

export function formatTMStateName(state: StateName): string {
  return state.replace(/\d+/g, (match) => {
    return match
      .split("")
      .map((digit) => String.fromCharCode(8320 + Number.parseInt(digit, 10)))
      .join("");
  });
}

export function formatTMTransition(transition?: TMTransition | null): string {
  if (!transition) {
    return "";
  }

  return `(${formatTMStateName(transition.nextState)}, ${transition.writeSymbol}, ${transition.movement})`;
}
