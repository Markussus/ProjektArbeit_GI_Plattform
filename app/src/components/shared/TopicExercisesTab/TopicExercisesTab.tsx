import type { ReactNode } from "react";
import { ClipboardList } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ExerciseCard } from "@/components/shared/ExerciseCard/ExerciseCard";
import { TopicCategorySection } from "@/components/shared/TopicCategorySection/TopicCategorySection";
import type { Exercise, ExerciseDefinition } from "@/types/exercise";
import type { TranslationKey } from "@/types/i18n";

/** One titled block of exercises, e.g. all "build a DFA from a grammar" tasks. */
export interface TopicExerciseGroup {
  id: string;
  titleKey: TranslationKey;
  descriptionKey?: TranslationKey;
  exercises: ExerciseDefinition[];
}

interface TopicExercisesTabProps {
  /** Flat list of exercises. Ignored when `groups` is given. */
  exercises?: ExerciseDefinition[];
  /** Render the tab as titled category sections instead of one flat list. */
  groups?: TopicExerciseGroup[];
  selectedExercise: Exercise | null;
  onSelectExercise: (exercise: Exercise) => void;
  onOpenExerciseInSimulation: (exercise: Exercise) => void;
  testId?: string;
  testIdPrefix?: string;
  headerAction?: ReactNode;
}

export function TopicExercisesTab({
  exercises,
  groups,
  selectedExercise,
  onSelectExercise,
  onOpenExerciseInSimulation,
  testId,
  testIdPrefix = "exercise-card",
  headerAction,
}: TopicExercisesTabProps) {
  const { t } = useTranslation();

  // Keep a stable id from the translation key so exercise state survives language changes.
  const toExercise = (exercise: ExerciseDefinition): Exercise => ({
    id: exercise.titleKey,
    title: t(exercise.titleKey),
    description: t(exercise.descriptionKey),
    titleKey: exercise.titleKey,
    descriptionKey: exercise.descriptionKey,
    difficulty: exercise.difficulty,
    icon: exercise.icon,
    kind: "exercise",
  });

  const renderCard = (exercise: Exercise, index: number) => (
    <ExerciseCard
      key={exercise.id}
      item={exercise}
      index={index}
      testIdPrefix={`${testIdPrefix}-${exercise.id}`}
      isSelected={selectedExercise?.id === exercise.id}
      onSelect={() => onSelectExercise(exercise)}
      onOpen={() => onOpenExerciseInSimulation(exercise)}
    />
  );

  // Card numbering runs across the whole tab, not per section.
  let cardIndex = 0;

  return (
    <div data-testid={testId}>
      <div
        data-testid={testId ? `${testId}-header` : undefined}
        className="text-muted-foreground mb-4 flex items-center gap-2"
      >
        {headerAction ?? (
          <>
            <ClipboardList className="size-4" />
            <h3 className="text-sm font-bold">
              {t("exercise.currentExercises")}
            </h3>
          </>
        )}
      </div>

      {groups ? (
        <div
          data-testid={testId ? `${testId}-list` : undefined}
          className="flex flex-col gap-6"
        >
          {groups.map((group) =>
            group.exercises.length === 0 ? null : (
              <TopicCategorySection
                key={group.id}
                testId={testId ? `${testId}-section-${group.id}` : undefined}
                title={t(group.titleKey)}
                description={
                  group.descriptionKey ? t(group.descriptionKey) : undefined
                }
              >
                {group.exercises.map((definition) =>
                  renderCard(toExercise(definition), cardIndex++),
                )}
              </TopicCategorySection>
            ),
          )}
        </div>
      ) : (
        <div
          data-testid={testId ? `${testId}-list` : undefined}
          className="bg-card ring-foreground/10 overflow-hidden rounded-xl ring-1"
        >
          {(exercises ?? []).map((definition, index) =>
            renderCard(toExercise(definition), index),
          )}
        </div>
      )}
    </div>
  );
}
