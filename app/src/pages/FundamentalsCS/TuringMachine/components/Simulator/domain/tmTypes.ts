export type HeadMovement = "L" | "R" | "N";

export type StateName = string;
export type TapeSymbol = string;

export interface TMTransition {
  nextState: StateName;
  writeSymbol: TapeSymbol;
  movement: HeadMovement;
}

export const DEFAULT_BLANK_SYMBOL: TapeSymbol = "\u25CA";
const BLANK_SYMBOL_INPUT_ALIAS = "<>";

export function isSingleTapeSymbol(value: string): boolean {
  return Array.from(value).length === 1;
}

export function normalizeTapeSymbolInput(value: string): TapeSymbol {
  const normalizedValue = value.trim();

  return normalizedValue === BLANK_SYMBOL_INPUT_ALIAS
    ? DEFAULT_BLANK_SYMBOL
    : normalizedValue;
}

export function parseTapeInput(value: string): TapeSymbol[] {
  const symbols: TapeSymbol[] = [];
  let index = 0;

  while (index < value.length) {
    if (value.startsWith(BLANK_SYMBOL_INPUT_ALIAS, index)) {
      symbols.push(DEFAULT_BLANK_SYMBOL);
      index += BLANK_SYMBOL_INPUT_ALIAS.length;
      continue;
    }

    const [symbol] = Array.from(value.slice(index));
    if (!symbol) {
      break;
    }

    symbols.push(symbol);
    index += symbol.length;
  }

  return symbols;
}
