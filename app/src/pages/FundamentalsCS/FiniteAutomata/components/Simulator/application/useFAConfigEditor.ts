import { useCallback, useMemo, useReducer } from "react";
import type {
  FAProgram,
  AutomatonType,
  FATransitionMap,
} from "../domain/faTypes";
import { EPSILON } from "../domain/faTypes";
import { validateFAProgram } from "../domain/faProgramValidation";
import type { FAProgramIssue } from "../domain/faProgramValidation";
import {
  buildTransitionTableHeaders,
  buildTransitionTableRows,
} from "../adapters/faTableAdapter";
import {
  defaultDFAProgram,
  defaultNFAProgram,
} from "../config/defaultFAProgram";

// --- Reducer ---

type EditorAction =
  | { type: "SET_AUTOMATON_TYPE"; payload: AutomatonType }
  | { type: "SET_STATES"; payload: string }
  | { type: "SET_ALPHABET"; payload: string }
  | { type: "SET_START_STATE"; payload: string }
  | { type: "SET_ACCEPT_STATES"; payload: string }
  | { type: "SET_TRANSITION"; from: string; symbol: string; targets: string }
  | { type: "ADD_STATE" }
  | { type: "REMOVE_STATE"; payload: string }
  | { type: "RESET"; payload: FAProgram };

function findNextStateName(states: string[]): string {
  let index = 0;
  while (states.includes(`S${index}`)) {
    index += 1;
  }
  return `S${index}`;
}

function parseCSV(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Like {@link parseCSV} but restricts each entry to a single symbol. The
 * alphabet of a DFA/NFA is a set of one-character symbols, so multi-character
 * tokens such as "10", "ab", or "xyz" are rejected rather than added.
 */
function parseAlphabetCSV(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => [...s].length === 1);
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
      // ε is never in the alphabet but is always a legal transition symbol.
      if (!symbolSet.has(symbol) && symbol !== EPSILON) continue;
      const targets = (symMap[symbol] || []).filter((t) => stateSet.has(t));
      if (targets.length > 0) {
        filtered[symbol] = targets;
      }
    }
    pruned[fromState] = filtered;
  }

  return pruned;
}

/**
 * Switching type swaps one canned default for the other, so a learner who has
 * not edited anything yet gets a worked automaton of the kind they picked.
 * Anything else keeps its table and only changes the label.
 */
function switchAutomatonType(state: FAProgram, type: AutomatonType): FAProgram {
  if (type === state.type) return state;

  const matchesDefault = (candidate: FAProgram) =>
    JSON.stringify({ ...state, type: candidate.type }) ===
    JSON.stringify(candidate);

  if (type === "NFA" && matchesDefault(defaultDFAProgram)) {
    return cloneProgram(defaultNFAProgram);
  }
  if (type === "DFA" && matchesDefault(defaultNFAProgram)) {
    return cloneProgram(defaultDFAProgram);
  }

  return { ...state, type };
}

function cloneProgram(program: FAProgram): FAProgram {
  return JSON.parse(JSON.stringify(program)) as FAProgram;
}

/**
 * Rewrite the state list, dropping whatever the new list no longer covers:
 * accept states, the start state, and every transition into or out of a state
 * that is gone.
 */
function withStates(state: FAProgram, states: string[]): FAProgram {
  return {
    ...state,
    states,
    acceptStates: state.acceptStates.filter((s) => states.includes(s)),
    startState: states.includes(state.startState)
      ? state.startState
      : states[0] || "",
    transitions: pruneTransitions(state.transitions, states, state.alphabet),
  };
}

/** Write one table cell; clearing its targets removes the cell entirely. */
function withTransition(
  state: FAProgram,
  from: string,
  symbol: string,
  targets: string[],
): FAProgram {
  const row = { ...(state.transitions[from] ?? {}) };
  if (targets.length === 0) {
    delete row[symbol];
  } else {
    row[symbol] = targets;
  }

  return {
    ...state,
    transitions: { ...state.transitions, [from]: row },
  };
}

/** Narrow the alphabet, dropping transitions on symbols that just left it. */
function withAlphabet(state: FAProgram, alphabet: string[]): FAProgram {
  return {
    ...state,
    alphabet,
    transitions: pruneTransitions(state.transitions, state.states, alphabet),
  };
}

/** Append the first unused S-name, adopting it as start state if there is none. */
function withNewState(state: FAProgram): FAProgram {
  const newState = findNextStateName(state.states);
  return {
    ...state,
    states: [...state.states, newState],
    startState: state.startState || newState,
  };
}

/** Drop a state and everything referring to it. The last state always stays. */
function withoutState(state: FAProgram, target: string): FAProgram {
  // Keep at least one state so the program stays well-formed.
  if (state.states.length <= 1) return state;

  const states = state.states.filter((s) => s !== target);
  return {
    ...withStates(state, states),
    startState: state.startState === target ? states[0] : state.startState,
  };
}

/**
 * One handler per action, so the reducer itself is a lookup rather than a
 * nine-way switch. Each handler owns exactly the edit its action describes.
 */
const EDITOR_ACTION_HANDLERS: {
  [K in EditorAction["type"]]: (
    state: FAProgram,
    action: Extract<EditorAction, { type: K }>,
  ) => FAProgram;
} = {
  SET_AUTOMATON_TYPE: (state, action) =>
    switchAutomatonType(state, action.payload),
  SET_STATES: (state, action) => withStates(state, parseCSV(action.payload)),
  SET_ALPHABET: (state, action) =>
    withAlphabet(state, parseAlphabetCSV(action.payload)),
  SET_START_STATE: (state, action) => ({
    ...state,
    startState: action.payload.trim(),
  }),
  SET_ACCEPT_STATES: (state, action) => ({
    ...state,
    acceptStates: parseCSV(action.payload),
  }),
  SET_TRANSITION: (state, action) =>
    withTransition(state, action.from, action.symbol, parseCSV(action.targets)),
  ADD_STATE: (state) => withNewState(state),
  REMOVE_STATE: (state, action) => withoutState(state, action.payload),
  RESET: (_state, action) => action.payload,
};

function editorReducer(state: FAProgram, action: EditorAction): FAProgram {
  const handler = EDITOR_ACTION_HANDLERS[action.type] as
    ((state: FAProgram, action: EditorAction) => FAProgram) | undefined;
  return handler ? handler(state, action) : state;
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
  addState: () => void;
  removeState: (state: string) => void;

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
  const addState = useCallback(() => dispatch({ type: "ADD_STATE" }), []);
  const removeState = useCallback(
    (state: string) => dispatch({ type: "REMOVE_STATE", payload: state }),
    [],
  );

  const applyProgram = useCallback(():
    { ok: true; program: FAProgram } | { ok: false } => {
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
    addState,
    removeState,
    applyProgram,
    resetToProgram,
  };
}
