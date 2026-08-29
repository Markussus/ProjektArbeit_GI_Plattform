const HEAD_WINDOW_TRANSITION_RATIO = 0.6;
const MIN_TRANSITION_MS = 120;
const MAX_TRANSITION_MS = 600;
const NO_ANIMATION_THRESHOLD_MS = 140;
const MAX_ANIMATED_TAPE_SHIFT_CELLS = 1;
export const DEFAULT_HEAD_WINDOW_RADIUS = 5;

export interface TMTapeCell {
  index: number;
  value: string;
  isFocused: boolean;
}

export interface TMTapeViewport {
  effectiveWindowRadius: number;
  effectiveHeadWindowRadius: number;
  minIndex: number;
  maxIndex: number;
}

export interface TMTapeContentRange {
  minIndex: number;
  maxIndex: number;
}

export interface TMTapeRenderRange {
  minIndex: number;
  maxIndex: number;
}

export function resolveTapeViewport(
  headPosition: number,
  windowRadius: number,
  headWindowRadius: number,
  responsiveWindowRadius: number,
): TMTapeViewport {
  const maxWindowRadius = Math.max(windowRadius, 0);
  const effectiveWindowRadius = Math.min(
    Math.max(responsiveWindowRadius, 0),
    maxWindowRadius,
  );
  const effectiveHeadWindowRadius = Math.min(
    Math.max(headWindowRadius, 0),
    effectiveWindowRadius,
  );
  const headViewportOffset = Math.max(
    -effectiveHeadWindowRadius,
    Math.min(headPosition, effectiveHeadWindowRadius),
  );
  const viewportCenter = headPosition - headViewportOffset;

  return {
    effectiveWindowRadius,
    effectiveHeadWindowRadius,
    minIndex: viewportCenter - effectiveWindowRadius,
    maxIndex: viewportCenter + effectiveWindowRadius,
  };
}

export function getTapeContentRange(
  tape: Record<number, string>,
  blankSymbol: string,
  fallbackIndex: number,
): TMTapeContentRange {
  let minIndex: number | null = null;
  let maxIndex: number | null = null;

  for (const [rawIndex, rawSymbol] of Object.entries(tape)) {
    const index = Number(rawIndex);
    const symbol = rawSymbol ?? blankSymbol;

    if (!Number.isFinite(index) || symbol === "" || symbol === blankSymbol) {
      continue;
    }

    minIndex = minIndex === null ? index : Math.min(minIndex, index);
    maxIndex = maxIndex === null ? index : Math.max(maxIndex, index);
  }

  return {
    minIndex: minIndex ?? fallbackIndex,
    maxIndex: maxIndex ?? fallbackIndex,
  };
}

export function getTapeRenderRange(params: {
  viewportStartIndex: number;
  viewportEndIndex: number;
  contentRange: TMTapeContentRange;
  paddingCells: number;
}): TMTapeRenderRange {
  const { viewportStartIndex, viewportEndIndex, contentRange, paddingCells } =
    params;
  const safePaddingCells = Math.max(paddingCells, 0);

  return {
    minIndex: Math.min(
      viewportStartIndex,
      contentRange.minIndex - safePaddingCells,
    ),
    maxIndex: Math.max(
      viewportEndIndex,
      contentRange.maxIndex + safePaddingCells,
    ),
  };
}

export function getTapeTransitionDurationMs(stepDurationMs: number): number {
  if (stepDurationMs <= NO_ANIMATION_THRESHOLD_MS) {
    return 0;
  }

  return Math.min(
    MAX_TRANSITION_MS,
    Math.max(
      MIN_TRANSITION_MS,
      Math.round(stepDurationMs * HEAD_WINDOW_TRANSITION_RATIO),
    ),
  );
}

export function buildTapeCells(
  tape: Record<number, string>,
  headPosition: number,
  blankSymbol: string,
  startIndex: number,
  endIndex: number,
): TMTapeCell[] {
  const cells: TMTapeCell[] = [];

  for (let index = startIndex; index <= endIndex; index += 1) {
    const symbol =
      tape[index] !== undefined && tape[index] !== null
        ? tape[index]
        : blankSymbol;

    cells.push({
      index,
      value: symbol === "" ? blankSymbol : symbol,
      isFocused: index === headPosition,
    });
  }

  return cells;
}

export function getResponsiveWindowRadius(params: {
  viewportWidth: number;
  baseWidthPx: number;
  cellWidthPx: number;
  cellPitchPx: number;
  maxWindowRadius: number;
}): number {
  const {
    viewportWidth,
    baseWidthPx,
    cellWidthPx,
    cellPitchPx,
    maxWindowRadius,
  } = params;

  if (cellWidthPx <= 0 || cellPitchPx <= 0) {
    return maxWindowRadius;
  }

  const maxVisibleCells = Math.max(
    1,
    Math.floor((viewportWidth - baseWidthPx - cellWidthPx) / cellPitchPx) + 1,
  );

  return Math.min(maxWindowRadius, Math.floor((maxVisibleCells - 1) / 2));
}

export function shouldAnimateTapeShift(
  shiftedCells: number,
  transitionDurationMs: number,
): boolean {
  return (
    shiftedCells !== 0 &&
    Math.abs(shiftedCells) <= MAX_ANIMATED_TAPE_SHIFT_CELLS &&
    transitionDurationMs > 0
  );
}
