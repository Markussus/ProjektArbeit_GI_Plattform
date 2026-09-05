import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Book, BookOpen, GitBranch, Zap } from "lucide-react";
import { ExerciseCard } from "@/components/shared/ExerciseCard/ExerciseCard";
import type { ModuleExamplesTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { TopicCategorySection } from "@/components/shared/TopicCategorySection/TopicCategorySection";
import type { Example } from "@/types/exercise";
import type { TranslationKey } from "@/types/i18n";
import {
  faExamples,
  type FAExample,
  type FAExampleCategory,
} from "./Simulator/config/faExamples";

/** Section order on the page — one block per kind of automaton. */
const CATEGORY_ORDER: FAExampleCategory[] = [
  "dfa",
  "nfa",
  "grammarToAutomaton",
];

export function ExamplesTab({
  selectedExample,
  onSelectExample,
  onOpenExampleInSimulation,
}: ModuleExamplesTabProps) {
  const { t } = useTranslation();

  const handleOpen = useCallback(
    (example: FAExample) => {
      onOpenExampleInSimulation(toTopicExample(example, t));
    },
    [onOpenExampleInSimulation, t],
  );

  // Card numbering runs across the whole tab, not per section.
  let cardIndex = 0;

  return (
    <div data-testid="fa-examples-tab" className="flex flex-col gap-6">
      <div className="text-muted-foreground flex items-center gap-2">
        <BookOpen className="size-4" />
        <h3 className="text-sm font-bold">
          {t("common.example.currentExamples")}
        </h3>
      </div>

      {CATEGORY_ORDER.map((category) => {
        const examples = faExamples.filter((e) => e.category === category);
        if (examples.length === 0) return null;

        return (
          <TopicCategorySection
            key={category}
            testId={`fa-examples-section-${category}`}
            title={t(`finite-automata.examples.categories.${category}.title`)}
            description={t(
              `finite-automata.examples.categories.${category}.description`,
            )}
          >
            {examples.map((example) => {
              const item = toTopicExample(example, t);
              const index = cardIndex++;
              return (
                <ExerciseCard
                  key={example.id}
                  item={item}
                  index={index}
                  testIdPrefix={`fa-example-card-${example.id}`}
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

// Match the icons the example cards used before the shared-card refactor:
// grammar-derived automata use Book, plain NFAs use Zap, DFAs use GitBranch.
function exampleIcon(example: FAExample) {
  if (example.category === "grammarToAutomaton") return Book;
  return example.type === "NFA" ? Zap : GitBranch;
}

function toTopicExample(
  example: FAExample,
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
    icon: exampleIcon(example),
    kind: "example",
  };
}
