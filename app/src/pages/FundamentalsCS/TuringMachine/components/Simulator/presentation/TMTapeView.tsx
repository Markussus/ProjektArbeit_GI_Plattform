import { useLayoutEffect, useMemo, useRef } from "react";
import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

const HEAD_WINDOW_TRANSITION_RATIO = 0.6;
const MIN_TRANSITION_MS = 120;
const MAX_TRANSITION_MS = 600;
const NO_ANIMATION_THRESHOLD_MS = 140;
const MAX_ANIMATED_TAPE_SHIFT_CELLS = 1;
const DEFAULT_HEAD_WINDOW_RADIUS = 5;

export interface TMTapeViewProps {
  tape: Record<number, string>;
  headPosition: number;
  stepDurationMs?: number;
  windowRadius?: number;
  headWindowRadius?: number;
  blankSymbol?: string;
  className?: string;
  cellClassName?: string;
}

export function TMTapeView({
  tape,
  headPosition,
  stepDurationMs = 1000,
  windowRadius = 10,
  headWindowRadius = DEFAULT_HEAD_WINDOW_RADIUS,
  blankSymbol = " ",
  className,
  cellClassName,
}: TMTapeViewProps) {
  const headIndicatorRef = useRef<HTMLDivElement | null>(null);
  const tapeTrackRef = useRef<HTMLDivElement | null>(null);
  const focusedCellRef = useRef<HTMLDivElement | null>(null);
  const previousStartIndexRef = useRef<number | null>(null);
  const tapeShiftFrameRef = useRef<number | null>(null);
  const effectiveHeadWindowRadius = Math.min(
    Math.max(headWindowRadius, 0),
    windowRadius,
  );
  const headViewportOffset = Math.max(
    -effectiveHeadWindowRadius,
    Math.min(headPosition, effectiveHeadWindowRadius),
  );
  const viewportCenter = headPosition - headViewportOffset;
  const startIndex = viewportCenter - windowRadius;
  const endIndex = viewportCenter + windowRadius;
  const transitionDurationMs =
    stepDurationMs <= NO_ANIMATION_THRESHOLD_MS
      ? 0
      : Math.min(
          MAX_TRANSITION_MS,
          Math.max(
            MIN_TRANSITION_MS,
            Math.round(stepDurationMs * HEAD_WINDOW_TRANSITION_RATIO),
          ),
        );
  const transitionStyle = {
    transitionDuration: `${transitionDurationMs}ms`,
  };
  const headIndicatorStyle = {
    transitionDuration: `${transitionDurationMs}ms`,
  };

  const cells = useMemo(() => {
    const result = [];

    for (let index = startIndex; index <= endIndex; index += 1) {
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

  useLayoutEffect(() => {
    const headIndicator = headIndicatorRef.current;
    const focusedCell = focusedCellRef.current;

    if (!headIndicator || !focusedCell) {
      if (headIndicator) {
        headIndicator.style.opacity = "0";
      }

      return;
    }

    headIndicator.style.opacity = "1";
    headIndicator.style.transform = `translateX(${focusedCell.offsetLeft + focusedCell.offsetWidth / 2}px) translateX(-50%)`;
  }, [cells]);

  useLayoutEffect(() => {
    const tapeTrack = tapeTrackRef.current;
    if (!tapeTrack) {
      previousStartIndexRef.current = startIndex;
      return;
    }

    if (previousStartIndexRef.current === null) {
      previousStartIndexRef.current = startIndex;
      tapeTrack.style.transitionDuration = "0ms";
      tapeTrack.style.transform = "translateX(0px)";
      return;
    }

    const previousStartIndex = previousStartIndexRef.current;
    const shiftedCells = startIndex - previousStartIndex;
    previousStartIndexRef.current = startIndex;

    if (
      shiftedCells === 0 ||
      Math.abs(shiftedCells) > MAX_ANIMATED_TAPE_SHIFT_CELLS ||
      transitionDurationMs === 0
    ) {
      tapeTrack.style.transitionDuration = "0ms";
      tapeTrack.style.transform = "translateX(0px)";
      return;
    }

    const firstCell = tapeTrack.children.item(0) as HTMLElement | null;
    const secondCell = tapeTrack.children.item(1) as HTMLElement | null;
    if (!firstCell || !secondCell) {
      tapeTrack.style.transitionDuration = "0ms";
      tapeTrack.style.transform = "translateX(0px)";
      return;
    }

    const cellPitchPx = secondCell.offsetLeft - firstCell.offsetLeft;
    if (cellPitchPx <= 0) {
      tapeTrack.style.transitionDuration = "0ms";
      tapeTrack.style.transform = "translateX(0px)";
      return;
    }

    tapeTrack.style.transitionDuration = "0ms";
    tapeTrack.style.transform = `translateX(${shiftedCells * cellPitchPx}px)`;

    if (tapeShiftFrameRef.current !== null) {
      window.cancelAnimationFrame(tapeShiftFrameRef.current);
    }

    tapeShiftFrameRef.current = window.requestAnimationFrame(() => {
      tapeTrack.style.transitionDuration = `${transitionDurationMs}ms`;
      tapeTrack.style.transform = "translateX(0px)";
      tapeShiftFrameRef.current = null;
    });

    return () => {
      if (tapeShiftFrameRef.current !== null) {
        window.cancelAnimationFrame(tapeShiftFrameRef.current);
        tapeShiftFrameRef.current = null;
      }
    };
  }, [startIndex, transitionDurationMs]);

  return (
    <div className={cn("flex w-full justify-center py-10", className)}>
      <div className="relative flex flex-col items-center justify-center">
        <div className="relative">
          <div
            ref={headIndicatorRef}
            className="text-primary pointer-events-none absolute -top-10 left-0 z-20 opacity-0 transition-all ease-out"
            style={headIndicatorStyle}
          >
            <ArrowDown className="h-5 w-5 drop-shadow-sm" />
          </div>

          <div
            ref={tapeTrackRef}
            className="bg-muted/30 flex gap-1 overflow-visible rounded-xl border px-4 pt-4 pb-8 shadow-inner transition-transform ease-out"
          >
            {cells.map((cell) => (
              <div
                key={cell.index}
                className="relative flex flex-col items-center"
                ref={cell.isFocused ? focusedCellRef : null}
              >
                <div
                  className={cn(
                    "bg-background flex h-14 w-12 items-center justify-center rounded-md border-2 font-mono text-xl transition-all ease-out",
                    cell.isFocused
                      ? "border-primary text-primary z-10 scale-110 shadow-md"
                      : "border-border text-foreground hover:border-muted-foreground",
                    cellClassName,
                  )}
                  style={transitionStyle}
                >
                  {cell.value}
                </div>

                <span
                  className={cn(
                    "absolute -bottom-5 mt-2 origin-top text-[10px] transition-all ease-out",
                    cell.isFocused
                      ? "text-primary scale-110 font-bold"
                      : "text-muted-foreground",
                  )}
                  style={transitionStyle}
                >
                  {cell.index}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
