import { useTranslation } from "react-i18next";
import { ExerciseCard } from "@/components/shared/ExerciseCard/ExerciseCard";
import { InlineResetControl } from "@/components/shared/InlineResetControl";
import type { ModuleExercisesTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { TopicCategorySection } from "@/components/shared/TopicCategorySection/TopicCategorySection";
import { TOPIC_STORAGE_IDS } from "@/data/moduleCatalog";
import {
  createTrainingCenterIdentifier,
  trainingCenterStorage,
} from "@/lib/trainingCenter";
import type { Exercise } from "@/types/exercise";
import {
  rlExercises,
  type RLExerciseCategory,
  type RLExerciseDefinition,
} from "../exercises/rlExerciseDefinitions";
import { RL_STORAGE_TASK_IDS } from "./Simulator/useRLPersistedSource";
import { useRLSimulatorStore } from "../store/rlSimulatorStore";

/** Section order on the page — one block per kind of task. */
const CATEGORY_ORDER: RLExerciseCategory[] = [
  "grammarToLanguage",
  "languageToGrammar",
  "applied",
];

export function ExercisesTab({
  selectedExercise,
  onSelectExercise,
  onOpenExerciseInSimulation,
}: ModuleExercisesTabProps) {
  const { t } = useTranslation();
  const loadScenario = useRLSimulatorStore((s) => s.loadScenario);
  const setActiveExercise = useRLSimulatorStore((s) => s.setActiveExercise);
  const clearExerciseDrafts = useRLSimulatorStore((s) => s.clearExerciseDrafts);

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

  // RL exercise progress lives in the in-session exercise drafts plus the
  // per-mode simulator sources that autosave to their topic slots — clear both.
  const handleResetAllExercises = () => {
    clearExerciseDrafts();
    for (const taskStorageId of Object.values(RL_STORAGE_TASK_IDS)) {
      trainingCenterStorage.delete(
        createTrainingCenterIdentifier(
          TOPIC_STORAGE_IDS.regularLanguages,
          taskStorageId,
        ),
      );
    }
  };

  // Card numbering runs across the whole tab, not per section.
  let cardIndex = 0;

  return (
    <div data-testid="rl-exercises-tab">
      <div className="mb-4 flex items-center gap-2">
        <InlineResetControl
          label={t("trainingCenter.resetAllExercises")}
          confirmationText={t("trainingCenter.confirmResetAllExercises")}
          onConfirm={handleResetAllExercises}
          testId="rl-reset-all-exercises"
        />
      </div>

      <div className="flex flex-col gap-6">
        {CATEGORY_ORDER.map((category) => {
          const defs = rlExercises.filter((def) => def.category === category);
          if (defs.length === 0) return null;

          return (
            <TopicCategorySection
              key={category}
              testId={`rl-exercises-section-${category}`}
              title={t(`rl.exercises.categories.${category}.title`)}
              description={t(`rl.exercises.categories.${category}.description`)}
            >
              {defs.map((def) => {
                const exercise = toExercise(def);
                const index = cardIndex++;
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
            </TopicCategorySection>
          );
        })}
      </div>
    </div>
  );
}
