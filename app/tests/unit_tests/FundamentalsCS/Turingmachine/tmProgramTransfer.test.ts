import { describe, expect, it } from "vitest";
import { BitWriter } from "@/lib/trainingCenter/bitStream";
import {
  withDerivedAlphabets,
  type TMProgram,
} from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/domain/tmProgram";
import { tmProgramTransferCodec } from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/domain/tmProgramTransfer";
import {
  DEFAULT_BLANK_SYMBOL,
  type TMTransition,
} from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/domain/tmTypes";
import { defaultTMProgram } from "./fixtures/defaultTMProgram";

const BASE64_URL_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

describe("Turing Machine program transfer codec", () => {
  it("round-trips a registry-symbol program in canonical form", async () => {
    const exportedValue =
      await tmProgramTransferCodec.exportValue(defaultTMProgram);
    const importedProgram =
      await tmProgramTransferCodec.importValue(exportedValue);

    expect(exportedValue).toMatch(/^[A-Za-z0-9_-]+$/u);
    expect(readModes(exportedValue)).toEqual({
      symbolMode: 0,
      transitionMode: 0,
    });
    expect(importedProgram).toEqual(
      withDerivedAlphabets({
        states: ["q0", "qS"],
        inputAlphabet: [],
        tapeAlphabet: [DEFAULT_BLANK_SYMBOL, "0", "1"],
        blankSymbol: DEFAULT_BLANK_SYMBOL,
        initialState: "q0",
        haltStates: ["qS"],
        initialTape: ["0", "1", "1", "0"],
        transitions: defaultTMProgram.transitions,
      }),
    );
  });

  it("accepts transfer strings with surrounding whitespace", async () => {
    const exportedValue =
      await tmProgramTransferCodec.exportValue(defaultTMProgram);

    await expect(
      tmProgramTransferCodec.importValue(` \n${exportedValue}\n `),
    ).resolves.toMatchObject({
      states: ["q0", "qS"],
      initialTape: defaultTMProgram.initialTape,
    });
  });

  it("uses raw UTF-8 mode for symbols outside the registry", async () => {
    const program = createProgram({
      states: ["start", "halt"],
      haltStates: ["halt"],
      initialTape: ["λ", "🙂"],
      transitions: {
        λ: {
          start: transition("halt", "🙂", "R"),
        },
      },
    });

    const exportedValue = await tmProgramTransferCodec.exportValue(program);
    const importedProgram =
      await tmProgramTransferCodec.importValue(exportedValue);

    expect(readModes(exportedValue).symbolMode).toBe(1);
    expect(importedProgram.tapeAlphabet).toEqual([
      DEFAULT_BLANK_SYMBOL,
      "λ",
      "🙂",
    ]);
    expect(importedProgram.initialTape).toEqual(["λ", "🙂"]);
    expect(importedProgram.transitions.λ?.q0).toEqual(
      transition("qS", "🙂", "R"),
    );
  });

  it("drops unused names, states, halt states, and symbols", async () => {
    const program = createProgram({
      states: ["start", "unused", "work", "accept", "unusedHalt"],
      haltStates: ["accept", "unusedHalt"],
      initialTape: ["0"],
      tapeAlphabet: ["0", "X", DEFAULT_BLANK_SYMBOL],
      transitions: {
        "0": {
          start: transition("work", "1", "R"),
          work: transition("accept", "0", "N"),
        },
      },
    });

    const exportedValue = await tmProgramTransferCodec.exportValue(program);
    const importedProgram =
      await tmProgramTransferCodec.importValue(exportedValue);

    expect(importedProgram.states).toEqual(["q0", "q1", "qS"]);
    expect(importedProgram.haltStates).toEqual(["qS"]);
    expect(importedProgram.tapeAlphabet).toEqual([
      DEFAULT_BLANK_SYMBOL,
      "0",
      "1",
    ]);
    expect(importedProgram.transitions["0"]).toEqual({
      q0: transition("q1", "1", "R"),
      q1: transition("qS", "0", "N"),
    });
  });

  it("ignores transitions defined on halt states during normalization", async () => {
    const program = createProgram({
      states: ["start", "accept"],
      haltStates: ["accept"],
      initialTape: ["0"],
      transitions: {
        "0": {
          start: transition("accept", "1", "R"),
          accept: transition("accept", "0", "L"),
        },
      },
    });

    const exportedValue = await tmProgramTransferCodec.exportValue(program);
    const importedProgram =
      await tmProgramTransferCodec.importValue(exportedValue);

    expect(importedProgram.states).toEqual(["q0", "qS"]);
    expect(importedProgram.haltStates).toEqual(["qS"]);
    expect(importedProgram.transitions["0"]).toEqual({
      q0: transition("qS", "1", "R"),
    });
  });

  it("round-trips a partial program without halt states", async () => {
    const program = createProgram({
      states: ["start"],
      haltStates: [],
      initialTape: ["0"],
      transitions: {
        "0": {
          start: transition("start", "1", "R"),
        },
      },
    });

    const exportedValue = await tmProgramTransferCodec.exportValue(program);
    const importedProgram =
      await tmProgramTransferCodec.importValue(exportedValue);

    expect(importedProgram).toEqual(
      withDerivedAlphabets({
        states: ["q0"],
        inputAlphabet: [],
        tapeAlphabet: [DEFAULT_BLANK_SYMBOL, "0", "1"],
        blankSymbol: DEFAULT_BLANK_SYMBOL,
        initialState: "q0",
        haltStates: [],
        initialTape: ["0"],
        transitions: {
          "0": {
            q0: transition("q0", "1", "R"),
          },
        },
      }),
    );
  });

  it("round-trips an incomplete program without transitions", async () => {
    const program = createProgram({
      states: ["start"],
      haltStates: [],
      initialTape: [],
      transitions: {},
    });

    const exportedValue = await tmProgramTransferCodec.exportValue(program);

    await expect(
      tmProgramTransferCodec.importValue(exportedValue),
    ).resolves.toEqual(
      withDerivedAlphabets({
        states: ["q0"],
        inputAlphabet: [],
        tapeAlphabet: [DEFAULT_BLANK_SYMBOL],
        blankSymbol: DEFAULT_BLANK_SYMBOL,
        initialState: "q0",
        haltStates: [],
        initialTape: [],
        transitions: {},
      }),
    );
  });

  it.each([
    {
      name: "dense raw",
      expectedMode: 0,
      program: defaultTMProgram,
    },
    {
      name: "sparse raw",
      expectedMode: 1,
      program: createProgram({
        states: ["s0", "s1", "halt"],
        haltStates: ["halt"],
        initialTape: ["0"],
        transitions: {
          "0": {
            s0: transition("s1", "1", "R"),
          },
          "1": {
            s1: transition("halt", "0", "L"),
          },
        },
      }),
    },
    {
      name: "dense dictionary",
      expectedMode: 2,
      program: createRepeatedTransitionProgram(false),
    },
    {
      name: "sparse dictionary",
      expectedMode: 3,
      program: createRepeatedTransitionProgram(true),
    },
  ])(
    "chooses $name when it has the smallest payload",
    async ({ expectedMode, program }) => {
      const exportedValue = await tmProgramTransferCodec.exportValue(program);
      const importedProgram =
        await tmProgramTransferCodec.importValue(exportedValue);

      expect(readModes(exportedValue).transitionMode).toBe(expectedMode);
      expect(importedProgram.initialTape).toEqual(program.initialTape);
    },
  );

  it("rejects malformed payloads", async () => {
    await expect(
      tmProgramTransferCodec.importValue("not.a.base64url.payload"),
    ).rejects.toThrow("tm_transfer_payload_invalid");
    await expect(tmProgramTransferCodec.importValue("")).rejects.toThrow(
      "tm_transfer_payload_invalid",
    );
  });

  it("rejects programs with duplicate states or duplicate halt states", async () => {
    const duplicateStatesProgram: TMProgram = {
      ...defaultTMProgram,
      states: ["q0", "qS", "q0"],
    };
    const duplicateHaltProgram: TMProgram = {
      ...defaultTMProgram,
      haltStates: ["qS", "qS"],
    };

    await expect(
      tmProgramTransferCodec.exportValue(duplicateStatesProgram),
    ).rejects.toThrow("tm_transfer_program_invalid");
    await expect(
      tmProgramTransferCodec.exportValue(duplicateHaltProgram),
    ).rejects.toThrow("tm_transfer_program_invalid");
  });

  it("rejects programs with invalid transitions referencing undeclared states", async () => {
    const invalidTargetProgram: TMProgram = {
      ...defaultTMProgram,
      transitions: {
        "0": {
          q0: { nextState: "qMissing", writeSymbol: "1", movement: "R" },
        },
      },
    };

    await expect(
      tmProgramTransferCodec.exportValue(invalidTargetProgram),
    ).rejects.toThrow("tm_transfer_program_invalid");
  });

  it("rejects programs that the compact format cannot represent", async () => {
    const customBlankProgram = {
      ...defaultTMProgram,
      blankSymbol: "_",
    };
    const initialHaltProgram = {
      ...defaultTMProgram,
      initialState: "qS",
    };

    await expect(
      tmProgramTransferCodec.exportValue(customBlankProgram),
    ).rejects.toThrow("tm_transfer_program_invalid");
    await expect(
      tmProgramTransferCodec.exportValue(initialHaltProgram),
    ).rejects.toThrow("tm_transfer_program_invalid");
  });

  describe("restoreImportedProgram & readSymbolDictionary branch validation", () => {
    it("rejects payload with zero non-halt states or zero symbols", async () => {
      const writerZeroStates = new BitWriter();
      writerZeroStates.writeVarUint(0);
      writerZeroStates.writeVarUint(1);
      writerZeroStates.writeVarUint(1);
      writerZeroStates.writeVarUint(0);
      await expect(
        tmProgramTransferCodec.importValue(writerZeroStates.toBase64Url()),
      ).rejects.toThrow("tm_transfer_payload_invalid");

      const writerZeroSymbols = new BitWriter();
      writerZeroSymbols.writeVarUint(1);
      writerZeroSymbols.writeVarUint(1);
      writerZeroSymbols.writeVarUint(0);
      writerZeroSymbols.writeVarUint(0);
      await expect(
        tmProgramTransferCodec.importValue(writerZeroSymbols.toBase64Url()),
      ).rejects.toThrow("tm_transfer_payload_invalid");
    });

    it("rejects payload when registry bit count does not match symbolCount", async () => {
      const writer = new BitWriter();
      writer.writeVarUint(1); // nonHaltStateCount
      writer.writeVarUint(0); // haltStateCount
      writer.writeVarUint(5); // symbolCount = 5
      writer.writeVarUint(0); // initialTapeLength = 0
      writer.writeBits(0, 1); // symbolMode = Registry
      writer.writeBits(0, 2); // transitionMode = DenseRaw
      // Write 18 bits for SYMBOL_REGISTRY, only 1 bit set to 1 => total symbols would be 1+1=2 !== 5
      for (let i = 0; i < 18; i++) {
        writer.writeBit(i === 0 ? 1 : 0);
      }
      await expect(
        tmProgramTransferCodec.importValue(writer.toBase64Url()),
      ).rejects.toThrow("tm_transfer_payload_invalid");
    });

    it("rejects payload with invalid symbolMode", async () => {
      const writer = new BitWriter();
      writer.writeVarUint(1);
      writer.writeVarUint(0);
      writer.writeVarUint(1);
      writer.writeVarUint(0);
      writer.writeBits(1, 1); // symbolMode = 1 (raw utf8)
      writer.writeBits(0, 2);
      // But now send 0 byte length in raw UTF8 symbol dictionary
      // symbolCount is 2 so it will try to read 1 symbol
      const writerInvalidMode = new BitWriter();
      writerInvalidMode.writeVarUint(1);
      writerInvalidMode.writeVarUint(0);
      writerInvalidMode.writeVarUint(2);
      writerInvalidMode.writeVarUint(0);
      writerInvalidMode.writeBits(1, 1); // RawUtf8
      writerInvalidMode.writeBits(0, 2);
      writerInvalidMode.writeVarUint(0); // byteLength 0 => invalid!
      await expect(
        tmProgramTransferCodec.importValue(writerInvalidMode.toBase64Url()),
      ).rejects.toThrow("tm_transfer_payload_invalid");
    });

    it("rejects payload with multi-char symbol in raw UTF-8 dictionary", async () => {
      const writer = new BitWriter();
      writer.writeVarUint(1);
      writer.writeVarUint(0);
      writer.writeVarUint(2); // 1 blank + 1 extra symbol
      writer.writeVarUint(0);
      writer.writeBits(1, 1); // RawUtf8
      writer.writeBits(0, 2);
      // Write 2 bytes representing "ab"
      const encoder = new TextEncoder();
      const bytes = encoder.encode("ab");
      writer.writeVarUint(bytes.length);
      for (const b of bytes) {
        writer.writeBits(b, 8);
      }
      await expect(
        tmProgramTransferCodec.importValue(writer.toBase64Url()),
      ).rejects.toThrow("tm_transfer_payload_invalid");
    });

    it("rejects payload with duplicate symbol in raw UTF-8 dictionary", async () => {
      const writer = new BitWriter();
      writer.writeVarUint(1);
      writer.writeVarUint(0);
      writer.writeVarUint(3); // 1 blank + 2 extra symbols
      writer.writeVarUint(0);
      writer.writeBits(1, 1); // RawUtf8
      writer.writeBits(0, 2);
      // Write "X" twice
      const encoder = new TextEncoder();
      const bytes = encoder.encode("X");
      writer.writeVarUint(bytes.length);
      for (const b of bytes) {
        writer.writeBits(b, 8);
      }
      writer.writeVarUint(bytes.length);
      for (const b of bytes) {
        writer.writeBits(b, 8);
      }
      await expect(
        tmProgramTransferCodec.importValue(writer.toBase64Url()),
      ).rejects.toThrow("tm_transfer_payload_invalid");
    });

    it("rejects payload with initial tape symbol ID out of range", async () => {
      const writer = new BitWriter();
      writer.writeVarUint(1);
      writer.writeVarUint(0);
      writer.writeVarUint(2); // symbols: blank + "0"
      writer.writeVarUint(1); // initialTape length 1
      writer.writeBits(0, 1); // Registry
      writer.writeBits(0, 2); // DenseRaw
      // Registry bitmask for 1 symbol:
      for (let i = 0; i < 18; i++) {
        writer.writeBit(i === 0 ? 1 : 0);
      }
      // readableSymbolIds: 2 bits (for 2 symbols)
      writer.writeBit(0);
      writer.writeBit(0);
      // initialTape symbol bits (bitsNeeded(2) = 1) -> symbolId 1 is valid, but let's write 2 (if bitsNeeded was > 1)
      // With symbolCount = 2, symbolBits = 1 bit (values 0 or 1).
      // Let's create symbolCount = 3 (bitsNeeded = 2), but only provide 3 symbols and request symbolId = 3 (out of range [0..2])
      const writerOutOfRange = new BitWriter();
      writerOutOfRange.writeVarUint(1);
      writerOutOfRange.writeVarUint(0);
      writerOutOfRange.writeVarUint(3); // symbolCount = 3 (0, 1, 2)
      writerOutOfRange.writeVarUint(1); // initialTape length 1
      writerOutOfRange.writeBits(0, 1); // Registry
      writerOutOfRange.writeBits(0, 2); // DenseRaw
      // 2 registry symbols active: "0", "1"
      for (let i = 0; i < 18; i++) {
        writerOutOfRange.writeBit(i < 2 ? 1 : 0);
      }
      // readableSymbolIds: 3 bits
      writerOutOfRange.writeBit(0);
      writerOutOfRange.writeBit(0);
      writerOutOfRange.writeBit(0);
      // initial tape symbol id: 2 bits -> write 3 (which is >= symbolCount 3)
      writerOutOfRange.writeBits(3, 2);
      // No transitions needed since readableSymbolIds is empty
      await expect(
        tmProgramTransferCodec.importValue(writerOutOfRange.toBase64Url()),
      ).rejects.toThrow("tm_transfer_payload_invalid");
    });
  });
});

