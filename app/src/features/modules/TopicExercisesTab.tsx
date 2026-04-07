import { useTranslation } from "react-i18next";
import { ClipboardList } from "lucide-react";
import { ExerciseCard } from "@/components/shared/ExerciseCard/ExerciseCard";
import type { Exercise } from "@/components/shared/ExerciseCard/ExerciseCard";
import type { ExerciseDefinition } from "./types";

interface TopicExercisesTabProps {
  exercises: ExerciseDefinition[];
  selectedExercise: Exercise | null;
  onSelectExercise: (exercise: Exercise) => void;
  onOpenExerciseInSimulation: (exercise: Exercise) => void;
}

export function TopicExercisesTab({
  exercises,
  selectedExercise,
  onSelectExercise,
  onOpenExerciseInSimulation,
}: TopicExercisesTabProps) {
  const { t } = useTranslation();
  const tk = (key: string) => t(key as never);

  const translatedExercises: Exercise[] = exercises.map((exercise) => ({
    title: tk(exercise.titleKey),
    description: tk(exercise.descriptionKey),
    difficulty: exercise.difficulty,
    icon: exercise.icon,
  }));

  return (
    <div>
      <div className="text-muted-foreground mb-4 flex items-center gap-2">
        <ClipboardList className="size-4" />
        <h3 className="text-sm font-bold">{t("exercise.currentExercises")}</h3>
      </div>

      <div className="bg-card ring-foreground/10 overflow-hidden rounded-xl ring-1">
        {translatedExercises.map((exercise, index) => (
          <ExerciseCard
            key={`${exercise.title}-${index}`}
            exercise={exercise}
            index={index}
            isSelected={selectedExercise?.title === exercise.title}
            onSelect={() => onSelectExercise(exercise)}
            onOpen={() => onOpenExerciseInSimulation(exercise)}
          />
        ))}
      </div>
    </div>
  );
}
