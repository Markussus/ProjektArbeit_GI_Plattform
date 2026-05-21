import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ClipboardList } from "lucide-react";
import { ExerciseCard } from "@/components/shared/ExerciseCard/ExerciseCard";
import type { ModuleExercisesTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import type { Exercise, DescriptionParams } from "@/types/exercise";
import type { TranslationKey } from "@/types/i18n";
import { generateEncodingExercises } from "../utils/exerciseGenerator";
import type { GeneratedExercise } from "../utils/exerciseGenerator";

interface EncodingExercise extends GeneratedExercise {
  title: string;
  description: string;
}

function replaceParams(text: string, params?: DescriptionParams): string {
  if (!params) return text;
  let result = text;
  for (const [key, value] of Object.entries(params)) {
    result = result.replaceAll(`{{${key}}}`, String(value));
  }
  return result;
}

export function ExercisesTab({
  selectedExercise,
  onSelectExercise,
  onOpenExerciseInSimulation,
}: ModuleExercisesTabProps) {
  const { t } = useTranslation();
  const exercises = useMemo(() => generateEncodingExercises(9), []);

  const translatedExercises: EncodingExercise[] = useMemo(
    () =>
      exercises.map((exercise) => {
        const rawDesc = t(exercise.descriptionKey);
        const desc = replaceParams(rawDesc, exercise.descriptionParams);
        return {
          ...exercise,
          title: t(exercise.titleKey),
          description: desc,
        };
      }),
    [exercises, t],
  );

  return (
    <div>
      <div className="text-muted-foreground mb-4 flex items-center gap-2">
        <ClipboardList className="size-4" />
        <h3 className="text-sm font-bold">{t("exercise.currentExercises")}</h3>
      </div>

      <div className="bg-card ring-foreground/10 overflow-hidden rounded-xl ring-1">
        {translatedExercises.map((exercise, index) => {
          const exerciseAsTopic: Exercise = {
            id: exercise.id as TranslationKey,
            title: exercise.title,
            description: exercise.description,
            difficulty: exercise.difficulty,
            icon: exercise.icon,
            kind: "exercise",
          };
          return (
            <ExerciseCard
              key={exercise.id}
              item={exerciseAsTopic}
              index={index}
              testIdPrefix={`exercise-card-${exercise.exerciseType}`}
              isSelected={selectedExercise?.id === exercise.id}
              onSelect={() => onSelectExercise(exerciseAsTopic)}
              onOpen={() => {
                const fullExercise = {
                  ...exerciseAsTopic,
                  answer: exercise.answer,
                  exerciseType: exercise.exerciseType,
                  mode: exercise.mode,
                  converterMode: exercise.converterMode,
                  initialValue: exercise.initialValue,
                } as unknown as Exercise;
                onOpenExerciseInSimulation(fullExercise);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
