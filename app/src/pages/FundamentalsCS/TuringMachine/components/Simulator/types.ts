// Represents the possible movements of the read/write head
export type HeadMovement = 'L' | 'R' | 'N';

// Represents the transition triple (Next State, Write Symbol, Movement)
export interface TMTransition {
  nextState: StateName;
  writeSymbol: TapeSymbol;
  movement: HeadMovement;
}

// Represents the name or identifier of a state
export type StateName = string;
// Represents a single symbol on the tape
export type TapeSymbol = string;  // Must be exactly one character long

// The delta function (transition table).
// Structured as in the lecture notes:
// Record<ReadSymbol, Record<CurrentState, TMTransition>>
export type TransitionTable = Record<TapeSymbol, Record<StateName, TMTransition>>;

// The configuration used to initialize the Turing machine (TConfig)
export interface TMConfig {
  states: StateName [];           // Set of states (Q)
  inputAlphabet: TapeSymbol[];    // Sigma
  tapeAlphabet: TapeSymbol[];     // Gamma (includes the blank symbol)
  blankSymbol: TapeSymbol;        // e.g., 'B' or ' '
  initialState: StateName;        // Initial state (q0)
  haltStates: StateName[];        // Accepting/Halting states
  transitions: TransitionTable;   // The defined logic
  initialTape: TapeSymbol[];      // The initial content of the tape
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
}
