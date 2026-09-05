import { useState, type ReactNode } from "react";
import type { TFunction } from "i18next";
import { Lightbulb } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { getBooleanAlgebraRule } from "../domain/booleanAlgebraRules";
import type {
  DnfDerivationStep,
  DnfSimplificationGroup,
  DnfSimplificationWalkthrough as DnfSimplificationWalkthroughModel,
} from "../domain/dnfSimplificationWalkthrough";

interface SimplificationWalkthroughProps {
  walkthrough: DnfSimplificationWalkthroughModel;
}

const LARGE_WALKTHROUGH_GROUP_THRESHOLD = 4;
const LARGE_WALKTHROUGH_STEP_THRESHOLD = 12;

export function SimplificationWalkthrough({
  walkthrough,
}: SimplificationWalkthroughProps) {
  const { t } = useTranslation();
  const [isFull, setIsFull] = useState(false);
  const hasGroups = walkthrough.groups.length > 0;
  const totalDerivationSteps = walkthrough.groups.reduce(
    (sum, group) => sum + group.derivationSteps.length,
    0,
  );
  const isLargeWalkthrough =
    walkthrough.groups.length >= LARGE_WALKTHROUGH_GROUP_THRESHOLD ||
    totalDerivationSteps >= LARGE_WALKTHROUGH_STEP_THRESHOLD;
  const useCompactBox = isLargeWalkthrough && !isFull;

  return (
    <div
      data-testid="dnf-simplification-walkthrough"
      data-view={isFull ? "full" : "compact"}
      className="border-border bg-background mt-4 rounded-md border p-3"
    >
      <div className="flex items-start justify-between gap-3">
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
        {isLargeWalkthrough && (
          <button
            type="button"
            data-testid="dnf-walkthrough-view-toggle"
            onClick={() => setIsFull((current) => !current)}
            className="border-border hover:bg-muted text-foreground inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors"
          >
            {isFull
              ? t("dnf.builder.exercise.showCompactWalkthrough")
              : t("dnf.builder.exercise.showFullWalkthrough")}
          </button>
        )}
      </div>

      <ol
        className={cn(
          "mt-4 space-y-3 pr-1 text-sm",
          useCompactBox && "max-h-128 overflow-y-auto",
        )}
      >
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
            <div className="mt-2 space-y-3">
              {walkthrough.groups.map((group, groupIndex) => (
                <GroupDerivation
                  key={`${group.term}-${group.coveredRowNumbers.join("-")}`}
                  group={group}
                  groupIndex={groupIndex}
                />
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

        {walkthrough.factoredForm !== null &&
          walkthrough.factoredLiteralCount !== null && (
            <WalkthroughStep index={hasGroups ? 5 : 4}>
              <p className="text-foreground font-semibold">
                {t(
                  walkthrough.factoredIsExact
                    ? "dnf.builder.exercise.walkthroughFactoredTitle"
                    : "dnf.builder.exercise.walkthroughFactoredFallbackTitle",
                )}
              </p>
              <p className="text-muted-foreground mt-1 leading-relaxed">
                {t(
                  walkthrough.factoredIsExact
                    ? "dnf.builder.exercise.walkthroughFactoredText"
                    : "dnf.builder.exercise.walkthroughFactoredFallbackText",
                  {
                    minimalLiterals: walkthrough.minimalLiteralCount,
                    factoredLiterals: walkthrough.factoredLiteralCount,
                  },
                )}
              </p>
              <code className="border-border bg-card text-foreground mt-2 block rounded-md border p-2 font-mono text-xs leading-relaxed break-words">
                {walkthrough.factoredForm}
              </code>
              {walkthrough.factoredDerivationSteps.length > 1 && (
                <ol
                  data-testid="dnf-walkthrough-factoring-derivation"
                  className="border-border/60 mt-3 space-y-1.5 border-l-2 pl-3"
                >
                  {walkthrough.factoredDerivationSteps.map(
                    (step, stepIndex) => (
                      <DerivationStepLine
                        key={stepIndex}
                        step={step}
                        isFirst={stepIndex === 0}
                      />
                    ),
                  )}
                </ol>
              )}
              <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
                {t(
                  walkthrough.factoredIsExact
                    ? "dnf.builder.exercise.walkthroughFactoredNote"
                    : "dnf.builder.exercise.walkthroughFactoredFallbackNote",
                )}
              </p>
            </WalkthroughStep>
          )}
      </ol>
    </div>
  );
}

interface GroupDerivationProps {
  group: DnfSimplificationGroup;
  groupIndex: number;
}

function GroupDerivation({ group, groupIndex }: GroupDerivationProps) {
  const { t } = useTranslation();
  const hasMultipleSteps = group.derivationSteps.length > 1;

  return (
    <div
      data-testid={`dnf-walkthrough-group-${groupIndex}`}
      className="border-border bg-muted/30 rounded-md border p-3"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-foreground text-xs font-semibold tracking-wide uppercase">
          {t("dnf.builder.exercise.walkthroughGroupHeading", {
            index: groupIndex + 1,
          })}
        </span>
        <code className="text-foreground font-mono text-xs">
          → {group.term}
        </code>
      </div>
      <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
        {t("dnf.builder.exercise.walkthroughGroupCoverage", {
          rows: formatRowNumbers(group.coveredRowNumbers, t),
        })}
        {group.eliminatedVariables.length > 0 && (
          <>
            {" — "}
            {t("dnf.builder.exercise.walkthroughGroupEliminated", {
              variables: group.eliminatedVariables.join(", "),
            })}
          </>
        )}
      </p>

      {hasMultipleSteps ? (
        <ol className="border-border/60 mt-3 space-y-1.5 border-l-2 pl-3">
          {group.derivationSteps.map((step, stepIndex) => (
            <DerivationStepLine
              key={stepIndex}
              step={step}
              isFirst={stepIndex === 0}
            />
          ))}
        </ol>
      ) : (
        <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
          {t("dnf.builder.exercise.walkthroughGroupNoEliminated")}
        </p>
      )}
    </div>
  );
}

interface DerivationStepLineProps {
  step: DnfDerivationStep;
  isFirst: boolean;
}

function DerivationStepLine({ step, isFirst }: DerivationStepLineProps) {
  const { t } = useTranslation();
  const ruleName = step.ruleId
    ? t(getBooleanAlgebraRule(step.ruleId).nameKey)
    : null;
  const noteText = step.noteKey ? t(step.noteKey, step.noteVars) : null;

  return (
    <li
      data-testid={
        step.ruleId ? `dnf-derivation-step-${step.ruleId}` : undefined
      }
      className="flex flex-col gap-1"
    >
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="text-muted-foreground font-mono text-xs">
          {isFirst ? "  " : "= "}
        </span>
        <code className="text-foreground font-mono text-xs leading-relaxed wrap-break-word">
          {step.expression}
        </code>
      </div>
      {ruleName && (
        <div className="ml-6 flex flex-wrap items-center gap-2">
          <span className="border-border bg-card text-foreground inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
            {ruleName}
          </span>
          {noteText && (
            <span className="text-muted-foreground text-[11px] leading-snug">
              {noteText}
            </span>
          )}
        </div>
      )}
    </li>
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
