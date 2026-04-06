import { useTranslation } from "react-i18next";
import { Binary, Calculator, Cpu, Shuffle, ClipboardList } from "lucide-react";
import { ExerciseCard } from "@/components/shared/ExerciseCard/ExerciseCard";
import type { Exercise } from "@/components/shared/ExerciseCard/ExerciseCard";

interface ExercisesTabProps {
  selectedExercise: Exercise | null;
  onSelectExercise: (exercise: Exercise) => void;
  onOpenExerciseInSimulation: (exercise: Exercise) => void;
}

export function ExercisesTab({
  selectedExercise,
  onSelectExercise,
  onOpenExerciseInSimulation,
}: ExercisesTabProps) {
  const { t } = useTranslation();

  const exercises: Exercise[] = [
    {
      title: t("number.exercise1"),
      description: t("number.exercise1Desc"),
      difficulty: "easy",
      icon: Binary,
    },
    {
      title: t("number.exercise2"),
      description: t("number.exercise2Desc"),
      difficulty: "medium",
      icon: Calculator,
    },
    {
      title: t("number.exercise3"),
      description: t("number.exercise3Desc"),
      difficulty: "hard",
      icon: Cpu,
    },
    {
      title: t("number.exercise4"),
      description: t("number.exercise4Desc"),
      difficulty: "hard",
      icon: Shuffle,
    },
  ];

  return (
    <div>
      <div className="text-muted-foreground mb-4 flex items-center gap-2">
        <ClipboardList className="size-4" />
        <h3 className="text-sm font-bold">{t("exercise.currentExercises")}</h3>
      </div>

      <div className="bg-card ring-foreground/10 overflow-hidden rounded-xl ring-1">
        {exercises.map((exercise, i) => (
          <ExerciseCard
            key={i}
            exercise={exercise}
            index={i}
            isSelected={selectedExercise?.title === exercise.title}
            onSelect={() => onSelectExercise(exercise)}
            onOpen={() => onOpenExerciseInSimulation(exercise)}
          />
        ))}
      </div>
    </div>
  );
}
