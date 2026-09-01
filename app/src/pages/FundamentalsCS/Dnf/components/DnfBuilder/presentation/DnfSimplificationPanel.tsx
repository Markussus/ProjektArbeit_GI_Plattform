import { useMemo, useRef, useState, type ReactNode } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Eye,
  Search,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  formatBooleanExpressionForDisplay,
  reformatBooleanExpressionInput,
} from "../domain/booleanExpressionFormat";
import type { DnfSimplificationCheckResult } from "../domain/dnfSimplificationCheck";
import { buildDnfSimplificationWalkthrough } from "../domain/dnfSimplificationWalkthrough";
import type { TruthTable } from "../domain/truthTable";
import { BooleanAlgebraReference } from "./BooleanAlgebraReference";
import { DnfOperatorToolbar } from "./DnfOperatorToolbar";
import {
  buildSimplificationDetail,
  getSimplificationStatusTone,
  type SimplificationStatusTone,
} from "./dnfSimplificationFeedback";
import { SimplificationWalkthrough } from "./SimplificationWalkthrough";

interface DnfSimplificationPanelProps {
  canonicalDnf: string;
  truthTable: TruthTable;
  simplificationAnswer: string;
  feedback: DnfSimplificationCheckResult | null;
  showSolution: boolean;
  className?: string;
  onAnswerChange: (value: string) => void;
  onCheck: () => void;
  onToggleSolution: () => void;
}

