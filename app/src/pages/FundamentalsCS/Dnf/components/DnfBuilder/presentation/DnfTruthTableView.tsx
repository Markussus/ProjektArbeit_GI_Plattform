import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { TruthTableDisplay } from "../adapters/truthTableAdapter";

const TABLE_PREVIEW_ROW_LIMIT = 32;

interface DnfTruthTableViewProps {
  display: TruthTableDisplay;
  resultHeader?: string;
}

export function DnfTruthTableView({
  display,
  resultHeader,
}: DnfTruthTableViewProps) {
  const { t } = useTranslation();
  const [showAllRows, setShowAllRows] = useState(false);
  const isLargeTable = display.rows.length >= TABLE_PREVIEW_ROW_LIMIT;
  const contributingRows = display.rows.filter((row) => row.isContributing);
  const previewRows = (
    contributingRows.length > 0 ? contributingRows : display.rows
  ).slice(0, TABLE_PREVIEW_ROW_LIMIT);
  const rowsToRender =
    isLargeTable && !showAllRows ? previewRows : display.rows;
  const showRowNumbers = isLargeTable;

  return (
    <section className="border-border bg-card rounded-lg border p-4">
      <h2 className="text-foreground text-lg font-semibold">
        {t("dnf.builder.truthTableTitle")}
      </h2>

      {isLargeTable && (
        <div className="border-border bg-muted/40 mt-4 rounded-md border p-3">
          <p className="text-muted-foreground text-sm leading-relaxed">
            {showAllRows
              ? t("dnf.builder.truthTableFull", {
                  total: display.rows.length,
                })
              : t("dnf.builder.truthTablePreview", {
                  shown: rowsToRender.length,
                  total: display.rows.length,
                  oneRows: display.trueRowCount,
                })}
          </p>
          <button
            type="button"
            onClick={() => setShowAllRows((current) => !current)}
            className="border-border hover:bg-muted mt-3 inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium"
          >
            {showAllRows ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
            {showAllRows
              ? t("dnf.builder.showCompactTable")
              : t("dnf.builder.showFullTable")}
          </button>
        </div>
      )}

      <div
        className={cn(
          "border-border mt-4 overflow-x-auto rounded-lg border",
          isLargeTable && !showAllRows && "max-h-[32rem] overflow-y-auto",
        )}
      >
        <table className="w-full border-collapse text-sm">
          <thead
            className={cn(
              "bg-muted",
              isLargeTable && !showAllRows && "sticky top-0 z-10",
            )}
          >
            <tr>
              {showRowNumbers && (
                <th
                  scope="col"
                  className="border-border border-r px-3 py-2 text-left font-semibold"
                >
                  {t("dnf.builder.truthTableRow")}
                </th>
              )}
              {display.variableHeaders.length > 0 ? (
                display.variableHeaders.map((variable) => (
                  <th
                    key={variable}
                    scope="col"
                    className="border-border border-r px-3 py-2 text-left font-semibold last:border-r-0"
                  >
                    {variable}
                  </th>
                ))
              ) : (
                <th
                  scope="col"
                  className="border-border border-r px-3 py-2 text-left font-semibold"
                >
                  {t("dnf.builder.truthTableNoVariables")}
                </th>
              )}
              <th
                scope="col"
                className="border-border border-r px-3 py-2 text-left font-semibold"
              >
                <code className="font-mono text-sm">
                  {resultHeader ?? t("dnf.builder.truthTableResult")}
                </code>
              </th>
              <th scope="col" className="px-3 py-2 text-left font-semibold">
                {t("dnf.builder.truthTableTerm")}
              </th>
            </tr>
          </thead>

          <tbody>
            {rowsToRender.map((row) => (
              <tr
                key={row.rowNumber}
                className={cn(
                  "border-border border-t",
                  row.isContributing && "bg-module-rose-bg/40",
                )}
              >
                {showRowNumbers && (
                  <td className="border-border text-muted-foreground border-r px-3 py-2 font-mono text-xs">
                    {row.rowNumber}
                  </td>
                )}
                {row.assignmentValues.length > 0 ? (
                  row.assignmentValues.map((value, valueIndex) => (
                    <td
                      key={`${row.rowNumber}-${valueIndex}`}
                      className="border-border border-r px-3 py-2 font-mono"
                    >
                      {value}
                    </td>
                  ))
                ) : (
                  <td className="border-border border-r px-3 py-2 text-sm">
                    {t("dnf.builder.truthTableConstant")}
                  </td>
                )}
                <td className="border-border border-r px-3 py-2 font-mono font-semibold">
                  {row.result}
                </td>
                <td className="px-3 py-2 font-mono">
                  {row.term || t("dnf.builder.truthTableIgnored")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
