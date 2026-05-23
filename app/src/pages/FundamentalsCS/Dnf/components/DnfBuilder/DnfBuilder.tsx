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

  if (builder.analysis.status === "too_many_variables") {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <VariableLimitPanel
          variableCount={builder.analysis.variableCount}
          maxVariableCount={builder.analysis.maxVariableCount}
        />
      </div>
    );
  }

  if (builder.analysis.status === "invalid") {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <ParseErrorPanel issue={builder.analysis.issue} />
      </div>
    );
  }

  const analysis = builder.analysis;
  const truthTable = analysis.truthTable;
  const simplification = builder.simplification;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <DnfExerciseWorkspace
        source={builder.source}
        truthTable={truthTable}
        truthTableAnswers={builder.truthTableAnswers}
        dnfAnswer={builder.dnfAnswer}
        feedback={builder.exerciseFeedback}
        showSolution={builder.showSolution}
        resultHeader={builder.resultHeader}
        requiresTruthTableAnswers={builder.requiresTruthTableAnswers}
        simplification={{
          isOpen: simplification.isOpen,
          answer: simplification.answer,
          feedback: simplification.feedback,
          showSolution: simplification.showSolution,
          onAnswerChange: simplification.setAnswer,
          onToggleOpen: simplification.toggleOpen,
          onCheck: () => simplification.check(truthTable),
          onToggleSolution: simplification.toggleSolution,
        }}
        onTruthTableAnswerChange={builder.setTruthTableAnswer}
        onDnfAnswerChange={builder.setDnfAnswer}
        onCheck={builder.checkExercise}
        onReset={builder.reset}
        onToggleSolution={builder.toggleSolution}
      />

      {builder.showSolution && display && (
        <>
          <DnfResultPanel
            formattedDnf={analysis.formattedDnf}
            variableCount={truthTable.variables.length}
            rowCount={truthTable.rows.length}
            trueRowCount={analysis.derivation.trueRows.length}
            derivation={analysis.derivation}
          />
          <DnfDerivationSteps
            derivation={analysis.derivation}
            truthTable={truthTable}
          />
          <DnfTruthTableView
            display={display}
            resultHeader={builder.resultHeader}
          />
        </>
      )}
    </div>
  );
}
