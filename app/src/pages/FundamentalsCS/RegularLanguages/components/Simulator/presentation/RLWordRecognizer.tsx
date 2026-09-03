import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/types/i18n";
import { recognizeWords } from "../domain/rlLanguageOps";
import { parseGrammar } from "../domain/rlGrammarValidation";
import { rlGrammarTransferCodec } from "../domain/rlGrammarTransfer";
import {
  RL_STORAGE_TASK_IDS,
  useRLPersistedSource,
} from "../useRLPersistedSource";
import { RLGrammarInputCard } from "./RLGrammarInputCard";

interface RLWordRecognizerProps {
  initialGrammar?: string;
  initialWord?: string;
  transferActive?: boolean;
  resetVersion?: number;
}

// Free mode opens blank - the worked grammar and its test words live in the
// Examples tab. Both fields keep their placeholders.
const EMPTY_SOURCE = "";
const EMPTY_WORD = "";

interface PerWordResult {
  word: string;
  accepted: boolean;
  reasonCode: string;
  states: string;
}

export function RLWordRecognizer({
  initialGrammar,
  initialWord,
  transferActive = true,
  resetVersion = 0,
}: RLWordRecognizerProps) {
  const { t } = useTranslation();
  const [source, setSource] = useState(initialGrammar ?? EMPTY_SOURCE);
  const [word, setWord] = useState(initialWord ?? EMPTY_WORD);

  // Adopt freshly seeded inputs (from an example/exercise) without remounting,
  // so the values persist after the store clears the pending scenario.
  const [seededGrammar, setSeededGrammar] = useState(initialGrammar);
  if (initialGrammar !== undefined && initialGrammar !== seededGrammar) {
    setSeededGrammar(initialGrammar);
    setSource(initialGrammar);
  }
  const [seededWord, setSeededWord] = useState(initialWord);
  if (initialWord !== undefined && initialWord !== seededWord) {
    setSeededWord(initialWord);
    setWord(initialWord);
  }

  const [appliedResetVersion, setAppliedResetVersion] = useState(resetVersion);
  if (resetVersion !== appliedResetVersion) {
    setAppliedResetVersion(resetVersion);
    setSource(EMPTY_SOURCE);
    setWord(EMPTY_WORD);
  }

  useRLPersistedSource({
    taskStorageId: RL_STORAGE_TASK_IDS.recognizeWord,
    codec: rlGrammarTransferCodec,
    source,
    setSource,
    hasSeed: initialGrammar !== undefined,
    transferActive,
  });

  const evaluation = useMemo<
    { ok: false } | { ok: true; results: PerWordResult[] }
  >(() => {
    const parsed = parseGrammar(source);
    if (!parsed.ok || !parsed.grammar) return { ok: false };
    const grammar = parsed.grammar;

    // Treat the input as a comma-separated list of test words. A bare
    // empty piece represents ε (the empty word).
    const pieces = word.split(",").map((w) => w.trim());
    const results = recognizeWords(grammar, pieces).map(
      (outcome, index): PerWordResult => ({
        word: pieces[index],
        accepted: outcome.accepted,
        reasonCode: outcome.reasonCode,
        states: outcome.states,
      }),
    );
    return { ok: true, results };
  }, [source, word]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        <RLGrammarInputCard
          testId="rl-word-recognizer-source"
          value={source}
          onChange={setSource}
          titleKey="regular-languages.simulator.grammarInput"
          titleFallback="Grammar"
        />
      </div>

      <div className="border-border bg-card flex flex-col gap-3 rounded-xl border p-5">
        <h4 className="text-foreground flex items-center gap-2 text-sm font-bold">
          {t("regular-languages.simulator.testWord", "Words to Test")}
        </h4>
        <input
          type="text"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder={t(
            "regular-languages.simulator.testWordPlaceholder",
            "Comma-separated words; empty = ε",
          )}
          className="border-input bg-background focus:ring-primary w-full rounded-md border px-3 py-2 font-mono text-sm focus:ring-2 focus:outline-none"
        />
        <p className="text-muted-foreground text-xs">
          {t(
            "regular-languages.simulator.testWordHelp",
            "Separate multiple words with commas. Each character is treated as one terminal symbol; whitespace around commas is ignored.",
          )}
        </p>

        {evaluation.ok ? (
          <ul className="mt-2 flex flex-col gap-1.5">
            {evaluation.results.map((r, idx) => (
              <li
                key={`${r.word}-${idx}`}
                className={cn(
                  "border-border flex items-start gap-2 rounded-md border px-3 py-2 text-sm",
                  r.accepted
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "bg-rose-500/10 text-rose-700 dark:text-rose-400",
                )}
              >
                {r.accepted ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                )}
                <div className="flex flex-col">
                  <span className="font-mono text-sm font-semibold">
                    {r.word === "" ? "ε" : r.word}
                  </span>
                  <span className="text-foreground/70 text-xs">
                    {t(
                      `regular-languages.simulator.reason.${r.reasonCode}` as TranslationKey,
                      { states: r.states },
                    )}
                  </span>
                </div>
              </li>
            ))}
          </ul>
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
