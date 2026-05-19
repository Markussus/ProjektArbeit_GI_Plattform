import type { ReactNode } from "react";

interface ResultSectionHeaderProps {
  icon: ReactNode;
  title: string;
}

/**
 * Überschrift für das Ergebnis-/Dashboard-Panel im Simulator.
 * Zeigt ein Icon links und einen Titel-Text daneben.
 */
export function ResultSectionHeader({ icon, title }: ResultSectionHeaderProps) {
  return (
    <h3 className="text-foreground mb-4 flex items-center gap-2 text-lg font-semibold">
      {icon}
      {title}
    </h3>
  );
}
