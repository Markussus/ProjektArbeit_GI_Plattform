import { useMemo } from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  emptySymbol = ' ',
  className,
  cellClassName,
}: ArrayViewProps) {
  const startIndex = focusIndex - windowRadius;
  const endIndex = focusIndex + windowRadius;

  const cells = useMemo(() => {
    const result = [];
    for (let i = startIndex; i <= endIndex; i++) {
        // Find if data has a symbol, otherwise use emptySymbol
        const symbol = data[i] !== undefined && data[i] !== null ? data[i] : emptySymbol;
        result.push({
            index: i,
            value: symbol === '' ? emptySymbol : symbol, // fallback
            isFocused: i === focusIndex,
        });
    }
    return result;
  }, [startIndex, endIndex, data, emptySymbol, focusIndex]);

  return (
    <div className={cn("w-full flex justify-center py-10", className)}>
      <div className="relative flex flex-col items-center justify-center">
        {/* Infinite tape visual overflow container */}
        <div className="flex gap-1 overflow-hidden p-4 rounded-xl bg-muted/30 border shadow-inner">
          {cells.map((cell) => (
            <div key={cell.index} className="flex flex-col items-center relative">
              {/* Tape Cell */}
              <div
                className={cn(
                  "w-12 h-14 flex items-center justify-center text-xl font-mono border-2 bg-background rounded-md transition-all duration-300",
                  cell.isFocused
                    ? "border-primary text-primary shadow-md scale-110 z-10"
                    : "border-border text-foreground hover:border-muted-foreground",
                  cellClassName
                )}
              >
                {cell.value}
              </div>

              {/* Index number */}
              <span
                className={cn(
                  "text-[10px] mt-2 absolute -bottom-5 transition-colors origin-top",
                  cell.isFocused ? "text-primary font-bold scale-110" : "text-muted-foreground"
                )}
              >
                {cell.index}
              </span>
            </div>
          ))}
        </div>

        {/* Head Indicator pointing to the center cell (which is focused by default) */}
        <div className="absolute -bottom-6 pointer-events-none text-primary animate-[bounce_2s_infinite]">
           <ArrowUp className="w-5 h-5 drop-shadow-sm" />
        </div>
      </div>
    </div>
  );
}

