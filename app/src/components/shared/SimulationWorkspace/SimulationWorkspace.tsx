import { useTranslation } from 'react-i18next'
import type { Exercise } from '@/components/shared/ExerciseCard/ExerciseCard'

interface SimulationWorkspaceProps {
    selectedExercise: Exercise | null
    placeholderText: string
}

export function SimulationWorkspace({
                                        selectedExercise,
                                        placeholderText,
                                    }: SimulationWorkspaceProps) {
    const { t } = useTranslation()

    if (!selectedExercise) {
        return (
            <div className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
                <p className="text-sm text-muted-foreground">{placeholderText}</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
                <h3 className="text-base font-semibold text-foreground">
                    {t('simulation.taskText')}
                </h3>

                <div className="mt-3 rounded-lg bg-muted p-4">
                    <p className="text-sm text-muted-foreground">
                        {t('simulation.selectedExercise')}: {selectedExercise.title}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {t('simulation.taskTextPlaceholder')}
                    </p>
                </div>
            </div>

            <div className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
                <h3 className="text-base font-semibold text-foreground">
                    {t('simulation.workspace')}
                </h3>

                <div className="mt-3 rounded-lg bg-muted p-4">
                    <p className="text-sm text-muted-foreground">{placeholderText}</p>
                </div>
            </div>
        </div>
    )
}