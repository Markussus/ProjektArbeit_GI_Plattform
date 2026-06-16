import { useMemo, useState } from "react";
import type { Exercise } from "@/types/exercise";
import type { ISimulatorTransferCodec } from "@/types/simulatorTransfer";
import { SimulatorStringTransferBox } from "@/components/shared/SimulatorStringTransferBox";
import { useTrainingCenterAutoSave } from "@/hooks/useTrainingCenterAutoSave";
import { buildTruthTableDisplay } from "./adapters/truthTableAdapter";
import { buildDnfFollowUpConfiguration } from "./application/dnfFollowUp";
import { useDnfBuilder } from "./application/useDnfBuilder";
import {
  dnfExerciseTransferCodec,
  type DnfExerciseTransferDraft,
} from "./domain/dnfTransfer";
import { DnfExerciseWorkspace } from "./presentation/DnfExerciseWorkspace";
import { DnfFollowUpSections } from "./presentation/DnfFollowUpSections";
import {
  ParseErrorPanel,
  VariableLimitPanel,
} from "./presentation/DnfStatusPanels";

interface DnfBuilderProps {
  selectedExercise: Exercise;
  initialAttempt?: DnfExerciseTransferDraft;
  storageIdentifier: string;
  storageEnabled: boolean;
  storageReady: boolean;
  transferCodec: ISimulatorTransferCodec<DnfExerciseTransferDraft>;
  onUserChange?: () => void;
}

export function DnfBuilder({
  selectedExercise,
  initialAttempt,
  storageIdentifier,
  storageEnabled,
  storageReady,
  transferCodec,
  onUserChange,
}: DnfBuilderProps) {
  const builder = useDnfBuilder(selectedExercise, initialAttempt);
  const [showFullTable, setShowFullTable] = useState(false);
  const transferValue = useMemo<DnfExerciseTransferDraft>(
    () => ({
      truthTableAnswers: builder.truthTableAnswers,
      dnfAnswer: builder.dnfAnswer,
      simplificationAnswer: builder.simplification.answer,
    }),
    [
      builder.dnfAnswer,
      builder.simplification.answer,
      builder.truthTableAnswers,
    ],
  );

  useTrainingCenterAutoSave({
    identifier: storageIdentifier,
    value: transferValue,
    codec: dnfExerciseTransferCodec,
    enabled: storageEnabled && storageReady,
  });

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
  const { solution, simplification: simplificationFollowUp } =
    buildDnfFollowUpConfiguration({
      analysis,
      display,
      resultHeader: builder.resultHeader,
      showSolution: builder.showSolution,
      feedback: builder.exerciseFeedback,
      simplification: builder.simplification,
      simplificationAnswerChange: (value) => {
        onUserChange?.();
        builder.simplification.setAnswer(value);
      },
    });

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
        onTruthTableAnswerChange={(rowIndex, value) => {
          onUserChange?.();
          builder.setTruthTableAnswer(rowIndex, value);
        }}
        onDnfAnswerChange={(value) => {
          onUserChange?.();
          builder.setDnfAnswer(value);
        }}
        onCheck={builder.checkExercise}
        onToggleSolution={builder.toggleSolution}
        onToggleFullTable={() => setShowFullTable((current) => !current)}
        solution={solution}
      />

      <DnfFollowUpSections simplification={simplificationFollowUp} />

      <SimulatorStringTransferBox
        value={transferValue}
        codec={transferCodec}
        onLoad={(attempt) => {
          onUserChange?.();
          builder.loadAttempt(attempt);
        }}
        testIdPrefix="dnf-exercise-transfer"
      />
    </div>
  );
}
