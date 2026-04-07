import { useTranslation } from 'react-i18next'
import { MonitorPlay, Braces, Target, Link2 } from 'lucide-react'
import { ExerciseCard } from '@/components/shared/ExerciseCard/ExerciseCard'
import type { Exercise } from '@/components/shared/ExerciseCard/ExerciseCard'
import { ClipboardList } from 'lucide-react'

export function ExercisesTab() {
  const { t } = useTranslation()

  const exercises: Exercise[] = [
    { title: t('turing.exercise1'), description: t('turing.exercise1Desc'), difficulty: 'easy', icon: MonitorPlay },
    { title: t('turing.exercise2'), description: t('turing.exercise2Desc'), difficulty: 'medium', icon: Braces },
    { title: t('turing.exercise3'), description: t('turing.exercise3Desc'), difficulty: 'hard', icon: Target },
    { title: t('turing.exercise4'), description: t('turing.exercise4Desc'), difficulty: 'hard', icon: Link2 },
  ]

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 text-muted-foreground">
        <ClipboardList className="size-4" />
        <h3 className="text-sm font-bold">Current Exercises</h3>
      </div>
      <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
        {exercises.map((exercise, i) => (
          <ExerciseCard
            key={i}
            exercise={exercise}
            index={i}
            isFirst={i === 0}
          />
        ))}
      </div>
    </div>
  )
}

