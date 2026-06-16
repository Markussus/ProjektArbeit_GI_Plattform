/* eslint-disable react-refresh/only-export-components */
import { lazy, type ReactElement } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Code2,
  Coffee,
  Cpu,
  GitBranch,
  Hash,
  Languages,
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
const RegularLanguagesTopicPage = lazy(async () => ({
  default: (
    await import("@/pages/FundamentalsCS/RegularLanguages/RegularLanguagesPage")
  ).RegularLanguagesPage,
}));
const TuringMachineTopicPage = lazy(async () => ({
  default: (
    await import("@/pages/FundamentalsCS/TuringMachine/TuringMachinePage")
  ).TuringMachinePage,
}));
const EncodingTopicPage = lazy(async () => ({
  default: (await import("@/pages/FundamentalsCS/Encoding/EncodingPage"))
    .EncodingPage,
}));
const JavaProgrammingTopicPage = lazy(async () => ({
  default: (await import("@/pages/Programming1/Java/JavaProgrammingPage"))
    .JavaProgrammingPage,
}));

export type TopicAccent = "orange" | "blue" | "purple" | "green" | "rose";

export const TOPIC_STORAGE_IDS = {
  turingMachine: 0,
  finiteAutomata: 1,
  regularLanguages: 2,
  numberSystems: 3,
  mooreMealy: 4,
  dnf: 5,
  encoding: 6,
  javaProgramming: 7,
} as const;

export const DEFAULT_TUTORIAL_VIDEO_URL =
  "https://oc-stream.thws.de/static/mh_default_org/api/fc50e633-53d5-4c66-a1ac-9bd74d5ec83d/ebe5bb19-e657-47dd-87c0-8d156efbe342/block_opencast_video_upload2WyzUn_TM_Video.mp4";

export interface ModuleTopicDefinition {
  id: string;
  storageId: number;
  titleKey: TranslationKey;
  descriptionKey?: TranslationKey;
  path: string;
  icon: LucideIcon;
  accent: TopicAccent;
  tutorialVideoUrl: string;
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
        storageId: TOPIC_STORAGE_IDS.turingMachine,
        titleKey: "tm.topic.title",
        descriptionKey: "tm.topic.description",
        path: "/fundamentals-cs/turing-machine",
        icon: Cpu,
        accent: "orange",
        tutorialVideoUrl: DEFAULT_TUTORIAL_VIDEO_URL,
        element: <TuringMachineTopicPage />,
      },
      {
        id: "finite-automata",
        storageId: TOPIC_STORAGE_IDS.finiteAutomata,
        titleKey: "automata.title",
        descriptionKey: "automata.description",
        path: "/fundamentals-cs/finite-automata",
        icon: GitBranch,
        accent: "blue",
        tutorialVideoUrl: DEFAULT_TUTORIAL_VIDEO_URL,
        element: <FiniteAutomataTopicPage />,
      },
      {
        id: "regular-languages",
        storageId: TOPIC_STORAGE_IDS.regularLanguages,
        titleKey: "rl.title",
        descriptionKey: "rl.description",
        path: "/fundamentals-cs/regular-languages",
        icon: Languages,
        accent: "purple",
        tutorialVideoUrl: DEFAULT_TUTORIAL_VIDEO_URL,
        element: <RegularLanguagesTopicPage />,
      },
      {
        id: "number-systems",
        storageId: TOPIC_STORAGE_IDS.numberSystems,
        titleKey: "number.title",
        descriptionKey: "number.description",
        path: "/fundamentals-cs/number-systems",
        icon: Hash,
        accent: "purple",
        tutorialVideoUrl: DEFAULT_TUTORIAL_VIDEO_URL,
        element: <NumberSystemsTopicPage />,
      },
      {
        id: "moore-mealy",
        storageId: TOPIC_STORAGE_IDS.mooreMealy,
        titleKey: "moore.title",
        descriptionKey: "moore.description",
        path: "/fundamentals-cs/moore-mealy",
        icon: ToggleLeft,
        accent: "green",
        tutorialVideoUrl: DEFAULT_TUTORIAL_VIDEO_URL,
        element: <MooreMealyTopicPage />,
      },
      {
        id: "dnf",
        storageId: TOPIC_STORAGE_IDS.dnf,
        titleKey: "dnf.title",
        descriptionKey: "dnf.description",
        path: "/fundamentals-cs/dnf",
        icon: TableProperties,
        accent: "rose",
        tutorialVideoUrl: DEFAULT_TUTORIAL_VIDEO_URL,
        element: <DnfTopicPage />,
      },
      {
        id: "encoding",
        storageId: TOPIC_STORAGE_IDS.encoding,
        titleKey: "encoding.title",
        descriptionKey: "encoding.description",
        path: "/fundamentals-cs/encoding",
        icon: Code2,
        accent: "blue",
        tutorialVideoUrl: DEFAULT_TUTORIAL_VIDEO_URL,
        element: <EncodingTopicPage />,
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
        storageId: TOPIC_STORAGE_IDS.javaProgramming,
        titleKey: "java.title",
        descriptionKey: "java.description",
        path: "/programming-1/java-programming",
        icon: Coffee,
        accent: "orange",
        tutorialVideoUrl: DEFAULT_TUTORIAL_VIDEO_URL,
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

export function findTopicById(topicId: string) {
  return learningModules
    .flatMap((module) => module.topics)
    .find((topic) => topic.id === topicId);
}
