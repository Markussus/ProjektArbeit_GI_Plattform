import { useMemo } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ArrayViewProps {
  /** Map of indices to string values. Ideal for sparse arrays like a Turing Machine tape. */
  data: Record<number, string>;
  /** The current active index (e.g., head position). */
  focusIndex: number;
  /** Number of cells to show on either side of the focused cell. */
  windowRadius?: number;
  /** The symbol to display when a cell at an index is undefined. */
  emptySymbol?: string;
  className?: string;
  cellClassName?: string;
}

export function ArrayView({
  data,
  focusIndex,
  windowRadius = 10,
  emptySymbol = " ",
  className,
  cellClassName,
}: ArrayViewProps) {
  const startIndex = focusIndex - windowRadius;
  const endIndex = focusIndex + windowRadius;

  const cells = useMemo(() => {
    const result = [];
    for (let i = startIndex; i <= endIndex; i++) {
      // Find if data has a symbol, otherwise use emptySymbol
      const symbol =
        data[i] !== undefined && data[i] !== null ? data[i] : emptySymbol;
      result.push({
        index: i,
        value: symbol === "" ? emptySymbol : symbol, // fallback
        isFocused: i === focusIndex,
      });
    }
    return result;
  }, [startIndex, endIndex, data, emptySymbol, focusIndex]);

  return (
    <div className={cn("flex w-full justify-center py-10", className)}>
      <div className="relative flex flex-col items-center justify-center">
        {/* Infinite tape visual overflow container */}
        <div className="bg-muted/30 flex gap-1 overflow-hidden rounded-xl border p-4 shadow-inner">
          {cells.map((cell) => (
            <div
              key={cell.index}
              className="relative flex flex-col items-center"
            >
              {/* Tape Cell */}
              <div
                className={cn(
                  "bg-background flex h-14 w-12 items-center justify-center rounded-md border-2 font-mono text-xl transition-all duration-300",
                  cell.isFocused
                    ? "border-primary text-primary z-10 scale-110 shadow-md"
                    : "border-border text-foreground hover:border-muted-foreground",
                  cellClassName,
                )}
              >
                {cell.value}
              </div>

              {/* Index number */}
              <span
                className={cn(
                  "absolute -bottom-5 mt-2 origin-top text-[10px] transition-colors",
                  cell.isFocused
                    ? "text-primary scale-110 font-bold"
                    : "text-muted-foreground",
                )}
              >
                {cell.index}
              </span>
            </div>
          ))}
        </div>

        {/* Head Indicator pointing to the center cell (which is focused by default) */}
        <div className="text-primary pointer-events-none absolute -bottom-6 animate-[bounce_2s_infinite]">
          <ArrowUp className="h-5 w-5 drop-shadow-sm" />
        </div>
      </div>
    </div>
  );
}
