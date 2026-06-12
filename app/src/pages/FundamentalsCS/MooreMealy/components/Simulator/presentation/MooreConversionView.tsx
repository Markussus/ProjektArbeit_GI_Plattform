import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type {
  MooreConversion,
  MooreConversionRow,
} from "../domain/mooreConversion";
import { MooreFormulaList } from "./MooreFormulaList";

interface MooreConversionViewProps {
  conversion: MooreConversion;
  onBackToEditor: () => void;
  onShowSimulator: () => void;
  onShowLogic: () => void;
}

export function MooreConversionView({
  conversion,
  onBackToEditor,
  onShowSimulator,
  onShowLogic,
}: MooreConversionViewProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"transition" | "output">(
    "transition",
  );

  return (
    <div data-testid="moore-conversion-view" className="space-y-5">
      <ViewHeader
        title={t("moore.conversion.title")}
        onBack={onBackToEditor}
        backLabel={t("moore.conversion.back")}
      />

      <div
        role="tablist"
        aria-label={t("moore.conversion.title")}
        className="border-border inline-flex rounded-lg border p-1"
      >
        <ConversionTab
          active={activeTab === "transition"}
          label={t("moore.conversion.transitionTab")}
          testId="moore-conversion-tab-transition"
          onClick={() => setActiveTab("transition")}
        />
        <ConversionTab
          active={activeTab === "output"}
          label={t("moore.conversion.outputTab")}
          testId="moore-conversion-tab-output"
          onClick={() => setActiveTab("output")}
        />
      </div>

      {activeTab === "transition" ? (
        <div className="space-y-6">
          <TransitionValueTable conversion={conversion} />
          <MooreFormulaList formulas={conversion.transition.formulas} />
        </div>
      ) : (
        <div className="space-y-6">
          <OutputValueTable conversion={conversion} />
          <MooreFormulaList formulas={conversion.output.formulas} />
        </div>
      )}
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={onShowSimulator}
          data-testid="moore-conversion-show-simulator"
          className="border-border bg-background hover:bg-muted rounded-md border px-4 py-2 font-semibold"
        >
          {t("moore.conversion.showSimulator")}
        </button>
        <button
          type="button"
          onClick={onShowLogic}
          data-testid="moore-conversion-show-logic"
          className="bg-brand text-brand-foreground rounded-md px-4 py-2 font-semibold hover:opacity-90"
        >
          {t("moore.conversion.showLogic")}
        </button>
      </div>
    </div>
  );
}

export function ViewHeader({
  title,
  onBack,
  backLabel,
}: {
  title: string;
  onBack: () => void;
  backLabel: string;
}) {
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onBack}
        data-testid="moore-subview-back"
        className="border-border bg-background hover:bg-muted inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium"
      >
        <ArrowLeft className="size-4" />
        {backLabel}
      </button>
      <h2 className="text-xl font-bold">{title}</h2>
    </div>
  );
}

