import { useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

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
        "w-full overflow-x-auto rounded-lg border bg-card text-card-foreground shadow-sm",
        className
      )}
    >
      <table className={cn("w-full text-sm border-collapse", tableClassName)}>
        <thead className="bg-muted/50 border-b">
          <tr>
            {headers.map((header, cIdx) => {
              const isColActive = activeCol === cIdx;
              return (
                <th
                  key={`header-${cIdx}`}
                  className={cn(
                    "p-3 font-semibold border-r last:border-r-0 relative group text-left align-middle",
                    isColActive && "bg-primary/20 text-foreground"
                  )}
                >
                  <div className="flex items-center justify-between gap-1 min-w-15">
                    {editable ? (
                      <input
                        value={header}
                        onChange={(e) => onHeaderChange?.(cIdx, e.target.value)}
                        className="w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary rounded px-1 -ml-1 text-sm font-semibold"
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
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10 p-1 rounded -mr-1"
                        title={t("simulation.table.removeColumn", "Remove column")}
                      >
                        <Trash2 size={14} className="shrink-0" />
                      </button>
                    )}
                  </div>
                </th>
              );
            })}

            {canAddColumn && editable && (
              <th className="p-1 w-10 border-l">
                <button
                  type="button"
                  onClick={onAddColumn}
                  className="w-full h-full min-h-8 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors"
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
                className="p-8 text-center text-muted-foreground italic rounded-b-lg"
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
                    "border-b last:border-b-0 group transition-colors",
                    isRowActive && "bg-primary/10" // Row highlight
                  )}
                >
                  {Array.from({ length: maxCols }).map((_, cIdx) => {
                    const cellValue = row[cIdx] || "";
                    const isColActive = activeCol === cIdx;
                    const isCellActive = activeCell?.row === rIdx && activeCell?.col === cIdx;

                    const highlightSpecificCell = isCellActive;
                    const highlightSecondary = !isCellActive && isColActive;

                    return (
                      <td
                        key={`cell-${rIdx}-${cIdx}`}
                        className={cn(
                          "p-2 border-r last:border-r-0 relative transition-all align-middle",
                          highlightSpecificCell && "bg-primary/30 ring-inset ring-2 ring-primary z-10 font-medium",
                          highlightSecondary && "bg-primary/5"
                        )}
                      >
                        {editable ? (
                          <input
                            value={cellValue}
                            onChange={(e) => onCellChange?.(rIdx, cIdx, e.target.value)}
                            className="w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary rounded px-2 py-1 text-sm font-mono hover:bg-muted/50 focus:bg-background transition-colors"
                            autoComplete="off"
                            spellCheck="false"
                          />
                        ) : (
                          <div className="px-2 py-1 text-sm font-mono truncate min-h-7 flex items-center">
                            {cellValue}
                          </div>
                        )}
                      </td>
                    );
                  })}

                  {hasRowActions && (
                    <td className="p-1 border-l w-10 text-center align-middle border-b-0">
                      {canRemoveRow && (
                        <button
                          type="button"
                          onClick={() => onRemoveRow?.(rIdx)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center w-full text-destructive hover:bg-destructive/10 p-1.5 rounded mx-auto"
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
                className="p-2 border-t"
              >
                <button
                  type="button"
                  onClick={onAddRow}
                  className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 py-1.5 px-3 rounded border border-dashed border-border hover:border-primary/50 transition-all font-medium"
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





