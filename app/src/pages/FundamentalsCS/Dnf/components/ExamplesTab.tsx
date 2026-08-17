import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ExerciseCard } from "@/components/shared/ExerciseCard/ExerciseCard";
import type { ModuleExamplesTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import type { Example } from "@/types/exercise";
import { dnfWalkthroughExamples } from "../examples/walkthroughExamples";

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

  return (
    <div
      data-testid="dnf-examples-tab"
      className="bg-card ring-foreground/10 animate-in fade-in slide-in-from-bottom-4 rounded-xl p-6 shadow-sm ring-1 duration-500"
    >
      {dnfWalkthroughExamples.map((example, index) => {
        const exampleItem: Example = {
          id: example.titleKey,
          title: t(example.titleKey),
          description: t(example.explanationKey),
          titleKey: example.titleKey,
          descriptionKey: example.explanationKey,
          icon: example.icon,
          kind: "example",
        };

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
    </div>
  );
}
