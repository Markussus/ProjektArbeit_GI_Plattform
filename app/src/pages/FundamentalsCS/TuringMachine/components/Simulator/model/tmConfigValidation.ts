import type { TMConfig } from "../types";
import { isSingleTapeSymbol } from "../utils/tmSymbolValidation";

export function validateTMConfig(config: TMConfig): void {
  const errors: string[] = [];
  const states = new Set(config.states);
  const inputAlphabet = new Set(config.inputAlphabet);
  const tapeAlphabet = new Set(config.tapeAlphabet);

  validateStates(config, states, errors);
  validateAlphabets(config, inputAlphabet, tapeAlphabet, errors);
  validateInitialTape(config, inputAlphabet, errors);
  validateTransitions(config, states, tapeAlphabet, errors);

  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }
}

function validateStates(
  config: TMConfig,
  states: Set<string>,
  errors: string[],
): void {
  if (config.haltStates.length === 0) {
    errors.push("At least one halt state must be defined.");
  }

  if (!states.has(config.initialState)) {
    errors.push(
      `The initial state '${config.initialState}' must exist in the set of states.`,
    );
  }

  const invalidHaltStates = config.haltStates.filter(
    (state) => !states.has(state),
  );

  if (invalidHaltStates.length > 0) {
    errors.push(
      `All halt states must exist in the set of states. Invalid halt states: ${invalidHaltStates.join(", ")}.`,
    );
  }
}

function validateAlphabets(
  config: TMConfig,
  inputAlphabet: Set<string>,
  tapeAlphabet: Set<string>,
  errors: string[],
): void {
  if (!tapeAlphabet.has(config.blankSymbol)) {
    errors.push(
      `The blank symbol '${config.blankSymbol}' must be part of the tape alphabet.`,
    );
  }

  if (!isSingleTapeSymbol(config.blankSymbol)) {
    errors.push("The blank symbol must consist of exactly one character.");
  }

  const invalidTapeAlphabetSymbols = config.tapeAlphabet.filter(
    (symbol) => !isSingleTapeSymbol(symbol),
  );
  if (invalidTapeAlphabetSymbols.length > 0) {
    errors.push(
      `All tape alphabet symbols must consist of exactly one character. Invalid symbols: ${Array.from(new Set(invalidTapeAlphabetSymbols)).join(", ")}.`,
    );
  }

  // TODO check if blank is part of input alphabet or is forbidden in input alphabet

  void inputAlphabet;
}

function validateInitialTape(
  config: TMConfig,
  inputAlphabet: Set<string>,
  errors: string[],
): void {
  const invalidInitialTapeSymbols = config.initialTape.filter(
    (symbol) => !inputAlphabet.has(symbol) || !isSingleTapeSymbol(symbol),
  );

  if (invalidInitialTapeSymbols.length > 0) {
    errors.push(
      `All symbols on the initial tape must be part of the input alphabet. Invalid symbols: ${Array.from(new Set(invalidInitialTapeSymbols)).join(", ")}.`,
    );
  }
}

function validateTransitions(
  config: TMConfig,
  states: Set<string>,
  tapeAlphabet: Set<string>,
  errors: string[],
): void {
  for (const [readSymbol, stateTransitions] of Object.entries(
    config.transitions,
  )) {
    if (!tapeAlphabet.has(readSymbol)) {
      errors.push(
        `A transition is defined for read symbol '${readSymbol}', but this symbol is not part of the tape alphabet.`,
      );
    }

    if (!isSingleTapeSymbol(readSymbol)) {
      errors.push(
        `Transition read symbol '${readSymbol}' must consist of exactly one character.`,
      );
    }

    for (const [currentState, transition] of Object.entries(stateTransitions)) {
      if (!states.has(currentState)) {
        errors.push(
          `A transition is defined for state '${currentState}', but this state is not part of the set of states.`,
        );
      }

      if (!states.has(transition.nextState)) {
        errors.push(
          `Transition from state '${currentState}' on symbol '${readSymbol}' points to unknown next state '${transition.nextState}'.`,
        );
      }

      if (!tapeAlphabet.has(transition.writeSymbol)) {
        errors.push(
          `Transition from state '${currentState}' on symbol '${readSymbol}' writes unknown symbol '${transition.writeSymbol}'.`,
        );
      }

      if (!isSingleTapeSymbol(transition.writeSymbol)) {
        errors.push(
          `Transition from state '${currentState}' on symbol '${readSymbol}' must write exactly one character.`,
        );
      }
    }
  }
}
