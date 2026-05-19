import { useMemo } from "react";
import type { Exercise } from "@/types/exercise";
import { buildTruthTableDisplay } from "./adapters/truthTableAdapter";
import { useDnfBuilder } from "./application/useDnfBuilder";
import { DnfDerivationSteps } from "./presentation/DnfDerivationSteps";
import { DnfExerciseWorkspace } from "./presentation/DnfExerciseWorkspace";
import { DnfResultPanel } from "./presentation/DnfResultPanel";
import {
  ParseErrorPanel,
  VariableLimitPanel,
} from "./presentation/DnfStatusPanels";
import { DnfTruthTableView } from "./presentation/DnfTruthTableView";

interface DnfBuilderProps {
  selectedExercise: Exercise;
}

export function DnfBuilder({ selectedExercise }: DnfBuilderProps) {
  const builder = useDnfBuilder(selectedExercise);
  const display = useMemo(() => {
    if (!builder.showSolution || builder.analysis.status !== "valid") {
      return null;
    }

    return buildTruthTableDisplay(
      builder.analysis.truthTable,
      builder.analysis.derivation,
    );
  }, [builder.analysis, builder.showSolution]);

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
            resultHeader={builder.resultHeader}
            requiresTruthTableAnswers={builder.requiresTruthTableAnswers}
            onTruthTableAnswerChange={builder.setTruthTableAnswer}
            onDnfAnswerChange={builder.setDnfAnswer}
            onCheck={builder.checkExercise}
            onReset={builder.reset}
            onToggleSolution={builder.toggleSolution}
          />

          {builder.showSolution && display && (
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
              <DnfTruthTableView
                display={display}
                resultHeader={builder.resultHeader}
              />
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
