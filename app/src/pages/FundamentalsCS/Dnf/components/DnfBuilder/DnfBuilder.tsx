import { useMemo } from "react";
import type { Exercise } from "@/types/exercise";
import { buildTruthTableDisplay } from "./adapters/truthTableAdapter";
import { useDnfBuilder } from "./application/useDnfBuilder";
import { DnfDerivationSteps } from "./presentation/DnfDerivationSteps";
import { DnfExerciseWorkspace } from "./presentation/DnfExerciseWorkspace";
import { DnfInputPanel } from "./presentation/DnfInputPanel";
import { DnfResultPanel } from "./presentation/DnfResultPanel";
import {
  EmptyExpressionPanel,
  LargeTruthTableWarning,
  ParseErrorPanel,
  VariableLimitPanel,
} from "./presentation/DnfStatusPanels";
import { DnfTruthTableView } from "./presentation/DnfTruthTableView";

const LARGE_VARIABLE_COUNT_THRESHOLD = 5;
const LARGE_TRUE_ROW_COUNT_THRESHOLD = 12;

interface DnfBuilderProps {
  selectedExercise?: Exercise | null;
  initialSource?: string | null;
}

export function DnfBuilder({
  selectedExercise,
  initialSource,
}: DnfBuilderProps) {
  const builder = useDnfBuilder(selectedExercise, initialSource);
  const shouldShowSolution = !builder.isExerciseMode || builder.showSolution;
  const isEmptySource = builder.source.trim().length === 0;
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
        ) : builder.analysis.status === "too_many_variables" ? (
          <VariableLimitPanel
            variableCount={builder.analysis.variableCount}
            maxVariableCount={builder.analysis.maxVariableCount}
          />
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
          onClear={builder.clearSource}
        />

        {builder.analysis.status === "valid" ? (
          <DnfResultPanel
            formattedDnf={builder.analysis.formattedDnf}
            variableCount={builder.analysis.truthTable.variables.length}
            rowCount={builder.analysis.truthTable.rows.length}
            trueRowCount={builder.analysis.derivation.trueRows.length}
            derivation={builder.analysis.derivation}
          />
        ) : isEmptySource ? (
          <EmptyExpressionPanel />
        ) : builder.analysis.status === "too_many_variables" ? (
          <VariableLimitPanel
            variableCount={builder.analysis.variableCount}
            maxVariableCount={builder.analysis.maxVariableCount}
          />
        ) : (
          <ParseErrorPanel issue={builder.analysis.issue} />
        )}
      </div>

      {shouldShowSolution && builder.analysis.status === "valid" && display && (
        <>
          {(builder.analysis.truthTable.variables.length >=
            LARGE_VARIABLE_COUNT_THRESHOLD ||
            builder.analysis.derivation.trueRows.length >
              LARGE_TRUE_ROW_COUNT_THRESHOLD) && (
            <LargeTruthTableWarning
              variableCount={builder.analysis.truthTable.variables.length}
              rowCount={builder.analysis.truthTable.rows.length}
              trueRowCount={builder.analysis.derivation.trueRows.length}
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
