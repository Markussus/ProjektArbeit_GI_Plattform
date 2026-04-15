import type { StateName, TMTransition } from "../types";

export function formatState(state: StateName): string {
  return state.replace(/\d+/g, (match) => {
    return match
      .split("")
      .map((digit) => String.fromCharCode(8320 + Number.parseInt(digit, 10)))
      .join("");
  });
}

export function formatTransition(transition?: TMTransition): string {
  if (!transition) {
    return "";
  }

  return `(${transition.nextState}, ${transition.writeSymbol}, ${transition.movement})`;
}
