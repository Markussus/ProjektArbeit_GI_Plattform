import { Cpu, GitBranch } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ExerciseCard } from "@/components/shared/ExerciseCard/ExerciseCard";
import type { ModuleExamplesTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { TopicCategorySection } from "@/components/shared/TopicCategorySection/TopicCategorySection";
import type { Example } from "@/types/exercise";
import { MEALY_EXAMPLE_ID, MOORE_EXAMPLE_ID } from "./SimulationTab";

export function ExamplesTab({
  selectedExample,
  onSelectExample,
  onOpenExampleInSimulation,
}: ModuleExamplesTabProps) {
  const { t } = useTranslation();
  const exampleGroups = [
    {
      id: "moore",
      title: t("moore-mealy.groups.moore.title"),
      description: t("moore-mealy.groups.moore.examplesDescription"),
      example: {
        id: MOORE_EXAMPLE_ID,
        title: t("moore-mealy.examples.mooreTitle"),
        description: t("moore-mealy.examples.mooreDescription"),
        icon: Cpu,
        kind: "example",
      } satisfies Example,
    },
    {
      id: "mealy",
      title: t("moore-mealy.groups.mealy.title"),
      description: t("moore-mealy.groups.mealy.examplesDescription"),
      example: {
        id: MEALY_EXAMPLE_ID,
        title: t("moore-mealy.examples.mealyTitle"),
        description: t("moore-mealy.examples.mealyDescription"),
        icon: GitBranch,
        kind: "example",
      } satisfies Example,
    },
  ];

  return (
    <div
      data-testid="moore-mealy-examples"
      className="animate-in fade-in slide-in-from-bottom-4 flex flex-col gap-6 duration-500"
    >
      {exampleGroups.map((group, index) => (
        <TopicCategorySection
          key={group.id}
          testId={`moore-mealy-examples-section-${group.id}`}
          title={group.title}
          description={group.description}
        >
          <ExerciseCard
            item={group.example}
            index={index}
            testIdPrefix={`moore-mealy-example-${group.example.id}`}
            isSelected={selectedExample?.id === group.example.id}
            onSelect={() => onSelectExample(group.example)}
            onOpen={() => onOpenExampleInSimulation(group.example)}
          />
        </TopicCategorySection>
      ))}
    </div>
  );
}
