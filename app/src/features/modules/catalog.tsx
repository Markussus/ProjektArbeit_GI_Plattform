import type { ReactElement } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Cpu,
  GitBranch,
  Hash,
  Layers3,
  TableProperties,
  ToggleLeft,
} from "lucide-react";
import { DnfPage as DnfTopicPage } from "@/pages/FundamentalsCS/Dnf/DnfPage";
import { FiniteAutomataPage as FiniteAutomataTopicPage } from "@/pages/FundamentalsCS/FiniteAutomata/FiniteAutomataPage";
import { MooreMealyPage as MooreMealyTopicPage } from "@/pages/FundamentalsCS/MooreMealy/MooreMealyPage";
import { NumberSystemsPage as NumberSystemsTopicPage } from "@/pages/FundamentalsCS/NumberSystems/NumberSystemsPage";
import { TuringMachinePage as TuringMachineTopicPage } from "@/pages/FundamentalsCS/TuringMachine/TuringMachinePage";

export type TopicAccent = "orange" | "blue" | "purple" | "green" | "rose";

export interface ModuleTopicDefinition {
  id: string;
  titleKey: string;
  descriptionKey?: string;
  path: string;
  icon: LucideIcon;
  accent: TopicAccent;
  element: ReactElement;
}

export interface LearningModuleDefinition {
  id: string;
  titleKey: string;
  descriptionKey: string;
  path: string;
  icon: LucideIcon;
  topics: ModuleTopicDefinition[];
}

export const learningModules: LearningModuleDefinition[] = [
  {
    id: "fundamentals-cs",
    titleKey: "modules.fundamentalsCs.title",
    descriptionKey: "modules.fundamentalsCs.description",
    path: "/fundamentals-cs",
    icon: Layers3,
    topics: [
      {
        id: "turing-machine",
        titleKey: "turing.title",
        descriptionKey: "turing.description",
        path: "/fundamentals-cs/turing-machine",
        icon: Cpu,
        accent: "orange",
        element: <TuringMachineTopicPage />,
      },
      {
        id: "finite-automata",
        titleKey: "automata.title",
        descriptionKey: "automata.description",
        path: "/fundamentals-cs/finite-automata",
        icon: GitBranch,
        accent: "blue",
        element: <FiniteAutomataTopicPage />,
      },
      {
        id: "number-systems",
        titleKey: "number.title",
        descriptionKey: "number.description",
        path: "/fundamentals-cs/number-systems",
        icon: Hash,
        accent: "purple",
        element: <NumberSystemsTopicPage />,
      },
      {
        id: "moore-mealy",
        titleKey: "moore.title",
        descriptionKey: "moore.description",
        path: "/fundamentals-cs/moore-mealy",
        icon: ToggleLeft,
        accent: "green",
        element: <MooreMealyTopicPage />,
      },
      {
        id: "dnf",
        titleKey: "dnf.title",
        descriptionKey: "dnf.description",
        path: "/fundamentals-cs/dnf",
        icon: TableProperties,
        accent: "rose",
        element: <DnfTopicPage />,
      },
    ],
  },
];

export const learningTopicRoutes = learningModules.flatMap((module) =>
  module.topics.map((topic) => ({
    path: topic.path,
    element: topic.element,
  })),
);

export function findModuleByPath(pathname: string) {
  return learningModules.find(
    (module) =>
      pathname === module.path ||
      module.topics.some((topic) => pathname === topic.path),
  );
}
