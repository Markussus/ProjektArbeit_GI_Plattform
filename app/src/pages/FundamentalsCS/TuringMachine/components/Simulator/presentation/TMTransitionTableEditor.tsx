import { useTranslation } from "react-i18next";
import {
  TableView,
  type TablePosition,
} from "@/components/shared/TableVisual/TableView";

export interface TMTransitionTableEditorProps {
  headers: string[];
  rows: string[][];
  onCellChange: (rowIndex: number, colIndex: number, value: string) => void;
  onCellBlur: (rowIndex: number, colIndex: number) => void;
  onHeaderChange: (colIndex: number, value: string) => void;
  onAddRow: () => void;
  onRemoveRow: (rowIndex: number) => void;
  onAddColumn: () => void;
  onRemoveColumn: (colIndex: number) => void;
  invalidCell?: TablePosition | null;
  isCellEditable?: (rowIndex: number, colIndex: number) => boolean;
  isCellDisabled?: (rowIndex: number, colIndex: number) => boolean;
  disabled?: boolean;
}

export function TMTransitionTableEditor({
  headers,
  rows,
  onCellChange,
  onCellBlur,
  onHeaderChange,
  onAddRow,
  onRemoveRow,
  onAddColumn,
  onRemoveColumn,
  invalidCell,
  isCellEditable,
  isCellDisabled,
  disabled = false,
}: TMTransitionTableEditorProps) {
  const { t } = useTranslation();

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="mb-2 min-h-[3.5rem]">
        <h3 className="text-md font-semibold">
          {t("tm.config.transitionTable")}
        </h3>
        <p className="text-muted-foreground text-sm">
          {t("tm.config.transitionFormat")}{" "}
          <code>(Next State, Write Symbol, Movement)</code>
          {t("tm.config.transitionExample")}
        </p>
      </div>

      <div className="w-max max-w-full">
        <TableView
          headers={headers}
          rows={rows}
          editMode={disabled ? "cells" : "all"}
          onCellChange={onCellChange}
          onCellBlur={onCellBlur}
          onHeaderChange={onHeaderChange}
          invalidCell={invalidCell}
          isCellEditable={isCellEditable}
          isCellDisabled={isCellDisabled}
          canAddRow={true}
          onAddRow={onAddRow}
          disableAddRow={disabled}
          canRemoveRow={true}
          onRemoveRow={onRemoveRow}
          disableRemoveRow={disabled}
          canAddColumn={true}
          onAddColumn={onAddColumn}
          disableAddColumn={disabled}
          canRemoveColumn={true}
          onRemoveColumn={onRemoveColumn}
          disableRemoveColumn={disabled}
        />
      </div>
    </div>
  );
}
