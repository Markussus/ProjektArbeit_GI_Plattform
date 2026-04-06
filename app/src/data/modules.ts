import type { LucideIcon } from "lucide-react";
import {
  Cpu,
  GitBranch,
  Hash,
  ToggleLeft,
  TableProperties,
  Layers3,
} from "lucide-react";

export type TopicAccent = "orange" | "blue" | "purple" | "green" | "rose";

export interface ModuleTopic {
  id: string;
  titleKey: string;
  descriptionKey?: string;
  path: string;
  icon: LucideIcon;
  accent: TopicAccent;
}

export interface LearningModule {
  id: string;
  titleKey: string;
  descriptionKey: string;
  path: string;
  icon: LucideIcon;
  topics: ModuleTopic[];
}

export const learningModules: LearningModule[] = [
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
      },
      {
        id: "finite-automata",
        titleKey: "automata.title",
        descriptionKey: "automata.description",
        path: "/fundamentals-cs/finite-automata",
        icon: GitBranch,
        accent: "blue",
      },
      {
        id: "number-systems",
        titleKey: "number.title",
        descriptionKey: "number.description",
        path: "/fundamentals-cs/number-systems",
        icon: Hash,
        accent: "purple",
      },
      {
        id: "moore-mealy",
        titleKey: "moore.title",
        descriptionKey: "moore.description",
        path: "/fundamentals-cs/moore-mealy",
        icon: ToggleLeft,
        accent: "green",
      },
      {
        id: "dnf",
        titleKey: "dnf.title",
        descriptionKey: "dnf.description",
        path: "/fundamentals-cs/dnf",
        icon: TableProperties,
        accent: "rose",
      },
    ],
  },
];
