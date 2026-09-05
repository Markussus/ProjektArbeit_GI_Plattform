import type { StateName, TapeSymbol, TMTransition } from "./tmTypes";

export type TransitionTable = Partial<
  Record<TapeSymbol, Partial<Record<StateName, TMTransition>>>
>;

export interface TMProgram {
  states: StateName[];
  inputAlphabet: TapeSymbol[];
  tapeAlphabet: TapeSymbol[];
  blankSymbol: TapeSymbol;
  initialState: StateName;
  haltStates: StateName[];
  transitions: TransitionTable;
  initialTape: TapeSymbol[];
}

export function deriveInputAlphabet(
  program: Pick<TMProgram, "initialTape">,
): TapeSymbol[] {
  return collectUniqueSymbols(program.initialTape);
}

export function deriveTapeAlphabet(
  program: Pick<
    TMProgram,
    "blankSymbol" | "initialTape" | "tapeAlphabet" | "transitions"
  >,
): TapeSymbol[] {
  const symbols: TapeSymbol[] = [];

  appendUniqueSymbols(symbols, program.tapeAlphabet);
  appendUniqueSymbols(symbols, program.initialTape);
  appendUniqueSymbols(symbols, [program.blankSymbol]);

  for (const [readSymbol, stateTransitions] of Object.entries(
    program.transitions,
  )) {
    appendUniqueSymbols(symbols, [readSymbol]);

    for (const transition of Object.values(stateTransitions ?? {})) {
      if (!transition) {
        continue;
      }

      appendUniqueSymbols(symbols, [transition.writeSymbol]);
    }
  }

  return symbols;
}

export function withDerivedAlphabets(program: TMProgram): TMProgram {
  return {
    ...program,
    inputAlphabet: deriveInputAlphabet(program),
  };
}

function collectUniqueSymbols(symbols: TapeSymbol[]): TapeSymbol[] {
  const uniqueSymbols: TapeSymbol[] = [];

  appendUniqueSymbols(uniqueSymbols, symbols);

  return uniqueSymbols;
}

function appendUniqueSymbols(
  target: TapeSymbol[],
  symbols: TapeSymbol[],
): void {
  for (const symbol of symbols) {
    if (target.includes(symbol)) {
      continue;
    }

    target.push(symbol);
  }
}
