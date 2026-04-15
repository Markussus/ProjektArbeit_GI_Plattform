import { useTranslation } from "react-i18next";
import { TableView } from "@/components/shared/TableVisual/TableView";

interface TMTransitionTableEditorProps {
  headers: string[];
  rows: string[][];
  onCellChange: (rowIndex: number, colIndex: number, value: string) => void;
  onHeaderChange: (colIndex: number, value: string) => void;
  onAddRow: () => void;
  onRemoveRow: (rowIndex: number) => void;
  onAddColumn: () => void;
  onRemoveColumn: (colIndex: number) => void;
}

export function TMTransitionTableEditor({
  headers,
  rows,
  onCellChange,
  onHeaderChange,
  onAddRow,
  onRemoveRow,
  onAddColumn,
  onRemoveColumn,
}: TMTransitionTableEditorProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2 overflow-hidden">
      <div className="mb-2 min-h-[3.5rem]">
        <h3 className="text-md font-semibold">
          {t("tm.config.transitionTable", "Transition Table")}
        </h3>
        <p className="text-muted-foreground text-sm">
          {t("tm.config.transitionFormat", "Format:")}{" "}
          <code>(Next State, Write Symbol, Movement)</code>
          {t("tm.config.transitionExample", " e.g., (q1, 0, R)")}
        </p>
      </div>

      <TableView
        headers={headers}
        rows={rows}
        editable={true}
        onCellChange={onCellChange}
        onHeaderChange={onHeaderChange}
        canAddRow={true}
        onAddRow={onAddRow}
        canRemoveRow={true}
        onRemoveRow={onRemoveRow}
        canAddColumn={true}
        onAddColumn={onAddColumn}
        canRemoveColumn={true}
        onRemoveColumn={onRemoveColumn}
      />
    </div>
  );
}
