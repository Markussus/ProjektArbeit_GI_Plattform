import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { ArrowDown } from "lucide-react";
import { useDragScroll } from "@/hooks/useDragScroll";
import { cn } from "@/lib/utils";
import {
  buildTapeCells,
  DEFAULT_HEAD_WINDOW_RADIUS,
  getResponsiveWindowRadius,
  getTapeContentRange,
  getTapeRenderRange,
  getTapeTransitionDurationMs,
  resolveTapeViewport,
  shouldAnimateTapeShift,
} from "./tmTapeViewLogic.ts";

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
  const headIndicatorRef = useRef<HTMLDivElement | null>(null);
  const tapeViewportRef = useRef<HTMLDivElement | null>(null);
  const tapeScrollerRef = useRef<HTMLDivElement | null>(null);
  const tapeTrackRef = useRef<HTMLDivElement | null>(null);
  const focusedCellRef = useRef<HTMLDivElement | null>(null);
  const previousStartIndexRef = useRef<number | null>(null);
  const previousWindowRadiusRef = useRef<number | null>(null);
  const previousAutoCenterKeyRef = useRef<string | null>(null);
  const tapeShiftFrameRef = useRef<number | null>(null);
  const headIndicatorFrameRef = useRef<number | null>(null);
  const dragScroll = useDragScroll<HTMLDivElement>();
  const setTapeScrollerRef = (element: HTMLDivElement | null) => {
    tapeScrollerRef.current = element;
    dragScroll.setElementRef(element);
  };
  const [viewportWidth, setViewportWidth] = useState<number | null>(null);
  const maxWindowRadius = Math.max(windowRadius, 0);
  const [responsiveWindowRadius, setResponsiveWindowRadius] =
    useState(maxWindowRadius);
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
  const autoCenterKey = `${headPosition}:${tapeRange.minIndex}:${tapeRange.maxIndex}`;
  const transitionDurationMs = getTapeTransitionDurationMs(stepDurationMs);
  const transitionStyle = useMemo(
    () => ({
      transitionDuration: `${transitionDurationMs}ms`,
    }),
    [transitionDurationMs],
  );
  const headIndicatorStyle = useMemo(() => ({ transitionDuration: "0ms" }), []);
  const updateHeadIndicatorPosition = useCallback(() => {
    const headIndicator = headIndicatorRef.current;
    const focusedCell = focusedCellRef.current;
    const tapeScroller = tapeScrollerRef.current;

    if (!headIndicator || !focusedCell || !tapeScroller) {
      if (headIndicator) {
        headIndicator.style.opacity = "0";
      }

      return;
    }

    const positioningParent =
      headIndicator.offsetParent instanceof HTMLElement
        ? headIndicator.offsetParent
        : tapeScroller;
    const viewportRect = positioningParent.getBoundingClientRect();
    const focusedCellRect = focusedCell.getBoundingClientRect();
    const focusedCellCenterPx =
      focusedCellRect.left - viewportRect.left + focusedCellRect.width / 2;

    headIndicator.style.opacity = "1";
    headIndicator.style.transform = `translateX(${focusedCellCenterPx}px) translateX(-50%)`;
  }, []);
  const stopHeadIndicatorTracking = useCallback(() => {
    if (headIndicatorFrameRef.current !== null) {
      window.cancelAnimationFrame(headIndicatorFrameRef.current);
      headIndicatorFrameRef.current = null;
    }
  }, []);
  const trackHeadIndicatorDuringAnimation = useCallback(
    (durationMs: number) => {
      stopHeadIndicatorTracking();

      const updateUntil = performance.now() + Math.max(durationMs, 0) + 80;

      const update = () => {
        updateHeadIndicatorPosition();

        if (performance.now() < updateUntil) {
          headIndicatorFrameRef.current = window.requestAnimationFrame(update);
          return;
        }

        headIndicatorFrameRef.current = null;
      };

      update();
    },
    [stopHeadIndicatorTracking, updateHeadIndicatorPosition],
  );

  useLayoutEffect(() => {
    return stopHeadIndicatorTracking;
  }, [stopHeadIndicatorTracking]);

  useLayoutEffect(() => {
    const observedElement =
      responsiveBoundaryRef?.current ?? tapeViewportRef.current;
    if (!observedElement) {
      return;
    }

    const updateViewportWidth = () => {
      const computedStyle = window.getComputedStyle(observedElement);
      const horizontalPaddingPx =
        Number.parseFloat(computedStyle.paddingLeft) +
        Number.parseFloat(computedStyle.paddingRight);

      setViewportWidth(
        Math.max(0, observedElement.clientWidth - horizontalPaddingPx),
      );
    };

    updateViewportWidth();

    const resizeObserver = new ResizeObserver(() => {
      updateViewportWidth();
    });

    resizeObserver.observe(observedElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [responsiveBoundaryRef]);

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

  useLayoutEffect(() => {
    updateHeadIndicatorPosition();
  }, [cells, updateHeadIndicatorPosition]);

  useLayoutEffect(() => {
    const tapeScroller = tapeScrollerRef.current;
    const focusedCell = focusedCellRef.current;
    if (!tapeScroller || !focusedCell) {
      previousAutoCenterKeyRef.current = autoCenterKey;
      return;
    }

    if (previousAutoCenterKeyRef.current === autoCenterKey) {
      return;
    }
    previousAutoCenterKeyRef.current = autoCenterKey;

    const scrollerRect = tapeScroller.getBoundingClientRect();
    const focusedCellRect = focusedCell.getBoundingClientRect();
    const focusedCellCenterPx =
      focusedCellRect.left - scrollerRect.left + focusedCellRect.width / 2;
    const targetScrollLeft =
      tapeScroller.scrollLeft +
      focusedCellCenterPx -
      tapeScroller.clientWidth / 2;

    tapeScroller.scrollTo({
      left: Math.max(0, targetScrollLeft),
      behavior: transitionDurationMs > 0 ? "smooth" : "auto",
    });
    trackHeadIndicatorDuringAnimation(transitionDurationMs);
  }, [
    autoCenterKey,
    headPosition,
    trackHeadIndicatorDuringAnimation,
    transitionDurationMs,
  ]);

  useLayoutEffect(() => {
    const tapeTrack = tapeTrackRef.current;
    if (!tapeTrack || viewportWidth === null) {
      return;
    }

    const totalCells = tapeTrack.children.length;
    const firstCell = tapeTrack.children.item(0) as HTMLElement | null;
    const secondCell = tapeTrack.children.item(1) as HTMLElement | null;
    if (!firstCell) {
      return;
    }

    const cellWidthPx = firstCell.offsetWidth;
    const cellPitchPx = secondCell
      ? secondCell.offsetLeft - firstCell.offsetLeft
      : cellWidthPx;
    const baseWidthPx =
      tapeTrack.offsetWidth -
      cellWidthPx -
      Math.max(0, totalCells - 1) * cellPitchPx;
    const nextRadius = getResponsiveWindowRadius({
      viewportWidth,
      baseWidthPx,
      cellWidthPx,
      cellPitchPx,
      maxWindowRadius,
    });

    if (nextRadius !== effectiveWindowRadius) {
      setResponsiveWindowRadius(nextRadius);
    }
  }, [effectiveWindowRadius, maxWindowRadius, viewportWidth, cells]);

  useLayoutEffect(() => {
    const tapeTrack = tapeTrackRef.current;
    if (!tapeTrack) {
      previousStartIndexRef.current = tapeRange.minIndex;
      previousWindowRadiusRef.current = effectiveWindowRadius;
      return;
    }

    if (previousStartIndexRef.current === null) {
      previousStartIndexRef.current = tapeRange.minIndex;
      previousWindowRadiusRef.current = effectiveWindowRadius;
      tapeTrack.style.transitionDuration = "0ms";
      tapeTrack.style.transform = "translateX(0px)";
      return;
    }

    const previousWindowRadius = previousWindowRadiusRef.current;
    previousWindowRadiusRef.current = effectiveWindowRadius;
    if (
      previousWindowRadius !== null &&
      previousWindowRadius !== effectiveWindowRadius
    ) {
      previousStartIndexRef.current = tapeRange.minIndex;
      tapeTrack.style.transitionDuration = "0ms";
      tapeTrack.style.transform = "translateX(0px)";
      return;
    }

    const previousStartIndex = previousStartIndexRef.current;
    const shiftedCells = tapeRange.minIndex - previousStartIndex;
    previousStartIndexRef.current = tapeRange.minIndex;

    if (!shouldAnimateTapeShift(shiftedCells, transitionDurationMs)) {
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
    updateHeadIndicatorPosition();

    if (tapeShiftFrameRef.current !== null) {
      window.cancelAnimationFrame(tapeShiftFrameRef.current);
    }

    tapeShiftFrameRef.current = window.requestAnimationFrame(() => {
      tapeTrack.style.transitionDuration = `${transitionDurationMs}ms`;
      tapeTrack.style.transform = "translateX(0px)";
      trackHeadIndicatorDuringAnimation(transitionDurationMs);
      tapeShiftFrameRef.current = null;
    });

    return () => {
      if (tapeShiftFrameRef.current !== null) {
        window.cancelAnimationFrame(tapeShiftFrameRef.current);
        tapeShiftFrameRef.current = null;
      }
    };
  }, [
    effectiveWindowRadius,
    tapeRange.minIndex,
    trackHeadIndicatorDuringAnimation,
    transitionDurationMs,
    updateHeadIndicatorPosition,
  ]);

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
