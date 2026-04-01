import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/shared/PageHeader/PageHeader'
import { TabNavigation } from '@/components/shared/TabNavigation/TabNavigation'
import { OverviewTab } from './components/OverviewTab'
import { ExercisesTab } from './components/ExercisesTab'
import { ExamplesTab } from './components/ExamplesTab'
import { SimulationTab } from './components/SimulationTab'

export function NumberSystemsPage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="p-8">
      <PageHeader
        title={t('number.title')}
        description={t('number.description')}
      />
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'exercises' && <ExercisesTab />}
      {activeTab === 'examples' && <ExamplesTab />}
      {activeTab === 'simulation' && <SimulationTab />}
    </div>
  )
}
