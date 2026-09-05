import type { ReactNode } from "react";
import { Play, Shuffle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { formatBooleanValue } from "../DnfBuilder/domain/booleanExpression";
import type { TruthTable } from "../DnfBuilder/domain/truthTable";
import { DnfTruthTable } from "../DnfBuilder/presentation/DnfTruthTable";

export const EDITABLE_TABLE_MIN_VARIABLE_COUNT = 1;
// Matches MAX_DNF_VARIABLE_COUNT — see dnfAnalysis.ts for the rationale.
export const EDITABLE_TABLE_MAX_VARIABLE_COUNT = 4;

interface TableSetupProps {
  truthTable: TruthTable;
  variableCount: number;
  resultValues: boolean[];
  onVariableCountChange: (value: number) => void;
  onResultValuesChange: (values: boolean[]) => void;
  onResultChange: (rowIndex: number, value: boolean) => void;
  onCommit: () => void;
}

export function TableSetup({
  truthTable,
  variableCount,
  resultValues,
  onVariableCountChange,
  onResultValuesChange,
  onResultChange,
  onCommit,
}: TableSetupProps) {
  const { t } = useTranslation();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <section
        data-testid="dnf-table-builder-controls"
        className="border-border bg-card rounded-lg border p-4"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-foreground text-lg font-semibold">
              {t("dnf.simulator.tableModeTitle")}
            </h2>
            <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-relaxed">
              {t("dnf.simulator.tableModeHint")}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            {t("dnf.simulator.variableCount")}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <label
              className="text-muted-foreground text-sm"
              htmlFor="dnf-variable-count"
            >
              {t("dnf.simulator.variableCountLabel")}
            </label>
            <input
              id="dnf-variable-count"
              data-testid="dnf-variable-count-input"
              type="number"
              min={EDITABLE_TABLE_MIN_VARIABLE_COUNT}
              max={EDITABLE_TABLE_MAX_VARIABLE_COUNT}
              step={1}
              value={variableCount}
              onChange={(event) =>
                onVariableCountChange(Number(event.target.value))
              }
              className="border-border bg-background text-foreground focus:ring-ring h-10 w-24 rounded-md border px-3 text-sm font-semibold focus:ring-2 focus:outline-none"
            />
            <span className="text-muted-foreground text-sm">
              {t("dnf.simulator.variableCountHelp", {
                min: EDITABLE_TABLE_MIN_VARIABLE_COUNT,
                max: EDITABLE_TABLE_MAX_VARIABLE_COUNT,
              })}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <TableValueButton
            testId="dnf-clear-table"
            label={t("dnf.simulator.clearTable")}
            onClick={() =>
              onResultValuesChange(
                Array.from({ length: resultValues.length }, () => false),
              )
            }
          />
          <TableValueButton
            testId="dnf-fill-table"
            label={t("dnf.simulator.fillTable")}
            onClick={() =>
              onResultValuesChange(
                Array.from({ length: resultValues.length }, () => true),
              )
            }
          />
          <TableValueButton
            testId="dnf-random-table"
            label={t("dnf.simulator.randomTable")}
            icon={<Shuffle className="size-4" />}
            onClick={() =>
              onResultValuesChange(
                createRandomResultValues(resultValues.length),
              )
            }
          />
          <TableValueButton
            testId="dnf-invert-table"
            label={t("dnf.simulator.invertTable")}
            onClick={() =>
              onResultValuesChange(resultValues.map((value) => !value))
            }
          />
        </div>
      </section>

      <TableSetupPreview
        truthTable={truthTable}
        resultValues={resultValues}
        onResultChange={onResultChange}
      />

      <div>
        <button
          type="button"
          data-testid="dnf-commit-table"
          onClick={onCommit}
          className="bg-brand text-brand-foreground inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold shadow-sm transition-opacity hover:opacity-90"
        >
          <Play className="size-4" />
          {t("dnf.simulator.commitTable")}
        </button>
      </div>
    </div>
  );
}

interface TableValueButtonProps {
  testId: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
}

function TableValueButton({
  testId,
  label,
  icon,
  onClick,
}: TableValueButtonProps) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      className="border-border hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors"
    >
      {icon}
      {label}
    </button>
  );
}

interface TableSetupPreviewProps {
  truthTable: TruthTable;
  resultValues: boolean[];
  onResultChange: (rowIndex: number, value: boolean) => void;
}

function TableSetupPreview({
  truthTable,
  resultValues,
  onResultChange,
}: TableSetupPreviewProps) {
  const { t } = useTranslation();
  const isScrollable = truthTable.rows.length >= 16;

  return (
    <section className="border-border bg-card rounded-lg border p-4">
      <h2 className="text-foreground text-lg font-semibold">
        {t("dnf.simulator.setupPreviewTitle")}
      </h2>
      <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
        {t("dnf.simulator.setupPreviewHint")}
      </p>

      <DnfTruthTable
        truthTable={truthTable}
        resultHeader="f"
        isScrollable={isScrollable}
        renderResultCell={(_, rowIndex) => {
          const currentValue = resultValues[rowIndex] ?? false;

          return (
            <div className="grid w-full max-w-36 grid-cols-2 gap-2">
              {[false, true].map((value) => (
                <button
                  key={String(value)}
                  type="button"
                  aria-pressed={currentValue === value}
                  onClick={() => onResultChange(rowIndex, value)}
                  className={cn(
                    "border-border hover:bg-muted min-h-9 rounded-md border px-3 font-mono text-sm font-semibold transition-colors",
                    currentValue === value &&
                      "border-brand bg-brand text-brand-foreground shadow-sm hover:opacity-90",
                  )}
                >
                  {formatBooleanValue(value)}
                </button>
              ))}
            </div>
          );
        }}
      />
    </section>
  );
}

function createRandomResultValues(rowCount: number): boolean[] {
  const values = Array.from({ length: rowCount }, () => Math.random() < 0.5);

  if (rowCount <= 1) {
    return values;
  }

  if (values.every((value) => !value)) {
    values[Math.floor(Math.random() * rowCount)] = true;
  }

  if (values.every((value) => value)) {
    values[Math.floor(Math.random() * rowCount)] = false;
  }

  return values;
}
