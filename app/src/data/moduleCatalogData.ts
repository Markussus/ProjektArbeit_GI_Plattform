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
import { TOPIC_STORAGE_IDS } from "./topicStorageIds";

export * from "./topicStorageIds";

export type TopicAccent = "orange" | "blue" | "purple" | "green" | "rose";

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
}

export interface LearningModuleDefinition {
  id: string;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  path: string;
  icon: LucideIcon;
  topics: ModuleTopicDefinition[];
}

// The catalog data is the single source of truth for navigation UI, metadata, and route configuration.
export const learningModules: LearningModuleDefinition[] = [
  {
    id: "fundamentals-cs",
    titleKey: "common.modules.fundamentalsCs.title",
    descriptionKey: "common.modules.fundamentalsCs.description",
    path: "/fundamentals-cs",
    icon: Layers3,
    topics: [
      {
        id: "turing-machine",
        storageId: TOPIC_STORAGE_IDS.turingMachine,
        titleKey: "turing-machine.topic.title",
        descriptionKey: "turing-machine.topic.description",
        path: "/fundamentals-cs/turing-machine",
        icon: Cpu,
        accent: "orange",
        tutorialVideoUrl: DEFAULT_TUTORIAL_VIDEO_URL,
      },
      {
        id: "finite-automata",
        storageId: TOPIC_STORAGE_IDS.finiteAutomata,
        titleKey: "finite-automata.topic.title",
        descriptionKey: "finite-automata.topic.description",
        path: "/fundamentals-cs/finite-automata",
        icon: GitBranch,
        accent: "blue",
        tutorialVideoUrl: DEFAULT_TUTORIAL_VIDEO_URL,
      },
      {
        id: "regular-languages",
        storageId: TOPIC_STORAGE_IDS.regularLanguages,
        titleKey: "regular-languages.title",
        descriptionKey: "regular-languages.description",
        path: "/fundamentals-cs/regular-languages",
        icon: Languages,
        accent: "purple",
        tutorialVideoUrl: DEFAULT_TUTORIAL_VIDEO_URL,
      },
      {
        id: "number-systems",
        storageId: TOPIC_STORAGE_IDS.numberSystems,
        titleKey: "number-systems.title",
        descriptionKey: "number-systems.description",
        path: "/fundamentals-cs/number-systems",
        icon: Hash,
        accent: "purple",
        tutorialVideoUrl: DEFAULT_TUTORIAL_VIDEO_URL,
      },
      {
        id: "moore-mealy",
        storageId: TOPIC_STORAGE_IDS.mooreMealy,
        titleKey: "moore-mealy.title",
        descriptionKey: "moore-mealy.description",
        path: "/fundamentals-cs/moore-mealy",
        icon: ToggleLeft,
        accent: "green",
        tutorialVideoUrl: DEFAULT_TUTORIAL_VIDEO_URL,
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
      },
    ],
  },
  {
    id: "programming-1",
    titleKey: "common.modules.programming1.title",
    descriptionKey: "common.modules.programming1.description",
    path: "/programming-1",
    icon: Code2,
    topics: [
      {
        id: "java-programming",
        storageId: TOPIC_STORAGE_IDS.javaProgramming,
        titleKey: "java-programming.title",
        descriptionKey: "java-programming.description",
        path: "/programming-1/java-programming",
        icon: Coffee,
        accent: "orange",
        tutorialVideoUrl: DEFAULT_TUTORIAL_VIDEO_URL,
      },
    ],
  },
];

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

export function findTopicByStorageId(topicStorageId: number) {
  return learningModules
    .flatMap((module) => module.topics)
    .find((topic) => topic.storageId === topicStorageId);
}

export function findTopicByPath(pathname: string) {
  return learningModules
    .flatMap((module) => module.topics)
    .find((topic) => topic.path === pathname);
}
