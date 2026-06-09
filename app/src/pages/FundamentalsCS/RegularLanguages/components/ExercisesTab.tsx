import { ClipboardList } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ExerciseCard } from "@/components/shared/ExerciseCard/ExerciseCard";
import type { ModuleExercisesTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import type { Exercise } from "@/types/exercise";
import {
  rlExercises,
  rlExerciseCategories,
  type RLExerciseDefinition,
} from "../exercises/rlExerciseDefinitions";
import { useRLSimulatorStore } from "../store/rlSimulatorStore";

export function ExercisesTab({
  selectedExercise,
  onSelectExercise,
  onOpenExerciseInSimulation,
}: ModuleExercisesTabProps) {
  const { t } = useTranslation();
  const loadScenario = useRLSimulatorStore((s) => s.loadScenario);
  const setActiveExercise = useRLSimulatorStore((s) => s.setActiveExercise);

  // Keep a stable id from the translation key so selection survives language
  // changes, matching the shared TopicExercisesTab behaviour.
  const toExercise = (def: RLExerciseDefinition): Exercise => ({
    id: def.titleKey,
    title: t(def.titleKey),
    description: t(def.descriptionKey),
    titleKey: def.titleKey,
    descriptionKey: def.descriptionKey,
    difficulty: def.difficulty,
    icon: def.icon,
    kind: "exercise",
  });

  const handleOpen = (def: RLExerciseDefinition) => {
    setActiveExercise(def.id);
    // Open on a blank slate in the right mode — the solution stays hidden
    // until the user reveals it from the workspace panel.
    loadScenario(
      def.mode === "grammarToLanguage"
        ? { mode: def.mode, grammarSource: "" }
        : { mode: def.mode, languageSource: "" },
    );
    onOpenExerciseInSimulation(toExercise(def));
  };

  return (
    <div className="space-y-8">
      <div className="text-muted-foreground flex items-center gap-2">
        <ClipboardList className="size-4" />
        <h3 className="text-sm font-bold">{t("exercise.currentExercises")}</h3>
      </div>

      {rlExerciseCategories.map(({ category, titleKey, descriptionKey }) => {
        const defs = rlExercises.filter((e) => e.category === category);
        if (defs.length === 0) return null;

        return (
          <section key={category}>
            <h4 className="text-foreground text-base font-bold">
              {t(titleKey)}
            </h4>
            <p className="text-muted-foreground mt-1 mb-3 text-sm">
              {t(descriptionKey)}
            </p>

            <div className="bg-card ring-foreground/10 overflow-hidden rounded-xl ring-1">
              {defs.map((def, index) => {
                const exercise = toExercise(def);
                return (
                  <ExerciseCard
                    key={def.id}
                    item={exercise}
                    index={index}
                    testIdPrefix={`exercise-card-${def.id}`}
                    isSelected={selectedExercise?.id === exercise.id}
                    onSelect={() => onSelectExercise(exercise)}
                    onOpen={() => handleOpen(def)}
                  />
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
