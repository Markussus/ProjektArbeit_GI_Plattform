import { useTranslation } from "react-i18next";
import {
  CheckCircle2,
  Circle,
  ClipboardList,
  PlayCircle,
  Play,
  RotateCcw,
  Star,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ModuleExercisesTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import {
  faExercises,
  type FAExerciseDefinition,
} from "../exercises/faExerciseDefinitions";
import {
  useFAExerciseStore,
  type FAExerciseStatus,
} from "../store/faExerciseStore";
import { useFAExampleStore } from "../store/faExampleStore";

const STATUS_STYLES: Record<
  FAExerciseStatus,
  { labelKey: string; fallback: string; className: string }
> = {
  not_started: {
    labelKey: "fa.exercisesTab.status.notStarted",
    fallback: "Not started",
    className: "bg-muted text-muted-foreground",
  },
  in_progress: {
    labelKey: "fa.exercisesTab.status.inProgress",
    fallback: "In progress",
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  },
  completed: {
    labelKey: "fa.exercisesTab.status.completed",
    fallback: "Completed",
    className: "bg-green-500/15 text-green-700 dark:text-green-400",
  },
};

export function ExercisesTab({
  onOpenExerciseInSimulation,
}: ModuleExercisesTabProps) {
  const { t } = useTranslation();
  const progress = useFAExerciseStore((s) => s.progress);
  const setActiveExercise = useFAExerciseStore((s) => s.setActiveExercise);
  const markInProgress = useFAExerciseStore((s) => s.markInProgress);
  const resetExercise = useFAExerciseStore((s) => s.resetExercise);
  const loadExample = useFAExampleStore((s) => s.loadExample);

  const handleStart = (exercise: FAExerciseDefinition) => {
    setActiveExercise(exercise.id);
    markInProgress(exercise.id);
    loadExample(exercise.starter, "");
    // Synthetic shared-Exercise object solely to trigger the tab switch in
    // ModuleTopicPage's state machine.
    onOpenExerciseInSimulation({
      id: exercise.id as never,
      title: t(exercise.titleKey, exercise.id),
      description: t(exercise.descriptionKey, ""),
      difficulty:
        exercise.difficulty === 1
          ? "easy"
          : exercise.difficulty === 2
            ? "medium"
            : "hard",
      icon: Target,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card ring-foreground/10 rounded-xl p-6 ring-1">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-foreground text-base font-bold">
              {t("fa.exercisesTab.title", "Practice Exercises")}
            </h3>
            <p className="text-muted-foreground mt-0.5 text-sm">
              {t(
                "fa.exercisesTab.subtitle",
                "Build each automaton yourself. Use hints if you get stuck — full solutions only if you ask.",
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Exercise cards */}
      <div className="space-y-3">
        {faExercises.map((ex) => {
          const p = progress[ex.id] ?? {
            status: "not_started" as FAExerciseStatus,
            hintsRevealed: 0,
            solutionRevealed: false,
          };
          const style = STATUS_STYLES[p.status];
          return (
            <div
              key={ex.id}
              className="bg-card ring-foreground/10 overflow-hidden rounded-xl ring-1 transition-shadow hover:shadow-md"
            >
              <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start">
                <div className="bg-muted text-muted-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                  {p.status === "completed" ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : p.status === "in_progress" ? (
                    <PlayCircle className="h-5 w-5 text-amber-600" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-foreground text-sm font-semibold">
                      {t(ex.titleKey, ex.id)}
                    </p>
                    <DifficultyStars difficulty={ex.difficulty} />
                    <span
                      className={cn(
                        "inline-flex rounded-md px-2 py-0.5 text-xs font-bold",
                        style.className,
                      )}
                    >
                      {t(style.labelKey, style.fallback)}
                    </span>
                  </div>

                  <div className="mt-2 flex items-start gap-2">
                    <Target className="text-primary mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <p className="text-foreground text-xs font-medium">
                      {t(ex.goalKey, "")}
                    </p>
                  </div>

                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                    {t(ex.descriptionKey, "")}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                  <button
                    type="button"
                    onClick={() => handleStart(ex)}
                    className="bg-brand text-brand-foreground inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:opacity-90"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    {p.status === "not_started"
                      ? t("fa.exercisesTab.start", "Start")
                      : t("fa.exercisesTab.resume", "Resume")}
                  </button>
                  {p.status !== "not_started" && (
                    <button
                      type="button"
                      onClick={() => resetExercise(ex.id)}
                      className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
                    >
                      <RotateCcw className="h-3 w-3" />
                      {t("fa.exercisesTab.reset", "Reset progress")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DifficultyStars({ difficulty }: { difficulty: 1 | 2 | 3 }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3].map((i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i <= difficulty
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/30",
          )}
        />
      ))}
    </span>
  );
}
