import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Book, BookOpen, GitBranch, Zap } from "lucide-react";
import { ExerciseCard } from "@/components/shared/ExerciseCard/ExerciseCard";
import type { ModuleExamplesTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import type { Example } from "@/types/exercise";
import type { TranslationKey } from "@/types/i18n";
import { faExamples, type FAExample } from "./Simulator/config/faExamples";
import { useFASimulatorStore } from "../store/faSimulatorStore";

export function ExamplesTab({
  selectedExample,
  onSelectExample,
  onOpenExampleInSimulation,
}: ModuleExamplesTabProps) {
  const { t } = useTranslation();
  const loadExample = useFASimulatorStore((s) => s.loadExample);

  const handleOpen = useCallback(
    (example: FAExample) => {
      loadExample(example.program, example.inputWord);
      onOpenExampleInSimulation(toTopicExample(example, t));
    },
    [loadExample, onOpenExampleInSimulation, t],
  );

  return (
    <div data-testid="fa-examples-tab" className="space-y-4">
      <div className="text-muted-foreground flex items-center gap-2">
        <BookOpen className="size-4" />
        <h3 className="text-sm font-bold">{t("example.currentExamples")}</h3>
      </div>

      <div className="bg-card ring-foreground/10 overflow-hidden rounded-xl ring-1">
        {faExamples.map((example, index) => {
          const item = toTopicExample(example, t);
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
      </div>
    </div>
  );
}

// Match the icons the example cards used before the shared-card refactor:
// the paired grammar example uses Book, plain NFAs use Zap, DFAs use GitBranch.
function exampleIcon(example: FAExample) {
  if (example.secondVariant) return Book;
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
