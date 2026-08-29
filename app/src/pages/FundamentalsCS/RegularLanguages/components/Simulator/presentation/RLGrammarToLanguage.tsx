import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useActiveSimulatorTransfer } from "@/hooks/useActiveSimulatorTransfer";
import { enumerateLanguage } from "../domain/rlLanguageOps";
import { parseGrammar } from "../domain/rlGrammarValidation";
import { rlGrammarTransferCodec } from "../domain/rlGrammarTransfer";
import {
  RL_STORAGE_TASK_IDS,
  useRLPersistedSource,
} from "../useRLPersistedSource";
import { RLGrammarInputCard } from "./RLGrammarInputCard";

interface RLGrammarToLanguageProps {
  initialGrammar?: string;
  transferActive?: boolean;
  resetVersion?: number;
}

// Free mode opens blank - the worked grammars live in the Examples tab.
// The input card keeps its placeholder so the notation stays visible.
const EMPTY_SOURCE = "";

// Documents the right-linear grammar notation, mirroring the "Supported
// Formats" panel on the Finite Automata page.
const GRAMMAR_SIMPLE_EXAMPLE = ["S -> 0S | 1A", "A -> 0A | 1"].join("\n");
const GRAMMAR_STRUCTURED_EXAMPLE = [
  "type: grammar",
  "productions:",
  "S -> 0S | 1A",
  "A -> 0A | 1",
].join("\n");

export function RLGrammarToLanguage({
  initialGrammar,
  transferActive = true,
  resetVersion = 0,
}: RLGrammarToLanguageProps) {
  const { t } = useTranslation();
  const [source, setSource] = useState(initialGrammar ?? EMPTY_SOURCE);
  const [maxLen, setMaxLen] = useState(6);
  const [maxWords, setMaxWords] = useState(20);
  const [showFormats, setShowFormats] = useState(false);

  // Adopt a freshly seeded grammar (e.g. when an exercise reveals its solution)
  // without remounting, so the value persists after the store clears it.
  const [seededGrammar, setSeededGrammar] = useState(initialGrammar);
  if (initialGrammar !== undefined && initialGrammar !== seededGrammar) {
    setSeededGrammar(initialGrammar);
    setSource(initialGrammar);
  }

  const [appliedResetVersion, setAppliedResetVersion] = useState(resetVersion);
  if (resetVersion !== appliedResetVersion) {
    setAppliedResetVersion(resetVersion);
    setSource(EMPTY_SOURCE);
  }

  const storageIdentifier = useRLPersistedSource({
    taskStorageId: RL_STORAGE_TASK_IDS.grammarToLanguage,
    codec: rlGrammarTransferCodec,
    source,
    setSource,
    hasSeed: initialGrammar !== undefined,
  });
  useActiveSimulatorTransfer({
    identifier: storageIdentifier,
    value: source,
    codec: rlGrammarTransferCodec,
    enabled: transferActive,
  });

  const result = useMemo(() => {
    const parsed = parseGrammar(source);
    if (!parsed.ok || !parsed.grammar) return { ok: false as const };
    return {
      ok: true as const,
      ...enumerateLanguage(parsed.grammar, { maxLen, maxWords }),
    };
  }, [source, maxLen, maxWords]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        <RLGrammarInputCard
          testId="rl-grammar-to-language-source"
          value={source}
          onChange={setSource}
          titleKey="regular-languages.simulator.grammarInput"
          titleFallback="Grammar"
        >
          {/* Supported grammar formats (mirrors the Language → Grammar panel) */}
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
              {t(
                "finite-automata.grammar.supportedFormats",
                "Supported Formats",
              )}
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
                  {GRAMMAR_SIMPLE_EXAMPLE}
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
                  {GRAMMAR_STRUCTURED_EXAMPLE}
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
        </RLGrammarInputCard>
      </div>

      <div className="bg-card ring-foreground/10 flex flex-col gap-3 rounded-xl p-5 ring-1">
        <h4 className="text-foreground flex items-center gap-2 text-sm font-bold">
          <ArrowRight className="text-primary h-4 w-4" />
          {t(
            "regular-languages.simulator.languageOutput",
            "Enumerated Language",
          )}
        </h4>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-muted-foreground flex flex-col gap-1 text-xs">
            {t("regular-languages.simulator.maxLen", "Max word length")}
            <input
              type="number"
              min={0}
              max={12}
              value={maxLen}
              onChange={(e) =>
                setMaxLen(
                  Math.max(0, Math.min(12, Number(e.target.value) || 0)),
                )
              }
              className="border-input bg-background w-full rounded-md border px-2 py-1 font-mono text-sm"
            />
          </label>
          <label className="text-muted-foreground flex flex-col gap-1 text-xs">
            {t("regular-languages.simulator.maxWords", "Max number of words")}
            <input
              type="number"
              min={1}
              max={200}
              value={maxWords}
              onChange={(e) =>
                setMaxWords(
                  Math.max(1, Math.min(200, Number(e.target.value) || 1)),
                )
              }
              className="border-input bg-background w-full rounded-md border px-2 py-1 font-mono text-sm"
            />
          </label>
        </div>

        {result.ok ? (
          <>
            <div className="bg-muted/40 max-h-72 overflow-y-auto rounded-md p-3 font-mono text-sm leading-relaxed">
              {result.words.length === 0 ? (
                <span className="text-muted-foreground">
                  {t(
                    "regular-languages.simulator.noWords",
                    "No words derivable within the limits.",
                  )}
                </span>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {result.words.map((w) => (
                    <span
                      key={w || "ε"}
                      className="bg-background ring-foreground/10 rounded-md px-2 py-0.5 text-xs ring-1"
                    >
                      {w === "" ? "ε" : w}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <p className="text-muted-foreground text-xs">
              {result.truncated
                ? t(
                    "regular-languages.simulator.truncatedNote",
                    "Output truncated by the word count cap. Increase the limit to see more.",
                  )
                : t(
                    "regular-languages.simulator.completeNote",
                    "All derivable words within the chosen length cap are shown.",
                  )}
            </p>
          </>
        ) : (
          <p className="text-muted-foreground text-sm">
            {t(
              "regular-languages.simulator.grammarInvalid",
              "Enter a valid right-linear grammar.",
            )}
          </p>
        )}
      </div>
    </div>
  );
}
