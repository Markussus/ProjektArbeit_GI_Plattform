import type { TablePosition } from "@/components/shared/TableVisual/TableView";
import { readCurrentSymbol } from "../domain/tmMachine";
import { formatTMStateName, formatTMTransition } from "../domain/tmFormatting";
import type { TMProgram } from "../domain/tmProgram";
import type { TMRuntime } from "../domain/tmRuntime";
import type { StateName, TapeSymbol } from "../domain/tmTypes";

export function getOrderedTapeAlphabet(
  program: Pick<TMProgram, "blankSymbol" | "tapeAlphabet">,
): TapeSymbol[] {
  return [
    program.blankSymbol,
    ...program.tapeAlphabet.filter((symbol) => symbol !== program.blankSymbol),
  ];
}

export function buildTransitionTableHeaders(states: StateName[]): string[] {
  return ["\u03B4", ...states.map(formatTMStateName)];
}

export function buildTransitionTableRows(
  program: TMProgram,
  states: StateName[] = program.states,
): string[][] {
  return getOrderedTapeAlphabet(program).map((symbol) => [
    symbol,
    ...states.map((state) =>
      formatTMTransition(program.transitions[symbol]?.[state]),
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
