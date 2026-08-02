import { useMemo, useState } from "react";
import { formatBooleanExpressionForDisplay } from "../domain/booleanExpressionFormat";
import { normalizeBooleanOperatorAliases } from "../domain/booleanSyntax";
import {
  checkDnfExerciseAttempt,
  type DnfExerciseCheckResult,
  type TruthTableAnswer,
} from "../domain/dnfExerciseCheck";
import { computeSmallestBooleanExpression } from "../domain/minimalExpression";
import type { DnfBuilderAnalysis } from "./dnfAnalysis";
import type { DnfExerciseTransferDraft } from "../domain/dnfTransfer";
import { useDnfSimplification } from "./useDnfSimplification";

interface UseDnfExerciseParams {
  analysis: DnfBuilderAnalysis;
  isExerciseMode: boolean;
  requiresTruthTableAnswers: boolean;
  initialAttempt?: DnfExerciseTransferDraft;
}

export function useDnfExercise({
  analysis,
  isExerciseMode,
  requiresTruthTableAnswers,
  initialAttempt,
}: UseDnfExerciseParams) {
  const [showSolution, setShowSolution] = useState(!isExerciseMode);
  const [truthTableAnswers, setTruthTableAnswers] = useState<
    TruthTableAnswer[]
  >(() => initialAttempt?.truthTableAnswers ?? []);
  const [dnfAnswer, setDnfAnswer] = useState(initialAttempt?.dnfAnswer ?? "");
  const [exerciseFeedback, setExerciseFeedback] =
    useState<DnfExerciseCheckResult | null>(() =>
      deriveRestoredFeedback(
        analysis,
        initialAttempt,
        requiresTruthTableAnswers,
      ),
    );
  const simplification = useDnfSimplification(
    initialAttempt?.simplificationAnswer,
  );
  const [solutionVersion, setSolutionVersion] = useState(0);

  const resetExercise = () => {
    setShowSolution(!isExerciseMode);
    setTruthTableAnswers([]);
    setDnfAnswer("");
    setExerciseFeedback(null);
    simplification.reset();
  };

  const setTruthTableAnswer = (rowIndex: number, value: boolean) => {
    setTruthTableAnswers((currentAnswers) => {
      const nextAnswers = [...currentAnswers];
      nextAnswers[rowIndex] = value;
      return nextAnswers;
    });
    setExerciseFeedback(null);
    setShowSolution(false);
    simplification.reset();
  };

  const updateDnfAnswer = (value: string) => {
    setDnfAnswer(normalizeBooleanOperatorAliases(value));
    setExerciseFeedback(null);
    setShowSolution(false);
    simplification.reset();
  };

  const checkExercise = () => {
    if (analysis.status !== "valid") {
      return;
    }

    setExerciseFeedback(
      checkDnfExerciseAttempt(
        analysis.truthTable,
        truthTableAnswers,
        dnfAnswer,
        { checkTruthTable: requiresTruthTableAnswers },
      ),
    );
  };

  const loadAttempt = (attempt: DnfExerciseTransferDraft) => {
    setShowSolution(false);
    setTruthTableAnswers([...attempt.truthTableAnswers]);
    setDnfAnswer(normalizeBooleanOperatorAliases(attempt.dnfAnswer));
    setExerciseFeedback(
      deriveRestoredFeedback(analysis, attempt, requiresTruthTableAnswers),
    );
    simplification.setAnswer(attempt.simplificationAnswer);
  };

  // Fill the exercise with its reference solution: correct truth table, the
  // canonical DNF and the minimal simplification — each shown as already
  // checked, so the whole flow opens in a solved state (the "give up / show me"
  // action used by the header button).
  const buildSolutionAttempt = (): DnfExerciseTransferDraft | null => {
    if (analysis.status !== "valid") {
      return null;
    }

    const { truthTable } = analysis;
    const solvedAnswers = truthTable.rows.map((row) => row.result);
    const canonicalDnf = analysis.formattedDnf;
    const minimalExpression = formatBooleanExpressionForDisplay(
      computeSmallestBooleanExpression(truthTable).expression,
    );

    return {
      truthTableAnswers: solvedAnswers,
      dnfAnswer: canonicalDnf,
      simplificationAnswer: minimalExpression,
    };
  };

  const loadSolution = (
    solvedAttempt = buildSolutionAttempt(),
  ): DnfExerciseTransferDraft | null => {
    if (!solvedAttempt || analysis.status !== "valid") {
      return null;
    }

    setShowSolution(false);
    setTruthTableAnswers([...solvedAttempt.truthTableAnswers]);
    setDnfAnswer(solvedAttempt.dnfAnswer);
    setExerciseFeedback(
      checkDnfExerciseAttempt(
        analysis.truthTable,
        solvedAttempt.truthTableAnswers,
        solvedAttempt.dnfAnswer,
        {
          checkTruthTable: requiresTruthTableAnswers,
        },
      ),
    );
    simplification.loadSolution(
      solvedAttempt.simplificationAnswer,
      analysis.truthTable,
    );
    setSolutionVersion((current) => current + 1);
    return solvedAttempt;
  };

  const normalizedTruthTableAnswers = useMemo(
    () =>
      analysis.status === "valid"
        ? analysis.truthTable.rows.map((row, rowIndex) =>
            requiresTruthTableAnswers
              ? (truthTableAnswers[rowIndex] ?? null)
              : row.result,
          )
        : [],
    [analysis, requiresTruthTableAnswers, truthTableAnswers],
  );

  return {
    showSolution,
    truthTableAnswers: normalizedTruthTableAnswers,
    dnfAnswer,
    exerciseFeedback,
    setTruthTableAnswer,
    setDnfAnswer: updateDnfAnswer,
    checkExercise,
    loadAttempt,
    buildSolutionAttempt,
    loadSolution,
    solutionVersion,
    toggleSolution: () => setShowSolution((current) => !current),
    resetExercise,
    simplification,
  };
}

function deriveRestoredFeedback(
  analysis: DnfBuilderAnalysis,
  attempt: DnfExerciseTransferDraft | undefined,
  requiresTruthTableAnswers: boolean,
): DnfExerciseCheckResult | null {
  if (!attempt || analysis.status !== "valid") {
    return null;
  }

  // Only restore the "solved" state for a genuinely correct attempt, so an
  // imported or auto-loaded session keeps the simplification step unlocked
  // without ever revealing the solution for an unsolved attempt.
  const result = checkDnfExerciseAttempt(
    analysis.truthTable,
    attempt.truthTableAnswers,
    normalizeBooleanOperatorAliases(attempt.dnfAnswer),
    { checkTruthTable: requiresTruthTableAnswers },
  );

  return result.isCorrect ? result : null;
}
