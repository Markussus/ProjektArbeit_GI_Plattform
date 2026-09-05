import type { ISimulatorTransferCodec } from "@/types/simulatorTransfer";
import {
  BitReader,
  BitWriter,
  assertCollectionSize,
  assertIdInRange,
  createSymbolDictionaryCodec,
} from "@/lib/trainingCenter";
import type {
  ProductionRule,
  RegularGrammar,
} from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faTypes";
import { formatGrammar } from "./rlRegexToGrammar";
import { parseGrammar } from "./rlGrammarValidation";
import { NON_TERMINAL_NAMES, nonTerminalName } from "./rlGrammarNaming";

const GRAMMAR_INVALID = "rl_transfer_grammar_invalid";
const PAYLOAD_INVALID = "rl_transfer_payload_invalid";

const symbolDictionary = createSymbolDictionaryCodec({
  // Covers the terminals real grammars use (binary digits, low letters) so the
  // registry mask beats raw UTF-8.
  registry: [
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
  ],
  payloadError: PAYLOAD_INVALID,
});

interface NormalizedProduction {
  lhsId: number;
  terminalId: number;
  nextNonTerminalId: number | null;
}

interface NormalizedGrammar {
  nonTerminalCount: number;
  terminals: string[];
  epsilonMask: boolean[];
  productions: NormalizedProduction[];
}

/**
 * Compact, shareable transfer codec for right-linear regular grammars. Works on
 * the grammar source text: export parses + encodes it, import decodes and
 * re-renders canonical source. Mirrors the Finite Automata transfer codec.
 */
export const rlGrammarTransferCodec: ISimulatorTransferCodec<string> = {
  async exportValue(source) {
    const normalizedGrammar = normalizeGrammar(source);
    const writer = new BitWriter(GRAMMAR_INVALID);
    const symbolMode = symbolDictionary.chooseMode(normalizedGrammar.terminals);

    writer.writeVarUint(normalizedGrammar.nonTerminalCount);
    writer.writeVarUint(normalizedGrammar.terminals.length);
    writer.writeVarUint(normalizedGrammar.productions.length);
    writer.writeBits(symbolMode, 1);

    for (const isEpsilonProducing of normalizedGrammar.epsilonMask) {
      writer.writeBit(isEpsilonProducing ? 1 : 0);
    }

    symbolDictionary.write(writer, normalizedGrammar.terminals, symbolMode);

    const ntBits = bitsNeeded(normalizedGrammar.nonTerminalCount);
    const terminalBits = bitsNeeded(normalizedGrammar.terminals.length);
    for (const production of normalizedGrammar.productions) {
      writer.writeBits(production.lhsId, ntBits);
      writer.writeBits(production.terminalId, terminalBits);
      if (production.nextNonTerminalId === null) {
        writer.writeBit(0);
      } else {
        writer.writeBit(1);
        writer.writeBits(production.nextNonTerminalId, ntBits);
      }
    }

    return writer.toBase64Url();
  },
  async importValue(serializedValue) {
    return formatGrammar(decodeGrammar(serializedValue.trim()));
  },
};

function normalizeGrammar(source: string): NormalizedGrammar {
  const parsed = parseGrammar(source);
  if (!parsed.ok || !parsed.grammar) {
    throw new Error(GRAMMAR_INVALID);
  }

  const grammar = parsed.grammar;
  if (
    grammar.nonTerminals.length === 0 ||
    !grammar.nonTerminals.includes(grammar.startSymbol)
  ) {
    throw new Error(GRAMMAR_INVALID);
  }

  // Non-terminal ID 0 is always the start symbol; the rest keep their order.
  const orderedNonTerminals = [
    grammar.startSymbol,
    ...grammar.nonTerminals.filter((name) => name !== grammar.startSymbol),
  ];
  const nonTerminalIds = new Map(
    orderedNonTerminals.map((name, index) => [name, index]),
  );

  const symbolMode = symbolDictionary.chooseMode(grammar.terminals);
  const terminals = symbolDictionary.order(grammar.terminals, symbolMode);
  const terminalIds = new Map(
    terminals.map((symbol, index) => [symbol, index]),
  );

  const epsilonSet = new Set(grammar.epsilonProducingNonTerminals ?? []);
  const epsilonMask = orderedNonTerminals.map((name) => epsilonSet.has(name));

  const productions = grammar.productions.map((rule) =>
    normalizeProduction(rule, nonTerminalIds, terminalIds),
  );

  return {
    nonTerminalCount: orderedNonTerminals.length,
    terminals,
    epsilonMask,
    productions,
  };
}

