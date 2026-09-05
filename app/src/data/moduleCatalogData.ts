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
        tutorialVideoUrl:
          "https://oc-stream.thws.de/static/mh_default_org/api/f2cab67e-deb0-4782-9c50-0637d42a0fea/0a59a17d-dba9-49de-967c-35fc72b14c78/Turingmaschine.mp4",
      },
      {
        id: "finite-automata",
        storageId: TOPIC_STORAGE_IDS.finiteAutomata,
        titleKey: "finite-automata.topic.title",
        descriptionKey: "finite-automata.topic.description",
        path: "/fundamentals-cs/finite-automata",
        icon: GitBranch,
        accent: "blue",
        tutorialVideoUrl:
          "https://oc-stream.thws.de/static/mh_default_org/api/e26956ef-d5cd-488e-86bb-c6f413983674/8af0bd95-c3fd-4314-bc4b-700787439c14/Endliche_Automaten_Walkthrough_Stimme.mp4",
      },
      {
        id: "regular-languages",
        storageId: TOPIC_STORAGE_IDS.regularLanguages,
        titleKey: "regular-languages.title",
        descriptionKey: "regular-languages.description",
        path: "/fundamentals-cs/regular-languages",
        icon: Languages,
        accent: "purple",
        tutorialVideoUrl:
          "https://oc-stream.thws.de/static/mh_default_org/api/0d1aa41b-7961-42a9-a63e-a8be0b0ee1e5/cd8e8a63-3d8b-4324-8b57-36d0468f03d8/Regulaere_Sprachen_Walkthrough_Stimme.mp4",
      },
      {
        id: "number-systems",
        storageId: TOPIC_STORAGE_IDS.numberSystems,
        titleKey: "number-systems.title",
        descriptionKey: "number-systems.description",
        path: "/fundamentals-cs/number-systems",
        icon: Hash,
        accent: "purple",
        tutorialVideoUrl:
          "https://oc-stream.thws.de/static/mh_default_org/api/e726391f-38f5-4207-8ff6-e32adeec2357/8a00c06f-5def-465b-80d3-9d905813099f/NumberSys.mp4",
      },
      {
        id: "moore-mealy",
        storageId: TOPIC_STORAGE_IDS.mooreMealy,
        titleKey: "moore-mealy.title",
        descriptionKey: "moore-mealy.description",
        path: "/fundamentals-cs/moore-mealy",
        icon: ToggleLeft,
        accent: "green",
        tutorialVideoUrl:
          "https://oc-stream.thws.de/static/mh_default_org/api/35415389-368d-4554-84fd-8a166a1924c3/29f4b8e4-b484-4195-8f16-b03d36e0dc4c/Moore_Mealy.mp4",
      },
      {
        id: "dnf",
        storageId: TOPIC_STORAGE_IDS.dnf,
        titleKey: "dnf.title",
        descriptionKey: "dnf.description",
        path: "/fundamentals-cs/dnf",
        icon: TableProperties,
        accent: "rose",
        tutorialVideoUrl:
          "https://oc-stream.thws.de/static/mh_default_org/api/b43e3e7c-5675-4280-9f3e-00189823bbe4/c02cf048-0577-4eb2-9dc8-6978397aa4dc/DNF.mp4",
      },
      {
        id: "encoding",
        storageId: TOPIC_STORAGE_IDS.encoding,
        titleKey: "encoding.title",
        descriptionKey: "encoding.description",
        path: "/fundamentals-cs/encoding",
        icon: Code2,
        accent: "blue",
        tutorialVideoUrl:
          "https://oc-stream.thws.de/static/mh_default_org/api/4d18e2f3-2be3-464a-8116-a2421648bf67/e3aac70a-1839-41b6-99bd-36fbd7059833/encoding.mp4",
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
        tutorialVideoUrl:
          "https://oc-stream.thws.de/static/mh_default_org/api/a07b549a-be18-4662-a5f3-d8aed3bf8c3d/f6863cae-b648-4bcf-b13d-a3869a4512b3/Java.mp4",
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
