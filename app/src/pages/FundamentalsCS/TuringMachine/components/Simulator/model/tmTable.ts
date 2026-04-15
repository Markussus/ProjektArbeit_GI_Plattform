import type { TablePosition } from "@/components/shared/TableVisual/TableView";
import type { StateName, TMConfig, TMState, TapeSymbol } from "../types";
import { formatState, formatTransition } from "../utils/tmFormatting";
import { readTapeSymbol } from "./tmState";

export function getOrderedTapeAlphabet(
  // Extract only the required properties from TMConfig with Pick<Type, Keys>
  config: Pick<TMConfig, "blankSymbol" | "tapeAlphabet">,
): TapeSymbol[] {
  return [
    config.blankSymbol,
    ...config.tapeAlphabet.filter((symbol) => symbol !== config.blankSymbol),
  ];
}

export function buildTransitionTableHeaders(states: StateName[]): string[] {
  return ["δ", ...states.map(formatState)];
}

export function buildTransitionTableRows(config: TMConfig): string[][] {
  return getOrderedTapeAlphabet(config).map((symbol) => [
    symbol,
    ...config.states.map((state) =>
      formatTransition(config.transitions[symbol]?.[state]),
    ),
  ]);
}

export function getActiveTransitionCell(
  config: TMConfig,
  currentState: TMState | null | undefined,
): TablePosition | null {
  if (!currentState) {
    return null;
  }

  const currentSymbol = readTapeSymbol(
    currentState.tape,
    currentState.headPosition,
    config.blankSymbol,
  );
  const orderedTapeAlphabet = getOrderedTapeAlphabet(config);
  const symbolIndex = orderedTapeAlphabet.indexOf(currentSymbol);
  const stateIndex = config.states.indexOf(currentState.currentState);

  if (symbolIndex < 0 || stateIndex < 0) {
    return null;
  }

  return { row: symbolIndex, col: stateIndex + 1 };
}
