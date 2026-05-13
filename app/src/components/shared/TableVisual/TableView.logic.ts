export const TABLE_CONTAINER_CLASS =
  "bg-card text-card-foreground w-max max-w-full overflow-x-auto rounded-lg border shadow-sm";
export const TABLE_CLASS = "w-max table-fixed border-collapse text-sm";
export const HEADER_ROW_CLASS = "bg-muted/50 border-b";
export const HEADER_CELL_CLASS =
  "group relative border-r p-3 text-left align-middle font-semibold last:border-r-0";
export const HEADER_CELL_ACTIVE_CLASS = "bg-primary/20 text-foreground";
export const HEADER_INPUT_CLASS =
  "focus:ring-primary -ml-1 w-full rounded border-none bg-transparent px-1 text-sm font-semibold focus:ring-1 focus:outline-none";
export const HEADER_CONTENT_CLASS =
  "flex min-w-15 items-center justify-between gap-1";
export const BODY_ROW_CLASS =
  "group border-b transition-colors last:border-b-0";
export const BODY_ROW_ACTIVE_CLASS = "bg-primary/10";
export const BODY_CELL_CLASS =
  "relative border-r p-2 align-middle transition-all last:border-r-0";
export const BODY_CELL_ACTIVE_CLASS =
  "bg-primary/30 ring-primary z-10 font-medium ring-2 ring-inset";
export const BODY_CELL_SECONDARY_CLASS = "bg-primary/5";
export const BODY_CELL_INVALID_CLASS =
  "bg-destructive/10 ring-destructive z-10 ring-2 ring-inset";
export const CELL_INPUT_CLASS =
  "focus:ring-primary hover:bg-muted/50 focus:bg-background w-full rounded border-none bg-transparent px-2 py-1 font-mono text-sm transition-colors focus:ring-1 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50";
export const CELL_INPUT_INVALID_CLASS =
  "text-destructive focus:ring-destructive";
export const READ_ONLY_CELL_CLASS =
  "flex min-h-7 items-center truncate px-2 py-1 font-mono text-sm";
export const HOVER_ACTION_BUTTON_CLASS =
  "text-destructive hover:bg-destructive/10 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40";
export const ROW_ACTION_BUTTON_CLASS =
  "text-destructive hover:bg-destructive/10 mx-auto flex w-full items-center justify-center rounded p-1.5 opacity-0 transition-opacity group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40";
export const ADD_ACTION_BUTTON_CLASS =
  "text-muted-foreground hover:text-primary hover:bg-primary/10 flex h-full min-h-8 w-full items-center justify-center rounded transition-colors disabled:cursor-not-allowed disabled:opacity-40";
export const ADD_ROW_BUTTON_CLASS =
  "text-muted-foreground hover:text-primary hover:bg-primary/5 border-border hover:border-primary/50 flex w-full items-center justify-center gap-2 rounded border border-dashed px-3 py-1.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40";
export const DEFAULT_FIRST_COLUMN_WIDTH_CLASS = "w-[2.5rem] max-w-[2.5rem]";
export const DEFAULT_DATA_COLUMN_WIDTH_CLASS = "w-[8rem] max-w-[8rem]";

export interface TablePosition {
  row: number;
  col: number;
}

export type TableEditMode = "none" | "cells" | "all";

export interface TableViewProps {
  headers: string[];
  rows: string[][];
  activeCell?: TablePosition | null;
  activeRow?: number | null;
  activeCol?: number | null;
  editMode?: TableEditMode;
  onCellChange?: (rowIndex: number, colIndex: number, value: string) => void;
  onCellBlur?: (rowIndex: number, colIndex: number) => void;
  onHeaderChange?: (colIndex: number, value: string) => void;
  invalidCell?: TablePosition | null;
  isCellEditable?: (rowIndex: number, colIndex: number) => boolean;
  isCellDisabled?: (rowIndex: number, colIndex: number) => boolean;
  canAddRow?: boolean;
  onAddRow?: () => void;
  disableAddRow?: boolean;
  canRemoveRow?: boolean;
  onRemoveRow?: (rowIndex: number) => void;
  disableRemoveRow?: boolean;
  canAddColumn?: boolean;
  onAddColumn?: () => void;
  disableAddColumn?: boolean;
  canRemoveColumn?: boolean;
  onRemoveColumn?: (colIndex: number) => void;
  disableRemoveColumn?: boolean;
  firstColumnWidthClassName?: string;
  dataColumnWidthClassName?: string;
  className?: string;
  tableClassName?: string;
  /**
   * If true, the table will NOT auto-scroll the active cell into view when
   * activeCell changes. The active cell is still highlighted; only the
   * camera/scroll movement is suppressed. Default false (legacy behavior).
   */
  disableActiveCellAutoScroll?: boolean;
}

