import { useTranslation } from "react-i18next";
import { FileText, Binary } from "lucide-react";
import { useState } from "react";
import { ExerciseCard } from "@/components/shared/ExerciseCard/ExerciseCard";
import { encodingExamples } from "../examples";
import type { Example } from "@/types/exercise";
import type { ModuleExamplesTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import type { ExerciseDefinition } from "@/types/exercise";

const exampleGroupOrder = ["base64", "utf8"] as const;

const exampleGroupIcons = {
  base64: FileText,
  utf8: Binary,
} as const;

type ExampleGroup = (typeof exampleGroupOrder)[number];

function getExampleGroup(
  examples: ExerciseDefinition[],
): Record<ExampleGroup, ExerciseDefinition[]> {
  const groups: Record<string, ExerciseDefinition[]> = {};
  for (const ex of examples) {
    const match = ex.titleKey.match(/example_(base64|utf8)/);
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
  const [selectedExample, setSelectedExample] = useState<Example | null>(null);

  const groups = getExampleGroup(encodingExamples);

  const selectExample = (example: Example) => {
    setSelectedExample((prev) => (prev?.id === example.id ? null : example));
  };

  const openExample = (example: Example) => {
    onOpenExampleInSimulation?.(example);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-500">
      <div className="bg-card ring-foreground/10 flex flex-col gap-4 rounded-xl p-6 shadow-sm ring-1">
        <h2 className="text-foreground flex items-center gap-2 text-xl font-bold">
          <FileText className="text-primary h-6 w-6" />
          {t("simulator.encoding.examplesTitle")}
        </h2>
        <p className="text-muted-foreground">
          {t("simulator.encoding.examplesDesc")}
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
              {t(`simulator.encoding.group${group}`)}
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
