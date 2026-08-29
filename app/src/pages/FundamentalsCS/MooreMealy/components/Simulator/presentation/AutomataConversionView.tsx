import { useState } from "react";
import { CircuitBoard, Pencil, Play } from "lucide-react";
import { useTranslation } from "react-i18next";
import { InlineTabNavigation } from "@/components/shared/InlineTabNavigation";
import { cn } from "@/lib/utils";
import type {
  AutomataConversion,
  AutomataConversionRow,
} from "../domain/automataConversion";
import { AutomataFormulaList } from "./AutomataFormulaList";
import { AutomataViewActions } from "./AutomataViewActions";

export interface AutomataConversionViewProps {
  conversion: AutomataConversion;
  onBackToEditor: () => void;
  onShowSimulator: () => void;
  onShowLogic: () => void;
}

export function AutomataConversionView({
  conversion,
  onBackToEditor,
  onShowSimulator,
  onShowLogic,
}: AutomataConversionViewProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"transition" | "output">(
    "transition",
  );

  return (
    <div data-testid="moore-conversion-view" className="space-y-5">
      <ViewHeader title={t("moore-mealy.conversion.title")} />

      <InlineTabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        ariaLabel={t("moore-mealy.conversion.title")}
        tabs={[
          {
            id: "transition",
            label: t("moore-mealy.conversion.transitionTab"),
            testId: "moore-conversion-tab-transition",
          },
          {
            id: "output",
            label: t("moore-mealy.conversion.outputTab"),
            testId: "moore-conversion-tab-output",
          },
        ]}
      />

      {activeTab === "transition" ? (
        <div className="space-y-6">
          <TransitionValueTable conversion={conversion} />
          <AutomataFormulaList formulas={conversion.transition.formulas} />
        </div>
      ) : (
        <div className="space-y-6">
          <OutputValueTable conversion={conversion} />
          <AutomataFormulaList formulas={conversion.output.formulas} />
        </div>
      )}
      <AutomataViewActions
        actions={[
          {
            label: t("moore-mealy.navigation.editDefinition"),
            onClick: onBackToEditor,
            icon: Pencil,
            testId: "moore-conversion-edit-definition",
          },
          {
            label: t("moore-mealy.navigation.showSimulator"),
            onClick: onShowSimulator,
            icon: Play,
            testId: "moore-conversion-show-simulator",
          },
          {
            label: t("moore-mealy.navigation.showLogic"),
            onClick: onShowLogic,
            icon: CircuitBoard,
            testId: "moore-conversion-show-logic",
          },
        ]}
      />
    </div>
  );
}

export function ViewHeader({ title }: { title: string }) {
  return <h2 className="text-xl font-bold">{title}</h2>;
}

function TransitionValueTable({
  conversion,
}: {
  conversion: AutomataConversion;
}) {
  const { t } = useTranslation();
  const { stateVariables, inputVariables, targetVariables } =
    conversion.transition;

  const groupedRows = conversion.transition.rows.reduce<
    Array<{ state: string; rows: AutomataConversionRow[] }>
  >((groups, row) => {
    const group = groups.find(
      (candidate) => candidate.state === row.currentState,
    );
    if (group) group.rows.push(row);
    else groups.push({ state: row.currentState, rows: [row] });
    return groups;
  }, []);

  return (
    <ConversionTableFrame>
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
              {t("moore-mealy.conversion.currentState")}
            </th>
            <th
              colSpan={inputVariables.length}
              className="border-foreground/70 border-r-2 bg-amber-500/10 p-3"
            >
              {t("moore-mealy.conversion.event")}
            </th>
            <th
              colSpan={targetVariables.length}
              className="bg-emerald-500/10 p-3"
            >
              {t("moore-mealy.conversion.nextState")}
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
    </ConversionTableFrame>
  );
}

function OutputValueTable({ conversion }: { conversion: AutomataConversion }) {
  const { t } = useTranslation();
  const {
    stateVariables,
    inputVariables = [],
    outputVariables,
    rows,
  } = conversion.output;

  return (
    <ValueTable
      testId="moore-output-value-table"
      groups={[
        {
          title: t("moore-mealy.conversion.state"),
          variables: stateVariables,
          tone: "bg-blue-500/10",
        },
        ...(inputVariables.length
          ? [
              {
                title: t("moore-mealy.conversion.event"),
                variables: inputVariables,
                tone: "bg-amber-500/10",
              },
            ]
          : []),
        {
          title: t("moore-mealy.conversion.output"),
          variables: outputVariables,
          tone: "bg-purple-500/10",
        },
      ]}
      rows={rows}
      getBits={(row) => [
        ...row.currentBits,
        ...row.inputBits,
        ...row.resultBits,
      ]}
      getTitles={(row) => [
        ...row.currentBits.map(() => row.currentState),
        ...row.inputBits.map(() => row.inputSymbol ?? ""),
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
  rows: AutomataConversionRow[];
  getBits: (row: AutomataConversionRow) => number[];
  getTitles: (row: AutomataConversionRow) => string[];
  testId: string;
}) {
  return (
    <ConversionTableFrame>
      <table
        data-testid={testId}
        className="w-full min-w-max border-collapse text-center font-mono text-sm"
      >
        <thead>
          <tr className="border-foreground/70 border-b-2">
            {groups.map((group, groupIndex) => (
              <th
                key={group.title}
                colSpan={group.variables.length}
                className={cn(
                  "border-foreground/70 px-4 py-3",
                  groupIndex < groups.length - 1 && "border-r-2",
                  group.tone,
                )}
              >
                {group.title}
              </th>
            ))}
          </tr>
          <tr className="border-foreground/70 bg-muted/40 border-b-2">
            {groups.flatMap((group, groupIndex) =>
              group.variables.map((variable, variableIndex) => (
                <th
                  key={variable}
                  className={cn(
                    "min-w-14 border-r p-2 last:border-r-0",
                    groupIndex < groups.length - 1 &&
                      variableIndex === group.variables.length - 1 &&
                      "border-foreground/70 border-r-2",
                  )}
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
              <tr
                key={rowIndex}
                className="group border-foreground/40 border-b-2 last:border-b-0"
              >
                {bits.map((bit, bitIndex) => (
                  <td
                    key={bitIndex}
                    title={titles[bitIndex]}
                    className={cn(
                      "group/cell group-hover:bg-brand/10 relative min-w-14 border-r p-2 transition-colors last:border-r-0",
                      isGroupBoundary(groups, bitIndex) &&
                        "border-foreground/70 border-r-2",
                    )}
                  >
                    {bit}
                    <span className="bg-popover text-popover-foreground border-border pointer-events-none absolute bottom-[calc(100%+0.25rem)] left-1/2 z-30 hidden -translate-x-1/2 rounded-md border px-2 py-1 text-xs whitespace-nowrap shadow-lg group-hover/cell:block">
                      {titles[bitIndex]}
                    </span>
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </ConversionTableFrame>
  );
}

function ConversionTableFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-foreground/70 max-w-full overflow-x-auto rounded-xl border-2">
      {children}
    </div>
  );
}

function isGroupBoundary(groups: ValueTableGroup[], bitIndex: number) {
  let endIndex = -1;
  return groups.slice(0, -1).some((group) => {
    endIndex += group.variables.length;
    return bitIndex === endIndex;
  });
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
