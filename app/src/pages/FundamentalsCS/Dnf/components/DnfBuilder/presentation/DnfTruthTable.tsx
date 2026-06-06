import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { formatBooleanValue } from "../domain/booleanExpression";
import type { TruthTable } from "../domain/truthTable";

type TruthTableRow = TruthTable["rows"][number];

interface DnfTruthTableProps {
  truthTable: TruthTable;
  resultHeader: string;
  isScrollable?: boolean;
  testId?: string;
  getRowClassName?: (rowIndex: number) => string | undefined;
  getRowTestId?: (rowIndex: number) => string;
  renderResultCell: (row: TruthTableRow, rowIndex: number) => ReactNode;
}

export function DnfTruthTable({
  truthTable,
  resultHeader,
  isScrollable = false,
  testId,
  getRowClassName,
  getRowTestId,
  renderResultCell,
}: DnfTruthTableProps) {
  const { t } = useTranslation();

  return (
    <div
      data-testid={testId}
      className={cn(
        "border-border mt-4 overflow-x-auto rounded-lg border",
        isScrollable && "max-h-[28rem] overflow-y-auto",
      )}
    >
      <table className="w-full border-collapse text-sm">
        <thead className={cn("bg-muted", isScrollable && "sticky top-0 z-10")}>
          <tr>
            <th
              scope="col"
              className="border-border w-20 border-r px-3 py-2 text-left font-semibold"
            >
              {t("dnf.builder.exercise.rowHeader")}
            </th>
            {truthTable.variables.map((variable) => (
              <th
                key={variable}
                scope="col"
                className="border-border border-r px-3 py-2 text-left font-semibold"
              >
                {variable}
              </th>
            ))}
            <th scope="col" className="px-3 py-2 text-left font-semibold">
              <code className="font-mono text-sm">{resultHeader}</code>
            </th>
          </tr>
        </thead>
        <tbody>
          {truthTable.rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              data-testid={getRowTestId?.(rowIndex)}
              className={cn(
                "border-border border-t",
                getRowClassName?.(rowIndex),
              )}
            >
              <td className="border-border text-muted-foreground border-r px-3 py-2 font-mono">
                {rowIndex + 1}
              </td>
              {truthTable.variables.map((variable) => (
                <td
                  key={variable}
                  className="border-border border-r px-3 py-2 font-mono"
                >
                  {formatBooleanValue(row.assignment[variable])}
                </td>
              ))}
              <td className="px-3 py-2">{renderResultCell(row, rowIndex)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
