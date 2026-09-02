import { useTranslation } from "react-i18next";
import { useState } from "react";
import { ExerciseCard } from "@/components/shared/ExerciseCard/ExerciseCard";
import { TopicCategorySection } from "@/components/shared/TopicCategorySection/TopicCategorySection";
import { numberSystemsExamples } from "../examples";
import type { Example } from "@/types/exercise";
import type { ModuleExamplesTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { getExampleGroup } from "./getExampleGroup";

const exampleGroupOrder = ["lecture", "07"] as const;

export function ExamplesTab({
  onOpenExampleInSimulation,
}: ModuleExamplesTabProps) {
  const { t } = useTranslation();
  const [selectedExample, setSelectedExample] = useState<Example | null>(null);

  const groups = getExampleGroup(numberSystemsExamples);

  const selectExample = (example: Example) => {
    setSelectedExample((prev) => (prev?.id === example.id ? null : example));
  };

  const openExample = (example: Example) => {
    onOpenExampleInSimulation?.(example);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col gap-6 duration-500">
      {exampleGroupOrder.map((group) => {
        const groupExamples = groups[group];
        if (!groupExamples?.length) return null;
        return (
          <TopicCategorySection
            key={group}
            testId={`number-systems-examples-section-${group}`}
            title={
              group === "lecture"
                ? t("number-systems.simulator.numbers.lectureScripts")
                : t(`number-systems.simulator.numbers.unit${group}`)
            }
          >
            {groupExamples.map((def, index) => {
              const example: Example = {
                id: def.titleKey,
                title: t(def.titleKey),
                description: t(def.descriptionKey),
                icon: def.icon,
                kind: "example",
              };
              return (
                <ExerciseCard
                  key={example.id}
                  item={example}
                  index={index}
                  isSelected={selectedExample?.id === example.id}
                  onSelect={() => selectExample(example)}
                  onOpen={() => openExample(example)}
                  testIdPrefix={`example-card-${example.id}`}
                />
              );
            })}
          </TopicCategorySection>
        );
      })}
    </div>
  );
}
