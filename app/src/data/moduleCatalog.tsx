/* eslint-disable react-refresh/only-export-components */
import { lazy, type ReactElement } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Code2,
  Coffee,
  Cpu,
  GitBranch,
  Hash,
  Layers3,
  TableProperties,
  ToggleLeft,
} from "lucide-react";
import type { TranslationKey } from "@/types/i18n";

const FundamentalsCSPage = lazy(async () => ({
  default: (await import("@/pages/FundamentalsCS/FundamentalsCSPage"))
    .FundamentalsCSPage,
}));
const Programming1Page = lazy(async () => ({
  default: (await import("@/pages/Programming1/Programming1Page"))
    .Programming1Page,
}));
const DnfTopicPage = lazy(async () => ({
  default: (await import("@/pages/FundamentalsCS/Dnf/DnfPage")).DnfPage,
}));
const FiniteAutomataTopicPage = lazy(async () => ({
  default: (
    await import("@/pages/FundamentalsCS/FiniteAutomata/FiniteAutomataPage")
  ).FiniteAutomataPage,
}));
const MooreMealyTopicPage = lazy(async () => ({
  default: (await import("@/pages/FundamentalsCS/MooreMealy/MooreMealyPage"))
    .MooreMealyPage,
}));
const NumberSystemsTopicPage = lazy(async () => ({
  default: (
    await import("@/pages/FundamentalsCS/NumberSystems/NumberSystemsPage")
  ).NumberSystemsPage,
}));
const TuringMachineTopicPage = lazy(async () => ({
  default: (
    await import("@/pages/FundamentalsCS/TuringMachine/TuringMachinePage")
  ).TuringMachinePage,
}));
const JavaProgrammingTopicPage = lazy(async () => ({
  default: (await import("@/pages/Programming1/Java/JavaProgrammingPage"))
    .JavaProgrammingPage,
}));

export type TopicAccent = "orange" | "blue" | "purple" | "green" | "rose";

export interface ModuleTopicDefinition {
  id: string;
  titleKey: TranslationKey;
  descriptionKey?: TranslationKey;
  path: string;
  icon: LucideIcon;
  accent: TopicAccent;
  element: ReactElement;
}

export interface LearningModuleDefinition {
  id: string;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  path: string;
  icon: LucideIcon;
  element: ReactElement;
  topics: ModuleTopicDefinition[];
}

// The catalog is the single source of truth for both navigation UI and route generation.
export const learningModules: LearningModuleDefinition[] = [
  {
    id: "fundamentals-cs",
    titleKey: "modules.fundamentalsCs.title",
    descriptionKey: "modules.fundamentalsCs.description",
    path: "/fundamentals-cs",
    icon: Layers3,
    element: <FundamentalsCSPage />,
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
  {
    id: "programming-1",
    titleKey: "modules.programming1.title",
    descriptionKey: "modules.programming1.description",
    path: "/programming-1",
    icon: Code2,
    element: <Programming1Page />,
    topics: [
      {
        id: "java-programming",
        titleKey: "java.title",
        descriptionKey: "java.description",
        path: "/programming-1/java-programming",
        icon: Coffee,
        accent: "orange",
        element: <JavaProgrammingTopicPage />,
      },
    ],
  },
];

const learningModuleRoutes = learningModules.map((module) => ({
  path: module.path,
  element: module.element,
}));

export const learningTopicRoutes = learningModules.flatMap((module) =>
  module.topics.map((topic) => ({
    path: topic.path,
    element: topic.element,
  })),
);

export const learningRoutes = [...learningModuleRoutes, ...learningTopicRoutes];

export function findModuleByPath(pathname: string) {
  // Topic pages inherit module context in the header/sidebar, so nested topic
  // paths also resolve back to their parent module definition here.
  return learningModules.find(
    (module) =>
      pathname === module.path ||
      module.topics.some((topic) => pathname === topic.path),
  );
}
