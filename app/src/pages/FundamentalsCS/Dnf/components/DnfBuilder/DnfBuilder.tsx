import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import type { Exercise } from "@/types/exercise";
import { buildTruthTableDisplay } from "./adapters/truthTableAdapter";
import { buildDnfFollowUpConfiguration } from "./application/dnfFollowUp";
import { useDnfBuilder } from "./application/useDnfBuilder";
import type { DnfExerciseTransferDraft } from "./domain/dnfTransfer";
import { DnfExerciseWorkspace } from "./presentation/DnfExerciseWorkspace";
import { DnfFollowUpSections } from "./presentation/DnfFollowUpSections";
import {
  ParseErrorPanel,
  VariableLimitPanel,
} from "./presentation/DnfStatusPanels";

interface DnfBuilderProps {
  selectedExercise: Exercise;
  initialAttempt?: DnfExerciseTransferDraft;
  onTransferValueChange?: (value: DnfExerciseTransferDraft) => void;
  onUserChange?: () => void;
}

export interface DnfBuilderHandle {
  loadSolution: () => DnfExerciseTransferDraft | null;
}

export const DnfBuilder = forwardRef<DnfBuilderHandle, DnfBuilderProps>(
  function DnfBuilder(
    { selectedExercise, initialAttempt, onTransferValueChange, onUserChange },
    ref,
  ) {
    const builder = useDnfBuilder(selectedExercise, initialAttempt);
    const { buildSolutionAttempt, loadSolution: applyLoadedSolution } = builder;
    useImperativeHandle(
      ref,
      () => ({
        loadSolution: () => {
          const solvedAttempt = buildSolutionAttempt();
          if (!solvedAttempt) {
            return null;
          }

          applyLoadedSolution(solvedAttempt);
          onUserChange?.();
          onTransferValueChange?.(solvedAttempt);
          return solvedAttempt;
        },
      }),
      [
        applyLoadedSolution,
        buildSolutionAttempt,
        onTransferValueChange,
        onUserChange,
      ],
    );
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

    useEffect(() => {
      onTransferValueChange?.(transferValue);
    }, [onTransferValueChange, transferValue]);

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

        <DnfFollowUpSections
          key={`simplification-${builder.solutionVersion}`}
          simplification={simplificationFollowUp}
          initiallyOpenSimplification={builder.solutionVersion > 0}
        />
      </div>
    );
  },
);
