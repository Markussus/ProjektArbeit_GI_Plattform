import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { BookOpen, ChevronDown, ChevronRight, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ModuleExamplesTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import type { Example } from "@/types/exercise";
import type { TranslationKey } from "@/types/i18n";
import {
  rlExamples,
  rlExampleCategories,
  type RLExample,
} from "./Simulator/config/rlExamples";
import { useRLSimulatorStore } from "../store/rlSimulatorStore";

export function ExamplesTab({
  selectedExample,
  onSelectExample,
  onOpenExampleInSimulation,
}: ModuleExamplesTabProps) {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const loadScenario = useRLSimulatorStore((s) => s.loadScenario);

  const toggle = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  const handleLoad = useCallback(
    (example: Example, source: RLExample) => {
      loadScenario({
        mode: source.mode,
        grammarSource: source.grammarSource,
        languageSource: source.languageSource,
        testWord: source.testWord,
      });
      onOpenExampleInSimulation(example);
    },
    [loadScenario, onOpenExampleInSimulation],
  );

  return (
    <div className="space-y-6">
      <div className="bg-card ring-foreground/10 rounded-xl p-6 ring-1">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-foreground text-base font-bold">
              {t("rl.examplesTab.title", "Predefined Examples")}
            </h3>
            <p className="text-muted-foreground mt-0.5 text-sm">
              {t(
                "rl.examplesTab.subtitle",
                "Walk through worked conversions between regex, grammar and language.",
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {rlExampleCategories.map(({ category, titleKey, descriptionKey }) => {
          const examples = rlExamples.filter((e) => e.category === category);
          if (examples.length === 0) return null;

          return (
            <section key={category}>
              <h4 className="text-foreground text-base font-bold">
                {t(titleKey as TranslationKey)}
              </h4>
              <p className="text-muted-foreground mt-1 mb-3 text-sm">
                {t(descriptionKey as TranslationKey)}
              </p>

              <div className="space-y-3">
                {examples.map((example) => {
                  const topicExample = toTopicExample(example, t);

                  return (
                    <ExampleCard
                      key={example.id}
                      example={example}
                      topicExample={topicExample}
                      isExpanded={expandedId === example.id}
                      isSelected={selectedExample?.id === topicExample.id}
                      onToggle={() => toggle(example.id)}
                      onSelect={() => onSelectExample(topicExample)}
                      onLoad={handleLoad}
                    />
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function toTopicExample(
  example: RLExample,
  t: (key: TranslationKey) => string,
): Example {
  const titleKey = example.titleKey as TranslationKey;
  const descriptionKey = example.descriptionKey as TranslationKey;

  return {
    id: titleKey,
    title: t(titleKey),
    description: t(descriptionKey),
    titleKey,
    descriptionKey,
    icon: BookOpen,
    kind: "example",
  };
}

interface ExampleCardProps {
  example: RLExample;
  topicExample: Example;
  isExpanded: boolean;
  isSelected: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onLoad: (example: Example, source: RLExample) => void;
}

function ExampleCard({
  example,
  topicExample,
  isExpanded,
  isSelected,
  onToggle,
  onSelect,
  onLoad,
}: ExampleCardProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "bg-card ring-foreground/10 overflow-hidden rounded-xl ring-1 transition-shadow hover:shadow-md",
        isSelected && "ring-primary/40",
      )}
    >
      <button
        type="button"
        onClick={() => {
          onSelect();
          onToggle();
        }}
        className="hover:bg-muted/30 flex w-full items-center gap-4 px-5 py-4 text-left transition-colors"
      >
        <div className="bg-muted text-muted-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
          <BookOpen className="h-5 w-5 text-purple-500" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-foreground text-sm font-semibold">
            {t(example.titleKey, example.id)}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            {t(`rl.simulator.modes.${example.mode}`, example.mode)}
          </p>
        </div>

        {isExpanded ? (
          <ChevronDown className="text-muted-foreground h-4 w-4 shrink-0" />
        ) : (
          <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t px-5 py-4">
          <p className="text-muted-foreground text-sm leading-relaxed">
            {t(example.descriptionKey, "")}
          </p>

          <div className="mt-4 space-y-3">
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

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onLoad(topicExample, example)}
              className="bg-brand text-brand-foreground inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:opacity-90"
            >
              <Play className="h-4 w-4 fill-current" />
              {t("rl.examplesTab.loadExample", "Load in Simulator")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
