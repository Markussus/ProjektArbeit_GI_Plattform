import { useTranslation } from "react-i18next";
import {
  MonitorPlay,
  Braces,
  Target,
  Link2,
  ClipboardList,
} from "lucide-react";
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
      title: t("turing.exercise1"),
      description: t("turing.exercise1Desc"),
      difficulty: "easy",
      icon: MonitorPlay,
    },
    {
      title: t("turing.exercise2"),
      description: t("turing.exercise2Desc"),
      difficulty: "medium",
      icon: Braces,
    },
    {
      title: t("turing.exercise3"),
      description: t("turing.exercise3Desc"),
      difficulty: "hard",
      icon: Target,
    },
    {
      title: t("turing.exercise4"),
      description: t("turing.exercise4Desc"),
      difficulty: "hard",
      icon: Link2,
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
