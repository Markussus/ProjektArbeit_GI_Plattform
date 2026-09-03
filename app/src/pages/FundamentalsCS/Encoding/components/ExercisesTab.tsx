import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ExerciseCard } from "@/components/shared/ExerciseCard/ExerciseCard";
import { InlineResetControl } from "@/components/shared/InlineResetControl";
import type { ModuleExercisesTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { TopicCategorySection } from "@/components/shared/TopicCategorySection/TopicCategorySection";
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

const groupKeys = ["base64", "utf8"] as const;
const difficultyOrder = { easy: 0, medium: 1, hard: 2 } as const;

export function ExercisesTab({
  selectedExercise,
  onSelectExercise,
  onOpenExerciseInSimulation,
}: ModuleExercisesTabProps) {
  const { t } = useTranslation();
  const [exercises, setExercises] = useState(() => generateEncodingExercises());

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

  const grouped = useMemo(() => {
    const groups: Record<string, EncodingExercise[]> = { base64: [], utf8: [] };
    for (const ex of translatedExercises) {
      groups[ex.mode]?.push(ex);
    }
    for (const key of Object.keys(groups)) {
      groups[key].sort(
        (a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty],
      );
    }
    return groups;
  }, [translatedExercises]);

  const handleResetAllExercises = () => {
    setExercises(generateEncodingExercises());
  };

  return (
    <div data-testid="encoding-exercises-tab">
      <div className="text-muted-foreground mb-4 flex items-center gap-2">
        <InlineResetControl
          label={t("common.trainingCenter.resetAllExercises")}
          confirmationText={t("common.trainingCenter.confirmResetAllExercises")}
          onConfirm={handleResetAllExercises}
          testId="encoding-reset-all-exercises"
        />
      </div>

      <div className="flex flex-col gap-6">
        {groupKeys.map((group) => {
          const groupExercises = grouped[group];
          if (!groupExercises?.length) return null;

          return (
            <TopicCategorySection
              key={group}
              testId={`encoding-exercises-section-${group}`}
              title={t(`encoding.simulator.group${group}`)}
            >
              {groupExercises.map((exercise, index) => {
                const exerciseAsTopic: Exercise = {
                  id: exercise.id as TranslationKey,
                  title: exercise.title,
                  description: exercise.description,
                  titleKey: exercise.titleKey,
                  descriptionKey: exercise.descriptionKey,
                  descriptionParams: exercise.descriptionParams,
                  difficulty: exercise.difficulty,
                  icon: exercise.icon,
                  kind: "exercise",
                };
                return (
                  <ExerciseCard
                    key={exercise.id}
                    item={exerciseAsTopic}
                    index={index}
                    testIdPrefix={`exercise-card-${group}-${index}`}
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
            </TopicCategorySection>
          );
        })}
      </div>
    </div>
  );
}
