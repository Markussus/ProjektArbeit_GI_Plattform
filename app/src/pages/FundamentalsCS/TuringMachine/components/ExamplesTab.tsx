import { BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ExerciseCard } from "@/components/shared/ExerciseCard/ExerciseCard";
import type { ModuleExamplesTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import type { Example } from "@/types/exercise";
import { turingMachineExamples } from "../examples";

export function ExamplesTab({
  selectedExample,
  onSelectExample,
  onOpenExampleInSimulation,
}: ModuleExamplesTabProps) {
  const { t } = useTranslation();

  const translatedExamples: Example[] = turingMachineExamples.map(
    (example) => ({
      id: example.titleKey,
      title: t(example.titleKey),
      description: t(example.descriptionKey),
      titleKey: example.titleKey,
      descriptionKey: example.descriptionKey,
      icon: example.icon,
      kind: "example",
    }),
  );

  return (
    <div data-testid="tm-examples-tab">
      <div
        data-testid="tm-examples-header"
        className="text-muted-foreground mb-4 flex items-center gap-2"
      >
        <BookOpen className="size-4" />
        <h3 className="text-sm font-bold">{t("common.example.currentExamples")}</h3>
      </div>

      <div
        data-testid="tm-examples-list"
        className="bg-card ring-foreground/10 overflow-hidden rounded-xl ring-1"
      >
        {translatedExamples.map((example, index) => (
          <ExerciseCard
            key={example.id}
            item={example}
            index={index}
            testIdPrefix={`tm-example-card-${example.id}`}
            isSelected={selectedExample?.id === example.id}
            onSelect={() => onSelectExample(example)}
            onOpen={() => onOpenExampleInSimulation(example)}
          />
        ))}
      </div>
    </div>
  );
}
