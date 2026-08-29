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
  findFAExercise,
} from "../exercises/faExerciseDefinitions";
import { useFASimulatorStore } from "../store/faSimulatorStore";

export function ExercisesTab(props: ModuleExercisesTabProps) {
  const { t } = useTranslation();
  const setActiveExercise = useFASimulatorStore((s) => s.setActiveExercise);
  const loadExample = useFASimulatorStore((s) => s.loadExample);
  const clearExerciseDrafts = useFASimulatorStore((s) => s.clearExerciseDrafts);

  const handleOpen = (exercise: Exercise) => {
    const def = findFAExercise(exercise.id);
    if (def) {
      setActiveExercise(def.id);
      // Prefill the simulator input with a representative accept word so the
      // user can immediately run the example through the automaton.
      const seedInput =
        def.exampleWords?.accept.find((w) => w.length > 0) ?? "";
      // Re-open the learner's saved work for this exercise if any; otherwise
      // start from the blank starter.
      const draft = useFASimulatorStore.getState().exerciseDrafts[def.id];
      loadExample(draft ?? def.starter, seedInput);
    }
    props.onOpenExerciseInSimulation(exercise);
  };

  // FA exercise progress is the per-exercise automaton draft (plus the free-mode
  // simulator slot) — clearing both resets the saved work.
  const handleResetAllExercises = () => {
    clearExerciseDrafts();
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