export interface TableCellState {
  value: string;
  isInvalid: boolean;
  canEdit: boolean;
  disabled: boolean;
  highlightSpecific: boolean;
  highlightSecondary: boolean;
}

interface ScrollAxisState {
  currentScroll: number;
  viewportStart: number;
  viewportSize: number;
  targetStart: number;
  targetSize: number;
}

export function getMaxCols(headers: string[], rows: string[][]): number {
  return Math.max(headers.length, ...rows.map((row) => row.length));
}

export function normalizeHeaders(headers: string[], maxCols: number): string[] {
  return Array.from({ length: maxCols }, (_, index) => headers[index] ?? "");
}

export function getColumnWidthClassName(
  colIndex: number,
  firstColumnWidthClassName: string,
  dataColumnWidthClassName: string,
): string {
  return colIndex === 0 ? firstColumnWidthClassName : dataColumnWidthClassName;
}

export function getTableCellState({
  row,
  rowIndex,
  colIndex,
  activeCell,
  activeCol,
  invalidCell,
  cellsEditable,
  isCellEditable,
  isCellDisabled,
}: {
  row: string[];
  rowIndex: number;
  colIndex: number;
  activeCell?: TablePosition | null;
  activeCol?: number | null;
  invalidCell?: TablePosition | null;
  cellsEditable: boolean;
  isCellEditable?: (rowIndex: number, colIndex: number) => boolean;
  isCellDisabled?: (rowIndex: number, colIndex: number) => boolean;
}): TableCellState {
  const value = row[colIndex] || "";
  const isInvalid =
    invalidCell?.row === rowIndex && invalidCell?.col === colIndex;
  const isActive = activeCell?.row === rowIndex && activeCell?.col === colIndex;
  const isColumnActive = activeCol === colIndex;
  const explicitlyEditable = isCellEditable?.(rowIndex, colIndex) ?? false;
  const disabled =
    !explicitlyEditable && (isCellDisabled?.(rowIndex, colIndex) ?? false);

  return {
    value,
    isInvalid,
    canEdit: cellsEditable || explicitlyEditable,
    disabled,
    highlightSpecific: isActive,
    highlightSecondary: !isActive && isColumnActive,
  };
}

export function getNextScrollPosition({
  currentScroll,
  viewportStart,
  viewportSize,
  targetStart,
  targetSize,
}: ScrollAxisState): number | null {
  const viewportEnd = viewportStart + viewportSize;
  const targetEnd = targetStart + targetSize;

  if (targetStart < viewportStart) {
    return Math.max(0, currentScroll - (viewportStart - targetStart));
  }

  if (targetEnd > viewportEnd) {
    return Math.max(0, currentScroll + (targetEnd - viewportEnd));
  }

  return null;
}

export function syncActiveCellIntoView(
  container: HTMLDivElement,
  activeCell: TablePosition | null | undefined,
): void {
  if (!activeCell) {
    return;
  }

  const cell = container.querySelector<HTMLTableCellElement>(
    `[data-table-row="${activeCell.row}"][data-table-col="${activeCell.col}"]`,
  );

  if (!cell) {
    return;
  }

  const containerRect = container.getBoundingClientRect();
  const cellRect = cell.getBoundingClientRect();
  const viewportLeft = containerRect.left + container.clientLeft;
  const viewportTop = containerRect.top + container.clientTop;
  const nextLeft = getNextScrollPosition({
    currentScroll: container.scrollLeft,
    viewportStart: viewportLeft,
    viewportSize: container.clientWidth,
    targetStart: cellRect.left,
    targetSize: cellRect.width,
  });
  const nextTop = getNextScrollPosition({
    currentScroll: container.scrollTop,
    viewportStart: viewportTop,
    viewportSize: container.clientHeight,
    targetStart: cellRect.top,
    targetSize: cellRect.height,
  });

  if (nextLeft !== null) {
    container.scrollLeft = nextLeft;
  }

  if (nextTop !== null) {
    container.scrollTop = nextTop;
  }
}
