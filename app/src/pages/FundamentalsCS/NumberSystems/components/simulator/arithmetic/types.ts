import type { ReactNode } from "react";

/**
 * Gemeinsame Props für alle Arithmetic-Simulator-Komponenten
 * (Addition, Subtraction, Multiplication, Division, Compare).
 */
export interface BaseArithmeticProps {
  renderModeSelector?: ReactNode;
  isExerciseMode?: boolean;
  showSolution?: boolean;
  onShowSolution?: () => void;
  /** Callback zum vollständigen Verlassen des Übungsmodus */
  onExitExercise?: () => void;
  initialA?: string;
  initialB?: string;
  onChangeValues?: (valA: string, valB: string) => void;
}

/**
 * Wie BaseArithmeticProps, aber ohne initialB –
 * für Operationen mit nur einem Operanden (Shifting, IEEEAddition).
 */
export type SingleOperandProps = Omit<BaseArithmeticProps, "initialB">;
