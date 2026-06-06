import { useMemo, useState } from "react";
import { ArrowLeft, Play, Shuffle } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Example, Exercise } from "@/types/exercise";
import { cn } from "@/lib/utils";
import { buildTruthTableDisplay } from "./DnfBuilder/adapters/truthTableAdapter";
import { analyzeDnfTruthTable } from "./DnfBuilder/application/dnfAnalysis";
import { buildDnfFollowUpConfiguration } from "./DnfBuilder/application/dnfFollowUp";
import { useDnfSimplification } from "./DnfBuilder/application/useDnfSimplification";
import { formatBooleanValue } from "./DnfBuilder/domain/booleanExpression";
import { normalizeBooleanOperatorAliases } from "./DnfBuilder/domain/booleanSyntax";
import {
  checkDnfExerciseAttempt,
  type DnfExerciseCheckResult,
} from "./DnfBuilder/domain/dnfExerciseCheck";
import {
  createTruthTableFromResults,
  type TruthTable,
} from "./DnfBuilder/domain/truthTable";
import { DnfBuilder } from "./DnfBuilder/DnfBuilder";
import { DnfExerciseWorkspace } from "./DnfBuilder/presentation/DnfExerciseWorkspace";
import { DnfFollowUpSections } from "./DnfBuilder/presentation/DnfFollowUpSections";
import { DnfTruthTable } from "./DnfBuilder/presentation/DnfTruthTable";
import { ExpressionBuilder } from "./ExpressionBuilder/ExpressionBuilder";
import { getDnfExerciseDefinition } from "../exercises";
import { getDnfWalkthroughExample } from "../examples/walkthroughExamples";

type DnfSimulatorMode = "expression_to_truth_table" | "truth_table_to_dnf";

const simulatorModes: DnfSimulatorMode[] = [
  "expression_to_truth_table",
  "truth_table_to_dnf",
];

const EDITABLE_TABLE_MIN_VARIABLE_COUNT = 1;
const EDITABLE_TABLE_MAX_VARIABLE_COUNT = 8;
const editableVariableNames = ["a", "b", "c", "d", "e", "f", "g", "h"];

interface DnfSimulatorProps {
  selectedExercise?: Exercise | null;
  selectedExample?: Example | null;
  onExitExercise?: () => void;
  onExitExample?: () => void;
}

