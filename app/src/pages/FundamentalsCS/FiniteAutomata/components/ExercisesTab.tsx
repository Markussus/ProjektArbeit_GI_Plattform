import { useTranslation } from "react-i18next";
import { InlineResetControl } from "@/components/shared/InlineResetControl";
import type { ModuleExercisesTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { TopicExercisesTab } from "@/components/shared/TopicExercisesTab/TopicExercisesTab";
import { TOPIC_STORAGE_IDS } from "@/data/moduleCatalog";
import {
  SIMULATOR_TASK_STORAGE_ID,
  createTrainingCenterIdentifier,
  trainingCenterStorage,
} from "@/lib/trainingCenter";
import type { Exercise } from "@/types/exercise";
import {
  allFAExercises,
  findFAExercise,
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

  // FA exercise progress is the automaton built in the simulator, which
  // autosaves to the topic's simulator slot — so clearing it resets the work.
  const handleResetAllExercises = () => {
    trainingCenterStorage.delete(
      createTrainingCenterIdentifier(
        TOPIC_STORAGE_IDS.finiteAutomata,
        SIMULATOR_TASK_STORAGE_ID,
      ),
    );
  };

  return (
    <TopicExercisesTab
      {...props}
      exercises={allFAExercises}
      testId="fa-exercises-tab"
      onOpenExerciseInSimulation={handleOpen}
      headerAction={
        <InlineResetControl
          label={t("trainingCenter.resetAllExercises")}
          confirmationText={t("trainingCenter.confirmResetAllExercises")}
          onConfirm={handleResetAllExercises}
          testId="fa-reset-all-exercises"
        />
      }
    />
  );
}
