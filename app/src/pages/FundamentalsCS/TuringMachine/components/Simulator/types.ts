// Repräsentiert die möglichen Bewegungen des Lese-/Schreibkopfs
export type HeadMovement = 'L' | 'R' | 'N';

// Repräsentiert das Tripel (Next State, Write Symbol, Movement)
export interface TMTransition {
  nextState: string;
  writeSymbol: string;
  movement: HeadMovement;
}

// Die delta-Funktion (Übergangstabelle).
// Struktur: Record<CurrentState, Record<ReadSymbol, TMTransition>>
export type TransitionTable = Record<string, Record<string, TMTransition>>;

// Die Konfiguration, mit der die Turingmaschine initialisiert wird (TConfig)
export interface TMConfig {
  states: string[];           // Menge der Zustände (Q)
  inputAlphabet: string[];    // Sigma
  tapeAlphabet: string[];     // Gamma (enthält auch das Blank-Symbol)
  blankSymbol: string;        // z.B. 'B' oder ' '
  initialState: string;       // Startzustand (q0)
  haltStates: string[];       // Akzeptierende/Haltende Zustände
  transitions: TransitionTable; // Die definierte Logik
  initialTapeWord: string;    // Das Startwort auf dem Band
}

// Der aktuelle Schnappschuss der Maschine während der Ausführung (TState)
export interface TMState {
  currentState: string;
  headPosition: number;
  /**
   * Tape implementiert als Sparse-Map:
   * Schlüssel ist der Index (kann negativ sein!), Wert ist das Symbol.
   * Beispiel: { 0: '1', 1: '0', -1: '1' }
   */
  tape: Record<number, string>;
  isHalted: boolean;
  errorMessage?: string;
}
