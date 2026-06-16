import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { SimulatorStringTransferBox } from "@/components/shared/SimulatorStringTransferBox";
import { recognizeWord } from "../domain/rlLanguageOps";
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
}

const DEFAULT_SOURCE = ["S -> 0S | 1A", "A -> 0A | 1 | ε"].join("\n");
const DEFAULT_WORD = "001, 010, 1, 00";

interface PerWordResult {
  word: string;
  accepted: boolean;
  reason: string;
}

export function RLWordRecognizer({
  initialGrammar,
  initialWord,
}: RLWordRecognizerProps) {
  const { t } = useTranslation();
  const [source, setSource] = useState(initialGrammar ?? DEFAULT_SOURCE);
  const [word, setWord] = useState(initialWord ?? DEFAULT_WORD);

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

  const storageTransferCodec = useRLPersistedSource({
    taskStorageId: RL_STORAGE_TASK_IDS.recognizeWord,
    codec: rlGrammarTransferCodec,
    source,
    setSource,
    hasSeed: initialGrammar !== undefined,
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
    const results = pieces.map((w): PerWordResult => {
      const outcome = recognizeWord(grammar, w);
      return { word: w, accepted: outcome.accepted, reason: outcome.reason };
    });
    return { ok: true, results };
  }, [source, word]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        <RLGrammarInputCard
          value={source}
          onChange={setSource}
          titleKey="rl.simulator.grammarInput"
          titleFallback="Grammar"
        />
      </div>

      <div className="bg-card ring-foreground/10 flex flex-col gap-3 rounded-xl p-5 ring-1">
        <h4 className="text-foreground flex items-center gap-2 text-sm font-bold">
          {t("rl.simulator.testWord", "Words to Test")}
        </h4>
        <input
          type="text"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder={t(
            "rl.simulator.testWordPlaceholder",
            "Comma-separated words; empty = ε",
          )}
          className="border-input bg-background focus:ring-primary w-full rounded-md border px-3 py-2 font-mono text-sm focus:ring-2 focus:outline-none"
        />
        <p className="text-muted-foreground text-xs">
          {t(
            "rl.simulator.testWordHelp",
            "Separate multiple words with commas. Each character is treated as one terminal symbol; whitespace around commas is ignored.",
          )}
        </p>

        {evaluation.ok ? (
          <ul className="mt-2 flex flex-col gap-1.5">
            {evaluation.results.map((r, idx) => (
              <li
                key={`${r.word}-${idx}`}
                className={cn(
                  "ring-foreground/10 flex items-start gap-2 rounded-md px-3 py-2 text-sm ring-1",
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
                  <span className="text-foreground/70 text-xs">{r.reason}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">
            {t(
              "rl.simulator.grammarInvalid",
              "Enter a valid right-linear grammar to derive a regex.",
            )}
          </p>
        )}
      </div>

      <SimulatorStringTransferBox
        value={source}
        codec={storageTransferCodec}
        onLoad={setSource}
        testIdPrefix="rl-transfer"
        className="lg:col-span-2"
      />
    </div>
  );
}
