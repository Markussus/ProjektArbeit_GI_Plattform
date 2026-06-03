import { useTranslation } from "react-i18next";
import { ExerciseCard } from "@/components/shared/ExerciseCard/ExerciseCard";
import type { ModuleExercisesTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { TopicExercisesTab } from "@/components/shared/TopicExercisesTab/TopicExercisesTab";
import type { Exercise } from "@/types/exercise";
import {
  faExercises,
  faGrammarToAutomatonExercises,
  findFAExercise,
  type FAExerciseDefinition,
} from "../exercises/faExerciseDefinitions";
import { useFASimulatorStore } from "../store/faSimulatorStore";

export function ExercisesTab(props: ModuleExercisesTabProps) {
  const { t } = useTranslation();
  const setActiveExercise = useFASimulatorStore((s) => s.setActiveExercise);
  const loadExample = useFASimulatorStore((s) => s.loadExample);

  const handleOpen = (exercise: Exercise) => {
    const def = findFAExercise(exercise.id);
    if (def) {
      setActiveExercise(def.id);
      // Prefill the simulator input with a representative accept word so the
      // user can immediately run the example through the automaton.
      const seedInput =
        def.exampleWords?.accept.find((w) => w.length > 0) ?? "";
      loadExample(def.starter, seedInput);
    }
    props.onOpenExerciseInSimulation(exercise);
  };

  // Stable id from the translation key so selection survives language changes.
  const toExercise = (def: FAExerciseDefinition): Exercise => ({
    id: def.titleKey,
    title: t(def.titleKey),
    description: t(def.descriptionKey),
    titleKey: def.titleKey,
    descriptionKey: def.descriptionKey,
    difficulty: def.difficulty,
    icon: def.icon,
    kind: "exercise",
  });

  return (
    <div className="space-y-8">
      <TopicExercisesTab
        {...props}
        exercises={faExercises}
        onOpenExerciseInSimulation={handleOpen}
      />

      <section>
        <h4 className="text-foreground text-base font-bold">
          {t("fa.grammarToAutomaton.sectionTitle")}
        </h4>
        <p className="text-muted-foreground mt-1 mb-3 text-sm">
          {t("fa.grammarToAutomaton.sectionDescription")}
        </p>

        <div className="bg-card ring-foreground/10 overflow-hidden rounded-xl ring-1">
          {faGrammarToAutomatonExercises.map((def, index) => {
            const exercise = toExercise(def);
            return (
              <ExerciseCard
                key={def.id}
                item={exercise}
                index={index}
                testIdPrefix={`exercise-card-${def.id}`}
                isSelected={props.selectedExercise?.id === exercise.id}
                onSelect={() => props.onSelectExercise(exercise)}
                onOpen={() => handleOpen(exercise)}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
