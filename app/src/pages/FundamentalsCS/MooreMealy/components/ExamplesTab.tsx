import { Cpu, GitBranch } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ExerciseCard } from "@/components/shared/ExerciseCard/ExerciseCard";
import type { ModuleExamplesTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import type { Example } from "@/types/exercise";
import { MEALY_EXAMPLE_ID, MOORE_EXAMPLE_ID } from "./SimulationTab";

export function ExamplesTab({
  selectedExample,
  onSelectExample,
  onOpenExampleInSimulation,
}: ModuleExamplesTabProps) {
  const { t } = useTranslation();
  const examples: Example[] = [
    {
      id: MOORE_EXAMPLE_ID,
      title: t("moore-mealy.examples.mooreTitle"),
      description: t("moore-mealy.examples.mooreDescription"),
      icon: Cpu,
      kind: "example",
    },
    {
      id: MEALY_EXAMPLE_ID,
      title: t("moore-mealy.examples.mealyTitle"),
      description: t("moore-mealy.examples.mealyDescription"),
      icon: GitBranch,
      kind: "example",
    },
  ];

  return (
    <div
      data-testid="moore-mealy-examples"
      className="bg-card ring-foreground/10 overflow-hidden rounded-xl ring-1"
    >
      {examples.map((example, index) => (
        <ExerciseCard
          key={example.id}
          item={example}
          index={index}
          testIdPrefix={`moore-mealy-example-${example.id}`}
          isSelected={selectedExample?.id === example.id}
          onSelect={() => onSelectExample(example)}
          onOpen={() => onOpenExampleInSimulation(example)}
        />
      ))}
    </div>
  );
}
