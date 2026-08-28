import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, ArrowRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useActiveSimulatorTransfer } from "@/hooks/useActiveSimulatorTransfer";
import {
  formatLanguageIssue,
  parseLanguageSpec,
  type LanguageParseIssue,
  type LanguageSpec,
} from "../domain/rlLanguageSpecParser";
import {
  formatGrammar,
  minimizeRightLinearGrammar,
  setBuilderToRightLinearGrammar,
} from "../domain/rlRegexToGrammar";
import {
  languageToGrammar,
  languageToGrammarMinimal,
} from "../domain/rlLanguageOps";
import { rlLanguageTransferCodec } from "../domain/rlLanguageTransfer";
import {
  RL_STORAGE_TASK_IDS,
  useRLPersistedSource,
} from "../useRLPersistedSource";
import { useRLSimulatorStore } from "../../../store/rlSimulatorStore";

interface RLLanguageToGrammarProps {
  initialSource?: string;
  transferActive?: boolean;
  resetVersion?: number;
}

// Kept short enough to sit on one line in the textarea; three words are still
// enough for the parser to infer the pattern 0ⁿ 1 0ᵐ from the trailing "..".
const DEFAULT_SOURCE = 'L = {"010", "0010", "00100", ..}';

// Documents the language definition syntax in the "Supported Formats" panel.
const LANGUAGE_ENUMERATION_EXAMPLE = 'L = {"010", "0010", "00100", ..}';
const LANGUAGE_SETBUILDER_EXAMPLE = "L = {a^n c b^m | n, m > 0}";

type ConversionResult =
  | { ok: false; error: string; issue: LanguageParseIssue }
  | {
      ok: true;
      spec: LanguageSpec;
      nonTerminals: string[];
      terminals: string[];
      startSymbol: string;
      grammarText: string;
    };

