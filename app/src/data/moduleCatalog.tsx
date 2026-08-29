/* eslint-disable react-refresh/only-export-components */
import { lazy } from "react";
import { learningModules } from "./moduleCatalogData";

export * from "./moduleCatalogData";

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

const modulePageElements: Record<string, React.ReactElement> = {
  "fundamentals-cs": <FundamentalsCSPage />,
  "programming-1": <Programming1Page />,
};

const topicPageElements: Record<string, React.ReactElement> = {
  "turing-machine": <TuringMachineTopicPage />,
  "finite-automata": <FiniteAutomataTopicPage />,
  "regular-languages": <RegularLanguagesTopicPage />,
  "number-systems": <NumberSystemsTopicPage />,
  "moore-mealy": <MooreMealyTopicPage />,
  dnf: <DnfTopicPage />,
  encoding: <EncodingTopicPage />,
  "java-programming": <JavaProgrammingTopicPage />,
};

const learningModuleRoutes = learningModules.map((module) => ({
  path: module.path,
  element: modulePageElements[module.id],
}));

export const learningTopicRoutes = learningModules.flatMap((module) =>
  module.topics.map((topic) => ({
    path: topic.path,
    element: topicPageElements[topic.id],
  })),
);

export const learningRoutes = [...learningModuleRoutes, ...learningTopicRoutes];
