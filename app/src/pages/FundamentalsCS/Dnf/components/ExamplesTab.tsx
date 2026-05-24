import { useState } from "react";
import { ArrowRightLeft, BookOpen, Table2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ExerciseCard } from "@/components/shared/ExerciseCard/ExerciseCard";
import type { ModuleExamplesTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import type { Example } from "@/types/exercise";
import {
  dnfWalkthroughExamples,
  type DnfWalkthroughExample,
  type DnfWalkthroughExampleMode,
} from "../examples/walkthroughExamples";

const modeOrder: DnfWalkthroughExampleMode[] = [
  "expression_to_truth_table",
  "truth_table_to_dnf",
];

const modeIcons: Record<DnfWalkthroughExampleMode, typeof BookOpen> = {
  expression_to_truth_table: ArrowRightLeft,
  truth_table_to_dnf: Table2,
};

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

  const groups = groupExamplesByMode(dnfWalkthroughExamples);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-500">
      {modeOrder.map((mode) => {
        const examples = groups[mode];
        if (!examples?.length) {
          return null;
        }

        const ModeIcon = modeIcons[mode];

        return (
          <div
            key={mode}
            className="bg-card ring-foreground/10 flex flex-col gap-4 rounded-xl p-6 shadow-sm ring-1"
          >
            <h3 className="text-foreground border-border/50 flex items-center gap-2 border-b pb-2 font-semibold">
              <ModeIcon className="text-primary size-5" />
              {t(`dnf.examples.modeGroup.${mode}`)}
            </h3>

            <div>
              {examples.map((example, index) => {
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
          </div>
        );
      })}
    </div>
  );
}

function groupExamplesByMode(
  examples: DnfWalkthroughExample[],
): Record<DnfWalkthroughExampleMode, DnfWalkthroughExample[]> {
  const groups: Record<DnfWalkthroughExampleMode, DnfWalkthroughExample[]> = {
    expression_to_truth_table: [],
    truth_table_to_dnf: [],
  };

  for (const example of examples) {
    groups[example.mode].push(example);
  }

  return groups;
}
