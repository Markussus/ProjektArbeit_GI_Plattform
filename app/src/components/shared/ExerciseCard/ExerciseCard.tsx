import type { LucideIcon } from 'lucide-react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Exercise {
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  icon: LucideIcon
}

interface ExerciseCardProps {
  exercise: Exercise
  index: number
  isFirst?: boolean
}

const difficultyTextColors = {
  easy: 'text-difficulty-easy',
  medium: 'text-difficulty-medium',
  hard: 'text-difficulty-hard',
}

const difficultyBorders = {
  easy: 'border-l-green-500',
  medium: 'border-l-orange-500',
  hard: 'border-l-red-500',
}

export function ExerciseCard({ exercise, index, isFirst }: ExerciseCardProps) {
  const Icon = exercise.icon

  return (
      <button
          type="button"
          className={cn(
              'flex w-full items-center gap-4 border-b border-border p-4 text-left hover:bg-muted/50',
              isFirst && 'border-l-[3px]',
              isFirst && difficultyBorders[exercise.difficulty]
          )}
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            Exercise {index + 1}: {exercise.title}
          </p>

          <p
              className={cn(
                  'text-xs font-bold uppercase tracking-wider',
                  difficultyTextColors[exercise.difficulty]
              )}
          >
            DIFFICULTY: {exercise.difficulty.toUpperCase()}
          </p>
        </div>

        {isFirst && <ChevronRight className="size-4 shrink-0 text-muted-foreground" />}
      </button>
  )
}