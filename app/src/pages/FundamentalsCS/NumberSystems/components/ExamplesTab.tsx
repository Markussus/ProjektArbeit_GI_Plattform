import { useTranslation } from "react-i18next";
import { BookOpen, Hash, Binary, Calculator } from "lucide-react";
import { useState } from "react";
import { ExerciseCard } from "@/components/shared/ExerciseCard/ExerciseCard";
import { numberSystemsExamples } from "../examples";
import type { Exercise } from "@/types/exercise";
import type { ModuleExamplesTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import type { ExerciseDefinition } from "@/types/exercise";

const exampleGroupOrder = ["03", "04", "05", "06"] as const;

const exampleGroupIcons = {
  "03": Hash,
  "04": Binary,
  "05": Calculator,
  "06": Calculator,
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
      if (!groups[group]) groups[group] = [];
      groups[group].push(ex);
    }
  }
  return groups as Record<ExampleGroup, ExerciseDefinition[]>;
}

export function ExamplesTab({
  onOpenExampleInSimulation,
}: ModuleExamplesTabProps) {
  const { t } = useTranslation();
  const [selectedExample, setSelectedExample] = useState<Exercise | null>(null);

  const groups = getExampleGroup(numberSystemsExamples);

  const selectExample = (exercise: Exercise) => {
    setSelectedExample((prev) => (prev?.id === exercise.id ? null : exercise));
  };

  const openExample = (exercise: Exercise) => {
    onOpenExampleInSimulation?.(exercise);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-500">
      <div className="bg-card ring-foreground/10 flex flex-col gap-4 rounded-xl p-6 shadow-sm ring-1">
        <h2 className="text-foreground flex items-center gap-2 text-xl font-bold">
          <BookOpen className="text-primary h-6 w-6" />
          {t("simulator.numbers.examplesTitle")}
        </h2>
        <p className="text-muted-foreground">
          {t("simulator.numbers.examplesDesc")}
        </p>
      </div>

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
              {t(`simulator.numbers.unit${group}`)}
            </h3>
            <div>
              {groupExamples.map((def, index) => {
                const exercise: Exercise = {
                  id: def.titleKey,
                  title: t(def.titleKey),
                  description: t(def.descriptionKey),
                  difficulty: def.difficulty,
                  icon: def.icon,
                };
                return (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    index={index}
                    variant="example"
                    isSelected={selectedExample?.id === exercise.id}
                    onSelect={() => selectExample(exercise)}
                    onOpen={() => openExample(exercise)}
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
