import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Info, ChevronDown, AlertCircle, Sparkles } from "lucide-react";
import type { FAProgram } from "../domain/faTypes";
import {
  describeSpec,
  generateWithInfo,
  parseGeneratorDSL,
  type GeneratorSpec,
} from "../domain/faGenerator";

interface FAGeneratorInputProps {
  onConvert: (program: FAProgram, suggestedInputWord?: string) => void;
}

/* ──────────────────────────────────────────────────────────
   Static content: mode cards + quick examples
   ────────────────────────────────────────────────────────── */

interface ModeCard {
  id: "regex" | "modulo" | "grammar";
  titleKey: string;
  titleFallback: string;
  blurbKey: string;
  blurbFallback: string;
  example: string;
}

const MODE_CARDS: ModeCard[] = [
  {
    id: "regex",
    titleKey: "fa.generator.mode.regex.title",
    titleFallback: "Regex",
    blurbKey: "fa.generator.mode.regex.blurb",
    blurbFallback: "Describe strings with a pattern.",
    example: ["type: regex", "value: (0|1)*00", "output: dfa", "input: 10100"].join("\n"),
  },
  {
    id: "modulo",
    titleKey: "fa.generator.mode.modulo.title",
    titleFallback: "Modulo",
    blurbKey: "fa.generator.mode.modulo.blurb",
    blurbFallback:
      "Numeric languages. States represent remainders modulo a divisor.",
    example: [
      "type: modulo",
      "alphabet: {0,1}",
      "divisor: 4",
      "remainder: 0",
      "input: 1100",
    ].join("\n"),
  },
  {
    id: "grammar",
    titleKey: "fa.generator.mode.grammar.title",
    titleFallback: "Grammar",
    blurbKey: "fa.generator.mode.grammar.blurb",
    blurbFallback:
      "Right-linear productions like S → 0S | 1A. First LHS is the start symbol.",
    example: [
      "type: grammar",
      "productions:",
      "S -> 0S | 1A",
      "A -> 0A | 1",
      "input: 010",
    ].join("\n"),
  },
];

interface QuickExample {
  labelKey: string;
  labelFallback: string;
  body: string;
}

const QUICK_EXAMPLES: QuickExample[] = [
  {
    labelKey: "fa.generator.quick.endsWith00",
    labelFallback: 'Strings ending with "00"',
    body: ["type: regex", "value: (0|1)*00", "output: dfa", "input: 1100"].join("\n"),
  },
  {
    labelKey: "fa.generator.quick.divBy3",
    labelFallback: "Binary divisible by 3",
    body: [
      "type: modulo",
      "alphabet: {0,1}",
      "divisor: 3",
      "remainder: 0",
      "input: 110",
    ].join("\n"),
  },
  {
    labelKey: "fa.generator.quick.divBy4",
    labelFallback: "Binary divisible by 4",
    body: [
      "type: modulo",
      "alphabet: {0,1}",
      "divisor: 4",
      "remainder: 0",
      "input: 100",
    ].join("\n"),
  },
  {
    labelKey: "fa.generator.quick.containsAB",
    labelFallback: 'Strings containing "ab"',
    body: ["type: regex", "value: (a|b)*ab(a|b)*", "output: dfa", "input: baba"].join("\n"),
  },
];

const DEFAULT_DSL = MODE_CARDS[0].example;

/* ──────────────────────────────────────────────────────────
   Live preview: speculatively parse the DSL without throwing
   ────────────────────────────────────────────────────────── */

