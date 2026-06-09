import { describe, expect, it } from "vitest";
import { faProgramTransferCodec } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faProgramTransfer";
import {
  EPSILON,
  type FAProgram,
} from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faTypes";
import {
  defaultDFAProgram,
  defaultNFAProgram,
} from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/config/defaultFAProgram";

const BASE64_URL_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

describe("Finite Automata program transfer codec", () => {
  it("round-trips a registry-symbol DFA in canonical form", async () => {
    const exportedValue =
      await faProgramTransferCodec.exportValue(defaultDFAProgram);
    const importedProgram =
      await faProgramTransferCodec.importValue(exportedValue);

    expect(exportedValue).toMatch(/^[A-Za-z0-9_-]+$/u);
    expect(readModes(exportedValue).symbolMode).toBe(0);
    expect(importedProgram).toEqual({
      type: "DFA",
      states: ["S0", "S1", "S2"],
      alphabet: ["a", "b"],
      startState: "S0",
      acceptStates: ["S2"],
      transitions: {
        S0: { a: ["S1"], b: ["S0"] },
        S1: { a: ["S1"], b: ["S2"] },
        S2: { a: ["S1"], b: ["S0"] },
      },
    });
  });

  it("round-trips an NFA with multiple targets per cell", async () => {
    const exportedValue =
      await faProgramTransferCodec.exportValue(defaultNFAProgram);
    const importedProgram =
      await faProgramTransferCodec.importValue(exportedValue);

    expect(importedProgram).toEqual({
      type: "NFA",
      states: ["S0", "S1", "S2"],
      alphabet: ["a", "b"],
      startState: "S0",
      acceptStates: ["S2"],
      transitions: {
        S0: { a: ["S0", "S1"], b: ["S0"] },
        S1: { b: ["S2"] },
        S2: {},
      },
    });
  });

  it("round-trips epsilon transitions in an NFA", async () => {
    const program: FAProgram = {
      type: "NFA",
      states: ["S0", "S1"],
      alphabet: ["a"],
      startState: "S0",
      acceptStates: ["S1"],
      transitions: {
        S0: { [EPSILON]: ["S1"], a: ["S0"] },
        S1: {},
      },
    };

    const exportedValue = await faProgramTransferCodec.exportValue(program);
    const importedProgram =
      await faProgramTransferCodec.importValue(exportedValue);

    expect(importedProgram.transitions.S0[EPSILON]).toEqual(["S1"]);
    expect(importedProgram.transitions.S0.a).toEqual(["S0"]);
  });

  it("renames states canonically with the start state first", async () => {
    const program: FAProgram = {
      type: "DFA",
      states: ["mid", "start", "accept"],
      alphabet: ["0", "1"],
      startState: "start",
      acceptStates: ["accept"],
      transitions: {
        start: { "0": ["mid"], "1": ["start"] },
        mid: { "0": ["accept"], "1": ["start"] },
        accept: { "0": ["accept"], "1": ["accept"] },
      },
    };

    const exportedValue = await faProgramTransferCodec.exportValue(program);
    const importedProgram =
      await faProgramTransferCodec.importValue(exportedValue);

    expect(importedProgram.states).toEqual(["S0", "S1", "S2"]);
    expect(importedProgram.startState).toBe("S0");
    expect(importedProgram.acceptStates).toEqual(["S2"]);
    expect(importedProgram.transitions.S0).toEqual({
      "0": ["S1"],
      "1": ["S0"],
    });
  });

  it("uses raw UTF-8 mode for symbols outside the registry", async () => {
    // Multi-byte symbols outside the registry: lambda (2-byte) and a smiley
    // (4-byte). Written as escapes so the source stays ASCII-only.
    const lambda = "\u03BB";
    const smiley = "\u{1F642}";
    const program: FAProgram = {
      type: "DFA",
      states: ["S0", "S1"],
      alphabet: [lambda, smiley],
      startState: "S0",
      acceptStates: ["S1"],
      transitions: {
        S0: { [lambda]: ["S1"], [smiley]: ["S0"] },
        S1: {},
      },
    };

    const exportedValue = await faProgramTransferCodec.exportValue(program);
    const importedProgram =
      await faProgramTransferCodec.importValue(exportedValue);

    expect(readModes(exportedValue).symbolMode).toBe(1);
    expect(importedProgram.alphabet).toEqual([lambda, smiley]);
    expect(importedProgram.transitions.S0).toEqual({
      [lambda]: ["S1"],
      [smiley]: ["S0"],
    });
  });

  it("accepts transfer strings with surrounding whitespace", async () => {
    const exportedValue =
      await faProgramTransferCodec.exportValue(defaultDFAProgram);

    await expect(
      faProgramTransferCodec.importValue(` \n${exportedValue}\n `),
    ).resolves.toMatchObject({ states: ["S0", "S1", "S2"] });
  });

  it("rejects malformed payloads", async () => {
    await expect(
      faProgramTransferCodec.importValue("not.a.base64url.payload"),
    ).rejects.toThrow("fa_transfer_payload_invalid");
    await expect(faProgramTransferCodec.importValue("")).rejects.toThrow(
      "fa_transfer_payload_invalid",
    );
  });

  it("rejects programs that the compact format cannot represent", async () => {
    const missingStartState: FAProgram = {
      ...defaultDFAProgram,
      startState: "nope",
    };

    await expect(
      faProgramTransferCodec.exportValue(missingStartState),
    ).rejects.toThrow("fa_transfer_program_invalid");
  });
});

function readModes(value: string): {
  symbolMode: number;
  transitionMode: number;
} {
  const bits = Array.from(value).flatMap((character) => {
    const valueIndex = BASE64_URL_ALPHABET.indexOf(character);
    return Array.from(
      { length: 6 },
      (_, bitIndex) => Math.floor(valueIndex / 2 ** (5 - bitIndex)) % 2,
    );
  });
  let offset = 0;

  // Skip the two leading varuints (state count, symbol count).
  for (let field = 0; field < 2; field++) {
    while (true) {
      const byte = readBits(bits, offset, 8);
      offset += 8;
      if (byte < 128) {
        break;
      }
    }
  }

  // typeBit, then symbolMode, then transitionMode.
  return {
    symbolMode: readBits(bits, offset + 1, 1),
    transitionMode: readBits(bits, offset + 2, 1),
  };
}

function readBits(bits: number[], offset: number, length: number): number {
  return bits
    .slice(offset, offset + length)
    .reduce((value, bit) => value * 2 + bit, 0);
}