function ConversionTab({
  active,
  label,
  testId,
  onClick,
}: {
  active: boolean;
  label: string;
  testId: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      data-testid={testId}
      onClick={onClick}
      className={cn(
        "rounded-md px-4 py-2 text-sm font-semibold",
        active
          ? "bg-brand text-brand-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function TransitionValueTable({ conversion }: { conversion: MooreConversion }) {
  const { t } = useTranslation();
  const { stateVariables, inputVariables, targetVariables } =
    conversion.transition;

  const groupedRows = conversion.transition.rows.reduce<
    Array<{ state: string; rows: MooreConversionRow[] }>
  >((groups, row) => {
    const group = groups.find(
      (candidate) => candidate.state === row.currentState,
    );
    if (group) group.rows.push(row);
    else groups.push({ state: row.currentState, rows: [row] });
    return groups;
  }, []);

  return (
    <div className="border-foreground/70 max-w-full overflow-x-auto rounded-xl border-2">
      <table
        data-testid="moore-transition-value-table"
        className="w-full min-w-max border-collapse text-center font-mono text-sm"
      >
        <thead>
          <tr className="border-foreground/70 border-b-2">
            <th
              colSpan={stateVariables.length}
              className="border-foreground/70 border-r-2 bg-blue-500/10 p-3"
            >
              {t("moore.conversion.currentState")}
            </th>
            <th
              colSpan={inputVariables.length}
              className="border-foreground/70 border-r-2 bg-amber-500/10 p-3"
            >
              {t("moore.conversion.event")}
            </th>
            <th
              colSpan={targetVariables.length}
              className="bg-emerald-500/10 p-3"
            >
              {t("moore.conversion.nextState")}
            </th>
          </tr>
          <tr className="border-foreground/70 bg-muted/40 border-b-2">
            {[...stateVariables, ...inputVariables, ...targetVariables].map(
              (variable, index) => (
                <th
                  key={variable}
                  className={cn(
                    "min-w-14 border-r p-2 last:border-r-0",
                    (index === stateVariables.length - 1 ||
                      index ===
                        stateVariables.length + inputVariables.length - 1) &&
                      "border-foreground/70 border-r-2",
                  )}
                >
                  {variable}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {groupedRows.map((group) => (
            <tr
              key={group.state}
              data-testid={`moore-conversion-state-row-${group.state}`}
              className="group border-foreground/40 border-b-2 last:border-b-0"
            >
              {group.rows[0].currentBits.map((bit, index) => (
                <HoverCell
                  key={`state-${index}`}
                  value={String(bit)}
                  title={group.state}
                  className={cn(
                    "group-hover:bg-brand/10",
                    index === group.rows[0].currentBits.length - 1 &&
                      "border-foreground/70 border-r-2",
                  )}
                />
              ))}
              {inputVariables.map((_, bitIndex) => (
                <td
                  key={`input-${bitIndex}`}
                  className={cn(
                    "group-hover:bg-brand/10 border-r p-0",
                    bitIndex === inputVariables.length - 1 &&
                      "border-foreground/70 border-r-2",
                  )}
                >
                  {group.rows.map((row) => (
                    <StackedValue
                      key={row.inputSymbol}
                      value={String(row.inputBits[bitIndex])}
                      title={row.inputSymbol ?? ""}
                    />
                  ))}
                </td>
              ))}
              {targetVariables.map((_, bitIndex) => (
                <td
                  key={`target-${bitIndex}`}
                  className="group-hover:bg-brand/10 border-r p-0 last:border-r-0"
                >
                  {group.rows.map((row) => (
                    <StackedValue
                      key={row.inputSymbol}
                      value={String(row.resultBits[bitIndex])}
                      title={row.nextState ?? ""}
                    />
                  ))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OutputValueTable({ conversion }: { conversion: MooreConversion }) {
  const { t } = useTranslation();
  const { stateVariables, outputVariables, rows } = conversion.output;

  return (
    <ValueTable
      testId="moore-output-value-table"
      groups={[
        {
          title: t("moore.conversion.state"),
          variables: stateVariables,
          tone: "bg-blue-500/10",
        },
        {
          title: t("moore.conversion.output"),
          variables: outputVariables,
          tone: "bg-purple-500/10",
        },
      ]}
      rows={rows}
      getBits={(row) => [...row.currentBits, ...row.resultBits]}
      getTitles={(row) => [
        ...row.currentBits.map(() => row.currentState),
        ...row.resultBits.map(
          () => `${row.outputSymbol ?? ""} (${row.resultBits.join("")})`,
        ),
      ]}
    />
  );
}

interface ValueTableGroup {
  title: string;
  variables: string[];
  tone: string;
}

function ValueTable({
  groups,
  rows,
  getBits,
  getTitles,
  testId,
}: {
  groups: ValueTableGroup[];
  rows: MooreConversionRow[];
  getBits: (row: MooreConversionRow) => number[];
  getTitles: (row: MooreConversionRow) => string[];
  testId: string;
}) {
  return (
    <div className="border-border max-w-full overflow-x-auto rounded-xl border">
      <table
        data-testid={testId}
        className="w-full min-w-max border-collapse text-center font-mono text-sm"
      >
        <thead>
          <tr className="border-b">
            {groups.map((group) => (
              <th
                key={group.title}
                colSpan={group.variables.length}
                className={cn("border-r px-4 py-3 last:border-r-0", group.tone)}
              >
                {group.title}
              </th>
            ))}
          </tr>
          <tr className="bg-muted/40 border-b">
            {groups.flatMap((group) =>
              group.variables.map((variable) => (
                <th
                  key={variable}
                  className="min-w-14 border-r p-2 last:border-r-0"
                >
                  {variable}
                </th>
              )),
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => {
            const bits = getBits(row);
            const titles = getTitles(row);
            return (
              <tr key={rowIndex} className="border-b last:border-b-0">
                {bits.map((bit, bitIndex) => (
                  <td
                    key={bitIndex}
                    title={titles[bitIndex]}
                    className="group hover:bg-brand/10 relative min-w-14 border-r p-2 transition-colors last:border-r-0"
                  >
                    {bit}
                    <span className="bg-popover text-popover-foreground border-border pointer-events-none absolute bottom-[calc(100%+0.25rem)] left-1/2 z-30 hidden -translate-x-1/2 rounded-md border px-2 py-1 text-xs whitespace-nowrap shadow-lg group-hover:block">
                      {titles[bitIndex]}
                    </span>
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function HoverCell({
  value,
  title,
  className,
}: {
  value: string;
  title: string;
  className?: string;
}) {
  return (
    <td className={cn("group/cell relative min-w-14 border-r p-3", className)}>
      {value}
      <Tooltip text={title} />
    </td>
  );
}

function StackedValue({ value, title }: { value: string; title: string }) {
  return (
    <div className="group/cell relative border-b p-2 last:border-b-0">
      {value}
      <Tooltip text={title} />
    </div>
  );
}

function Tooltip({ text }: { text: string }) {
  return (
    <span className="bg-popover text-popover-foreground border-border pointer-events-none absolute bottom-[calc(100%+0.25rem)] left-1/2 z-30 hidden -translate-x-1/2 rounded-md border px-2 py-1 text-xs whitespace-nowrap shadow-lg group-hover/cell:block">
      {text}
    </span>
  );
}
