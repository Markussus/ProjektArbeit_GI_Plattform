import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SymbolSetPanelProps {
  title: string;
  items: Array<{ key: string; content: ReactNode }>;
  emptyText: string;
  className?: string;
  testId?: string;
}

export function SymbolSetPanel({
  title,
  items,
  emptyText,
  className,
  testId,
}: SymbolSetPanelProps) {
  return (
    <section data-testid={testId} className={cn("space-y-2", className)}>
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="border-border bg-card flex min-h-12 min-w-0 flex-wrap gap-1.5 rounded-lg border px-3 py-2">
        {items.length > 0 ? (
          items.map((item) => (
            <span
              key={item.key}
              className="bg-muted text-foreground max-w-full min-w-0 rounded border px-2 py-0.5 font-mono text-sm break-all whitespace-normal"
            >
              {item.content}
            </span>
          ))
        ) : (
          <span className="text-muted-foreground text-sm italic">
            {emptyText}
          </span>
        )}
      </div>
    </section>
  );
}
