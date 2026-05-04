import type { ReactNode } from "react";

interface SimulatorLayoutProps {
  /** Linke Spalte: Inputs & Operanden */
  inputPanel: ReactNode;
  /** Rechte Spalte: Ergebnis oder ExerciseValidationPanel */
  resultPanel: ReactNode;
}

/**
 * Zwei-Spalten-Grid-Layout für alle Arithmetic-Simulator-Komponenten.
 * Links: Eingabefelder. Rechts: Ergebnis oder Validation.
 */
export function SimulatorLayout({ inputPanel, resultPanel }: SimulatorLayoutProps) {
  return (
    <div className="animate-in fade-in zoom-in-95 grid w-full grid-cols-1 gap-6 duration-300 md:grid-cols-2">
      {/* Input Panel */}
      <div className="bg-card border-border/50 space-y-6 rounded-xl border p-6 shadow-sm">
        {inputPanel}
      </div>

      {/* Result / Locked Panel */}
      <div className="bg-muted/30 border-border/50 overflow-auto rounded-xl border p-6 shadow-sm">
        {resultPanel}
      </div>
    </div>
  );
}
