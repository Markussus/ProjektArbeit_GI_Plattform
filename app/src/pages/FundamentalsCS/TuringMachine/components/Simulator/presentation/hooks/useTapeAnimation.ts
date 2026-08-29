import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  getResponsiveWindowRadius,
  shouldAnimateTapeShift,
  type TMTapeCell,
} from "../tmTapeViewLogic";

export interface UseTapeResponsiveRadiusProps {
  responsiveBoundaryRef?: RefObject<HTMLDivElement | null>;
  tapeViewportRef: RefObject<HTMLDivElement | null>;
  tapeTrackRef: RefObject<HTMLDivElement | null>;
  effectiveWindowRadius: number;
  maxWindowRadius: number;
  cells: TMTapeCell[];
  setResponsiveWindowRadius: (radius: number) => void;
}

export function useTapeResponsiveRadius({
  responsiveBoundaryRef,
  tapeViewportRef,
  tapeTrackRef,
  effectiveWindowRadius,
  maxWindowRadius,
  cells,
  setResponsiveWindowRadius,
}: UseTapeResponsiveRadiusProps) {
  const [viewportWidth, setViewportWidth] = useState<number | null>(null);

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
  }, [responsiveBoundaryRef, tapeViewportRef]);

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
  }, [
    effectiveWindowRadius,
    maxWindowRadius,
    viewportWidth,
    cells,
    tapeTrackRef,
    setResponsiveWindowRadius,
  ]);
}

export interface UseTapeHeadTrackingProps {
  headIndicatorRef: RefObject<HTMLDivElement | null>;
  focusedCellRef: RefObject<HTMLDivElement | null>;
  tapeScrollerRef: RefObject<HTMLDivElement | null>;
  cells: TMTapeCell[];
}

export function useTapeHeadTracking({
  headIndicatorRef,
  focusedCellRef,
  tapeScrollerRef,
  cells,
}: UseTapeHeadTrackingProps) {
  const headIndicatorFrameRef = useRef<number | null>(null);

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
    const scrollerRect = tapeScroller.getBoundingClientRect();
    const focusedCellRect = focusedCell.getBoundingClientRect();

    const focusedCellCenterPx =
      focusedCellRect.left - viewportRect.left + focusedCellRect.width / 2;
    const focusedCellCenterClientX =
      focusedCellRect.left + focusedCellRect.width / 2;

    if (
      focusedCellCenterClientX < scrollerRect.left ||
      focusedCellCenterClientX > scrollerRect.right
    ) {
      headIndicator.style.opacity = "0";
    } else {
      headIndicator.style.opacity = "1";
    }

    headIndicator.style.transform = `translateX(${focusedCellCenterPx}px) translateX(-50%)`;
  }, [focusedCellRef, headIndicatorRef, tapeScrollerRef]);

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
    updateHeadIndicatorPosition();
  }, [cells, updateHeadIndicatorPosition]);

  return { updateHeadIndicatorPosition, trackHeadIndicatorDuringAnimation };
}

export interface UseTapeAutoCenterProps {
  tapeScrollerRef: RefObject<HTMLDivElement | null>;
  focusedCellRef: RefObject<HTMLDivElement | null>;
  autoCenterKey: string;
  headPosition: number;
  transitionDurationMs: number;
  trackHeadIndicatorDuringAnimation: (durationMs: number) => void;
}

export function useTapeAutoCenter({
  tapeScrollerRef,
  focusedCellRef,
  autoCenterKey,
  headPosition,
  transitionDurationMs,
  trackHeadIndicatorDuringAnimation,
}: UseTapeAutoCenterProps) {
  const previousAutoCenterKeyRef = useRef<string | null>(null);

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
    tapeScrollerRef,
    focusedCellRef,
    trackHeadIndicatorDuringAnimation,
    transitionDurationMs,
  ]);
}

export interface UseTapeShiftAnimationProps {
  tapeTrackRef: RefObject<HTMLDivElement | null>;
  tapeRangeMinIndex: number;
  effectiveWindowRadius: number;
  transitionDurationMs: number;
  updateHeadIndicatorPosition: () => void;
  trackHeadIndicatorDuringAnimation: (durationMs: number) => void;
}

export function useTapeShiftAnimation({
  tapeTrackRef,
  tapeRangeMinIndex,
  effectiveWindowRadius,
  transitionDurationMs,
  updateHeadIndicatorPosition,
  trackHeadIndicatorDuringAnimation,
}: UseTapeShiftAnimationProps) {
  const previousStartIndexRef = useRef<number | null>(null);
  const previousWindowRadiusRef = useRef<number | null>(null);
  const tapeShiftFrameRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    const tapeTrack = tapeTrackRef.current;
    if (!tapeTrack) {
      previousStartIndexRef.current = tapeRangeMinIndex;
      previousWindowRadiusRef.current = effectiveWindowRadius;
      return;
    }

    if (previousStartIndexRef.current === null) {
      previousStartIndexRef.current = tapeRangeMinIndex;
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
      previousStartIndexRef.current = tapeRangeMinIndex;
      tapeTrack.style.transitionDuration = "0ms";
      tapeTrack.style.transform = "translateX(0px)";
      return;
    }

    const previousStartIndex = previousStartIndexRef.current;
    const shiftedCells = tapeRangeMinIndex - previousStartIndex;
    previousStartIndexRef.current = tapeRangeMinIndex;

    if (!shouldAnimateTapeShift(shiftedCells, transitionDurationMs)) {
      tapeTrack.style.transitionDuration = "0ms";
      tapeTrack.style.transform = "translateX(0px)";
      return;
    }

    if (tapeShiftFrameRef.current !== null) {
      window.cancelAnimationFrame(tapeShiftFrameRef.current);
    }

    executeTapeShiftAnimation({
      tapeTrack,
      shiftedCells,
      transitionDurationMs,
      updateHeadIndicatorPosition,
      trackHeadIndicatorDuringAnimation,
      onAnimationScheduled: (frameId) => {
        tapeShiftFrameRef.current = frameId;
      },
      onAnimationComplete: () => {
        tapeShiftFrameRef.current = null;
      },
    });

    return () => {
      if (tapeShiftFrameRef.current !== null) {
        window.cancelAnimationFrame(tapeShiftFrameRef.current);
        tapeShiftFrameRef.current = null;
      }
    };
  }, [
    effectiveWindowRadius,
    tapeRangeMinIndex,
    trackHeadIndicatorDuringAnimation,
    transitionDurationMs,
    updateHeadIndicatorPosition,
    tapeTrackRef,
  ]);
}

interface ExecuteTapeShiftAnimationOptions {
  tapeTrack: HTMLDivElement;
  shiftedCells: number;
  transitionDurationMs: number;
  updateHeadIndicatorPosition: () => void;
  trackHeadIndicatorDuringAnimation: (durationMs: number) => void;
  onAnimationScheduled: (frameId: number) => void;
  onAnimationComplete: () => void;
}

function executeTapeShiftAnimation({
  tapeTrack,
  shiftedCells,
  transitionDurationMs,
  updateHeadIndicatorPosition,
  trackHeadIndicatorDuringAnimation,
  onAnimationScheduled,
  onAnimationComplete,
}: ExecuteTapeShiftAnimationOptions): void {
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

  const frameId = window.requestAnimationFrame(() => {
    tapeTrack.style.transitionDuration = `${transitionDurationMs}ms`;
    tapeTrack.style.transform = "translateX(0px)";
    trackHeadIndicatorDuringAnimation(transitionDurationMs);
    onAnimationComplete();
  });
  onAnimationScheduled(frameId);
}
