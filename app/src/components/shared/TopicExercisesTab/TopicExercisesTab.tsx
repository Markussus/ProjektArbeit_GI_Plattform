import { ClipboardList } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ExerciseCard } from "@/components/shared/ExerciseCard/ExerciseCard";
import type { Exercise, ExerciseDefinition } from "@/types/exercise";

interface TopicExercisesTabProps {
  exercises: ExerciseDefinition[];
  selectedExercise: Exercise | null;
  onSelectExercise: (exercise: Exercise) => void;
  onOpenExerciseInSimulation: (exercise: Exercise) => void;
  testId?: string;
  testIdPrefix?: string;
}

export function TopicExercisesTab({
  exercises,
  selectedExercise,
  onSelectExercise,
  onOpenExerciseInSimulation,
  testId,
  testIdPrefix = "exercise-card",
}: TopicExercisesTabProps) {
  const { t } = useTranslation();

  // Keep a stable id from the translation key so exercise state survives language changes.
  const translatedExercises: Exercise[] = exercises.map((exercise) => ({
    id: exercise.titleKey,
    title: t(exercise.titleKey),
    description: t(exercise.descriptionKey),
    titleKey: exercise.titleKey,
    descriptionKey: exercise.descriptionKey,
    difficulty: exercise.difficulty,
    icon: exercise.icon,
    kind: "exercise",
  }));

  return (
    <div data-testid={testId}>
      <div
        data-testid={testId ? `${testId}-header` : undefined}
        className="text-muted-foreground mb-4 flex items-center gap-2"
      >
        <ClipboardList className="size-4" />
        <h3 className="text-sm font-bold">{t("exercise.currentExercises")}</h3>
      </div>

      <div
        data-testid={testId ? `${testId}-list` : undefined}
        className="bg-card ring-foreground/10 overflow-hidden rounded-xl ring-1"
      >
        {translatedExercises.map((exercise, index) => (
          <ExerciseCard
            key={exercise.id}
            item={exercise}
            index={index}
            testIdPrefix={`${testIdPrefix}-${exercise.id}`}
            isSelected={selectedExercise?.id === exercise.id}
            onSelect={() => onSelectExercise(exercise)}
            onOpen={() => onOpenExerciseInSimulation(exercise)}
          />
        ))}
      </div>
    </div>
  );
}
