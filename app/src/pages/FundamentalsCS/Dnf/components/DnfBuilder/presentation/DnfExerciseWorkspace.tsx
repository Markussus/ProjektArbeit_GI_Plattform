import { useRef, type KeyboardEvent } from "react";
import { Eye, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatBooleanInput } from "../domain/booleanSyntax";
import type {
  DnfExerciseCheckResult,
  TruthTableAnswer,
} from "../domain/dnfExerciseCheck";
import type { TruthTable } from "../domain/truthTable";
import type { DnfFollowUpSolution } from "../application/dnfFollowUp";
import { DnfExerciseTaskCard } from "./DnfExerciseTaskCard";
import { DnfExerciseTruthTablePanel } from "./DnfExerciseTruthTablePanel";
import { DnfOperatorToolbar } from "./DnfOperatorToolbar";
import { DnfSolutionBlock } from "./DnfSolutionBlock";
import { ExerciseFeedbackPanel } from "./ExerciseFeedbackPanel";

const WORKSPACE_TABLE_TOGGLE_THRESHOLD = 16;

interface DnfExerciseWorkspaceProps {
  source: string;
  truthTable: TruthTable;
  truthTableAnswers: TruthTableAnswer[];
  dnfAnswer: string;
  feedback: DnfExerciseCheckResult | null;
  showSolution: boolean;
  resultHeader?: string;
  requiresTruthTableAnswers: boolean;
  canEditTruthTableResults?: boolean;
  canToggleFullTable?: boolean;
  showFullTable?: boolean;
  solution?: DnfFollowUpSolution;
  onTruthTableAnswerChange: (rowIndex: number, value: boolean) => void;
  onDnfAnswerChange: (value: string) => void;
  onCheck: () => void;
  onToggleSolution: () => void;
  onToggleFullTable?: () => void;
}

