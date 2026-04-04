import { useTranslation } from 'react-i18next'
import { GitBranch, Shuffle, Minimize2, ArrowRightLeft, ClipboardList } from 'lucide-react'
import { ExerciseCard } from '@/components/shared/ExerciseCard/ExerciseCard'
import type { Exercise } from '@/components/shared/ExerciseCard/ExerciseCard'

interface ExercisesTabProps {
    selectedExercise: Exercise | null
    onSelectExercise: (exercise: Exercise) => void
    onOpenExerciseInSimulation: (exercise: Exercise) => void
}

export function ExercisesTab({
                                 selectedExercise,
                                 onSelectExercise,
                                 onOpenExerciseInSimulation,
                             }: ExercisesTabProps) {
    const { t } = useTranslation()

    const exercises: Exercise[] = [
        { title: t('automata.exercise1'), description: t('automata.exercise1Desc'), difficulty: 'easy', icon: GitBranch },
        { title: t('automata.exercise2'), description: t('automata.exercise2Desc'), difficulty: 'medium', icon: Shuffle },
        { title: t('automata.exercise3'), description: t('automata.exercise3Desc'), difficulty: 'medium', icon: Minimize2 },
        { title: t('automata.exercise4'), description: t('automata.exercise4Desc'), difficulty: 'hard', icon: ArrowRightLeft },
    ]

    return (
        <div>
            <div className="mb-4 flex items-center gap-2 text-muted-foreground">
                <ClipboardList className="size-4" />
                <h3 className="text-sm font-bold">{t('exercise.currentExercises')}</h3>
            </div>

            <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
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
    )
}