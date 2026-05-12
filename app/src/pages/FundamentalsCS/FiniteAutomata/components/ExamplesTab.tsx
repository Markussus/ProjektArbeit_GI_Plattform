import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  GitBranch,
  ChevronDown,
  ChevronRight,
  Play,
  BookOpen,
  Zap,
  Book,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ModuleExamplesTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { faExamples, type FAExample } from "./Simulator/config/faExamples";
import type { FAProgram } from "./Simulator/domain/faTypes";
import { useFASimulatorStore } from "../store/faSimulatorStore";

export function ExamplesTab({ onSwitchToSimulation }: ModuleExamplesTabProps) {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const loadExample = useFASimulatorStore((s) => s.loadExample);

  const toggle = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  const handleLoad = useCallback(
    (program: FAProgram, inputWord: string) => {
      loadExample(program, inputWord);
      onSwitchToSimulation();
    },
    [loadExample, onSwitchToSimulation],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card ring-foreground/10 rounded-xl p-6 ring-1">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-foreground text-base font-bold">
              {t("fa.examplesTab.title", "Predefined Examples")}
            </h3>
            <p className="text-muted-foreground mt-0.5 text-sm">
              {t(
                "fa.examplesTab.subtitle",
                "Learn how finite automata work by studying these examples.",
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Example cards */}
      <div className="space-y-3">
        {faExamples.map((example) => (
          <ExampleCard
            key={example.id}
            example={example}
            isExpanded={expandedId === example.id}
            onToggle={() => toggle(example.id)}
            onLoad={handleLoad}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Individual Example Card ────────────────────────────────────────────── */

function ExampleCard({
  example,
  isExpanded,
  onToggle,
  onLoad,
}: {
  example: FAExample;
  isExpanded: boolean;
  onToggle: () => void;
  onLoad: (program: FAProgram, inputWord: string) => void;
}) {
  const { t } = useTranslation();
  const hasBoth = !!example.secondVariant;
  const [variantChoice, setVariantChoice] = useState<"NFA" | "DFA">("NFA");

  const activeProgram =
    hasBoth && variantChoice === "DFA" && example.secondVariant
      ? example.secondVariant.program
      : example.program;
  const activeInputWord =
    hasBoth && variantChoice === "DFA" && example.secondVariant
      ? example.secondVariant.inputWord
      : example.inputWord;

  const typeBadgeClass =
    example.type === "DFA"
      ? "bg-module-blue-bg text-module-blue-fg"
      : "bg-module-purple-bg text-module-purple-fg";

  return (
    <div className="bg-card ring-foreground/10 overflow-hidden rounded-xl ring-1 transition-shadow hover:shadow-md">
      {/* Header row */}
      <button
        type="button"
        onClick={onToggle}
        className="hover:bg-muted/30 flex w-full items-center gap-4 px-5 py-4 text-left transition-colors"
      >
        <div className="bg-muted text-muted-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
          {hasBoth ? (
            <div className="flex items-center gap-0.5">
              <Book className="h-5 w-5 text-orange-500" />
            </div>
          ) : example.type === "NFA" ? (
            <Zap className="h-5 w-5 text-purple-500" />
          ) : (
            <GitBranch className="h-5 w-5 text-blue-500" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-foreground text-sm font-semibold">
            {t(example.titleKey, example.id)}
          </p>
          <div className="mt-1 flex items-center gap-2">
            {hasBoth ? (
              <>
                <span className="bg-module-orange-bg text-module-orange-fg inline-flex rounded-md px-2 py-0.5 text-xs font-bold">
                  {"Grammatik"}
                </span>
                <span className="bg-module-purple-bg text-module-purple-fg inline-flex rounded-md px-2 py-0.5 text-xs font-bold">
                  {"NFA"}
                </span>
                <span className="bg-module-blue-bg text-module-blue-fg inline-flex rounded-md px-2 py-0.5 text-xs font-bold">
                  DFA
                </span>
              </>
            ) : (
              <span
                className={cn(
                  "inline-flex rounded-md px-2 py-0.5 text-xs font-bold",
                  typeBadgeClass,
                )}
              >
                {example.type}
              </span>
            )}
            <span className="text-muted-foreground text-xs">
              Σ = {"{"}
              {example.program.alphabet.join(", ")}
              {"}"}
            </span>
          </div>
        </div>

        {isExpanded ? (
          <ChevronDown className="text-muted-foreground h-4 w-4 shrink-0" />
        ) : (
          <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t px-5 py-4">
          {/* Description */}
          <p className="text-muted-foreground text-sm leading-relaxed">
            {t(example.descriptionKey, "")}
          </p>

          {/* Step-by-step guide */}
          <div className="mt-4">
            <h4 className="text-foreground flex items-center gap-2 text-sm font-bold">
              <BookOpen className="text-primary h-4 w-4" />
              {t("fa.examplesTab.howItWorks", "How it works")}
            </h4>

            <div className="mt-3 space-y-3">
              {example.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="bg-muted/30 relative rounded-lg py-3 pr-4 pl-4"
                >
                  <div className="border-primary/30 absolute top-0 bottom-0 left-0 w-0.75 rounded-full border-l-[3px]" />
                  <h5 className="text-foreground text-sm font-semibold">
                    {t(step.titleKey, `Step ${idx + 1}`)}
                  </h5>
                  <p className="text-muted-foreground mt-1 text-sm leading-relaxed whitespace-pre-line">
                    {t(step.contentKey, "")}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Variant selector (grammar example only) */}
          {hasBoth && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-muted-foreground text-xs font-medium">
                {t("fa.examplesTab.variant", "Variant:")}
              </span>
              <div className="bg-muted flex gap-0.5 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setVariantChoice("NFA")}
                  className={cn(
                    "rounded-md px-3 py-1 text-xs font-bold transition-colors",
                    variantChoice === "NFA"
                      ? "bg-module-purple-bg text-module-purple-fg"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  NFA
                </button>
                <button
                  type="button"
                  onClick={() => setVariantChoice("DFA")}
                  className={cn(
                    "rounded-md px-3 py-1 text-xs font-bold transition-colors",
                    variantChoice === "DFA"
                      ? "bg-module-blue-bg text-module-blue-fg"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  DFA
                </button>
              </div>
            </div>
          )}

          {/* Try it section */}
          <div className="bg-muted/20 mt-4 rounded-lg p-3">
            <p className="text-muted-foreground text-xs font-medium">
              {t("fa.examplesTab.tryIt", "Try it with input:")}{" "}
              <code className="bg-muted text-foreground rounded px-1.5 py-0.5 font-mono text-xs">
                {activeInputWord || "ε"}
              </code>
            </p>
          </div>

          {/* Load button */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onLoad(activeProgram, activeInputWord)}
              className="bg-brand text-brand-foreground inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:opacity-90"
            >
              <Play className="h-4 w-4 fill-current" />
              {t("fa.examplesTab.loadExample", "Load in Simulator")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
