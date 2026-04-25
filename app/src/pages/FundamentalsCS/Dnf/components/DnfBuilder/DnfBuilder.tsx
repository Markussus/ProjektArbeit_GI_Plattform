import { useMemo } from "react";
import type { TFunction } from "i18next";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Exercise } from "@/types/exercise";
import { buildTruthTableDisplay } from "./adapters/truthTableAdapter";
import { useDnfBuilder } from "./application/useDnfBuilder";
import type { DnfParseIssue, DnfParseIssueCode } from "./domain/dnfParser";
import { DnfDerivationSteps } from "./presentation/DnfDerivationSteps";
import { DnfExerciseWorkspace } from "./presentation/DnfExerciseWorkspace";
import { DnfInputPanel } from "./presentation/DnfInputPanel";
import { DnfResultPanel } from "./presentation/DnfResultPanel";
import { DnfTruthTableView } from "./presentation/DnfTruthTableView";

const parseIssueKeyByCode: Record<DnfParseIssueCode, string> = {
  empty_expression: "dnf.builder.errors.emptyExpression",
  unexpected_character: "dnf.builder.errors.unexpectedCharacter",
  unexpected_token: "dnf.builder.errors.unexpectedToken",
  unexpected_end: "dnf.builder.errors.unexpectedEnd",
  missing_closing_parenthesis: "dnf.builder.errors.missingClosingParenthesis",
};

const LARGE_VARIABLE_COUNT_THRESHOLD = 6;

interface DnfBuilderProps {
  selectedExercise?: Exercise | null;
}

export function DnfBuilder({ selectedExercise }: DnfBuilderProps) {
  const builder = useDnfBuilder(selectedExercise);
  const shouldShowSolution = !builder.isExerciseMode || builder.showSolution;
  const display = useMemo(() => {
    if (!shouldShowSolution || builder.analysis.status !== "valid") {
      return null;
    }

    return buildTruthTableDisplay(
      builder.analysis.truthTable,
      builder.analysis.derivation,
    );
  }, [builder.analysis, shouldShowSolution]);

  if (builder.isExerciseMode) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        {builder.analysis.status === "valid" ? (
          <>
            <DnfExerciseWorkspace
              source={builder.source}
              truthTable={builder.analysis.truthTable}
              truthTableAnswers={builder.truthTableAnswers}
              dnfAnswer={builder.dnfAnswer}
              feedback={builder.exerciseFeedback}
              showSolution={builder.showSolution}
              onTruthTableAnswerChange={builder.setTruthTableAnswer}
              onDnfAnswerChange={builder.setDnfAnswer}
              onCheck={builder.checkExercise}
              onReset={builder.reset}
              onToggleSolution={builder.toggleSolution}
            />

            {shouldShowSolution && display && (
              <>
                <DnfResultPanel
                  formattedDnf={builder.analysis.formattedDnf}
                  variableCount={builder.analysis.truthTable.variables.length}
                  rowCount={builder.analysis.truthTable.rows.length}
                  trueRowCount={builder.analysis.derivation.trueRows.length}
                  derivation={builder.analysis.derivation}
                />
                <DnfDerivationSteps
                  derivation={builder.analysis.derivation}
                  truthTable={builder.analysis.truthTable}
                />
                <DnfTruthTableView display={display} />
              </>
            )}
          </>
        ) : (
          <ParseErrorPanel issue={builder.analysis.issue} />
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]">
        <DnfInputPanel
          source={builder.source}
          examples={builder.examples}
          isExerciseMode={builder.isExerciseMode}
          onSourceChange={builder.setSource}
          onLoadExample={builder.loadExample}
          onReset={builder.reset}
        />

        {builder.analysis.status === "valid" ? (
          <DnfResultPanel
            formattedDnf={builder.analysis.formattedDnf}
            variableCount={builder.analysis.truthTable.variables.length}
            rowCount={builder.analysis.truthTable.rows.length}
            trueRowCount={builder.analysis.derivation.trueRows.length}
            derivation={builder.analysis.derivation}
          />
        ) : (
          <ParseErrorPanel issue={builder.analysis.issue} />
        )}
      </div>

      {shouldShowSolution && builder.analysis.status === "valid" && display && (
        <>
          {builder.analysis.truthTable.variables.length >=
            LARGE_VARIABLE_COUNT_THRESHOLD && (
            <LargeTruthTableWarning
              variableCount={builder.analysis.truthTable.variables.length}
              rowCount={builder.analysis.truthTable.rows.length}
            />
          )}
          <DnfDerivationSteps
            derivation={builder.analysis.derivation}
            truthTable={builder.analysis.truthTable}
          />
          <DnfTruthTableView display={display} />
        </>
      )}
    </div>
  );
}

function LargeTruthTableWarning({
  variableCount,
  rowCount,
}: {
  variableCount: number;
  rowCount: number;
}) {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 shadow-sm">
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
        <AlertTriangle className="h-5 w-5" />
        {t("dnf.builder.largeTableTitle")}
      </h3>
      <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-300/80">
        {t("dnf.builder.largeTableDesc", {
          variables: variableCount,
          rows: rowCount,
        })}
      </p>
    </div>
  );
}

function ParseErrorPanel({ issue }: { issue: DnfParseIssue }) {
  const { t } = useTranslation();

  return (
    <section className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0" />
        <div>
          <h2 className="text-lg font-semibold">
            {t("dnf.builder.errors.title")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed">
            {translateParseIssue(t, issue)}
          </p>
        </div>
      </div>
    </section>
  );
}

function translateParseIssue(t: TFunction, issue: DnfParseIssue): string {
  return t(
    parseIssueKeyByCode[issue.code] as never,
    {
      index: issue.index + 1,
      value: issue.value ?? "",
    } as never,
  ) as unknown as string;
}
