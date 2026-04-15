// Represents the possible movements of the read/write head
export type HeadMovement = "L" | "R" | "N";

// Represents the transition triple (Next State, Write Symbol, Movement)
export interface TMTransition {
  nextState: StateName;
  writeSymbol: TapeSymbol;
  movement: HeadMovement;
}

// Represents the name or identifier of a state
export type StateName = string;
// Represents a single symbol on the tape
export type TapeSymbol = string; // Must be exactly one character long

export const DEFAULT_BLANK_SYMBOL: TapeSymbol = "◊";

// The delta function (transition table).
// Structured as in the lecture notes:
// Record<ReadSymbol, Record<CurrentState, TMTransition>>
export type TransitionTable = Record<
  TapeSymbol,
  Record<StateName, TMTransition>
>;

// The configuration used to initialize the Turing machine (TConfig)
export interface TMConfig {
  states: StateName[]; // Set of states (Q)
  inputAlphabet: TapeSymbol[]; // Sigma
  tapeAlphabet: TapeSymbol[]; // Gamma (includes the blank symbol)
  blankSymbol: TapeSymbol; // e.g., 'B', '◊' or ' '
  initialState: StateName; // Initial state (q0)
  haltStates: StateName[]; // Accepting/Halting states
  transitions: TransitionTable; // The defined logic
  initialTape: TapeSymbol[]; // The initial content of the tape
}

// The current snapshot of the machine during execution (TState)
export interface TMState {
  // The current active state
  currentState: StateName;
  // The current index position of the read/write head
  headPosition: number;
  /**
   * Tape implemented as a sparse map:
   * Key is the index (can be negative!), value is the symbol.
   * Example: { 0: '1', 1: '0', -1: '1' }
   */
  tape: Record<number, TapeSymbol>;
  // Indicates if the machine has reached a halting state
  isHalted: boolean;
  // Optional error message if the machine crashes or enters an invalid state
  errorMessage?: string;
  // The number of steps the machine has executed
  stepCount: number;
}

/**
 * Converts digits to Unicode subscripts (e.g., q0 -> q₀).
 * 8320 is the base offset for Unicode subscript 0 (U+2080).
 * Adding a digit (0-9) to this offset yields the corresponding subscript character.
 */
export function formatState(state: string) {
  return state.replace(/\d+/g, (match) => {
    return match
      .split("")
      .map((d) => String.fromCharCode(8320 + parseInt(d)))
      .join("");
  });
}

/**
 * Parses a transition string like "(q1, 0, R)" into a TMTransition object.
 * Extracts the next state, write symbol, and head movement (L, N, or R).
 * Returns null if the input string does not match the expected format.
 */
export function parseTransition(cellValue: string): TMTransition | null {
  const match = cellValue.match(
    /^\s*\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([LNR])\s*\)\s*$/,
  );
  if (match) {
    return {
      nextState: match[1].trim(),
      writeSymbol: match[2].trim(),
      movement: match[3].trim() as HeadMovement,
    };
  }
  return null;
}

/**
 * Formats a TMTransition object back into its string representation.
 * Example: converts { nextState: 'q1', writeSymbol: '0', movement: 'R' } to "(q1, 0, R)".
 * Returns an empty string if the transition is undefined or null.
 */
export function formatTransition(transition?: TMTransition): string {
  if (!transition) return "";
  return `(${transition.nextState}, ${transition.writeSymbol}, ${transition.movement})`;
}
