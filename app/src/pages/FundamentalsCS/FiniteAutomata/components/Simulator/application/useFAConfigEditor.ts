import { useCallback, useMemo, useReducer } from "react";
import type {
  FAProgram,
  AutomatonType,
  FATransitionMap,
} from "../domain/faTypes";
import { validateFAProgram } from "../domain/faProgramValidation";
import type { FAProgramIssue } from "../domain/faProgramValidation";
import {
  buildTransitionTableHeaders,
  buildTransitionTableRows,
} from "../adapters/faTableAdapter";

// --- Reducer ---

type EditorAction =
  | { type: "SET_AUTOMATON_TYPE"; payload: AutomatonType }
  | { type: "SET_STATES"; payload: string }
  | { type: "SET_ALPHABET"; payload: string }
  | { type: "SET_START_STATE"; payload: string }
  | { type: "SET_ACCEPT_STATES"; payload: string }
  | { type: "SET_TRANSITION"; from: string; symbol: string; targets: string }
  | { type: "RESET"; payload: FAProgram };

function parseCSV(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function pruneTransitions(
  transitions: FATransitionMap,
  validStates: string[],
  validSymbols: string[],
): FATransitionMap {
  const pruned: FATransitionMap = {};
  const stateSet = new Set(validStates);
  const symbolSet = new Set(validSymbols);

  for (const fromState of validStates) {
    const symMap = transitions[fromState];
    if (!symMap) {
      pruned[fromState] = {};
      continue;
    }

    const filtered: Record<string, string[]> = {};
    for (const symbol of Object.keys(symMap)) {
      if (!symbolSet.has(symbol) && symbol !== "ε") continue;
      const targets = (symMap[symbol] || []).filter((t) => stateSet.has(t));
      if (targets.length > 0) {
        filtered[symbol] = targets;
      }
    }
    pruned[fromState] = filtered;
  }

  return pruned;
}

function editorReducer(state: FAProgram, action: EditorAction): FAProgram {
  switch (action.type) {
    case "SET_AUTOMATON_TYPE":
      return { ...state, type: action.payload };
    case "SET_STATES": {
      const states = parseCSV(action.payload);
      const acceptStates = state.acceptStates.filter((s) => states.includes(s));
      const startState = states.includes(state.startState)
        ? state.startState
        : states[0] || "";
      const transitions = pruneTransitions(
        state.transitions,
        states,
        state.alphabet,
      );
      return { ...state, states, acceptStates, startState, transitions };
    }
    case "SET_ALPHABET": {
      const alphabet = parseCSV(action.payload);
      const transitions = pruneTransitions(
        state.transitions,
        state.states,
        alphabet,
      );
      return { ...state, alphabet, transitions };
    }
    case "SET_START_STATE":
      return { ...state, startState: action.payload.trim() };
    case "SET_ACCEPT_STATES": {
      const acceptStates = parseCSV(action.payload);
      return { ...state, acceptStates };
    }
    case "SET_TRANSITION": {
      const targets = parseCSV(action.targets);
      const newTransitions: FATransitionMap = { ...state.transitions };
      if (!newTransitions[action.from]) {
        newTransitions[action.from] = {};
      }
      const updatedRow = { ...newTransitions[action.from] };
      if (targets.length === 0) {
        delete updatedRow[action.symbol];
      } else {
        updatedRow[action.symbol] = targets;
      }
      newTransitions[action.from] = updatedRow;
      return { ...state, transitions: newTransitions };
    }
    case "RESET":
      return action.payload;
    default:
      return state;
  }
}

// --- Hook ---

export interface UseFAConfigEditorResult {
  draft: FAProgram;
  validationIssues: FAProgramIssue[];
  isValid: boolean;
  tableHeaders: string[];
  tableRows: string[][];

  setAutomatonType: (type: AutomatonType) => void;
  setStates: (value: string) => void;
  setAlphabet: (value: string) => void;
  setStartState: (value: string) => void;
  setAcceptStates: (value: string) => void;
  setTransition: (from: string, symbol: string, targets: string) => void;

  applyProgram: () => { ok: true; program: FAProgram } | { ok: false };
  resetToProgram: (program: FAProgram) => void;
}

export function useFAConfigEditor(
  initialProgram: FAProgram,
): UseFAConfigEditorResult {
  const [draft, dispatch] = useReducer(editorReducer, initialProgram);

  const validationIssues = useMemo(() => validateFAProgram(draft), [draft]);
  const isValid = validationIssues.length === 0;

  const tableHeaders = useMemo(
    () => buildTransitionTableHeaders(draft.states),
    [draft.states],
  );
  const tableRows = useMemo(() => buildTransitionTableRows(draft), [draft]);

  const setAutomatonType = useCallback(
    (type: AutomatonType) =>
      dispatch({ type: "SET_AUTOMATON_TYPE", payload: type }),
    [],
  );
  const setStates = useCallback(
    (value: string) => dispatch({ type: "SET_STATES", payload: value }),
    [],
  );
  const setAlphabet = useCallback(
    (value: string) => dispatch({ type: "SET_ALPHABET", payload: value }),
    [],
  );
  const setStartState = useCallback(
    (value: string) => dispatch({ type: "SET_START_STATE", payload: value }),
    [],
  );
  const setAcceptStates = useCallback(
    (value: string) => dispatch({ type: "SET_ACCEPT_STATES", payload: value }),
    [],
  );
  const setTransition = useCallback(
    (from: string, symbol: string, targets: string) =>
      dispatch({ type: "SET_TRANSITION", from, symbol, targets }),
    [],
  );

  const applyProgram = useCallback(():
    | { ok: true; program: FAProgram }
    | { ok: false } => {
    const issues = validateFAProgram(draft);
    if (issues.length > 0) {
      return { ok: false };
    }
    return { ok: true, program: { ...draft } };
  }, [draft]);

  const resetToProgram = useCallback((program: FAProgram) => {
    dispatch({ type: "RESET", payload: program });
  }, []);

  return {
    draft,
    validationIssues,
    isValid,
    tableHeaders,
    tableRows,
    setAutomatonType,
    setStates,
    setAlphabet,
    setStartState,
    setAcceptStates,
    setTransition,
    applyProgram,
    resetToProgram,
  };
}
