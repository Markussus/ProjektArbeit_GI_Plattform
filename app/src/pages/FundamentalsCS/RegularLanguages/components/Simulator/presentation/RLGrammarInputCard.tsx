import { useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle } from "lucide-react";
import { formatGrammarIssue } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faGrammarParsing";
import { parseGrammar } from "../domain/rlGrammarValidation";

interface RLGrammarInputCardProps {
  value: string;
  onChange: (value: string) => void;
  titleKey?: string;
  titleFallback?: string;
  testId?: string;
  /** Optional extra content rendered inside the card, e.g. a formats panel. */
  children?: ReactNode;
}

const DEFAULT_PLACEHOLDER = ["S -> 0S | 1A", "A -> 0A | 1 | ε"].join("\n");

export function RLGrammarInputCard({
  value,
  onChange,
  titleKey,
  titleFallback,
  testId,
  children,
}: RLGrammarInputCardProps) {
  const { t } = useTranslation();
  // Re-parse only when the text changes, not on every parent re-render.
  const parsed = useMemo(() => parseGrammar(value), [value]);

  const errorText = parsed.issue
    ? formatGrammarIssue(t, parsed.issue, parsed.error ?? "")
    : parsed.validationCodes
        .map((code) => t(`fa.grammar.${code}`, code))
        .join(", ");

  return (
    <div className="bg-card ring-foreground/10 flex flex-col gap-3 rounded-xl p-5 ring-1">
      <h4 className="text-foreground flex items-center gap-2 text-sm font-bold">
        {t(titleKey ?? "rl.simulator.grammarInput", titleFallback ?? "Grammar")}
      </h4>
      <textarea
        data-testid={testId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        placeholder={DEFAULT_PLACEHOLDER}
        className="border-input bg-background focus:ring-primary min-h-[140px] w-full rounded-md border px-3 py-2 font-mono text-sm focus:ring-2 focus:outline-none"
      />
      <p className="text-muted-foreground text-xs leading-relaxed">
        {t(
          "rl.simulator.grammarHelp",
          "One production per line. Format: 'S -> 0S | 1A'. Use ε (or the word 'epsilon') for the empty word.",
        )}
      </p>
      {errorText && value.trim().length > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{errorText}</span>
        </div>
      )}
      {children}
    </div>
  );
}
