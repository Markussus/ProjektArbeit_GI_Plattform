import { useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export interface TablePosition {
  row: number;
  col: number;
}

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
  /** Are the cells editable? */
  editable?: boolean;
  /** Callback when cell text changes */
  onCellChange?: (rowIndex: number, colIndex: number, value: string) => void;
  /** Callback when header text changes */
  onHeaderChange?: (colIndex: number, value: string) => void;
  /** Can new rows be added by the user? */
  canAddRow?: boolean;
  onAddRow?: () => void;
  /** Can rows be removed by the user? */
  canRemoveRow?: boolean;
  onRemoveRow?: (rowIndex: number) => void;
  /** Can new columns be added by the user? */
  canAddColumn?: boolean;
  onAddColumn?: () => void;
  /** Can columns be removed by the user? */
  canRemoveColumn?: boolean;
  onRemoveColumn?: (colIndex: number) => void;
  className?: string;
  tableClassName?: string;
}

export function TableView({
  headers,
  rows,
  activeCell,
  activeRow,
  activeCol,
  editable = false,
  onCellChange,
  onHeaderChange,
  canAddRow = false,
  onAddRow,
  canRemoveRow = false,
  onRemoveRow,
  canAddColumn = false,
  onAddColumn,
  canRemoveColumn = false,
  onRemoveColumn,
  className,
  tableClassName,
}: TableViewProps) {
  const { t } = useTranslation();

  // Determine standard column count. Ensure enough cells in each row.
  const maxCols = useMemo(() => {
    return Math.max(headers.length, ...rows.map((r) => r.length));
  }, [headers.length, rows]);

  const hasRowActions = (canRemoveRow || canAddColumn) && editable;

  return (
    <div
      className={cn(
        "bg-card text-card-foreground w-full overflow-x-auto rounded-lg border shadow-sm",
        className,
      )}
    >
      <table className={cn("w-full border-collapse text-sm", tableClassName)}>
        <thead className="bg-muted/50 border-b">
          <tr>
            {headers.map((header, cIdx) => {
              const isColActive = activeCol === cIdx;
              return (
                <th
                  key={`header-${cIdx}`}
                  className={cn(
                    "group relative border-r p-3 text-left align-middle font-semibold last:border-r-0",
                    isColActive && "bg-primary/20 text-foreground",
                  )}
                >
                  <div className="flex min-w-15 items-center justify-between gap-1">
                    {editable ? (
                      <input
                        value={header}
                        onChange={(e) => onHeaderChange?.(cIdx, e.target.value)}
                        className="focus:ring-primary -ml-1 w-full rounded border-none bg-transparent px-1 text-sm font-semibold focus:ring-1 focus:outline-none"
                        autoComplete="off"
                        spellCheck="false"
                      />
                    ) : (
                      <span className="truncate">{header}</span>
                    )}

                    {canRemoveColumn && editable && (
                      <button
                        type="button"
                        onClick={() => onRemoveColumn?.(cIdx)}
                        className="text-destructive hover:bg-destructive/10 -mr-1 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100"
                        title={t(
                          "simulation.table.removeColumn",
                          "Remove column",
                        )}
                      >
                        <Trash2 size={14} className="shrink-0" />
                      </button>
                    )}
                  </div>
                </th>
              );
            })}

            {canAddColumn && editable && (
              <th className="w-10 border-l p-1">
                <button
                  type="button"
                  onClick={onAddColumn}
                  className="text-muted-foreground hover:text-primary hover:bg-primary/10 flex h-full min-h-8 w-full items-center justify-center rounded transition-colors"
                  title={t("simulation.table.addColumn", "Add column")}
                >
                  <Plus size={16} />
                </button>
              </th>
            )}

            {!canAddColumn && canRemoveRow && editable && (
              <th className="w-10 border-l px-0"></th> // Space for trash icons
            )}
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={maxCols + (hasRowActions ? 1 : 0)}
                className="text-muted-foreground rounded-b-lg p-8 text-center italic"
              >
                {t("simulation.table.empty", "Table is empty")}
              </td>
            </tr>
          ) : (
            rows.map((row, rIdx) => {
              const isRowActive = activeRow === rIdx;

              return (
                <tr
                  key={`row-${rIdx}`}
                  className={cn(
                    "group border-b transition-colors last:border-b-0",
                    isRowActive && "bg-primary/10", // Row highlight
                  )}
                >
                  {Array.from({ length: maxCols }).map((_, cIdx) => {
                    const cellValue = row[cIdx] || "";
                    const isColActive = activeCol === cIdx;
                    const isCellActive =
                      activeCell?.row === rIdx && activeCell?.col === cIdx;

                    const highlightSpecificCell = isCellActive;
                    const highlightSecondary = !isCellActive && isColActive;

                    return (
                      <td
                        key={`cell-${rIdx}-${cIdx}`}
                        className={cn(
                          "relative border-r p-2 align-middle transition-all last:border-r-0",
                          highlightSpecificCell &&
                            "bg-primary/30 ring-primary z-10 font-medium ring-2 ring-inset",
                          highlightSecondary && "bg-primary/5",
                        )}
                      >
                        {editable ? (
                          <input
                            value={cellValue}
                            onChange={(e) =>
                              onCellChange?.(rIdx, cIdx, e.target.value)
                            }
                            className="focus:ring-primary hover:bg-muted/50 focus:bg-background w-full rounded border-none bg-transparent px-2 py-1 font-mono text-sm transition-colors focus:ring-1 focus:outline-none"
                            autoComplete="off"
                            spellCheck="false"
                          />
                        ) : (
                          <div className="flex min-h-7 items-center truncate px-2 py-1 font-mono text-sm">
                            {cellValue}
                          </div>
                        )}
                      </td>
                    );
                  })}

                  {hasRowActions && (
                    <td className="w-10 border-b-0 border-l p-1 text-center align-middle">
                      {canRemoveRow && (
                        <button
                          type="button"
                          onClick={() => onRemoveRow?.(rIdx)}
                          className="text-destructive hover:bg-destructive/10 mx-auto flex w-full items-center justify-center rounded p-1.5 opacity-0 transition-opacity group-hover:opacity-100"
                          title={t("simulation.table.removeRow", "Remove row")}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })
          )}

          {canAddRow && editable && (
            <tr className="bg-muted/10 hover:bg-muted/30 transition-colors">
              <td
                colSpan={maxCols + (hasRowActions ? 1 : 0)}
                className="border-t p-2"
              >
                <button
                  type="button"
                  onClick={onAddRow}
                  className="text-muted-foreground hover:text-primary hover:bg-primary/5 border-border hover:border-primary/50 flex w-full items-center justify-center gap-2 rounded border border-dashed px-3 py-1.5 text-sm font-medium transition-all"
                >
                  <Plus size={16} />
                  {t("simulation.table.addRow", "Add new row")}
                </button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
