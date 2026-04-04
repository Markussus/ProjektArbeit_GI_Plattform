import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/shared/PageHeader/PageHeader'
import { TabNavigation } from '@/components/shared/TabNavigation/TabNavigation'
import { OverviewTab } from './components/OverviewTab'
import { ExercisesTab } from './components/ExercisesTab'
import { ExamplesTab } from './components/ExamplesTab'
import { SimulationTab } from './components/SimulationTab'
import type { Exercise } from '@/components/shared/ExerciseCard/ExerciseCard'

export function DnfPage() {
    const { t } = useTranslation()
    const [activeTab, setActiveTab] = useState('overview')
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
    const [simulationExercise, setSimulationExercise] = useState<Exercise | null>(null)

    const handleSelectExercise = (exercise: Exercise) => {
        setSelectedExercise((prev) => (prev?.title === exercise.title ? null : exercise))
    }

    const handleOpenExerciseInSimulation = (exercise: Exercise) => {
        setSelectedExercise(exercise)
        setSimulationExercise(exercise)
        setActiveTab('simulation')
    }

    return (
        <div className="p-8">
            <PageHeader
                title={t('dnf.title')}
                description={t('dnf.description')}
            />

            <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'exercises' && (
                <ExercisesTab
                    selectedExercise={selectedExercise}
                    onSelectExercise={handleSelectExercise}
                    onOpenExerciseInSimulation={handleOpenExerciseInSimulation}
                />
            )}
            {activeTab === 'examples' && <ExamplesTab />}
            {activeTab === 'simulation' && (
                <SimulationTab selectedExercise={simulationExercise} />
            )}
        </div>
    )
}