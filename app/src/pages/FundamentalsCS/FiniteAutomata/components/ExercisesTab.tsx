import { useTranslation } from "react-i18next";
import { InlineResetControl } from "@/components/shared/InlineResetControl";
import type { ModuleExercisesTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import {
  TopicExercisesTab,
  type TopicExerciseGroup,
} from "@/components/shared/TopicExercisesTab/TopicExercisesTab";
import { TOPIC_STORAGE_IDS } from "@/data/topicStorageIds";
import {
  SIMULATOR_TASK_STORAGE_ID,
  createTrainingCenterIdentifier,
  trainingCenterStorage,
} from "@/lib/trainingCenter";
import type { Exercise } from "@/types/exercise";
import {
  faExercises,
  faGrammarToAutomatonExercises,
} from "../exercises/faExerciseDefinitions";

export function ExercisesTab(props: ModuleExercisesTabProps) {
  const { t } = useTranslation();

  const handleOpen = (exercise: Exercise) => {
    props.onOpenExerciseInSimulation(exercise);
  };

  const handleResetAllExercises = () => {
    trainingCenterStorage.delete(
      createTrainingCenterIdentifier(
        TOPIC_STORAGE_IDS.finiteAutomata,
        SIMULATOR_TASK_STORAGE_ID,
      ),
    );
  };

  // Two kinds of task: build an automaton for a described language, or build
  // one from a given regular grammar.
  const groups: TopicExerciseGroup[] = [
    {
      id: "languageToAutomaton",
      titleKey:
        "finite-automata.exercisesTab.categories.languageToAutomaton.title",
      descriptionKey:
        "finite-automata.exercisesTab.categories.languageToAutomaton.description",
      exercises: faExercises,
    },
    {
      id: "grammarToAutomaton",
      titleKey:
        "finite-automata.exercisesTab.categories.grammarToAutomaton.title",
      descriptionKey:
        "finite-automata.exercisesTab.categories.grammarToAutomaton.description",
      exercises: faGrammarToAutomatonExercises,
    },
  ];

  return (
    <TopicExercisesTab
      {...props}
      groups={groups}
      testId="fa-exercises-tab"
      onOpenExerciseInSimulation={handleOpen}
      headerAction={
        <InlineResetControl
          label={t("common.trainingCenter.resetAllExercises")}
          confirmationText={t("common.trainingCenter.confirmResetAllExercises")}
          onConfirm={handleResetAllExercises}
          testId="fa-reset-all-exercises"
        />
      }
    />
  );
}
