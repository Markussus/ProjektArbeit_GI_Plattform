import type { KeyboardEvent, RefObject } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { formatBooleanValue } from "../domain/booleanExpression";
import type {
  DnfExerciseCheckResult,
  TruthTableAnswer,
} from "../domain/dnfExerciseCheck";
import type { TruthTable } from "../domain/truthTable";
import { DnfTruthTable } from "./DnfTruthTable";

interface DnfExerciseTruthTablePanelProps {
  truthTable: TruthTable;
  truthTableAnswers: TruthTableAnswer[];
  issueByRow: Map<number, DnfExerciseCheckResult["truthTableIssues"][number]>;
  resultHeader?: string;
  requiresTruthTableAnswers: boolean;
  canEditTruthTableResults: boolean;
  canInteractWithResultColumn: boolean;
  canActuallyToggleTable: boolean;
  showFullTable: boolean;
  isScrollableTruthTable: boolean;
  resultRowRefs: RefObject<Array<HTMLDivElement | null>>;
  onToggleFullTable?: () => void;
  onResultKeyDown: (
    event: KeyboardEvent<HTMLDivElement>,
    rowIndex: number,
  ) => void;
  onSelectResult: (rowIndex: number, value: boolean) => void;
}

export function DnfExerciseTruthTablePanel({
  truthTable,
  truthTableAnswers,
  issueByRow,
  resultHeader,
  requiresTruthTableAnswers,
  canEditTruthTableResults,
  canInteractWithResultColumn,
  canActuallyToggleTable,
  showFullTable,
  isScrollableTruthTable,
  resultRowRefs,
  onToggleFullTable,
  onResultKeyDown,
  onSelectResult,
}: DnfExerciseTruthTablePanelProps) {
  const { t } = useTranslation();

  return (
    <section
      data-testid="dnf-exercise-truth-table-panel"
      className="border-border bg-card h-full rounded-lg border p-4"
    >
      <div>
        <h2 className="text-foreground text-lg font-semibold">
          {t("dnf.builder.exercise.tableTitle")}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {requiresTruthTableAnswers
            ? t("dnf.builder.exercise.tableHint")
            : canEditTruthTableResults
              ? t("dnf.builder.exercise.tableHintEditable")
              : t("dnf.builder.exercise.tableHintGiven")}
        </p>
        {canActuallyToggleTable && onToggleFullTable && (
          <div className="mt-3">
            <button
              type="button"
              data-testid="dnf-workspace-table-toggle"
              onClick={onToggleFullTable}
              className="border-border hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors"
            >
              {showFullTable ? (
                <ChevronUp className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
              {showFullTable
                ? t("dnf.builder.showCompactTable")
                : t("dnf.builder.showFullTable")}
            </button>
          </div>
        )}
      </div>

      <DnfTruthTable
        truthTable={truthTable}
        resultHeader={resultHeader ?? t("dnf.builder.truthTableResult")}
        isScrollable={isScrollableTruthTable}
        testId="dnf-exercise-truth-table"
        getRowTestId={(rowIndex) => `dnf-exercise-truth-table-row-${rowIndex}`}
        getRowClassName={(rowIndex) =>
          requiresTruthTableAnswers && issueByRow.get(rowIndex)?.actual === null
            ? "bg-amber-500/10"
            : undefined
        }
        renderResultCell={(row, rowIndex) => {
          const answer = truthTableAnswers[rowIndex] ?? null;

          return canInteractWithResultColumn ? (
            <div
              ref={(element) => {
                if (resultRowRefs.current) {
                  resultRowRefs.current[rowIndex] = element;
                }
              }}
              tabIndex={0}
              role="group"
              aria-label={t("dnf.builder.exercise.resultGroupLabel", {
                row: rowIndex + 1,
              })}
              onKeyDown={(event) => onResultKeyDown(event, rowIndex)}
              className="focus:ring-ring grid w-full max-w-36 grid-cols-2 gap-2 rounded-md focus:ring-2 focus:outline-none"
            >
              {[false, true].map((value) => (
                <button
                  key={String(value)}
                  type="button"
                  data-testid={`dnf-result-button-${rowIndex}-${value ? "1" : "0"}`}
                  aria-pressed={answer === value}
                  aria-label={t("dnf.builder.exercise.resultButtonLabel", {
                    row: rowIndex + 1,
                    value: formatBooleanValue(value),
                  })}
                  onClick={() => onSelectResult(rowIndex, value)}
                  className={cn(
                    "border-border hover:bg-muted min-h-9 rounded-md border px-3 font-mono text-sm font-semibold transition-colors",
                    answer === value &&
                      "border-brand bg-brand text-brand-foreground shadow-sm hover:opacity-90",
                  )}
                >
                  {formatBooleanValue(value)}
                </button>
              ))}
            </div>
          ) : (
            <span className="bg-muted/40 border-border inline-flex min-h-9 min-w-12 items-center justify-center rounded-md border px-3 font-mono text-sm font-semibold">
              {formatBooleanValue(row.result)}
            </span>
          );
        }}
      />
    </section>
  );
}
