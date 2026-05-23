import { useRef } from "react";
import type { TFunction } from "i18next";
import { CheckCircle2, Eye, Lightbulb, Search, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { BooleanExpression } from "../domain/booleanExpression";
import { formatBooleanInput } from "../domain/booleanSyntax";
import type { DnfSimplificationCheckResult } from "../domain/dnfSimplificationCheck";
import { DnfOperatorToolbar } from "./DnfOperatorToolbar";

interface DnfSimplificationPanelProps {
  canonicalDnf: string;
  simplificationAnswer: string;
  feedback: DnfSimplificationCheckResult | null;
  showSolution: boolean;
  onAnswerChange: (value: string) => void;
  onCheck: () => void;
  onToggleSolution: () => void;
}

export function DnfSimplificationPanel({
  canonicalDnf,
  simplificationAnswer,
  feedback,
  showSolution,
  onAnswerChange,
  onCheck,
  onToggleSolution,
}: DnfSimplificationPanelProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const statusTone = getStatusTone(feedback?.status);

  return (
    <section className="border-border bg-muted/30 mt-5 rounded-lg border p-4">
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
          value={simplificationAnswer}
          onChange={(event) => onAnswerChange(event.target.value)}
          onBlur={(event) => onAnswerChange(formatBooleanInput(event.target.value))}
          spellCheck="false"
          placeholder={t("dnf.builder.exercise.simplifiedDnfPlaceholder")}
          className="border-border bg-background text-foreground focus:ring-ring mt-2 min-h-20 w-full resize-y rounded-md border p-3 font-mono text-sm leading-relaxed focus:ring-2 focus:outline-none"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onCheck}
          className="bg-brand text-brand-foreground inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold shadow-sm transition-opacity hover:opacity-90"
        >
          <Search className="size-4" />
          {t("dnf.builder.exercise.checkSimplification")}
        </button>
        <button
          type="button"
          onClick={onToggleSolution}
          disabled={feedback === null}
          className="border-border hover:bg-muted inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Eye className="size-4" />
          {showSolution
            ? t("dnf.builder.exercise.hideSimplificationSolution")
            : feedback !== null
              ? t("dnf.builder.exercise.showSimplificationSolution")
              : t("dnf.builder.exercise.solutionAfterCheckSimplification")}
        </button>
      </div>

      {feedback && (
        <SimplificationFeedback feedback={feedback} statusTone={statusTone} />
      )}

      {feedback && showSolution && (
        <div className="border-border bg-background mt-4 rounded-md border p-3">
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            {t("dnf.builder.exercise.minimalDnfLabel")}
          </p>
          <code className="text-foreground mt-2 block font-mono text-sm leading-relaxed break-words">
            {formatBooleanExpression(feedback.minimalExpression)}
          </code>
          <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
            {t("dnf.builder.exercise.minimalDnfNote", {
              literals: feedback.minimumLiteralCount,
              terms: feedback.minimumTermCount,
            })}
          </p>
        </div>
      )}
    </section>
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
      className={cn(
        "mt-4 rounded-md border p-3",
        statusTone.containerClass,
      )}
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
        containerClass:
          "border-emerald-500/30 bg-emerald-500/10",
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

function formatBooleanExpression(expression: BooleanExpression): string {
  return renderExpression(expression, 0);
}

function renderExpression(
  expression: BooleanExpression,
  parentPrecedence: number,
): string {
  switch (expression.type) {
    case "constant":
      return expression.value ? "1" : "0";
    case "variable":
      return expression.name;
    case "not":
      return `¬${renderExpression(expression.operand, 3)}`;
    case "binary": {
      const precedence = expression.operator === "and" ? 2 : 1;
      const symbol = expression.operator === "and" ? "∧" : "∨";
      const text = `${renderExpression(
        expression.left,
        precedence,
      )} ${symbol} ${renderExpression(expression.right, precedence)}`;
      return precedence < parentPrecedence ? `(${text})` : text;
    }
  }
}
