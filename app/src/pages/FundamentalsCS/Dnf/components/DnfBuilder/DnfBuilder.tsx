import { useMemo, useState } from "react";
import type { Exercise } from "@/types/exercise";
import { buildTruthTableDisplay } from "./adapters/truthTableAdapter";
import { useDnfBuilder } from "./application/useDnfBuilder";
import { DnfExerciseWorkspace } from "./presentation/DnfExerciseWorkspace";
import { DnfFollowUpSections } from "./presentation/DnfFollowUpSections";
import {
  ParseErrorPanel,
  VariableLimitPanel,
} from "./presentation/DnfStatusPanels";

interface DnfBuilderProps {
  selectedExercise: Exercise;
}

export function DnfBuilder({ selectedExercise }: DnfBuilderProps) {
  const builder = useDnfBuilder(selectedExercise);
  const [showFullTable, setShowFullTable] = useState(false);
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
  const simplificationControls = {
    answer: simplification.answer,
    feedback: simplification.feedback,
    showSolution: simplification.showSolution,
    showWalkthrough: simplification.showWalkthrough,
    onAnswerChange: simplification.setAnswer,
    onCheck: () => simplification.check(truthTable),
    onToggleSolution: simplification.toggleSolution,
    onToggleWalkthrough: simplification.toggleWalkthrough,
  };
  const solution =
    builder.showSolution && display
      ? {
          formattedDnf: analysis.formattedDnf,
          variableCount: truthTable.variables.length,
          rowCount: truthTable.rows.length,
          trueRowCount: analysis.derivation.trueRows.length,
          derivation: analysis.derivation,
          display,
          resultHeader: builder.resultHeader,
          truthTable,
        }
      : undefined;
  const simplificationFollowUp = {
    truthTable,
    controls: simplificationControls,
    isEnabled: builder.exerciseFeedback?.isCorrect === true,
  };

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
        canToggleFullTable={true}
        showFullTable={showFullTable}
        onTruthTableAnswerChange={builder.setTruthTableAnswer}
        onDnfAnswerChange={builder.setDnfAnswer}
        onCheck={builder.checkExercise}
        onReset={builder.reset}
        onToggleSolution={builder.toggleSolution}
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