export function DnfSimplificationPanel({
  canonicalDnf,
  truthTable,
  simplificationAnswer,
  feedback,
  showSolution,
  className,
  onAnswerChange,
  onCheck,
  onToggleSolution,
}: DnfSimplificationPanelProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isReferenceOpen, setIsReferenceOpen] = useState(false);

  const statusTone = getSimplificationStatusTone(feedback?.status);
  const walkthrough = useMemo(
    () =>
      feedback !== null && showSolution
        ? buildDnfSimplificationWalkthrough(truthTable)
        : null,
    [feedback, showSolution, truthTable],
  );

  return (
    <section
      data-testid="dnf-simplification-panel"
      className={cn(
        "border-border bg-muted/30 rounded-lg border p-4",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="bg-module-rose-bg text-module-rose-fg flex size-9 shrink-0 items-center justify-center rounded-md">
          <Sparkles className="size-5" />
        </div>
        <div>
          <h3 className="text-foreground text-base font-semibold">
            {t("dnf.builder.exercise.simplificationTitle")}
          </h3>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
            {t("dnf.builder.exercise.simplificationHint")}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          {t("dnf.builder.exercise.canonicalDnfLabel")}
        </p>
        <code className="border-border bg-background text-foreground mt-2 block rounded-md border p-3 font-mono text-sm leading-relaxed break-words">
          {canonicalDnf}
        </code>
      </div>

      <div className="mt-4">
        <label
          className="text-foreground text-sm font-semibold"
          htmlFor="dnf-simplified-answer"
        >
          {t("dnf.builder.exercise.simplifiedDnfLabel")}
        </label>
        <DnfOperatorToolbar
          inputRef={inputRef}
          value={simplificationAnswer}
          onChange={onAnswerChange}
          className="mt-3"
        />
        <textarea
          ref={inputRef}
          id="dnf-simplified-answer"
          data-testid="dnf-simplified-answer"
          value={simplificationAnswer}
          onChange={(event) => onAnswerChange(event.target.value)}
          onBlur={(event) =>
            onAnswerChange(reformatBooleanExpressionInput(event.target.value))
          }
          spellCheck="false"
          placeholder={t("dnf.builder.exercise.simplifiedDnfPlaceholder")}
          className="border-border bg-background text-foreground focus:ring-ring mt-2 min-h-20 w-full resize-y rounded-md border p-3 font-mono text-sm leading-relaxed focus:ring-2 focus:outline-none"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          data-testid="dnf-check-simplification"
          onClick={onCheck}
          className="bg-brand text-brand-foreground inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold shadow-sm transition-opacity hover:opacity-90"
        >
          <Search className="size-4" />
          {t("dnf.builder.exercise.checkSimplification")}
        </button>
        <button
          type="button"
          data-testid="dnf-toggle-simplification-solution"
          disabled={feedback === null}
          aria-expanded={feedback !== null && showSolution}
          onClick={onToggleSolution}
          className="border-border hover:bg-muted inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Eye className="size-4" />
          {showSolution
            ? t("dnf.builder.exercise.hideSolution")
            : feedback
              ? t("dnf.builder.exercise.showSolutionHelp")
              : t("dnf.builder.exercise.solutionAfterCheck")}
        </button>
      </div>

      {feedback && (
        <SimplificationFeedback feedback={feedback} statusTone={statusTone} />
      )}

      {feedback && showSolution && walkthrough && (
        <SimplificationSolution feedback={feedback} walkthrough={walkthrough} />
      )}

      <div className="mt-4 space-y-2">
        <RevealSection
          testId="dnf-reveal-algebra-reference"
          icon={BookOpen}
          title={t("dnf.builder.exercise.revealAlgebraReferenceTitle")}
          isOpen={isReferenceOpen}
          disabled={false}
          onToggle={() => setIsReferenceOpen((current) => !current)}
        >
          <BooleanAlgebraReference variant="panel" />
        </RevealSection>
      </div>
    </section>
  );
}

interface SimplificationSolutionProps {
  feedback: DnfSimplificationCheckResult;
  walkthrough: ReturnType<typeof buildDnfSimplificationWalkthrough>;
}

function SimplificationSolution({
  feedback,
  walkthrough,
}: SimplificationSolutionProps) {
  const { t } = useTranslation();

  return (
    <div
      data-testid="dnf-simplification-solution"
      className="border-border bg-background mt-4 rounded-md border p-3"
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-foreground text-sm font-semibold">
          {t("dnf.builder.solutionTitle")}
        </p>
      </div>

      <div className="mt-3 space-y-4">
        <div>
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            {t("dnf.builder.exercise.minimalDnfLabel")}
          </p>
          <code className="text-foreground mt-2 block font-mono text-sm leading-relaxed break-words">
            {formatBooleanExpressionForDisplay(feedback.minimalExpression)}
          </code>
          <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
            {t("dnf.builder.exercise.minimalDnfNote", {
              literalsLabel: t("dnf.builder.exercise.literalCount", {
                count: feedback.minimumLiteralCount,
              }),
              termsLabel: t("dnf.builder.exercise.termCount", {
                count: feedback.minimumTermCount,
              }),
            })}
          </p>
        </div>

        {feedback.factoredIsShorter && (
          <div className="border-border/60 border-t pt-3">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              {t(
                feedback.factoredIsExact
                  ? "dnf.builder.exercise.factoredLabel"
                  : "dnf.builder.exercise.factoredFallbackLabel",
              )}
            </p>
            <code className="text-foreground mt-2 block font-mono text-sm leading-relaxed break-words">
              {formatBooleanExpressionForDisplay(feedback.factoredExpression)}
            </code>
            <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
              {t(
                feedback.factoredIsExact
                  ? "dnf.builder.exercise.factoredNote"
                  : "dnf.builder.exercise.factoredFallbackNote",
                {
                  literalsLabel: t("dnf.builder.exercise.literalCount", {
                    count: feedback.factoredLiteralCount,
                  }),
                },
              )}
            </p>
          </div>
        )}

        <SimplificationWalkthrough walkthrough={walkthrough} />
      </div>
    </div>
  );
}

interface RevealSectionProps {
  icon: typeof Eye;
  title: string;
  isOpen: boolean;
  disabled: boolean;
  onToggle: () => void;
  testId?: string;
  children: ReactNode;
}

function RevealSection({
  icon: Icon,
  title,
  isOpen,
  disabled,
  onToggle,
  testId,
  children,
}: RevealSectionProps) {
  return (
    <div>
      <button
        type="button"
        data-testid={testId}
        disabled={disabled}
        aria-expanded={isOpen}
        onClick={onToggle}
        className={cn(
          "border-border bg-card hover:bg-muted/40 flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2 text-left transition-colors",
          isOpen && "border-brand",
          disabled && "hover:bg-card cursor-not-allowed opacity-50",
        )}
      >
        <span className="text-foreground flex min-w-0 flex-wrap items-center gap-2 text-sm font-medium">
          <Icon className="size-4 shrink-0" />
          <span className="truncate">{title}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {isOpen ? (
            <ChevronUp className="text-muted-foreground size-4" />
          ) : (
            <ChevronDown className="text-muted-foreground size-4" />
          )}
        </span>
      </button>
      {isOpen && !disabled && (
        <div className="border-border bg-background mt-2 rounded-md border p-3">
          {children}
        </div>
      )}
    </div>
  );
}

interface SimplificationFeedbackProps {
  feedback: DnfSimplificationCheckResult;
  statusTone: SimplificationStatusTone;
}

function SimplificationFeedback({
  feedback,
  statusTone,
}: SimplificationFeedbackProps) {
  const { t } = useTranslation();

  return (
    <div
      data-testid="dnf-simplification-feedback"
      data-status={feedback.status}
      className={cn("mt-4 rounded-md border p-3", statusTone.containerClass)}
    >
      <div className="flex items-start gap-2">
        <statusTone.Icon
          className={cn("mt-0.5 size-5 shrink-0", statusTone.iconClass)}
        />
        <div>
          <p className={cn("text-sm font-semibold", statusTone.titleClass)}>
            {t(`dnf.builder.exercise.simplificationStatus.${feedback.status}`)}
          </p>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
            {buildSimplificationDetail(feedback, t)}
          </p>
        </div>
      </div>
    </div>
  );
}
