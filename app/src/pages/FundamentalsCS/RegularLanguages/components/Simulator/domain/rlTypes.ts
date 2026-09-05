import type {
  RegularGrammar,
  ProductionRule,
} from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faTypes";

export type { RegularGrammar, ProductionRule };

export type RegexNode =
  | { kind: "empty" }
  | { kind: "epsilon" }
  | { kind: "symbol"; value: string }
  | { kind: "concat"; left: RegexNode; right: RegexNode }
  | { kind: "union"; left: RegexNode; right: RegexNode }
  | { kind: "star"; child: RegexNode };

export type SimulationMode =
  "grammarToLanguage" | "languageToGrammar" | "recognizeWord";
