import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, ChevronDown } from "lucide-react";
import type { FAProgram } from "../domain/faTypes";
import {
  grammarToAutomaton,
  validateRegularGrammar,
} from "../domain/faGrammarConversion";
import {
  formatGrammarIssue,
  parseGrammarSource,
  type ParseGrammarResult,
} from "../domain/faGrammarParsing";

interface FAGrammarInputProps {
  onConvert: (program: FAProgram) => void;
}

const SIMPLE_EXAMPLE = ["S -> 0S | 1A", "A -> 0A | 1"].join("\n");

const STRUCTURED_EXAMPLE = [
  "type: grammar",
  "productions:",
  "S -> 0S | 1A",
  "A -> 0A | 1",
].join("\n");

const DEFAULT_GRAMMAR_SOURCE = SIMPLE_EXAMPLE;

export function FAGrammarInput({ onConvert }: FAGrammarInputProps) {
  const { t } = useTranslation();
  const [source, setSource] = useState(DEFAULT_GRAMMAR_SOURCE);
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);
  const [helpOpen, setHelpOpen] = useState(false);

  const parsed: ParseGrammarResult = useMemo(
    () => parseGrammarSource(source),
    [source],
  );

  const parseErrorText = parsed.ok
    ? null
    : formatGrammarIssue(t, parsed.issue, parsed.error);

  const handleConvert = () => {
    if (!parsed.ok) {
      setSubmitErrors([formatGrammarIssue(t, parsed.issue, parsed.error)]);
      return;
    }
    const validationErrors = validateRegularGrammar(parsed.grammar);
    if (validationErrors.length > 0) {
      setSubmitErrors(
        validationErrors.map((code) =>
          t(`finite-automata.grammar.${code}`, code),
        ),
      );
      return;
    }
    setSubmitErrors([]);
    onConvert(grammarToAutomaton(parsed.grammar));
  };

  const handleLoadExample = () => {
    setSource(SIMPLE_EXAMPLE);
    setSubmitErrors([]);
  };

  const inputClass =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:outline-none";

  const detectedFormatLabel = parsed.format
    ? t(`finite-automata.grammar.format.${parsed.format}`, parsed.format)
    : null;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-bold">
          {t("finite-automata.grammar.title", "Regular Grammar → Automaton")}
        </h3>
        <p className="text-muted-foreground mt-1 text-xs">
          {t(
            "finite-automata.grammar.intro",
            "Enter a right-linear grammar. The first non-terminal on the left becomes the start symbol; non-terminals and terminals are inferred from your productions.",
          )}
        </p>
      </div>

      {submitErrors.length > 0 && (
        <div className="bg-destructive/10 text-destructive flex items-start gap-2 rounded-md border border-current/30 px-3 py-2 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div className="whitespace-pre-line">{submitErrors.join("\n")}</div>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <label
            className="text-sm font-medium"
            htmlFor="fa-grammar-productions"
          >
            {t("finite-automata.grammar.productions", "Grammar")}
          </label>
          {detectedFormatLabel && (
            <span className="text-muted-foreground text-xs">
              {t("finite-automata.grammar.detectedFormat", "Detected format")}:{" "}
              <span className="text-foreground font-medium">
                {detectedFormatLabel}
              </span>
            </span>
          )}
        </div>
        <textarea
          id="fa-grammar-productions"
          value={source}
          onChange={(e) => {
            setSource(e.target.value);
            setSubmitErrors([]);
          }}
          className={`${inputClass} min-h-[180px] font-mono`}
          spellCheck={false}
          placeholder={SIMPLE_EXAMPLE}
        />
        <p className="text-muted-foreground text-xs">
          {t(
            "finite-automata.grammar.productionsHint",
            "One production per line. Two formats are supported (auto-detected).",
          )}
        </p>
      </div>

      {!parsed.ok && source.trim().length > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div>
            <div className="text-xs font-semibold tracking-wide uppercase">
              {t(
                "finite-automata.grammar.parseError",
                "Grammar not parseable yet",
              )}
            </div>
            <div className="text-xs">{parseErrorText}</div>
          </div>
        </div>
      )}

      <details
        open={helpOpen}
        onToggle={(e) => setHelpOpen((e.target as HTMLDetailsElement).open)}
        className="bg-muted/30 rounded-md border"
      >
        <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm font-medium select-none">
          <ChevronDown
            className={`h-4 w-4 transition-transform ${helpOpen ? "" : "-rotate-90"}`}
          />
          {t("finite-automata.grammar.supportedFormats", "Supported Formats")}
        </summary>
        <div className="flex flex-col gap-3 px-3 pb-3">
          <div>
            <div className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
              {t(
                "finite-automata.grammar.format1Label",
                "Format 1 — simplified",
              )}
            </div>
            <pre className="bg-background/60 text-foreground/90 overflow-x-auto rounded border px-3 py-2 font-mono text-[12px] leading-relaxed">
              {SIMPLE_EXAMPLE}
            </pre>
          </div>
          <div>
            <div className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
              {t(
                "finite-automata.grammar.format2Label",
                "Format 2 — structured",
              )}
            </div>
            <pre className="bg-background/60 text-foreground/90 overflow-x-auto rounded border px-3 py-2 font-mono text-[12px] leading-relaxed">
              {STRUCTURED_EXAMPLE}
            </pre>
          </div>
          <p className="text-muted-foreground text-xs">
            {t(
              "finite-automata.grammar.epsilonHint",
              "To insert the empty string symbol (ε), you can either copy and paste it or type the word 'epsilon'.",
            )}
          </p>
        </div>
      </details>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleConvert}
          disabled={!parsed.ok}
          className="bg-brand text-brand-foreground rounded-md px-4 py-2 font-semibold hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t("finite-automata.grammar.convert", "Convert to Automaton")}
        </button>
        <button
          type="button"
          onClick={handleLoadExample}
          className="bg-muted hover:bg-muted/80 rounded-md px-3 py-2 text-sm font-medium"
        >
          {t("finite-automata.grammar.loadExample", "Load Example")}
        </button>
      </div>
    </div>
  );
}