function safeParse(
  source: string,
): { ok: true; spec: GeneratorSpec } | { ok: false; error: string } {
  try {
    return { ok: true, spec: parseGeneratorDSL(source) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/* ──────────────────────────────────────────────────────────
   Component
   ────────────────────────────────────────────────────────── */

export function FAGeneratorInput({ onConvert }: FAGeneratorInputProps) {
  const { t } = useTranslation();
  const [source, setSource] = useState(DEFAULT_DSL);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [autoGenerate, setAutoGenerate] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const preview = useMemo(() => safeParse(source), [source]);

  // Refs for debounced auto-generate so we don't fire on every keystroke
  const debounceRef = useRef<number | null>(null);
  useEffect(() => {
    if (!autoGenerate) return;
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => {
      if (preview.ok) {
        try {
          const { program, suggestedWord } = generateWithInfo(preview.spec);
          setSubmitError(null);
          onConvert(program, suggestedWord ?? undefined);
        } catch (e) {
          setSubmitError(e instanceof Error ? e.message : String(e));
        }
      }
    }, 400);
    return () => {
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [source, autoGenerate, preview, onConvert]);

  const handleGenerate = () => {
    if (!preview.ok) {
      setSubmitError(preview.error);
      return;
    }
    try {
      const { program, suggestedWord } = generateWithInfo(preview.spec);
      setSubmitError(null);
      onConvert(program, suggestedWord ?? undefined);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : String(e));
    }
  };

  const loadExample = (body: string) => {
    setSource(body);
    setSubmitError(null);
  };

  const inputClass =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:outline-none";

  const liveDescription = preview.ok ? describeSpec(preview.spec) : null;

  return (
    <div className="flex flex-col gap-5">
      {/* Title + info tooltip */}
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold">
            {t("fa.generator.title", "Generator")}
          </h3>
          <span
            className="text-muted-foreground inline-flex cursor-help"
            title={t(
              "fa.generator.tooltip",
              "Describe a language and automatically build an automaton.",
            )}
          >
            <Info className="h-4 w-4" />
          </span>
        </div>
        <p className="text-muted-foreground mt-1 text-xs">
          {t(
            "fa.generator.intro",
            "Turn a language description (regex, modulo, grammar) into an NFA/DFA. Pick a mode, edit the DSL, then generate.",
          )}
        </p>
      </div>

      {/* Section B: mode cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {MODE_CARDS.map((card) => (
          <div
            key={card.id}
            className="bg-muted/40 flex flex-col gap-2 rounded-lg border p-3"
          >
            <div className="text-sm font-semibold tracking-wide uppercase">
              {t(card.titleKey, card.titleFallback)}
            </div>
            <p className="text-muted-foreground text-xs">
              {t(card.blurbKey, card.blurbFallback)}
            </p>
            <pre className="bg-background text-foreground/90 overflow-x-auto rounded border px-2 py-1.5 text-[11px] leading-tight">
              {card.example}
            </pre>
            <button
              type="button"
              onClick={() => loadExample(card.example)}
              className="bg-primary/10 text-primary hover:bg-primary/20 mt-auto self-start rounded-md px-3 py-1 text-xs font-semibold"
            >
              {t("fa.generator.tryThis", "Try this")}
            </button>
          </div>
        ))}
      </div>

      {/* Quick examples */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">
          {t("fa.generator.quick.label", "Quick examples")}
        </span>
        <div className="flex flex-wrap gap-2">
          {QUICK_EXAMPLES.map((q) => (
            <button
              key={q.labelKey}
              type="button"
              onClick={() => loadExample(q.body)}
              className="bg-muted hover:bg-muted/80 rounded-md px-3 py-1.5 text-xs font-medium"
            >
              {t(q.labelKey, q.labelFallback)}
            </button>
          ))}
        </div>
      </div>

      {/* DSL input */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="fa-generator-dsl">
          {t("fa.generator.dsl", "DSL input")}
        </label>
        <textarea
          id="fa-generator-dsl"
          value={source}
          onChange={(e) => {
            setSource(e.target.value);
            setSubmitError(null);
          }}
          className={`${inputClass} min-h-[160px] font-mono`}
          spellCheck={false}
        />
      </div>

      {/* Collapsible supported formats */}
      <details
        open={helpOpen}
        onToggle={(e) => setHelpOpen((e.target as HTMLDetailsElement).open)}
        className="bg-muted/30 rounded-md border"
      >
        <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm font-medium select-none">
          <ChevronDown
            className={`h-4 w-4 transition-transform ${helpOpen ? "" : "-rotate-90"}`}
          />
          {t("fa.generator.help.title", "Supported formats")}
        </summary>
        <div className="px-3 pb-3">
          <pre className="bg-background/60 text-foreground/90 overflow-x-auto rounded border px-3 py-2 text-[11px] leading-relaxed">
            {`type: regex
  value:   regular expression         # supports ( ) | * + ? \\ ε
  output:  dfa | nfa                  # default: dfa
  input:   test string                # optional: word to test in simulator

type: modulo
  alphabet:  {0,1}                    # digit symbols, low to high
  divisor:   positive integer
  remainder: integer in [0, divisor)  # default: 0
  input:     test string              # optional: word to test in simulator

type: grammar
  productions:                        # right-linear only
    S -> 0S | 1A
    A -> 0A | 1`}
          </pre>
        </div>
      </details>

      {/* Live explanation */}
      <div className="bg-muted/40 flex items-start gap-2 rounded-md border px-3 py-2 text-sm">
        <Sparkles className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
        <div>
          <div className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            {t("fa.generator.liveLabel", "Detected language")}
          </div>
          <div className={preview.ok ? "" : "text-muted-foreground italic"}>
            {liveDescription ??
              t(
                "fa.generator.liveHint",
                "Keep typing — the DSL isn't complete yet.",
              )}
          </div>
        </div>
      </div>

      {/* Inline parse error (as-you-type) */}
      {!preview.ok && source.trim().length > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div>
            <div className="text-xs font-semibold tracking-wide uppercase">
              {t("fa.generator.parseHint", "DSL not parseable yet")}
            </div>
            <div className="font-mono text-xs">{preview.error}</div>
          </div>
        </div>
      )}

      {/* Hard submit error (only after clicking Generate and something else failed) */}
      {submitError && (
        <div className="bg-destructive/10 text-destructive flex items-start gap-2 rounded-md border border-current/30 px-3 py-2 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div>
            <div className="text-xs font-semibold tracking-wide uppercase">
              {t("fa.generator.error", "Could not generate")}
            </div>
            <div className="font-mono text-xs">{submitError}</div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleGenerate}
          disabled={!preview.ok}
          className="bg-brand text-brand-foreground rounded-md px-4 py-2 font-semibold hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t("fa.generator.generate", "Generate Automaton")}
        </button>

        <label className="text-muted-foreground inline-flex cursor-pointer items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={autoGenerate}
            onChange={(e) => setAutoGenerate(e.target.checked)}
          />
          {t("fa.generator.auto", "Auto-generate on change")}
        </label>
      </div>
    </div>
  );
}
