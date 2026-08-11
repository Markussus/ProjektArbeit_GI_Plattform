import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { BookOpen } from "lucide-react";
import { ExerciseCard } from "@/components/shared/ExerciseCard/ExerciseCard";
import type { ModuleExamplesTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { TopicCategorySection } from "@/components/shared/TopicCategorySection/TopicCategorySection";
import type { Example } from "@/types/exercise";
import type { TranslationKey } from "@/types/i18n";
import {
  rlExamples,
  type RLExample,
  type RLExampleCategory,
} from "./Simulator/config/rlExamples";
import { useRLSimulatorStore } from "../store/rlSimulatorStore";

/** Section order on the page — one block per kind of task. */
const CATEGORY_ORDER: RLExampleCategory[] = [
  "grammarToLanguage",
  "languageToGrammar",
  "recognizeWord",
];

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

  // Card numbering runs across the whole tab, not per section.
  let cardIndex = 0;

  return (
    <div data-testid="rl-examples-tab" className="flex flex-col gap-6">
      <div className="text-muted-foreground flex items-center gap-2">
        <BookOpen className="size-4" />
        <h3 className="text-sm font-bold">{t("example.currentExamples")}</h3>
      </div>

      {CATEGORY_ORDER.map((category) => {
        const examples = rlExamples.filter((e) => e.category === category);
        if (examples.length === 0) return null;

        return (
          <TopicCategorySection
            key={category}
            testId={`rl-examples-section-${category}`}
            title={t(`rl.examples.categories.${category}.title`)}
            description={t(`rl.examples.categories.${category}.description`)}
          >
            {examples.map((example) => {
              const item = toTopicExample(example, t);
              const index = cardIndex++;
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
          </TopicCategorySection>
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
    icon: example.icon,
    kind: "example",
  };
}
