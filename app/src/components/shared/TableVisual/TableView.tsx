import { useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const TABLE_CONTAINER_CLASS =
  "bg-card text-card-foreground w-max max-w-full overflow-x-auto rounded-lg border shadow-sm";
const TABLE_CLASS = "w-max table-fixed border-collapse text-sm";
const HEADER_ROW_CLASS = "bg-muted/50 border-b";
const HEADER_CELL_CLASS =
  "group relative border-r p-3 text-left align-middle font-semibold last:border-r-0";
const HEADER_CELL_ACTIVE_CLASS = "bg-primary/20 text-foreground";
const HEADER_INPUT_CLASS =
  "focus:ring-primary -ml-1 w-full rounded border-none bg-transparent px-1 text-sm font-semibold focus:ring-1 focus:outline-none";
const HEADER_CONTENT_CLASS = "flex min-w-15 items-center justify-between gap-1";
const BODY_ROW_CLASS = "group border-b transition-colors last:border-b-0";
const BODY_ROW_ACTIVE_CLASS = "bg-primary/10";
const BODY_CELL_CLASS =
  "relative border-r p-2 align-middle transition-all last:border-r-0";
const BODY_CELL_ACTIVE_CLASS =
  "bg-primary/30 ring-primary z-10 font-medium ring-2 ring-inset";
const BODY_CELL_SECONDARY_CLASS = "bg-primary/5";
const BODY_CELL_INVALID_CLASS =
  "bg-destructive/10 ring-destructive z-10 ring-2 ring-inset";
const CELL_INPUT_CLASS =
  "focus:ring-primary hover:bg-muted/50 focus:bg-background w-full rounded border-none bg-transparent px-2 py-1 font-mono text-sm transition-colors focus:ring-1 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50";
const CELL_INPUT_INVALID_CLASS = "text-destructive focus:ring-destructive";
const READ_ONLY_CELL_CLASS =
  "flex min-h-7 items-center truncate px-2 py-1 font-mono text-sm";
const HOVER_ACTION_BUTTON_CLASS =
  "text-destructive hover:bg-destructive/10 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40";
const ROW_ACTION_BUTTON_CLASS =
  "text-destructive hover:bg-destructive/10 mx-auto flex w-full items-center justify-center rounded p-1.5 opacity-0 transition-opacity group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40";
const ADD_ACTION_BUTTON_CLASS =
  "text-muted-foreground hover:text-primary hover:bg-primary/10 flex h-full min-h-8 w-full items-center justify-center rounded transition-colors disabled:cursor-not-allowed disabled:opacity-40";
const ADD_ROW_BUTTON_CLASS =
  "text-muted-foreground hover:text-primary hover:bg-primary/5 border-border hover:border-primary/50 flex w-full items-center justify-center gap-2 rounded border border-dashed px-3 py-1.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40";
export const DEFAULT_FIRST_COLUMN_WIDTH_CLASS = "w-[2.5rem] max-w-[2.5rem]";
export const DEFAULT_DATA_COLUMN_WIDTH_CLASS = "w-[8rem] max-w-[8rem]";

export interface TablePosition {
  row: number;
  col: number;
}

export type TableEditMode = "none" | "cells" | "all";

export interface TableViewProps {
  /** Array of column headers */
  headers: string[];
  /** 2D Array of table rows/cells */
  rows: string[][];
  /** Highlight a specific cell */
  activeCell?: TablePosition | null;
  /** Highlight an entire row */
  activeRow?: number | null;
  /** Highlight an entire column */
  activeCol?: number | null;
  /** Edit mode for the table: read-only, cells only, or cells plus headers */
  editMode?: TableEditMode;
  /** Callback when cell text changes */
  onCellChange?: (rowIndex: number, colIndex: number, value: string) => void;
  /** Callback when a cell loses focus */
  onCellBlur?: (rowIndex: number, colIndex: number) => void;
  /** Callback when header text changes */
  onHeaderChange?: (colIndex: number, value: string) => void;
  /** Mark a specific cell as invalid */
  invalidCell?: TablePosition | null;
  /** Explicitly allow editing for specific cells, even if the table is otherwise read-only */
  isCellEditable?: (rowIndex: number, colIndex: number) => boolean;
  /** Disable editing for specific cells */
  isCellDisabled?: (rowIndex: number, colIndex: number) => boolean;
  /** Can new rows be added by the user? */
  canAddRow?: boolean;
  onAddRow?: () => void;
  disableAddRow?: boolean;
  /** Can rows be removed by the user? */
  canRemoveRow?: boolean;
  onRemoveRow?: (rowIndex: number) => void;
  disableRemoveRow?: boolean;
  /** Can new columns be added by the user? */
  canAddColumn?: boolean;
  onAddColumn?: () => void;
  disableAddColumn?: boolean;
  /** Can columns be removed by the user? */
  canRemoveColumn?: boolean;
  onRemoveColumn?: (colIndex: number) => void;
  disableRemoveColumn?: boolean;
  firstColumnWidthClassName?: string;
  dataColumnWidthClassName?: string;
  className?: string;
  tableClassName?: string;
}

interface TableCellState {
  value: string;
  isInvalid: boolean;
  canEdit: boolean;
  disabled: boolean;
  highlightSpecific: boolean;
  highlightSecondary: boolean;
}

function getMaxCols(headers: string[], rows: string[][]): number {
  return Math.max(headers.length, ...rows.map((row) => row.length));
}

function normalizeHeaders(headers: string[], maxCols: number): string[] {
  return Array.from({ length: maxCols }, (_, index) => headers[index] ?? "");
}

function getColumnWidthClassName(
  colIndex: number,
  firstColumnWidthClassName: string,
  dataColumnWidthClassName: string,
): string {
  return colIndex === 0 ? firstColumnWidthClassName : dataColumnWidthClassName;
}

function getTableCellState({
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

export function TableView({
  headers,
  rows,
  activeCell,
  activeRow,
  activeCol,
  editMode = "none",
  onCellChange,
  onCellBlur,
  onHeaderChange,
  invalidCell,
  isCellEditable,
  isCellDisabled,
  canAddRow = false,
  onAddRow,
  disableAddRow = false,
  canRemoveRow = false,
  onRemoveRow,
  disableRemoveRow = false,
  canAddColumn = false,
  onAddColumn,
  disableAddColumn = false,
  canRemoveColumn = false,
  onRemoveColumn,
  disableRemoveColumn = false,
  firstColumnWidthClassName = DEFAULT_FIRST_COLUMN_WIDTH_CLASS,
  dataColumnWidthClassName = DEFAULT_DATA_COLUMN_WIDTH_CLASS,
  className,
  tableClassName,
}: TableViewProps) {
  const { t } = useTranslation();

  const maxCols = useMemo(() => {
    return getMaxCols(headers, rows);
  }, [headers, rows]);

  const normalizedHeaders = useMemo(
    () => normalizeHeaders(headers, maxCols),
    [headers, maxCols],
  );

  const cellsEditable = editMode !== "none";
  const headersEditable = editMode === "all";
  const showAddRowControl = canAddRow && cellsEditable;
  const showRemoveRowControl = canRemoveRow && cellsEditable;
  const showAddColumnControl = canAddColumn && headersEditable;
  const showRemoveColumnControl = canRemoveColumn && headersEditable;
  const hasTrailingActionColumn = showRemoveRowControl || showAddColumnControl;
  const contentColSpan = maxCols + (hasTrailingActionColumn ? 1 : 0);
  const labels = {
    table: t("simulation.table.label", "Table view"),
    empty: t("simulation.table.empty", "Table is empty"),
    addRow: t("simulation.table.addRow", "Add new row"),
    addColumn: t("simulation.table.addColumn", "Add column"),
    removeColumn: t("simulation.table.removeColumn", "Remove column"),
    removeRow: t("simulation.table.removeRow", "Remove row"),
    columnActions: t("simulation.table.columnActions", "Column actions"),
    rowActions: t("simulation.table.rowActions", "Row actions"),
  };

  const getColumnLabel = (header: string, colIndex: number) =>
    header ||
    t("simulation.table.columnHeader", "Column {{index}}", {
      index: colIndex + 1,
    });

  const getHeaderInputAriaLabel = (colIndex: number) =>
    t("simulation.table.editColumnHeader", "Edit column {{index}} header", {
      index: colIndex + 1,
    });

  const getCellInputAriaLabel = (rowIndex: number, colIndex: number) =>
    t(
      "simulation.table.editCell",
      "Edit cell in row {{row}}, column {{column}}",
      {
        row: rowIndex + 1,
        column: normalizedHeaders[colIndex]
          ? normalizedHeaders[colIndex]
          : colIndex + 1,
      },
    );

  const renderHeaderCell = (header: string, colIndex: number) => {
    const isColActive = activeCol === colIndex;
    const headerLabel = getColumnLabel(header, colIndex);

    return (
      <th
        key={`header-${colIndex}`}
        scope="col"
        className={cn(
          HEADER_CELL_CLASS,
          getColumnWidthClassName(
            colIndex,
            firstColumnWidthClassName,
            dataColumnWidthClassName,
          ),
          isColActive && HEADER_CELL_ACTIVE_CLASS,
        )}
      >
        <div className={HEADER_CONTENT_CLASS}>
          {headersEditable ? (
            <input
              value={header}
              onChange={(e) => onHeaderChange?.(colIndex, e.target.value)}
              aria-label={getHeaderInputAriaLabel(colIndex)}
              className={HEADER_INPUT_CLASS}
              autoComplete="off"
              spellCheck="false"
            />
          ) : (
            <>
              <span aria-hidden="true" className="truncate">
                {header}
              </span>
              {!header && <span className="sr-only">{headerLabel}</span>}
            </>
          )}

          {showRemoveColumnControl && (
            <button
              type="button"
              onClick={() => onRemoveColumn?.(colIndex)}
              disabled={disableRemoveColumn}
              aria-label={labels.removeColumn}
              className={cn(HOVER_ACTION_BUTTON_CLASS, "-mr-1")}
              title={labels.removeColumn}
            >
              <Trash2 size={14} className="shrink-0" />
            </button>
          )}
        </div>
      </th>
    );
  };

  const renderTrailingHeaderCell = () => {
    if (showAddColumnControl) {
      return (
        <th scope="col" className="w-10 border-l p-1">
          <span className="sr-only">{labels.columnActions}</span>
          <button
            type="button"
            onClick={onAddColumn}
            disabled={disableAddColumn}
            aria-label={labels.addColumn}
            className={ADD_ACTION_BUTTON_CLASS}
            title={labels.addColumn}
          >
            <Plus size={16} />
          </button>
        </th>
      );
    }

    if (showRemoveRowControl) {
      return (
        <th scope="col" className="w-10 border-l px-0">
          <span className="sr-only">{labels.rowActions}</span>
        </th>
      );
    }

    return null;
  };

  const renderRowActionCell = (rowIndex: number) => {
    if (!hasTrailingActionColumn) {
      return null;
    }

    return (
      <td className="w-10 border-b-0 border-l p-1 text-center align-middle">
        {showRemoveRowControl && (
          <button
            type="button"
            onClick={() => onRemoveRow?.(rowIndex)}
            disabled={disableRemoveRow}
            aria-label={t(
              "simulation.table.removeRowWithIndex",
              "Remove row {{index}}",
              { index: rowIndex + 1 },
            )}
            className={ROW_ACTION_BUTTON_CLASS}
            title={labels.removeRow}
          >
            <Trash2 size={14} />
          </button>
        )}
      </td>
    );
  };

  const renderBodyCell = (
    row: string[],
    rowIndex: number,
    colIndex: number,
  ) => {
    const columnLabel = getColumnLabel(normalizedHeaders[colIndex], colIndex);
    const cellState = getTableCellState({
      row,
      rowIndex,
      colIndex,
      activeCell,
      activeCol,
      invalidCell,
      cellsEditable,
      isCellEditable,
      isCellDisabled,
    });

    return (
      <td
        key={`cell-${rowIndex}-${colIndex}`}
        className={cn(
          BODY_CELL_CLASS,
          getColumnWidthClassName(
            colIndex,
            firstColumnWidthClassName,
            dataColumnWidthClassName,
          ),
          cellState.highlightSpecific && BODY_CELL_ACTIVE_CLASS,
          cellState.highlightSecondary && BODY_CELL_SECONDARY_CLASS,
          cellState.isInvalid && BODY_CELL_INVALID_CLASS,
        )}
      >
        {cellState.canEdit ? (
          <input
            value={cellState.value}
            onChange={(e) => onCellChange?.(rowIndex, colIndex, e.target.value)}
            onBlur={() => onCellBlur?.(rowIndex, colIndex)}
            disabled={cellState.disabled}
            aria-invalid={cellState.isInvalid || undefined}
            aria-label={getCellInputAriaLabel(rowIndex, colIndex)}
            className={cn(
              CELL_INPUT_CLASS,
              cellState.isInvalid && CELL_INPUT_INVALID_CLASS,
            )}
            autoComplete="off"
            spellCheck="false"
          />
        ) : (
          <div aria-label={columnLabel} className={READ_ONLY_CELL_CLASS}>
            {cellState.value}
          </div>
        )}
      </td>
    );
  };

  return (
    <div className={cn(TABLE_CONTAINER_CLASS, className)}>
      <table
        aria-label={labels.table}
        className={cn(TABLE_CLASS, tableClassName)}
      >
        <thead className={HEADER_ROW_CLASS}>
          <tr>
            {normalizedHeaders.map(renderHeaderCell)}
            {renderTrailingHeaderCell()}
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={contentColSpan}
                className="text-muted-foreground rounded-b-lg p-8 text-center italic"
              >
                {labels.empty}
              </td>
            </tr>
          ) : (
            rows.map((row, rIdx) => {
              const isRowActive = activeRow === rIdx;

              return (
                <tr
                  key={`row-${rIdx}`}
                  className={cn(
                    BODY_ROW_CLASS,
                    isRowActive && BODY_ROW_ACTIVE_CLASS,
                  )}
                >
                  {Array.from({ length: maxCols }, (_, cIdx) =>
                    renderBodyCell(row, rIdx, cIdx),
                  )}
                  {renderRowActionCell(rIdx)}
                </tr>
              );
            })
          )}

          {showAddRowControl && (
            <tr className="bg-muted/10 hover:bg-muted/30 transition-colors">
              <td colSpan={contentColSpan} className="border-t p-2">
                <button
                  type="button"
                  onClick={onAddRow}
                  disabled={disableAddRow}
                  aria-label={labels.addRow}
                  className={ADD_ROW_BUTTON_CLASS}
                >
                  <Plus size={16} />
                  {labels.addRow}
                </button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