export function DnfExerciseWorkspace({
  source,
  truthTable,
  truthTableAnswers,
  dnfAnswer,
  feedback,
  showSolution,
  resultHeader,
  requiresTruthTableAnswers,
  canEditTruthTableResults = false,
  canToggleFullTable = false,
  showFullTable = false,
  solution,
  onTruthTableAnswerChange,
  onDnfAnswerChange,
  onCheck,
  onToggleSolution,
  onToggleFullTable,
}: DnfExerciseWorkspaceProps) {
  const { t } = useTranslation();
  const dnfInputRef = useRef<HTMLTextAreaElement>(null);
  const resultRowRefs = useRef<Array<HTMLDivElement | null>>([]);
  const issueByRow = new Map(
    feedback?.truthTableIssues.map((issue) => [issue.rowIndex, issue]) ?? [],
  );
  const answeredRowCount = truthTableAnswers.filter(
    (answer) => answer !== null,
  ).length;
  const hasDnfAttempt = dnfAnswer.trim().length > 0;
  const canShowSolution = feedback !== null;
  const canInteractWithResultColumn =
    requiresTruthTableAnswers || canEditTruthTableResults;
  const isLargeWorkspaceTable =
    truthTable.rows.length >= WORKSPACE_TABLE_TOGGLE_THRESHOLD;
  const canActuallyToggleTable = canToggleFullTable && isLargeWorkspaceTable;
  const isCompactEditableTable = canActuallyToggleTable && !showFullTable;
  const isScrollableTruthTable = isCompactEditableTable;

  const focusResultRow = (rowIndex: number) => {
    const nextRow =
      resultRowRefs.current[rowIndex] ??
      resultRowRefs.current[resultRowRefs.current.length - 1];
    nextRow?.focus();
  };

  const updateTruthTableAnswer = (rowIndex: number, value: boolean) => {
    onTruthTableAnswerChange(rowIndex, value);
    focusResultRow(Math.min(rowIndex + 1, truthTable.rows.length - 1));
  };

  const handleResultKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    rowIndex: number,
  ) => {
    switch (event.key) {
      case "0":
      case "ArrowLeft":
        event.preventDefault();
        updateTruthTableAnswer(rowIndex, false);
        break;
      case "1":
      case "ArrowRight":
        event.preventDefault();
        updateTruthTableAnswer(rowIndex, true);
        break;
      case "ArrowDown":
        event.preventDefault();
        focusResultRow(Math.min(rowIndex + 1, truthTable.rows.length - 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        focusResultRow(Math.max(rowIndex - 1, 0));
        break;
    }
  };

  return (
    <div data-testid="dnf-exercise-workspace" className="flex flex-col gap-5">
      <DnfExerciseTaskCard
        source={source}
        requiresTruthTableAnswers={requiresTruthTableAnswers}
        canEditTruthTableResults={canEditTruthTableResults}
      />

      <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.6fr)]">
        <DnfExerciseTruthTablePanel
          truthTable={truthTable}
          truthTableAnswers={truthTableAnswers}
          issueByRow={issueByRow}
          resultHeader={resultHeader}
          requiresTruthTableAnswers={requiresTruthTableAnswers}
          canEditTruthTableResults={canEditTruthTableResults}
          canInteractWithResultColumn={canInteractWithResultColumn}
          canActuallyToggleTable={canActuallyToggleTable}
          showFullTable={showFullTable}
          isScrollableTruthTable={isScrollableTruthTable}
          resultRowRefs={resultRowRefs}
          onToggleFullTable={onToggleFullTable}
          onResultKeyDown={handleResultKeyDown}
          onSelectResult={updateTruthTableAnswer}
        />

        <ExerciseFeedbackPanel
          truthTable={truthTable}
          feedback={feedback}
          answeredRowCount={answeredRowCount}
          totalRowCount={truthTable.rows.length}
          hasDnfAnswer={hasDnfAttempt}
          isTruthTableProvided={!requiresTruthTableAnswers}
          isTruthTableEditable={canEditTruthTableResults}
        />
      </div>

      <section
        data-testid="dnf-exercise-answer-panel"
        className="border-border bg-card rounded-lg border p-4"
      >
        <div>
          <label
            className="text-foreground text-sm font-semibold"
            htmlFor="dnf-exercise-answer"
          >
            {t("dnf.builder.exercise.dnfLabel")}
          </label>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
            {t("dnf.builder.exercise.dnfHint")}
          </p>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
            {t("dnf.builder.keyboardAliases")}
          </p>
          <DnfOperatorToolbar
            inputRef={dnfInputRef}
            value={dnfAnswer}
            onChange={onDnfAnswerChange}
            className="mt-3"
          />
          <textarea
            ref={dnfInputRef}
            id="dnf-exercise-answer"
            data-testid="dnf-exercise-answer"
            value={dnfAnswer}
            onChange={(event) => onDnfAnswerChange(event.target.value)}
            onBlur={(event) =>
              onDnfAnswerChange(formatBooleanInput(event.target.value))
            }
            spellCheck="false"
            placeholder={t("dnf.builder.exercise.dnfPlaceholder")}
            className="border-border bg-background text-foreground focus:ring-ring mt-2 min-h-24 w-full resize-y rounded-md border p-3 font-mono text-sm leading-relaxed focus:ring-2 focus:outline-none"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            data-testid="dnf-check-answer"
            onClick={onCheck}
            className="bg-brand text-brand-foreground inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold shadow-sm transition-opacity hover:opacity-90"
          >
            <Search className="size-4" />
            {t("dnf.builder.exercise.check")}
          </button>
          <button
            type="button"
            data-testid="dnf-toggle-solution"
            onClick={onToggleSolution}
            disabled={!canShowSolution}
            className="border-border hover:bg-muted inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Eye className="size-4" />
            {showSolution
              ? t("dnf.builder.exercise.hideSolution")
              : canShowSolution
                ? t("dnf.builder.exercise.showSolutionHelp")
                : t("dnf.builder.exercise.solutionAfterCheck")}
          </button>
        </div>

        {solution && <DnfSolutionBlock solution={solution} />}
      </section>
    </div>
  );
}
