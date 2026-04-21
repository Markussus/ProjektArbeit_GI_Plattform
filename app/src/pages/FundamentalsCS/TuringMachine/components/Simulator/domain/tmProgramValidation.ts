import { isSingleTapeSymbol } from "../utils/tmSymbolValidation";
import type { TMProgram } from "./tmProgram";

export type TMProgramIssueCode =
  | "states_empty"
  | "initial_state_missing"
  | "halt_states_empty"
  | "halt_state_missing"
  | "blank_symbol_missing"
  | "blank_symbol_invalid"
  | "tape_symbol_invalid"
  | "initial_tape_invalid_symbol"
  | "transition_read_symbol_missing"
  | "transition_read_symbol_invalid"
  | "transition_state_missing"
  | "transition_next_state_missing"
  | "transition_write_symbol_missing"
  | "transition_write_symbol_invalid";

export interface TMProgramIssue {
  code: TMProgramIssueCode;
  path?: string;
  params?: Record<string, string>;
}

export function validateTMProgram(program: TMProgram): TMProgramIssue[] {
  const issues: TMProgramIssue[] = [];
  const states = new Set(program.states);
  const inputAlphabet = new Set(program.inputAlphabet);
  const tapeAlphabet = new Set(program.tapeAlphabet);

  validateStates(program, states, issues);
  validateAlphabet(program, tapeAlphabet, issues);
  validateInitialTape(program, inputAlphabet, issues);
  validateTransitions(program, states, tapeAlphabet, issues);

  return issues;
}

export function isTMProgramValid(program: TMProgram): boolean {
  return validateTMProgram(program).length === 0;
}

function validateStates(
  program: TMProgram,
  states: Set<string>,
  issues: TMProgramIssue[],
): void {
  if (program.states.length === 0) {
    issues.push({ code: "states_empty", path: "states" });
  }

  if (!states.has(program.initialState)) {
    issues.push({
      code: "initial_state_missing",
      path: "initialState",
      params: { state: program.initialState },
    });
  }

  if (program.haltStates.length === 0) {
    issues.push({ code: "halt_states_empty", path: "haltStates" });
  }

  for (const haltState of [...new Set(program.haltStates)]) {
    if (!states.has(haltState)) {
      issues.push({
        code: "halt_state_missing",
        path: "haltStates",
        params: { state: haltState },
      });
    }
  }
}

function validateAlphabet(
  program: TMProgram,
  tapeAlphabet: Set<string>,
  issues: TMProgramIssue[],
): void {
  if (!tapeAlphabet.has(program.blankSymbol)) {
    issues.push({
      code: "blank_symbol_missing",
      path: "blankSymbol",
      params: { symbol: program.blankSymbol },
    });
  }

  if (!isSingleTapeSymbol(program.blankSymbol)) {
    issues.push({
      code: "blank_symbol_invalid",
      path: "blankSymbol",
      params: { symbol: program.blankSymbol },
    });
  }

  for (const symbol of [...new Set(program.tapeAlphabet)]) {
    if (!isSingleTapeSymbol(symbol)) {
      issues.push({
        code: "tape_symbol_invalid",
        path: "tapeAlphabet",
        params: { symbol },
      });
    }
  }
}

function validateInitialTape(
  program: TMProgram,
  inputAlphabet: Set<string>,
  issues: TMProgramIssue[],
): void {
  for (const symbol of [...new Set(program.initialTape)]) {
    if (inputAlphabet.has(symbol) && isSingleTapeSymbol(symbol)) {
      continue;
    }

    issues.push({
      code: "initial_tape_invalid_symbol",
      path: "initialTape",
      params: { symbol },
    });
  }
}

function validateTransitions(
  program: TMProgram,
  states: Set<string>,
  tapeAlphabet: Set<string>,
  issues: TMProgramIssue[],
): void {
  for (const [readSymbol, stateTransitions] of Object.entries(
    program.transitions,
  )) {
    if (!tapeAlphabet.has(readSymbol)) {
      issues.push({
        code: "transition_read_symbol_missing",
        path: `transitions.${readSymbol}`,
        params: { symbol: readSymbol },
      });
    }

    if (!isSingleTapeSymbol(readSymbol)) {
      issues.push({
        code: "transition_read_symbol_invalid",
        path: `transitions.${readSymbol}`,
        params: { symbol: readSymbol },
      });
    }

    for (const [state, transition] of Object.entries(stateTransitions ?? {})) {
      if (!transition) {
        continue;
      }

      if (!states.has(state)) {
        issues.push({
          code: "transition_state_missing",
          path: `transitions.${readSymbol}.${state}`,
          params: { state, symbol: readSymbol },
        });
      }

      if (!states.has(transition.nextState)) {
        issues.push({
          code: "transition_next_state_missing",
          path: `transitions.${readSymbol}.${state}.nextState`,
          params: {
            state,
            symbol: readSymbol,
            nextState: transition.nextState,
          },
        });
      }

      if (!tapeAlphabet.has(transition.writeSymbol)) {
        issues.push({
          code: "transition_write_symbol_missing",
          path: `transitions.${readSymbol}.${state}.writeSymbol`,
          params: {
            state,
            symbol: readSymbol,
            writeSymbol: transition.writeSymbol,
          },
        });
      }

      if (!isSingleTapeSymbol(transition.writeSymbol)) {
        issues.push({
          code: "transition_write_symbol_invalid",
          path: `transitions.${readSymbol}.${state}.writeSymbol`,
          params: {
            state,
            symbol: readSymbol,
            writeSymbol: transition.writeSymbol,
          },
        });
      }
    }
  }
}
