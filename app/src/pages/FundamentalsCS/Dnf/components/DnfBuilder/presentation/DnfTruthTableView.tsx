import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { TruthTableDisplay } from "../adapters/truthTableAdapter";

interface DnfTruthTableViewProps {
  display: TruthTableDisplay;
}

export function DnfTruthTableView({ display }: DnfTruthTableViewProps) {
  const { t } = useTranslation();

  return (
    <section className="border-border bg-background/40 rounded-lg border p-4">
      <h2 className="text-foreground text-lg font-semibold">
        {t("dnf.builder.truthTableTitle")}
      </h2>

      <div className="border-border mt-4 overflow-x-auto rounded-lg border">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-muted/50">
            <tr>
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
                {t("dnf.builder.truthTableResult")}
              </th>
              <th scope="col" className="px-3 py-2 text-left font-semibold">
                {t("dnf.builder.truthTableTerm")}
              </th>
            </tr>
          </thead>

          <tbody>
            {display.rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={cn(
                  "border-border border-t",
                  row.isContributing && "bg-module-rose-bg/40",
                )}
              >
                {row.assignmentValues.length > 0 ? (
                  row.assignmentValues.map((value, valueIndex) => (
                    <td
                      key={`${rowIndex}-${valueIndex}`}
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
