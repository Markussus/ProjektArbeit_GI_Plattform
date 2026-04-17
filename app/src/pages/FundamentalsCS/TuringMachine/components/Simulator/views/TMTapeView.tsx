import { useMemo } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TMTapeViewProps {
  /** Sparse tape cells mapped by their tape index. */
  tape: Record<number, string>;
  /** Current tape head position. */
  headPosition: number;
  /** Number of visible cells to render on either side of the head. */
  windowRadius?: number;
  /** Symbol shown for undefined or empty tape cells. */
  blankSymbol?: string;
  className?: string;
  cellClassName?: string;
}

export function TMTapeView({
  tape,
  headPosition,
  windowRadius = 10,
  blankSymbol = " ",
  className,
  cellClassName,
}: TMTapeViewProps) {
  const startIndex = headPosition - windowRadius;
  const endIndex = headPosition + windowRadius;

  const cells = useMemo(() => {
    const result = [];
    for (let index = startIndex; index <= endIndex; index++) {
      const symbol =
        tape[index] !== undefined && tape[index] !== null
          ? tape[index]
          : blankSymbol;

      result.push({
        index,
        value: symbol === "" ? blankSymbol : symbol,
        isFocused: index === headPosition,
      });
    }
    return result;
  }, [blankSymbol, endIndex, headPosition, startIndex, tape]);

  return (
    <div className={cn("flex w-full justify-center py-10", className)}>
      <div className="relative flex flex-col items-center justify-center">
        <div className="bg-muted/30 flex gap-1 overflow-hidden rounded-xl border p-4 shadow-inner">
          {cells.map((cell) => (
            <div
              key={cell.index}
              className="relative flex flex-col items-center"
            >
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

        <div className="text-primary pointer-events-none absolute -bottom-6 animate-[bounce_2s_infinite]">
          <ArrowUp className="h-5 w-5 drop-shadow-sm" />
        </div>
      </div>
    </div>
  );
}