function createRepeatedTransitionProgram(sparse: boolean): TMProgram {
  const nonHaltStates = Array.from({ length: 8 }, (_, index) => `s${index}`);
  const repeatedTransitions = Object.fromEntries(
    nonHaltStates.map((state) => [state, transition("halt", "0", "N")]),
  );

  return createProgram({
    states: [...nonHaltStates, "halt"],
    haltStates: ["halt"],
    initialTape: ["0"],
    transitions: sparse
      ? {
          "0": repeatedTransitions,
          "1": {},
        }
      : {
          "0": repeatedTransitions,
        },
  });
}

function createProgram({
  states,
  haltStates,
  initialTape,
  transitions,
  tapeAlphabet = [DEFAULT_BLANK_SYMBOL],
}: {
  states: string[];
  haltStates: string[];
  initialTape: string[];
  transitions: TMProgram["transitions"];
  tapeAlphabet?: string[];
}): TMProgram {
  return withDerivedAlphabets({
    states,
    inputAlphabet: [],
    tapeAlphabet,
    blankSymbol: DEFAULT_BLANK_SYMBOL,
    initialState: states[0],
    haltStates,
    transitions,
    initialTape,
  });
}

function transition(
  nextState: string,
  writeSymbol: string,
  movement: TMTransition["movement"],
): TMTransition {
  return { nextState, writeSymbol, movement };
}

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

  for (let field = 0; field < 4; field++) {
    while (true) {
      const byte = readBits(bits, offset, 8);
      offset += 8;
      if (byte < 128) {
        break;
      }
    }
  }

  return {
    symbolMode: readBits(bits, offset, 1),
    transitionMode: readBits(bits, offset + 1, 2),
  };
}

function readBits(bits: number[], offset: number, length: number): number {
  return bits
    .slice(offset, offset + length)
    .reduce((value, bit) => value * 2 + bit, 0);
}
