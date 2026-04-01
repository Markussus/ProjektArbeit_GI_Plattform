import { useTranslation } from 'react-i18next'
import { ToggleLeft, ToggleRight, ArrowRightLeft, Repeat, ClipboardList } from 'lucide-react'
import { ExerciseCard } from '@/components/shared/ExerciseCard/ExerciseCard'
import type { Exercise } from '@/components/shared/ExerciseCard/ExerciseCard'

export function ExercisesTab() {
  const { t } = useTranslation()

  const exercises: Exercise[] = [
    { title: t('moore.exercise1'), description: t('moore.exercise1Desc'), difficulty: 'easy', icon: ToggleLeft },
    { title: t('moore.exercise2'), description: t('moore.exercise2Desc'), difficulty: 'medium', icon: ToggleRight },
    { title: t('moore.exercise3'), description: t('moore.exercise3Desc'), difficulty: 'medium', icon: ArrowRightLeft },
    { title: t('moore.exercise4'), description: t('moore.exercise4Desc'), difficulty: 'hard', icon: Repeat },
  ]

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 text-muted-foreground">
        <ClipboardList className="size-4" />
        <h3 className="text-sm font-bold">Current Exercises</h3>
      </div>
      <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
        {exercises.map((exercise, i) => (
          <ExerciseCard key={i} exercise={exercise} index={i} isFirst={i === 0} />
        ))}
      </div>
    </div>
  )
}