export function RLLanguageToGrammar({
  initialSource,
  transferActive = true,
  resetVersion = 0,
}: RLLanguageToGrammarProps) {
  const { t } = useTranslation();
  const [source, setSource] = useState(initialSource ?? DEFAULT_SOURCE);
  const [showFormats, setShowFormats] = useState(false);
  // Detailed = one non-terminal per prefix; Simplified = minimal merged grammar.
  const [simplified, setSimplified] = useState(false);

  // Adopt a freshly seeded language (e.g. when an exercise reveals its
  // solution) without remounting, so it persists after the store clears it.
  const [seededSource, setSeededSource] = useState(initialSource);
  if (initialSource !== undefined && initialSource !== seededSource) {
    setSeededSource(initialSource);
    setSource(initialSource);
  }

  const [appliedResetVersion, setAppliedResetVersion] = useState(resetVersion);
  if (resetVersion !== appliedResetVersion) {
    setAppliedResetVersion(resetVersion);
    setSource(DEFAULT_SOURCE);
  }

  const storageIdentifier = useRLPersistedSource({
    taskStorageId: RL_STORAGE_TASK_IDS.languageToGrammar,
    codec: rlLanguageTransferCodec,
    source,
    setSource,
    hasSeed: initialSource !== undefined,
  });
  useActiveSimulatorTransfer({
    identifier: storageIdentifier,
    value: source,
    codec: rlLanguageTransferCodec,
    enabled: transferActive,
  });

  // Publish the current language so the lifted exercise "Check solution" action
  // can validate it; clear it when this mode unmounts.
  const setStudentLanguageSource = useRLSimulatorStore(
    (s) => s.setStudentLanguageSource,
  );
  useEffect(() => {
    setStudentLanguageSource(source);
    return () => setStudentLanguageSource(null);
  }, [source, setStudentLanguageSource]);

  const result: ConversionResult = useMemo(() => {
    const parsed = parseLanguageSpec(source);
    if (!parsed.ok) {
      return { ok: false, error: parsed.error, issue: parsed.issue };
    }
    if (parsed.spec.kind === "setBuilder") {
      // Both views stay right-linear. Simplified merges non-terminals that
      // derive the same words; when there is nothing to merge it is the very
      // same grammar as Detailed.
      const detailed = setBuilderToRightLinearGrammar(parsed.spec);
      const grammar = simplified
        ? minimizeRightLinearGrammar(detailed)
        : detailed;
      return {
        ok: true,
        spec: parsed.spec,
        nonTerminals: grammar.nonTerminals,
        terminals: grammar.terminals,
        startSymbol: grammar.startSymbol,
        grammarText: formatGrammar(grammar),
      };
    }
    // Enumeration: build a prefix-tree grammar. If the user wrote a `..`
    // continuation marker, the parser will already have promoted the
    // enumeration to a set-builder above, so this only fires for finite
    // languages. The Simplified mode merges equivalent suffixes into a minimal,
    // human-readable grammar instead.
    const grammar = simplified
      ? languageToGrammarMinimal(parsed.spec.words)
      : languageToGrammar(parsed.spec.words);
    return {
      ok: true,
      spec: parsed.spec,
      nonTerminals: grammar.nonTerminals,
      terminals: grammar.terminals,
      startSymbol: grammar.startSymbol,
      grammarText: formatGrammar(grammar),
    };
  }, [source, simplified]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        <div className="bg-card ring-foreground/10 flex flex-col gap-3 rounded-xl p-5 ring-1">
          <h4 className="text-foreground flex items-center gap-2 text-sm font-bold">
            {t("regular-languages.simulator.languageDefinition", "Language Definition")}
          </h4>

          <textarea
            data-testid="rl-language-to-grammar-source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            spellCheck={false}
            placeholder={DEFAULT_SOURCE}
            className="border-input bg-background focus:ring-primary min-h-[120px] w-full rounded-md border px-3 py-2 font-mono text-sm focus:ring-2 focus:outline-none"
          />

          {/* Supported language definition formats (mirrors the FA grammar panel) */}
          <details
            open={showFormats}
            onToggle={(e) =>
              setShowFormats((e.target as HTMLDetailsElement).open)
            }
            className="bg-muted/30 rounded-md border"
          >
            <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm font-medium select-none">
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  !showFormats && "-rotate-90",
                )}
              />
              {t("regular-languages.simulator.supportedFormats", "Supported formats")}
            </summary>
            <div className="flex flex-col gap-3 px-3 pb-3">
              <div>
                <div className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
                  {t(
                    "regular-languages.simulator.supportedFormatsExtensional",
                    "Extensional / Set Format:",
                  )}
                </div>
                <pre className="bg-background/60 text-foreground/90 overflow-x-auto rounded border px-3 py-2 font-mono text-[12px] leading-relaxed">
                  {LANGUAGE_ENUMERATION_EXAMPLE}
                </pre>
              </div>
              <div>
                <div className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
                  {t(
                    "regular-languages.simulator.supportedFormatsIntensional",
                    "Intensional / Formal Format:",
                  )}
                </div>
                <pre className="bg-background/60 text-foreground/90 overflow-x-auto rounded border px-3 py-2 font-mono text-[12px] leading-relaxed">
                  {LANGUAGE_SETBUILDER_EXAMPLE}
                </pre>
              </div>
            </div>
          </details>

          {!result.ok && source.trim().length > 0 && (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{formatLanguageIssue(t, result.issue, result.error)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-card ring-foreground/10 flex flex-col gap-3 rounded-xl p-5 ring-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-foreground flex items-center gap-2 text-sm font-bold">
            <ArrowRight className="text-primary h-4 w-4" />
            {t("regular-languages.simulator.grammarOutput", "Resulting Grammar")}
          </h4>
          <div
            className="bg-muted/60 inline-flex rounded-lg p-0.5"
            role="group"
            aria-label={t("regular-languages.simulator.grammarMode.label", "Grammar style")}
          >
            <button
              type="button"
              onClick={() => setSimplified(false)}
              aria-pressed={!simplified}
              data-testid="rl-grammar-mode-detailed"
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                !simplified
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t("regular-languages.simulator.grammarMode.detailed", "Detailed")}
            </button>
            <button
              type="button"
              onClick={() => setSimplified(true)}
              aria-pressed={simplified}
              data-testid="rl-grammar-mode-simplified"
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                simplified
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t("regular-languages.simulator.grammarMode.simplified", "Simplified")}
            </button>
          </div>
        </div>
        {result.ok ? (
          <>
            <pre className="bg-muted/40 text-foreground/90 overflow-x-auto rounded-md p-3 font-mono text-sm leading-relaxed whitespace-pre">
              {result.grammarText || "—"}
            </pre>
            <div className="text-muted-foreground space-y-1 text-xs">
              <div>
                <span className="text-foreground font-semibold">N:</span>{" "}
                {`{${result.nonTerminals.join(", ")}}`}
              </div>
              <div>
                <span className="text-foreground font-semibold">Σ:</span>{" "}
                {`{${result.terminals.join(", ")}}`}
              </div>
              <div>
                <span className="text-foreground font-semibold">S:</span>{" "}
                {result.startSymbol}
              </div>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground text-sm">
            {t(
              "regular-languages.simulator.languageInvalid",
              "Enter a valid language definition to derive a grammar.",
            )}
          </p>
        )}
      </div>
    </div>
  );
}
