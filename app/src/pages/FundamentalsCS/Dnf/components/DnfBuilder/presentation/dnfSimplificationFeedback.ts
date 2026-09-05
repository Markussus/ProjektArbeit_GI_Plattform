import type { TFunction } from "i18next";
import { CheckCircle2, Lightbulb, type LucideIcon } from "lucide-react";
import type { DnfSimplificationCheckResult } from "../domain/dnfSimplificationCheck";

export interface SimplificationStatusTone {
  containerClass: string;
  titleClass: string;
  iconClass: string;
  Icon: LucideIcon;
}

export function buildSimplificationDetail(
  feedback: DnfSimplificationCheckResult,
  t: TFunction,
): string {
  switch (feedback.status) {
    case "empty":
    case "syntax_error":
    case "not_equivalent":
      return t(`dnf.builder.exercise.simplificationDetail.${feedback.status}`);
    case "unknown_variable":
      return t("dnf.builder.exercise.simplificationDetail.unknown_variable", {
        variables: feedback.unknownVariables.join(", "),
      });
    case "equivalent_not_shorter":
      return t(
        "dnf.builder.exercise.simplificationDetail.equivalent_not_shorter",
        {
          userLiterals: feedback.userLiteralCount ?? 0,
          canonicalLiterals: feedback.canonicalLiteralCount,
        },
      );
    case "accepted_not_minimal":
    case "accepted_minimal":
      return t(`dnf.builder.exercise.simplificationDetail.${feedback.status}`, {
        userLiterals: feedback.userLiteralCount ?? 0,
        minimumLiterals: feedback.acceptedMinimumLiteralCount,
      });
  }
}

export function getSimplificationStatusTone(
  status: DnfSimplificationCheckResult["status"] | undefined,
): SimplificationStatusTone {
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
