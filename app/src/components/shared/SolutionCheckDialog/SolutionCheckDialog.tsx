import type { ReactNode } from "react";
import { Popup } from "@/components/shared/Popup/Popup";
import { TableView } from "@/components/shared/TableVisual/TableView";
import type { TableViewProps } from "@/components/shared/TableVisual/TableView";

interface SolutionCheckDialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  testId: string;
  error?: string | null;
  errorTestId?: string;
  summary?: ReactNode;
  tableTestIdPrefix: string;
  headers: string[];
  rows: string[][];
  getRowTestAttributes?: TableViewProps["getRowTestAttributes"];
  firstColumnWidthClassName?: string;
  dataColumnWidthClassName?: string;
}

export function SolutionCheckDialog({
  open,
  title,
  onClose,
  testId,
  error,
  errorTestId,
  summary,
  tableTestIdPrefix,
  headers,
  rows,
  getRowTestAttributes,
  firstColumnWidthClassName = "w-[6rem] max-w-[8rem]",
  dataColumnWidthClassName = "w-[12rem] max-w-[16rem]",
}: SolutionCheckDialogProps) {
  return (
    <Popup open={open} title={title} onClose={onClose} testId={testId}>
      <div className="space-y-4">
        {summary}
        {error && (
          <p data-testid={errorTestId} className="text-sm text-red-600">
            {error}
          </p>
        )}
        {rows.length > 0 && (
          <TableView
            testIdPrefix={tableTestIdPrefix}
            headers={headers}
            rows={rows}
            getRowTestAttributes={getRowTestAttributes}
            firstColumnWidthClassName={firstColumnWidthClassName}
            dataColumnWidthClassName={dataColumnWidthClassName}
          />
        )}
      </div>
    </Popup>
  );
}