function normalizeProduction(
  rule: ProductionRule,
  nonTerminalIds: Map<string, number>,
  terminalIds: Map<string, number>,
): NormalizedProduction {
  return {
    lhsId: getRequiredMapValue(nonTerminalIds, rule.lhs),
    terminalId: getRequiredMapValue(terminalIds, rule.terminal),
    nextNonTerminalId:
      rule.nextNonTerminal === null
        ? null
        : getRequiredMapValue(nonTerminalIds, rule.nextNonTerminal),
  };
}

function decodeGrammar(serializedGrammar: string): RegularGrammar {
  try {
    return decodeGrammarUnsafe(serializedGrammar);
  } catch {
    throw new Error(PAYLOAD_INVALID);
  }
}

function decodeGrammarUnsafe(serializedGrammar: string): RegularGrammar {
  const reader = BitReader.fromBase64Url(serializedGrammar, PAYLOAD_INVALID);
  const nonTerminalCount = reader.readVarUint();
  const terminalCount = reader.readVarUint();
  const productionCount = reader.readVarUint();

  assertCollectionSize(nonTerminalCount, PAYLOAD_INVALID);
  assertCollectionSize(terminalCount, PAYLOAD_INVALID);
  assertCollectionSize(productionCount, PAYLOAD_INVALID);

  if (nonTerminalCount < 1) {
    throw new Error(PAYLOAD_INVALID);
  }

  const symbolMode = reader.readBits(1);
  const epsilonMask = Array.from(
    { length: nonTerminalCount },
    () => reader.readBit() === 1,
  );
  const terminals = symbolDictionary.read(reader, symbolMode, terminalCount);

  const ntBits = bitsNeeded(nonTerminalCount);
  const terminalBits = bitsNeeded(terminalCount);
  const names = createCanonicalNonTerminalNames(nonTerminalCount);

  const productions = Array.from(
    { length: productionCount },
    (): ProductionRule => {
      const lhsId = reader.readBits(ntBits);
      const terminalId = reader.readBits(terminalBits);
      const hasNext = reader.readBit() === 1;
      const nextId = hasNext ? reader.readBits(ntBits) : null;

      assertIdInRange(lhsId, nonTerminalCount, PAYLOAD_INVALID);
      assertIdInRange(terminalId, terminalCount, PAYLOAD_INVALID);
      if (nextId !== null) {
        assertIdInRange(nextId, nonTerminalCount, PAYLOAD_INVALID);
      }

      return {
        lhs: names[lhsId],
        terminal: terminals[terminalId],
        nextNonTerminal: nextId === null ? null : names[nextId],
      };
    },
  );

  reader.assertOnlyPaddingRemains();

  return {
    nonTerminals: names,
    terminals,
    startSymbol: names[0],
    productions,
    epsilonProducingNonTerminals: names.filter((_, ntId) => epsilonMask[ntId]),
  };
}

/** ID 0 is the start symbol "S", then the remaining uppercase letters. */
function createCanonicalNonTerminalNames(count: number): string[] {
  return Array.from({ length: count }, (_, ntId) =>
    ntId === 0 ? NON_TERMINAL_NAMES.start : nonTerminalName(ntId - 1),
  );
}

function bitsNeeded(count: number): number {
  return count <= 1 ? 0 : Math.floor(Math.log2(count - 1)) + 1;
}

function getRequiredMapValue<TKey, TValue>(
  map: Map<TKey, TValue>,
  key: TKey,
): TValue {
  const value = map.get(key);
  if (value === undefined) {
    throw new Error(GRAMMAR_INVALID);
  }
  return value;
}
