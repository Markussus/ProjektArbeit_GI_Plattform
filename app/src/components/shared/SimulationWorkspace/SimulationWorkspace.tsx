import { useTranslation } from "react-i18next";
import type { Exercise } from "@/components/shared/ExerciseCard/ExerciseCard";

interface SimulationWorkspaceProps {
  selectedExercise: Exercise | null;
  placeholderText: string;
}

export function SimulationWorkspace({
  selectedExercise,
  placeholderText,
}: SimulationWorkspaceProps) {
  const { t } = useTranslation();

  if (!selectedExercise) {
    return (
      <div className="bg-card ring-foreground/10 rounded-xl p-6 ring-1">
        <p className="text-muted-foreground text-sm">{placeholderText}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-card ring-foreground/10 rounded-xl p-6 ring-1">
        <h3 className="text-foreground text-base font-semibold">
          {t("simulation.taskText")}
        </h3>

        <div className="bg-muted mt-3 rounded-lg p-4">
          <p className="text-muted-foreground text-sm">
            {t("simulation.selectedExercise")}: {selectedExercise.title}
          </p>
          <p className="text-muted-foreground mt-2 text-sm">
            {t("simulation.taskTextPlaceholder")}
          </p>
        </div>
      </div>

      <div className="bg-card ring-foreground/10 rounded-xl p-6 ring-1">
        <p className="text-muted-foreground text-sm">{placeholderText}</p>
      </div>
    </div>
  );
}
