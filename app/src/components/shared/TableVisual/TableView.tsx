import { useLayoutEffect, useMemo, useRef } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  ADD_ACTION_BUTTON_CLASS,
  ADD_ROW_BUTTON_CLASS,
  BODY_CELL_ACTIVE_CLASS,
  BODY_CELL_CLASS,
  BODY_CELL_INVALID_CLASS,
  BODY_CELL_SECONDARY_CLASS,
  BODY_ROW_ACTIVE_CLASS,
  BODY_ROW_CLASS,
  CELL_INPUT_CLASS,
  CELL_INPUT_INVALID_CLASS,
  DEFAULT_DATA_COLUMN_WIDTH_CLASS,
  DEFAULT_FIRST_COLUMN_WIDTH_CLASS,
  getColumnWidthClassName,
  getMaxCols,
  getTableCellState,
  HEADER_CELL_ACTIVE_CLASS,
  HEADER_CELL_CLASS,
  HEADER_CONTENT_CLASS,
  HEADER_INPUT_CLASS,
  HEADER_ROW_CLASS,
  HOVER_ACTION_BUTTON_CLASS,
  normalizeHeaders,
  READ_ONLY_CELL_CLASS,
  ROW_ACTION_BUTTON_CLASS,
  syncActiveCellIntoView,
  TABLE_CLASS,
  TABLE_CONTAINER_CLASS,
  type TableViewProps,
} from "./TableView.logic";

export {
  DEFAULT_DATA_COLUMN_WIDTH_CLASS,
  DEFAULT_FIRST_COLUMN_WIDTH_CLASS,
} from "./TableView.logic";
export type {
  TableEditMode,
  TablePosition,
  TableViewProps,
} from "./TableView.logic";

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
  disableActiveCellAutoScroll = false,
}: TableViewProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement | null>(null);

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

  useLayoutEffect(() => {
    if (disableActiveCellAutoScroll) {
      return;
    }
    const container = containerRef.current;
    if (!container) {
      return;
    }

    syncActiveCellIntoView(container, activeCell);
  }, [activeCell, maxCols, rows.length, disableActiveCellAutoScroll]);

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
        data-table-row={rowIndex}
        data-table-col={colIndex}
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
    <div ref={containerRef} className={cn(TABLE_CONTAINER_CLASS, className)}>
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
