import { useMemo, useRef, type ReactNode } from "react";
import type { TFunction } from "i18next";
import {
  CheckCircle2,
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
import {
  buildDnfSimplificationWalkthrough,
  type DnfSimplificationWalkthrough,
} from "../domain/dnfSimplificationWalkthrough";
import type { TruthTable } from "../domain/truthTable";
import { DnfOperatorToolbar } from "./DnfOperatorToolbar";

interface DnfSimplificationPanelProps {
  canonicalDnf: string;
  truthTable: TruthTable;
  simplificationAnswer: string;
  feedback: DnfSimplificationCheckResult | null;
  showSolution: boolean;
  showWalkthrough: boolean;
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
  onAnswerChange,
  onCheck,
  onToggleSolution,
  onToggleWalkthrough,
}: DnfSimplificationPanelProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const statusTone = getStatusTone(feedback?.status);
  const walkthrough = useMemo(
    () =>
      feedback !== null
        ? buildDnfSimplificationWalkthrough(truthTable)
        : null,
    [feedback, truthTable],
  );

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
        <button
          type="button"
          onClick={onToggleWalkthrough}
          disabled={feedback === null}
          className="border-border hover:bg-muted inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ListChecks className="size-4" />
          {showWalkthrough
            ? t("dnf.builder.exercise.hideSimplificationWalkthrough")
            : feedback !== null
              ? t("dnf.builder.exercise.showSimplificationWalkthrough")
              : t("dnf.builder.exercise.walkthroughAfterCheckSimplification")}
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
      )}

      {feedback && showWalkthrough && walkthrough && (
        <SimplificationWalkthrough walkthrough={walkthrough} />
      )}
    </section>
  );
}

interface SimplificationFeedbackProps {
  feedback: DnfSimplificationCheckResult;
  statusTone: StatusTone;
}

interface SimplificationWalkthroughProps {
  walkthrough: DnfSimplificationWalkthrough;
}

function SimplificationWalkthrough({
  walkthrough,
}: SimplificationWalkthroughProps) {
  const { t } = useTranslation();
  const hasGroups = walkthrough.groups.length > 0;

  return (
    <div className="border-border bg-background mt-4 rounded-md border p-3">
      <div className="flex items-start gap-2">
        <Lightbulb className="text-brand mt-0.5 size-5 shrink-0" />
        <div>
          <p className="text-foreground text-sm font-semibold">
            {t("dnf.builder.exercise.walkthroughTitle")}
          </p>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
            {t("dnf.builder.exercise.walkthroughNote")}
          </p>
        </div>
      </div>

      <ol className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1 text-sm">
        <WalkthroughStep index={1}>
          <p className="text-foreground font-semibold">
            {t("dnf.builder.exercise.walkthroughRowsTitle")}
          </p>
          <p className="text-muted-foreground mt-1 leading-relaxed">
            {walkthrough.constantCase === "always_false"
              ? t("dnf.builder.exercise.walkthroughNoRows")
              : t("dnf.builder.exercise.walkthroughRowsText", {
                  rows: formatRowNumbers(walkthrough.trueRowNumbers, t),
                })}
          </p>
          <code className="border-border bg-card text-foreground mt-2 block max-h-28 overflow-y-auto rounded-md border p-2 font-mono text-xs leading-relaxed break-words">
            {walkthrough.canonicalDnf}
          </code>
        </WalkthroughStep>

        {walkthrough.constantCase !== null && (
          <WalkthroughStep index={2}>
            <p className="text-foreground font-semibold">
              {t("dnf.builder.exercise.walkthroughConstantTitle")}
            </p>
            <p className="text-muted-foreground mt-1 leading-relaxed">
              {walkthrough.constantCase === "always_true"
                ? t("dnf.builder.exercise.walkthroughAllRows")
                : t("dnf.builder.exercise.walkthroughAlwaysFalse")}
            </p>
          </WalkthroughStep>
        )}

        {hasGroups && (
          <WalkthroughStep index={2}>
            <p className="text-foreground font-semibold">
              {t("dnf.builder.exercise.walkthroughGroupsTitle")}
            </p>
            <p className="text-muted-foreground mt-1 leading-relaxed">
              {t("dnf.builder.exercise.walkthroughGroupsIntro")}
            </p>
            <div className="mt-2 space-y-2">
              {walkthrough.groups.map((group) => (
                <div
                  key={`${group.term}-${group.coveredRowNumbers.join("-")}`}
                  className="border-border bg-muted/30 rounded-md border p-2"
                >
                  <code className="text-foreground font-mono text-xs">
                    {group.term}
                  </code>
                  <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                    {t("dnf.builder.exercise.walkthroughGroupCoverage", {
                      rows: formatRowNumbers(group.coveredRowNumbers, t),
                    })}
                  </p>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {group.eliminatedVariables.length > 0
                      ? t("dnf.builder.exercise.walkthroughGroupEliminated", {
                          variables: group.eliminatedVariables.join(", "),
                        })
                      : t(
                          "dnf.builder.exercise.walkthroughGroupNoEliminated",
                        )}
                  </p>
                </div>
              ))}
            </div>
          </WalkthroughStep>
        )}

        {hasGroups && (
          <WalkthroughStep index={3}>
            <p className="text-foreground font-semibold">
              {t("dnf.builder.exercise.walkthroughCoverTitle")}
            </p>
            <p className="text-muted-foreground mt-1 leading-relaxed">
              {t("dnf.builder.exercise.walkthroughCoverText")}
            </p>
          </WalkthroughStep>
        )}

        <WalkthroughStep index={hasGroups ? 4 : 3}>
          <p className="text-foreground font-semibold">
            {t("dnf.builder.exercise.walkthroughResultTitle")}
          </p>
          <code className="border-border bg-card text-foreground mt-2 block rounded-md border p-2 font-mono text-xs leading-relaxed break-words">
            {walkthrough.minimalForm}
          </code>
        </WalkthroughStep>
      </ol>
    </div>
  );
}

interface WalkthroughStepProps {
  index: number;
  children: ReactNode;
}

function WalkthroughStep({ index, children }: WalkthroughStepProps) {
  return (
    <li className="flex gap-3">
      <span className="bg-brand text-brand-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
        {index}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </li>
  );
}

function formatRowNumbers(rowNumbers: number[], t: TFunction): string {
  const visibleLimit = 12;
  const visible = rowNumbers.slice(0, visibleLimit).join(", ");

  if (rowNumbers.length <= visibleLimit) {
    return visible;
  }

  return t("dnf.builder.exercise.walkthroughRowListMore", {
    visible,
    count: rowNumbers.length - visibleLimit,
  });
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
