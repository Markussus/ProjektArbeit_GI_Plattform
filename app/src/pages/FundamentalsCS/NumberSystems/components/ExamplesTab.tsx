import { useTranslation } from "react-i18next";
import { BookOpen } from "lucide-react";
import { useState } from "react";
import { ExerciseCard } from "@/components/shared/ExerciseCard/ExerciseCard";
import { numberSystemsExamples } from "../examples";
import type { Example } from "@/types/exercise";
import type { ModuleExamplesTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import type { ExerciseDefinition } from "@/types/exercise";

const exampleGroupOrder = ["lecture", "07"] as const;

const exampleGroupIcons = {
  lecture: BookOpen,
  "07": BookOpen,
} as const;

type ExampleGroup = (typeof exampleGroupOrder)[number];

function getExampleGroup(
  examples: ExerciseDefinition[],
): Record<ExampleGroup, ExerciseDefinition[]> {
  const groups: Record<string, ExerciseDefinition[]> = {};
  for (const ex of examples) {
    const match = ex.titleKey.match(/example_u(\d{2})/);
    if (match) {
      const group = match[1];
      const targetGroup = ["03", "04", "05", "06"].includes(group)
        ? "lecture"
        : group;
      if (!groups[targetGroup]) groups[targetGroup] = [];
      groups[targetGroup].push(ex);
    }
  }
  return groups as Record<ExampleGroup, ExerciseDefinition[]>;
}

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
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-500">
      {exampleGroupOrder.map((group) => {
        const groupExamples = groups[group];
        if (!groupExamples?.length) return null;
        const Icon = exampleGroupIcons[group];

        return (
          <div
            key={group}
            className="bg-card ring-foreground/10 flex flex-col gap-4 rounded-xl p-6 shadow-sm ring-1"
          >
            <h3 className="text-foreground border-border/50 flex items-center gap-2 border-b pb-2 font-semibold">
              <Icon className="text-primary h-5 w-5" />
              {group === "lecture"
                ? t("simulator.numbers.lectureScripts")
                : t(`simulator.numbers.unit${group}`)}
            </h3>
            <div>
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
            </div>
          </div>
        );
      })}
    </div>
  );
}
