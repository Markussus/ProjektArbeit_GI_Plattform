import { useMemo, useRef, useState, type ReactNode } from "react";
import type { TFunction } from "i18next";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  Lightbulb,
  ListChecks,
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
import { SimplificationWalkthrough } from "./SimplificationWalkthrough";

interface DnfSimplificationPanelProps {
  canonicalDnf: string;
  truthTable: TruthTable;
  simplificationAnswer: string;
  feedback: DnfSimplificationCheckResult | null;
  showSolution: boolean;
  showWalkthrough: boolean;
  className?: string;
  onAnswerChange: (value: string) => void;
  onCheck: () => void;
  onToggleSolution: () => void;
  onToggleWalkthrough: () => void;
}

export function DnfSimplificationPanel({
  canonicalDnf,
  truthTable,
  simplificationAnswer,
  feedback,
  showSolution,
  showWalkthrough,
  className,
  onAnswerChange,
  onCheck,
  onToggleSolution,
  onToggleWalkthrough,
}: DnfSimplificationPanelProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isReferenceOpen, setIsReferenceOpen] = useState(false);

  const statusTone = getStatusTone(feedback?.status);
  const walkthrough = useMemo(
    () =>
      feedback !== null ? buildDnfSimplificationWalkthrough(truthTable) : null,
    [feedback, truthTable],
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

      <div className="mt-4">
        <button
          type="button"
          data-testid="dnf-check-simplification"
          onClick={onCheck}
          className="bg-brand text-brand-foreground inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold shadow-sm transition-opacity hover:opacity-90"
        >
          <Search className="size-4" />
          {t("dnf.builder.exercise.checkSimplification")}
        </button>
      </div>

      {feedback && (
        <SimplificationFeedback feedback={feedback} statusTone={statusTone} />
      )}

      <div className="mt-4 space-y-2">
        <RevealSection
          testId="dnf-reveal-minimal-solution"
          icon={Eye}
          title={t("dnf.builder.exercise.revealSolutionTitle")}
          disabledHint={t("dnf.builder.exercise.revealRequiresCheck")}
          isOpen={feedback !== null && showSolution}
          disabled={feedback === null}
          onToggle={onToggleSolution}
          isSolution
        >
          {feedback && (
            <div className="space-y-4">
              <div>
                <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  {t("dnf.builder.exercise.minimalDnfLabel")}
                </p>
                <code className="text-foreground mt-2 block font-mono text-sm leading-relaxed break-words">
                  {formatBooleanExpressionForDisplay(
                    feedback.minimalExpression,
                  )}
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
                    {t("dnf.builder.exercise.factoredLabel")}
                  </p>
                  <code className="text-foreground mt-2 block font-mono text-sm leading-relaxed break-words">
                    {formatBooleanExpressionForDisplay(
                      feedback.factoredExpression,
                    )}
                  </code>
                  <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
                    {t("dnf.builder.exercise.factoredNote", {
                      literalsLabel: t("dnf.builder.exercise.literalCount", {
                        count: feedback.factoredLiteralCount,
                      }),
                    })}
                  </p>
                </div>
              )}
            </div>
          )}
        </RevealSection>

        <RevealSection
          testId="dnf-reveal-walkthrough"
          icon={ListChecks}
          title={t("dnf.builder.exercise.revealWalkthroughTitle")}
          disabledHint={t("dnf.builder.exercise.revealRequiresCheck")}
          isOpen={feedback !== null && showWalkthrough}
          disabled={feedback === null}
          onToggle={onToggleWalkthrough}
          isSolution
        >
          {walkthrough && (
            <SimplificationWalkthrough walkthrough={walkthrough} />
          )}
        </RevealSection>

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

interface RevealSectionProps {
  icon: typeof Eye;
  title: string;
  disabledHint?: string;
  isOpen: boolean;
  disabled: boolean;
  onToggle: () => void;
  isSolution?: boolean;
  testId?: string;
  children: ReactNode;
}

function RevealSection({
  icon: Icon,
  title,
  disabledHint,
  isOpen,
  disabled,
  onToggle,
  isSolution = false,
  testId,
  children,
}: RevealSectionProps) {
  const { t } = useTranslation();

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
          {isSolution && (
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              {t("dnf.builder.solutionBadge")}
            </span>
          )}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {disabled && disabledHint && (
            <span className="text-muted-foreground text-xs">
              {disabledHint}
            </span>
          )}
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
  statusTone: StatusTone;
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
            {buildDetail(feedback, t)}
          </p>
        </div>
      </div>
    </div>
  );
}

function buildDetail(
  feedback: DnfSimplificationCheckResult,
  t: TFunction,
): string {
  switch (feedback.status) {
    case "empty":
      return t("dnf.builder.exercise.simplificationDetail.empty");
    case "syntax_error":
      return t("dnf.builder.exercise.simplificationDetail.syntax_error");
    case "unknown_variable":
      return t("dnf.builder.exercise.simplificationDetail.unknown_variable", {
        variables: feedback.unknownVariables.join(", "),
      });
    case "not_equivalent":
      return t("dnf.builder.exercise.simplificationDetail.not_equivalent");
    case "equivalent_not_shorter":
      return t(
        "dnf.builder.exercise.simplificationDetail.equivalent_not_shorter",
        {
          userLiterals: feedback.userLiteralCount ?? 0,
          canonicalLiterals: feedback.canonicalLiteralCount,
        },
      );
    case "accepted_not_minimal":
      return t(
        "dnf.builder.exercise.simplificationDetail.accepted_not_minimal",
        {
          userLiterals: feedback.userLiteralCount ?? 0,
          minimumLiterals: feedback.minimumLiteralCount,
        },
      );
    case "accepted_minimal":
      return t("dnf.builder.exercise.simplificationDetail.accepted_minimal", {
        userLiterals: feedback.userLiteralCount ?? 0,
        minimumLiterals: feedback.minimumLiteralCount,
      });
  }
}

type StatusTone = {
  containerClass: string;
  titleClass: string;
  iconClass: string;
  Icon: typeof CheckCircle2;
};

function getStatusTone(
  status: DnfSimplificationCheckResult["status"] | undefined,
): StatusTone {
  switch (status) {
    case "accepted_minimal":
      return {
        containerClass: "border-emerald-500/30 bg-emerald-500/10",
        titleClass: "text-emerald-700 dark:text-emerald-300",
        iconClass: "text-emerald-600 dark:text-emerald-400",
        Icon: CheckCircle2,
      };
    case "accepted_not_minimal":
      return {
        containerClass: "border-amber-500/30 bg-amber-500/10",
        titleClass: "text-amber-700 dark:text-amber-300",
        iconClass: "text-amber-600 dark:text-amber-400",
        Icon: Lightbulb,
      };
    case "equivalent_not_shorter":
    case "not_equivalent":
    case "syntax_error":
    case "unknown_variable":
    case "empty":
    default:
      return {
        containerClass: "border-border bg-card",
        titleClass: "text-foreground",
        iconClass: "text-muted-foreground",
        Icon: Lightbulb,
      };
  }
}
