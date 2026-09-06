import { describe, expect, it } from "vitest";
import { faProgramDraftCodec } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faProgramDraft";
import { faProgramTransferCodec } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faProgramTransfer";
import { defaultDFAProgram } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/config/defaultFAProgram";
import type { FAProgram } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faTypes";
import { EPSILON } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faTypes";

function program(overrides: Partial<FAProgram> = {}): FAProgram {
  return { ...structuredClone(defaultDFAProgram), ...overrides };
}

async function roundTrip(source: FAProgram): Promise<FAProgram> {
  return faProgramDraftCodec.importValue(
    await faProgramDraftCodec.exportValue(source),
  );
}

describe("faProgramDraftCodec — round trip", () => {
  it("restores a complete program unchanged", async () => {
    await expect(roundTrip(defaultDFAProgram)).resolves.toEqual(
      defaultDFAProgram,
    );
  });

  it("keeps epsilon rows", async () => {
    const withEpsilon = program({
      type: "NFA",
      transitions: { S0: { [EPSILON]: ["S1"] } },
    });

    await expect(roundTrip(withEpsilon)).resolves.toEqual(withEpsilon);
  });

  it("keeps symbols the compact dictionary has no entry for", async () => {
    const unicode = program({ alphabet: ["→", "ß"] });

    await expect(roundTrip(unicode)).resolves.toEqual(unicode);
  });
});

describe("faProgramDraftCodec — drafts the compact codec refuses", () => {
  // Each of these is a program the learner can be halfway through building.
  // The compact codec throws on all of them, which is why they used to make
  // every autosave of the exercise vanish without a word.
  const halfBuilt: [string, FAProgram][] = [
    ["a symbol typed twice", program({ alphabet: ["a", "a"] })],
    ["a state named twice", program({ states: ["S0", "S0"] })],
    ["a start state outside the state set", program({ startState: "nowhere" })],
    ["no states at all", program({ states: [], startState: "" })],
  ];

  it.each(halfBuilt)("saves and restores %s", async (_label, draft) => {
    await expect(faProgramTransferCodec.exportValue(draft)).rejects.toThrow(
      /fa_transfer_program_invalid/,
    );

    await expect(roundTrip(draft)).resolves.toEqual(draft);
  });

  it("saves and restores an alphabet that has not been filled in yet", async () => {
    // The compact codec happens to accept this one, but the editor flags it as
    // invalid, so it is still a state a learner gets left in mid-build.
    const empty = program({ alphabet: [] });

    await expect(roundTrip(empty)).resolves.toEqual(empty);
  });
});

describe("faProgramDraftCodec — payloads written by other formats", () => {
  it("reads a slot saved in the compact format", async () => {
    // Drafts saved before this codec existed, and transfer strings imported
    // from someone else, both arrive in the compact format.
    const compact = await faProgramTransferCodec.exportValue(defaultDFAProgram);

    await expect(faProgramDraftCodec.importValue(compact)).resolves.toEqual(
      defaultDFAProgram,
    );
  });

  it("tolerates surrounding whitespace", async () => {
    const exported = await faProgramDraftCodec.exportValue(defaultDFAProgram);

    await expect(
      faProgramDraftCodec.importValue(` \n${exported}\n `),
    ).resolves.toEqual(defaultDFAProgram);
  });

  it("rejects an empty payload", async () => {
    await expect(faProgramDraftCodec.importValue("")).rejects.toThrow();
  });

  it("rejects a payload that is neither format", async () => {
    await expect(
      faProgramDraftCodec.importValue("not.a.base64url.payload"),
    ).rejects.toThrow();
  });
});

describe("faProgramDraftCodec — payloads that are shaped wrong", () => {
  async function draftPayloadOf(json: unknown): Promise<string> {
    // Reuse the codec's own framing so only the JSON body under test differs.
    const framed = await faProgramDraftCodec.exportValue(
      json as unknown as FAProgram,
    );
    return framed;
  }

  const malformed: [string, unknown][] = [
    ["an unknown automaton type", program({ type: "PDA" as never })],
    ["states that are not strings", program({ states: [1, 2] as never })],
    ["a start state that is not a string", program({ startState: 7 as never })],
    [
      "transitions that are not an object",
      program({ transitions: [] as never }),
    ],
    [
      "transition targets that are not strings",
      program({ transitions: { S0: { a: [0] } } as never }),
    ],
    ["a payload that is not an object", "just a string"],
  ];

  it.each(malformed)(
    "refuses %s rather than handing it to the editor",
    async (_label, json) => {
      // Storage can hold anything, so a payload the editor could not drive has
      // to fail rather than crash the config view mid-render.
      await expect(
        faProgramDraftCodec.importValue(await draftPayloadOf(json)),
      ).rejects.toThrow();
    },
  );
});
