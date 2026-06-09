import type { ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface CollapsibleStepProps {
  isOpen: boolean;
  onToggle: () => void;
  /** Inhalt der immer sichtbaren Zeile (Step-Vorschau) */
  header: ReactNode;
  /** Inhalt des aufgeklappten Bereichs */
  children: ReactNode;
  /** Optionale CSS-Klassen für den Wrapper */
  className?: string;
}

/**
 * Zusammenklappbarer Schritt-Eintrag für Step-by-Step-Listen.
 * Kapselt Border, Hover-Effekte, Chevron und expandierten Bereich.
 */
export function CollapsibleStep({
  isOpen,
  onToggle,
  header,
  children,
  className = "",
}: CollapsibleStepProps) {
  return (
    <div
      className={`border-border/40 overflow-hidden rounded-lg border ${className}`}
    >
      <button
        onClick={onToggle}
        className="bg-background hover:bg-muted/50 flex w-full items-center justify-between p-3"
      >
        <div className="flex items-center gap-4">{header}</div>
        {isOpen ? (
          <ChevronDown className="text-muted-foreground h-4 w-4 shrink-0" />
        ) : (
          <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="bg-muted/30 border-border/40 border-t p-3">
          {children}
        </div>
      )}
    </div>
  );
}
