import type { TruthTableDisplay } from "../adapters/truthTableAdapter";
import type { DnfExerciseCheckResult } from "../domain/dnfExerciseCheck";
import type { DnfDerivation } from "../domain/dnfDerivation";
import type { DnfSimplificationCheckResult } from "../domain/dnfSimplificationCheck";
import type { TruthTable } from "../domain/truthTable";
import type { DnfBuilderAnalysis } from "./dnfAnalysis";
import type { UseDnfSimplificationResult } from "./useDnfSimplification";

type ValidDnfAnalysis = Extract<DnfBuilderAnalysis, { status: "valid" }>;

export interface DnfFollowUpSolution {
  formattedDnf: string;
  variableCount: number;
  rowCount: number;
  trueRowCount: number;
  derivation: DnfDerivation;
  display: TruthTableDisplay | null;
  resultHeader: string;
}

interface DnfSimplificationControls {
  answer: string;
  feedback: DnfSimplificationCheckResult | null;
  showSolution: boolean;
  showWalkthrough: boolean;
  onAnswerChange: (value: string) => void;
  onCheck: () => void;
  onToggleSolution: () => void;
  onToggleWalkthrough: () => void;
}

export interface DnfFollowUpConfiguration {
  solution?: DnfFollowUpSolution;
  simplification: {
    truthTable: TruthTable;
    controls: DnfSimplificationControls;
    isEnabled: boolean;
  };
}

interface BuildDnfFollowUpConfigurationOptions {
  analysis: ValidDnfAnalysis;
  display: TruthTableDisplay | null;
  resultHeader: string;
  showSolution: boolean;
  feedback: DnfExerciseCheckResult | null;
  simplification: UseDnfSimplificationResult;
  simplificationAnswerChange?: (value: string) => void;
}

export function buildDnfFollowUpConfiguration({
  analysis,
  display,
  resultHeader,
  showSolution,
  feedback,
  simplification,
  simplificationAnswerChange,
}: BuildDnfFollowUpConfigurationOptions): DnfFollowUpConfiguration {
  const solution =
    showSolution && display
      ? {
          formattedDnf: analysis.formattedDnf,
          variableCount: analysis.truthTable.variables.length,
          rowCount: analysis.truthTable.rows.length,
          trueRowCount: analysis.derivation.trueRows.length,
          derivation: analysis.derivation,
          display,
          resultHeader,
        }
      : undefined;

  return {
    solution,
    simplification: {
      truthTable: analysis.truthTable,
      controls: {
        answer: simplification.answer,
        feedback: simplification.feedback,
        showSolution: simplification.showSolution,
        showWalkthrough: simplification.showWalkthrough,
        onAnswerChange: simplificationAnswerChange ?? simplification.setAnswer,
        onCheck: () => simplification.check(analysis.truthTable),
        onToggleSolution: simplification.toggleSolution,
        onToggleWalkthrough: simplification.toggleWalkthrough,
      },
      isEnabled: feedback?.isCorrect === true,
    },
  };
}
