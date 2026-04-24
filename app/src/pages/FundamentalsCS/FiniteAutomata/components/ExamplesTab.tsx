import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  GitBranch,
  ChevronDown,
  ChevronRight,
  Play,
  Plus,
  BookOpen,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ModuleExamplesTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import {
  faExamples,
  emptyFAProgram,
  type FAExample,
} from "./Simulator/config/faExamples";
import type { FAProgram } from "./Simulator/domain/faTypes";
import { useFAExampleStore } from "../store/faExampleStore";

export function ExamplesTab({ onSwitchToSimulation }: ModuleExamplesTabProps) {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const loadExample = useFAExampleStore((s) => s.loadExample);

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

      {/* Build from scratch card */}
      <div className="bg-card ring-foreground/10 overflow-hidden rounded-xl ring-1">
        <div className="from-primary/5 border-b bg-gradient-to-r to-transparent px-5 py-3">
          <h3 className="text-foreground flex items-center gap-2 text-sm font-bold">
            <Plus className="h-4 w-4" />
            {t("fa.buildFromScratch.title", "Build Your Own Automaton")}
          </h3>
        </div>
        <div className="px-5 py-4">
          <p className="text-muted-foreground text-sm">
            {t(
              "fa.buildFromScratch.description",
              "Start with a blank canvas and create your own DFA or NFA from scratch.",
            )}
          </p>
          <p className="text-muted-foreground mt-2 text-xs italic">
            {t(
              "fa.buildFromScratch.hint",
              "You can switch between DFA and NFA mode at any time in the editor.",
            )}
          </p>
          <button
            type="button"
            onClick={() => handleLoad(emptyFAProgram, "")}
            className="bg-primary text-primary-foreground hover:bg-primary/90 mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all"
          >
            <Plus className="h-4 w-4" />
            {t("fa.buildFromScratch.button", "Start Empty")}
          </button>
        </div>
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
          {example.type === "NFA" ? (
            <Zap className="h-5 w-5" />
          ) : (
            <GitBranch className="h-5 w-5" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-foreground text-sm font-semibold">
            {t(example.titleKey, example.id)}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={cn(
                "inline-flex rounded-md px-2 py-0.5 text-xs font-bold",
                typeBadgeClass,
              )}
            >
              {example.type}
            </span>
            <span className="text-muted-foreground text-xs">
              {example.program.states.length}{" "}
              {t("fa.config.states", "states").toLowerCase().split(" ")[0]} · Σ
              = {"{"}
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
                  <div className="border-primary/30 absolute top-0 bottom-0 left-0 w-[3px] rounded-full border-l-[3px]" />
                  <h5 className="text-foreground text-sm font-semibold">
                    {t(step.titleKey, `Step ${idx + 1}`)}
                  </h5>
                  <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                    {t(step.contentKey, "")}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Try it section */}
          <div className="bg-muted/20 mt-4 rounded-lg p-3">
            <p className="text-muted-foreground text-xs font-medium">
              {t("fa.examplesTab.tryIt", "Try it with input:")}{" "}
              <code className="bg-muted text-foreground rounded px-1.5 py-0.5 font-mono text-xs">
                {example.inputWord || "ε"}
              </code>
            </p>
          </div>

          {/* Load button */}
          <button
            type="button"
            onClick={() => onLoad(example.program, example.inputWord)}
            className="bg-brand text-brand-foreground mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:opacity-90"
          >
            <Play className="h-4 w-4 fill-current" />
            {t("fa.examplesTab.loadExample", "Load in Simulator")}
          </button>
        </div>
      )}
    </div>
  );
}
