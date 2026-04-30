import type { TFunction } from "i18next";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { DnfParseIssue, DnfParseIssueCode } from "../domain/dnfParser";

const parseIssueKeyByCode: Record<DnfParseIssueCode, string> = {
  empty_expression: "dnf.builder.errors.emptyExpression",
  unexpected_character: "dnf.builder.errors.unexpectedCharacter",
  unexpected_token: "dnf.builder.errors.unexpectedToken",
  unexpected_end: "dnf.builder.errors.unexpectedEnd",
  missing_closing_parenthesis: "dnf.builder.errors.missingClosingParenthesis",
};

export function VariableLimitPanel({
  variableCount,
  maxVariableCount,
}: {
  variableCount: number;
  maxVariableCount: number;
}) {
  const { t } = useTranslation();

  return (
    <section className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-800 dark:text-amber-300">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0" />
        <div>
          <h2 className="text-lg font-semibold">
            {t("dnf.builder.variableLimitTitle")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed">
            {t("dnf.builder.variableLimitDesc", {
              variables: variableCount,
              max: maxVariableCount,
            })}
          </p>
        </div>
      </div>
    </section>
  );
}

export function ParseErrorPanel({ issue }: { issue: DnfParseIssue }) {
  const { t } = useTranslation();

  return (
    <section className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0" />
        <div>
          <h2 className="text-lg font-semibold">
            {t("dnf.builder.errors.title")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed">
            {translateParseIssue(t, issue)}
          </p>
        </div>
      </div>
    </section>
  );
}

function translateParseIssue(t: TFunction, issue: DnfParseIssue): string {
  return t(
    parseIssueKeyByCode[issue.code] as never,
    {
      index: issue.index + 1,
      value: issue.value ?? "",
    } as never,
  ) as unknown as string;
}
