import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ExerciseCard } from "@/components/shared/ExerciseCard/ExerciseCard";
import type { ModuleExamplesTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { TopicCategorySection } from "@/components/shared/TopicCategorySection/TopicCategorySection";
import type { Example } from "@/types/exercise";
import {
  dnfWalkthroughExamples,
  type DnfWalkthroughExample,
} from "../examples/walkthroughExamples";

const MODE_ORDER: DnfWalkthroughExample["mode"][] = [
  "expression_to_truth_table",
  "truth_table_to_dnf",
];

export function ExamplesTab({
  selectedExample,
  onSelectExample,
  onOpenExampleInSimulation,
}: ModuleExamplesTabProps) {
  const { t } = useTranslation();
  const [openExampleId, setOpenExampleId] = useState<string | null>(
    selectedExample?.id ?? null,
  );

  const handleSelect = (example: Example) => {
    setOpenExampleId((prev) => (prev === example.id ? null : example.id));
    onSelectExample(example);
  };

  const handleOpen = (example: Example) => {
    onOpenExampleInSimulation(example);
  };

  let cardIndex = 0;

  return (
    <div
      data-testid="dnf-examples-tab"
      className="animate-in fade-in slide-in-from-bottom-4 flex flex-col gap-6 duration-500"
    >
      {MODE_ORDER.map((mode) => {
        const examples = dnfWalkthroughExamples.filter(
          (example) => example.mode === mode,
        );

        return (
          <TopicCategorySection
            key={mode}
            testId={`dnf-examples-section-${mode}`}
            title={t(`dnf.taskGroups.${mode}.title`)}
            description={t(`dnf.taskGroups.${mode}.description`)}
          >
            {examples.map((example) => {
              const exampleItem: Example = {
                id: example.titleKey,
                title: t(example.titleKey),
                description: t(example.explanationKey),
                titleKey: example.titleKey,
                descriptionKey: example.explanationKey,
                icon: example.icon,
                kind: "example",
              };
              const index = cardIndex++;

              return (
                <ExerciseCard
                  key={example.id}
                  item={exampleItem}
                  index={index}
                  testIdPrefix={`dnf-example-${example.id}`}
                  isSelected={openExampleId === exampleItem.id}
                  onSelect={() => handleSelect(exampleItem)}
                  onOpen={() => handleOpen(exampleItem)}
                />
              );
            })}
          </TopicCategorySection>
        );
      })}
    </div>
  );
}
