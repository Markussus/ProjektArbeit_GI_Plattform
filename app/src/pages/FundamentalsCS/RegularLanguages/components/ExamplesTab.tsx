import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { BookOpen } from "lucide-react";
import { ExerciseCard } from "@/components/shared/ExerciseCard/ExerciseCard";
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
  const loadScenario = useRLSimulatorStore((s) => s.loadScenario);

  const handleOpen = useCallback(
    (example: RLExample) => {
      loadScenario({
        mode: example.mode,
        grammarSource: example.grammarSource,
        languageSource: example.languageSource,
        testWord: example.testWord,
      });
      onOpenExampleInSimulation(toTopicExample(example, t));
    },
    [loadScenario, onOpenExampleInSimulation, t],
  );

  return (
    <div data-testid="rl-examples-tab" className="space-y-8">
      <div className="text-muted-foreground flex items-center gap-2">
        <BookOpen className="size-4" />
        <h3 className="text-sm font-bold">{t("example.currentExamples")}</h3>
      </div>

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

            <div className="bg-card ring-foreground/10 overflow-hidden rounded-xl ring-1">
              {examples.map((example, index) => {
                const item = toTopicExample(example, t);
                return (
                  <ExerciseCard
                    key={example.id}
                    item={item}
                    index={index}
                    testIdPrefix={`rl-example-card-${example.id}`}
                    isSelected={selectedExample?.id === item.id}
                    onSelect={() => onSelectExample(item)}
                    onOpen={() => handleOpen(example)}
                  />
                );
              })}
            </div>
          </section>
        );
      })}
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
