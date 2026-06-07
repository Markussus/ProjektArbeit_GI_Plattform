import { describe, expect, it } from "vitest";
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
