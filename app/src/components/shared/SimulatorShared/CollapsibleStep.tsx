import type { ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface CollapsibleStepProps {
  isOpen: boolean;
  onToggle: () => void;

  header: ReactNode;

  children: ReactNode;

  className?: string;
  testId?: string;
}

export function CollapsibleStep({
  isOpen,
  onToggle,
  header,
  children,
  className = "",
  testId,
}: CollapsibleStepProps) {
  return (
    <div
      data-testid={testId}
      className={`border-border/40 overflow-hidden rounded-lg border ${className}`}
    >
      <button
        onClick={onToggle}
        data-testid={testId ? `${testId}-toggle` : undefined}
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
        <div
          data-testid={testId ? `${testId}-content` : undefined}
          className="bg-muted/30 border-border/40 border-t p-3"
        >
          {children}
        </div>
      )}
    </div>
  );
}
