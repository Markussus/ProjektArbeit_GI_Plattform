import type { TablePosition } from "@/components/shared/TableVisual/TableView";
import { readCurrentSymbol } from "../domain/tmMachine";
import type { TMProgram } from "../domain/tmProgram";
import type { TMRuntime } from "../domain/tmRuntime";
import type { StateName, TapeSymbol, TMTransition } from "../domain/tmTypes";

export function getOrderedTapeAlphabet(
  program: Pick<TMProgram, "blankSymbol" | "tapeAlphabet">,
): TapeSymbol[] {
  return [
    program.blankSymbol,
    ...program.tapeAlphabet.filter((symbol) => symbol !== program.blankSymbol),
  ];
}

export function buildTransitionTableHeaders(states: StateName[]): string[] {
  return ["\u03B4", ...states.map(formatState)];
}

export function buildTransitionTableRows(program: TMProgram): string[][] {
  return getOrderedTapeAlphabet(program).map((symbol) => [
    symbol,
    ...program.states.map((state) =>
      formatTransition(program.transitions[symbol]?.[state]),
    ),
  ]);
}

export function getActiveTransitionCell(
  program: TMProgram,
  runtime: TMRuntime | null | undefined,
): TablePosition | null {
  if (!runtime) {
    return null;
  }

  const currentSymbol = readCurrentSymbol(program, runtime);
  const orderedTapeAlphabet = getOrderedTapeAlphabet(program);
  const symbolIndex = orderedTapeAlphabet.indexOf(currentSymbol);
  const stateIndex = program.states.indexOf(runtime.currentState);

  if (symbolIndex < 0 || stateIndex < 0) {
    return null;
  }

  return { row: symbolIndex, col: stateIndex + 1 };
}

function formatState(state: StateName): string {
  return state.replace(/\d+/g, (match) => {
    return match
      .split("")
      .map((digit) => String.fromCharCode(8320 + Number.parseInt(digit, 10)))
      .join("");
  });
}

function formatTransition(transition?: TMTransition): string {
  if (!transition) {
    return "";
  }

  return `(${transition.nextState}, ${transition.writeSymbol}, ${transition.movement})`;
}