export function DnfSimulator({
  selectedExercise,
  selectedExample,
  onExitExercise,
  onExitExample,
}: DnfSimulatorProps) {
  const { t } = useTranslation();

  const walkthroughExample = selectedExample
    ? getDnfWalkthroughExample(selectedExample.id)
    : null;

  const selectedExerciseMode = selectedExercise
    ? (getDnfExerciseDefinition(selectedExercise.id)?.mode ??
      "expression_to_truth_table")
    : null;

  // Seed the active mode from a walkthrough example (if any) so the example
  // opens in its native mode, but let the user override by clicking a tab.
  // The component remounts when the example changes (parent uses a keyed
  // mount), so this initial value is recomputed for each new example.
  const [activeMode, setActiveMode] = useState<DnfSimulatorMode>(
    walkthroughExample?.mode ?? "expression_to_truth_table",
  );

  const visibleMode = selectedExerciseMode ?? activeMode;

  const handleModeClick = (mode: DnfSimulatorMode) => {
    if (mode === visibleMode) return;

    setActiveMode(mode);
    if (selectedExercise) {
      onExitExercise?.();
    } else if (walkthroughExample) {
      // Switching tabs while a walkthrough example is active drops the
      // example: the other mode has no seed data for it and the header would
      // otherwise still advertise the example as "selected".
      onExitExample?.();
    }
  };

  const renderContent = () => {
    if (selectedExercise) {
      return (
        <DnfBuilder
          key={selectedExercise.id}
          selectedExercise={selectedExercise}
        />
      );
    }

    if (
      walkthroughExample?.mode === "expression_to_truth_table" &&
      visibleMode === "expression_to_truth_table"
    ) {
      return (
        <ExpressionBuilder
          key={walkthroughExample.id}
          initialExpression={walkthroughExample.expression}
        />
      );
    }

    if (
      walkthroughExample?.mode === "truth_table_to_dnf" &&
      visibleMode === "truth_table_to_dnf"
    ) {
      return (
        <TableToDnfBuilder
          key={walkthroughExample.id}
          initialVariables={walkthroughExample.variables}
          initialResultValues={walkthroughExample.resultValues}
        />
      );
    }

    return visibleMode === "expression_to_truth_table" ? (
      <ExpressionBuilder />
    ) : (
      <TableToDnfBuilder />
    );
  };

  return (
    <div
      data-testid="dnf-simulator"
      data-mode={visibleMode}
      className="flex h-full flex-col space-y-6"
    >
      <div className="border-border flex gap-1 border-b">
        {simulatorModes.map((mode) => (
          <button
            key={mode}
            type="button"
            data-testid={`dnf-mode-tab-${mode}`}
            className={cn(
              "relative shrink-0 px-4 py-2.5 text-sm font-medium",
              visibleMode === mode
                ? "text-tab-active"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => handleModeClick(mode)}
          >
            {t(`dnf.simulator.tabs.${mode}`)}
            {visibleMode === mode && (
              <span className="bg-tab-indicator absolute inset-x-0 -bottom-px h-0.5" />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1">{renderContent()}</div>
    </div>
  );
}

interface TableToDnfBuilderProps {
  initialVariables?: string[];
  initialResultValues?: boolean[];
}

function TableToDnfBuilder({
  initialVariables,
  initialResultValues,
}: TableToDnfBuilderProps = {}) {
  const { t } = useTranslation();
  const initialVariableCount = clampVariableCount(
    initialVariables?.length ?? 3,
  );
  const hasInitialSeed = Boolean(
    initialResultValues &&
    initialResultValues.length === 2 ** initialVariableCount,
  );
  const [variableCount, setVariableCount] = useState(initialVariableCount);
  const [resultValues, setResultValues] = useState<boolean[]>(() =>
    initialResultValues &&
    initialResultValues.length === 2 ** initialVariableCount
      ? [...initialResultValues]
      : Array.from({ length: 2 ** initialVariableCount }, () => false),
  );
  const [committed, setCommitted] = useState(hasInitialSeed);
  const [showSolution, setShowSolution] = useState(false);
  const [showFullTable, setShowFullTable] = useState(false);
  const [dnfAnswer, setDnfAnswer] = useState("");
  const [feedback, setFeedback] = useState<DnfExerciseCheckResult | null>(null);
  const simplification = useDnfSimplification();
  const truthTable = useMemo(
    () =>
      createTruthTableFromResults(
        editableVariableNames.slice(0, variableCount),
        resultValues,
      ),
    [resultValues, variableCount],
  );
  const analysis = useMemo(
    () => analyzeDnfTruthTable(truthTable),
    [truthTable],
  );

  const display = useMemo(() => {
    if (!showSolution || analysis.status !== "valid") return null;

    return buildTruthTableDisplay(analysis.truthTable, analysis.derivation);
  }, [analysis, showSolution]);

  const resetAttempt = () => {
    setShowSolution(false);
    setDnfAnswer("");
    setFeedback(null);
    simplification.reset();
  };

  const handleCommitTable = () => {
    setCommitted(true);
  };

  const handleNewTable = () => {
    setCommitted(false);
    setShowFullTable(false);
    resetAttempt();
  };

  const updateVariableCount = (nextVariableCount: number) => {
    const boundedVariableCount = clampVariableCount(nextVariableCount);

    setVariableCount(boundedVariableCount);
    setResultValues(
      Array.from({ length: 2 ** boundedVariableCount }, () => false),
    );
    resetAttempt();
  };

  const updateResultValue = (rowIndex: number, value: boolean) => {
    setResultValues((currentValues) => {
      const nextValues = [...currentValues];
      nextValues[rowIndex] = value;
      return nextValues;
    });
    setFeedback(null);
    setShowSolution(false);
    simplification.reset();
  };

  const randomizeResultValues = () => {
    setResultValues(createRandomResultValues(resultValues.length));
    resetAttempt();
  };

  const handleCheck = () => {
    if (analysis.status !== "valid") return;

    setFeedback(
      checkDnfExerciseAttempt(analysis.truthTable, [], dnfAnswer, {
        checkTruthTable: false,
      }),
    );
  };

  const updateDnfAnswer = (value: string) => {
    setDnfAnswer(normalizeBooleanOperatorAliases(value));
    setFeedback(null);
    setShowSolution(false);
    simplification.reset();
  };

  if (analysis.status !== "valid") {
    return null;
  }

  const { solution, simplification: simplificationFollowUp } =
    buildDnfFollowUpConfiguration({
      analysis,
      display,
      resultHeader: "f",
      showSolution,
      feedback,
      simplification,
    });

  if (!committed) {
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
                  updateVariableCount(Number(event.target.value))
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
            <button
              type="button"
              data-testid="dnf-clear-table"
              onClick={() => {
                setResultValues(
                  Array.from({ length: resultValues.length }, () => false),
                );
                resetAttempt();
              }}
              className="border-border hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors"
            >
              {t("dnf.simulator.clearTable")}
            </button>
            <button
              type="button"
              data-testid="dnf-fill-table"
              onClick={() => {
                setResultValues(
                  Array.from({ length: resultValues.length }, () => true),
                );
                resetAttempt();
              }}
              className="border-border hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors"
            >
              {t("dnf.simulator.fillTable")}
            </button>
            <button
              type="button"
              data-testid="dnf-random-table"
              onClick={randomizeResultValues}
              className="border-border hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors"
            >
              <Shuffle className="size-4" />
              {t("dnf.simulator.randomTable")}
            </button>
            <button
              type="button"
              data-testid="dnf-invert-table"
              onClick={() => {
                setResultValues((currentValues) =>
                  currentValues.map((value) => !value),
                );
                resetAttempt();
              }}
              className="border-border hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors"
            >
              {t("dnf.simulator.invertTable")}
            </button>
          </div>
        </section>

        <TableSetupPreview
          truthTable={analysis.truthTable}
          resultValues={resultValues}
          onResultChange={updateResultValue}
        />

        <div>
          <button
            type="button"
            onClick={handleCommitTable}
            className="bg-brand text-brand-foreground inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold shadow-sm transition-opacity hover:opacity-90"
          >
            <Play className="size-4" />
            {t("dnf.simulator.commitTable")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div>
        <button
          type="button"
          onClick={handleNewTable}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="size-4" />
          {t("dnf.simulator.newTable")}
        </button>
      </div>

      <DnfExerciseWorkspace
        source="f"
        truthTable={analysis.truthTable}
        truthTableAnswers={resultValues}
        dnfAnswer={dnfAnswer}
        feedback={feedback}
        showSolution={showSolution}
        resultHeader="f"
        requiresTruthTableAnswers={false}
        canAlwaysShowSolution={true}
        canEditTruthTableResults={false}
        canToggleFullTable={true}
        showFullTable={showFullTable}
        onTruthTableAnswerChange={updateResultValue}
        onDnfAnswerChange={updateDnfAnswer}
        onCheck={handleCheck}
        onReset={resetAttempt}
        onToggleSolution={() => setShowSolution((current) => !current)}
        onToggleFullTable={() => setShowFullTable((current) => !current)}
      />

      <DnfFollowUpSections
        key={solution ? "solution-visible" : "solution-hidden"}
        solution={solution}
        simplification={simplificationFollowUp}
      />
    </div>
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

function clampVariableCount(value: number): number {
  if (!Number.isFinite(value)) {
    return EDITABLE_TABLE_MIN_VARIABLE_COUNT;
  }

  return Math.min(
    EDITABLE_TABLE_MAX_VARIABLE_COUNT,
    Math.max(EDITABLE_TABLE_MIN_VARIABLE_COUNT, Math.trunc(value)),
  );
}
