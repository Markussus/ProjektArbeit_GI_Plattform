import { useMemo, useRef, useState, type RefObject } from "react";
import { ArrowDown } from "lucide-react";
import { useDragScroll } from "@/hooks/useDragScroll";
import { cn } from "@/lib/utils";
import {
  buildTapeCells,
  DEFAULT_HEAD_WINDOW_RADIUS,
  getTapeContentRange,
  getTapeRenderRange,
  getTapeTransitionDurationMs,
  resolveTapeViewport,
} from "./tmTapeViewLogic";
import {
  useTapeAutoCenter,
  useTapeHeadTracking,
  useTapeResponsiveRadius,
  useTapeShiftAnimation,
} from "./hooks/useTapeAnimation";

export interface TMTapeViewProps {
  tape: Record<number, string>;
  headPosition: number;
  stepDurationMs?: number;
  windowRadius?: number;
  headWindowRadius?: number;
  blankSymbol?: string;
  responsiveBoundaryRef?: RefObject<HTMLDivElement | null>;
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
  responsiveBoundaryRef,
  className,
  cellClassName,
}: TMTapeViewProps) {
  // 1. Refs
  const headIndicatorRef = useRef<HTMLDivElement | null>(null);
  const tapeViewportRef = useRef<HTMLDivElement | null>(null);
  const tapeScrollerRef = useRef<HTMLDivElement | null>(null);
  const tapeTrackRef = useRef<HTMLDivElement | null>(null);
  const focusedCellRef = useRef<HTMLDivElement | null>(null);

  const dragScroll = useDragScroll<HTMLDivElement>();
  const setTapeScrollerRef = (element: HTMLDivElement | null) => {
    tapeScrollerRef.current = element;
    dragScroll.setElementRef(element);
  };

  // 2. Base state & duration logic
  const maxWindowRadius = Math.max(windowRadius, 0);
  const [responsiveWindowRadius, setResponsiveWindowRadius] =
    useState(maxWindowRadius);
  const transitionDurationMs = getTapeTransitionDurationMs(stepDurationMs);

  const transitionStyle = useMemo(
    () => ({
      transitionDuration: `${transitionDurationMs}ms`,
    }),
    [transitionDurationMs],
  );
  const headIndicatorStyle = useMemo(() => ({ transitionDuration: "0ms" }), []);

  // 3. Resolve Viewport & Tape Ranges
  const {
    effectiveWindowRadius,
    minIndex: startIndex,
    maxIndex: endIndex,
  } = useMemo(
    () =>
      resolveTapeViewport(
        headPosition,
        windowRadius,
        headWindowRadius,
        responsiveWindowRadius,
      ),
    [headPosition, headWindowRadius, responsiveWindowRadius, windowRadius],
  );

  const contentRange = useMemo(
    () => getTapeContentRange(tape, blankSymbol, headPosition),
    [blankSymbol, headPosition, tape],
  );

  const tapeRange = useMemo(
    () =>
      getTapeRenderRange({
        viewportStartIndex: startIndex,
        viewportEndIndex: endIndex,
        contentRange,
        paddingCells: effectiveWindowRadius,
      }),
    [contentRange, effectiveWindowRadius, endIndex, startIndex],
  );

  const cells = useMemo(
    () =>
      buildTapeCells(
        tape,
        headPosition,
        blankSymbol,
        tapeRange.minIndex,
        tapeRange.maxIndex,
      ),
    [blankSymbol, headPosition, tapeRange, tape],
  );

  const autoCenterKey = `${headPosition}:${tapeRange.minIndex}:${tapeRange.maxIndex}`;

  // 4. Side Effects / Animation Hooks
  useTapeResponsiveRadius({
    responsiveBoundaryRef,
    tapeViewportRef,
    tapeTrackRef,
    cells,
    effectiveWindowRadius,
    maxWindowRadius,
    setResponsiveWindowRadius,
  });

  const { updateHeadIndicatorPosition, trackHeadIndicatorDuringAnimation } =
    useTapeHeadTracking({
      headIndicatorRef,
      focusedCellRef,
      tapeScrollerRef,
      cells,
    });

  useTapeAutoCenter({
    tapeScrollerRef,
    focusedCellRef,
    autoCenterKey,
    headPosition,
    transitionDurationMs,
    trackHeadIndicatorDuringAnimation,
  });

  useTapeShiftAnimation({
    tapeTrackRef,
    tapeRangeMinIndex: tapeRange.minIndex,
    effectiveWindowRadius,
    transitionDurationMs,
    updateHeadIndicatorPosition,
    trackHeadIndicatorDuringAnimation,
  });

  // 5. Render
  return (
    <div
      ref={tapeViewportRef}
      data-testid="tm-tape-view"
      className={cn("w-full py-10", className)}
    >
      <div className="relative w-full">
        <div
          ref={headIndicatorRef}
          data-testid="tm-tape-head-indicator"
          className="text-primary pointer-events-none absolute -top-10 left-0 z-20 opacity-0 transition-all ease-out"
          style={headIndicatorStyle}
        >
          <ArrowDown className="h-5 w-5 drop-shadow-sm" />
        </div>

        <div
          data-testid="tm-tape-window"
          className="bg-muted/30 w-full rounded-xl border px-4 pt-4 pb-8 shadow-inner"
        >
          <div
            ref={setTapeScrollerRef}
            data-testid="tm-tape-scroll-area"
            onMouseDown={dragScroll.onMouseDown}
            onScroll={updateHeadIndicatorPosition}
            className={cn(
              "w-full overflow-x-auto overflow-y-hidden pt-2 pb-3 [scrollbar-width:thin]",
              "[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent",
              dragScroll.isDragging ? "cursor-grabbing" : "cursor-grab",
            )}
          >
            <div
              ref={tapeTrackRef}
              data-testid="tm-tape-track"
              className="mx-auto flex w-max gap-1 overflow-visible px-1 transition-transform ease-out"
            >
              {cells.map((cell) => (
                <div
                  key={cell.index}
                  data-testid={`tm-tape-cell-${cell.index}`}
                  data-tape-index={cell.index}
                  data-focused={cell.isFocused}
                  className="relative flex h-20 flex-col items-center"
                  ref={cell.isFocused ? focusedCellRef : null}
                >
                  <div
                    data-testid={`tm-tape-cell-value-${cell.index}`}
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
                    data-testid={`tm-tape-cell-index-${cell.index}`}
                    className={cn(
                      "absolute bottom-0 origin-top text-[10px] transition-all ease-out",
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
    </div>
  );
}
