import { useState } from "react";
import { useTranslation } from "react-i18next";
import type {
  RegularGrammar,
  ProductionRule,
  FAProgram,
} from "../domain/faTypes";
import {
  grammarToAutomaton,
  validateRegularGrammar,
} from "../domain/faGrammarConversion";

interface FAGrammarInputProps {
  onConvert: (program: FAProgram) => void;
}

const defaultGrammar: RegularGrammar = {
  nonTerminals: ["S", "A", "B"],
  terminals: ["a", "b"],
  startSymbol: "S",
  productions: [
    { lhs: "S", terminal: "a", nextNonTerminal: "A" },
    { lhs: "S", terminal: "b", nextNonTerminal: "S" },
    { lhs: "A", terminal: "a", nextNonTerminal: "B" },
    { lhs: "A", terminal: "b", nextNonTerminal: "S" },
    { lhs: "B", terminal: "a", nextNonTerminal: "B" },
    { lhs: "B", terminal: "b", nextNonTerminal: null },
  ],
};

export function FAGrammarInput({ onConvert }: FAGrammarInputProps) {
  const { t } = useTranslation();
  const [nonTerminals, setNonTerminals] = useState(
    defaultGrammar.nonTerminals.join(", "),
  );
  const [terminals, setTerminals] = useState(
    defaultGrammar.terminals.join(", "),
  );
  const [startSymbol, setStartSymbol] = useState(defaultGrammar.startSymbol);
  const [productionText, setProductionText] = useState(
    defaultGrammar.productions
      .map((p) => `${p.lhs} → ${p.terminal}${p.nextNonTerminal ?? ""}`)
      .join("\n"),
  );
  const [errors, setErrors] = useState<string[]>([]);

  const parseCSV = (s: string) =>
    s
      .split(",")
      .map((x) => x.trim())
      .filter((x) => x.length > 0);

  const parseProductions = (text: string): ProductionRule[] => {
    const rules: ProductionRule[] = [];
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    for (const line of lines) {
      // Parse "A → aB" or "A -> aB" or "A → a"
      const match = line.match(/^(\S+)\s*(?:→|->)\s*(\S+)$/);
      if (!match) continue;

      const lhs = match[1];
      const rhs = match[2];

      if (rhs.length === 1) {
        rules.push({ lhs, terminal: rhs, nextNonTerminal: null });
      } else if (rhs.length === 2) {
        rules.push({ lhs, terminal: rhs[0], nextNonTerminal: rhs[1] });
      } else {
        // Try to split: first char is terminal, rest is non-terminal
        const terminal = rhs[0];
        const nt = rhs.slice(1);
        rules.push({ lhs, terminal, nextNonTerminal: nt });
      }
    }

    return rules;
  };

  const handleConvert = () => {
    const grammar: RegularGrammar = {
      nonTerminals: parseCSV(nonTerminals),
      terminals: parseCSV(terminals),
      startSymbol: startSymbol.trim(),
      productions: parseProductions(productionText),
    };

    const validationErrors = validateRegularGrammar(grammar);
    if (validationErrors.length > 0) {
      setErrors(validationErrors.map((code) => t(`fa.grammar.${code}`, code)));
      return;
    }

    setErrors([]);
    const automaton = grammarToAutomaton(grammar);
    onConvert(automaton);
  };

  const inputClass =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:outline-none";
  const labelClass = "text-sm font-medium";

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-bold">
        {t("fa.grammar.title", "Regular Grammar → Automaton")}
      </h3>

      {errors.length > 0 && (
        <div className="bg-destructive/10 text-destructive rounded-md border border-current/20 p-3 text-sm">
          {errors.join("\n")}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className={labelClass}>
            {t("fa.grammar.nonTerminals", "Non-Terminals (comma-separated)")}
          </label>
          <input
            type="text"
            value={nonTerminals}
            onChange={(e) => setNonTerminals(e.target.value)}
            className={inputClass}
            placeholder="S, A, B"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass}>
            {t("fa.grammar.terminals", "Terminals (comma-separated)")}
          </label>
          <input
            type="text"
            value={terminals}
            onChange={(e) => setTerminals(e.target.value)}
            className={inputClass}
            placeholder="a, b"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass}>
            {t("fa.grammar.startSymbol", "Start Symbol")}
          </label>
          <input
            type="text"
            value={startSymbol}
            onChange={(e) => setStartSymbol(e.target.value)}
            className={inputClass}
            placeholder="S"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass}>
          {t(
            "fa.grammar.productions",
            "Production Rules (one per line, e.g. S → aA)",
          )}
        </label>
        <textarea
          value={productionText}
          onChange={(e) => setProductionText(e.target.value)}
          className={`${inputClass} min-h-[120px] font-mono`}
          placeholder={"S → aA\nA → bB\nB → a"}
        />
      </div>

      <button
        onClick={handleConvert}
        className="bg-brand text-brand-foreground self-start rounded-md px-4 py-2 hover:opacity-90"
      >
        {t("fa.grammar.convert", "Convert to Automaton")}
      </button>
    </div>
  );
}
