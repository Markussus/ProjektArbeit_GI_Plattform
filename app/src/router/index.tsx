import { createBrowserRouter } from 'react-router-dom'
import { MainLayout } from '@/layouts/MainLayout/MainLayout'
import { HomePage } from '@/pages/Home/HomePage'
import { TuringMachinePage } from '@/pages/TuringMachine/TuringMachinePage'
import { FiniteAutomataPage } from '@/pages/FiniteAutomata/FiniteAutomataPage'
import { NumberSystemsPage } from '@/pages/NumberSystems/NumberSystemsPage'
import { MooreMealyPage } from '@/pages/MooreMealy/MooreMealyPage'
import { DnfPage } from '@/pages/Dnf/DnfPage'

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/turing-machine', element: <TuringMachinePage /> },
      { path: '/finite-automata', element: <FiniteAutomataPage /> },
      { path: '/number-systems', element: <NumberSystemsPage /> },
      { path: '/moore-mealy', element: <MooreMealyPage /> },
      { path: '/dnf', element: <DnfPage /> },
    ],
  },
])

