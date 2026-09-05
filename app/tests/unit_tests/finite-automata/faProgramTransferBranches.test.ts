import { describe, expect, it } from "vitest";
import { faProgramTransferCodec } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faProgramTransfer";
import {
  EPSILON,
  type FAProgram,
} from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faTypes";

const PROGRAM_INVALID = /cannot be represented|invalid/i;

function program(overrides: Partial<FAProgram> = {}): FAProgram {
  return {
    type: "DFA",
    states: ["S0", "S1"],
    alphabet: ["a", "b"],
    transitions: { S0: { a: ["S1"] }, S1: { b: ["S0"] } },
    startState: "S0",
    acceptStates: ["S1"],
    ...overrides,
  };
}

async function roundTrip(source: FAProgram): Promise<FAProgram> {
  return faProgramTransferCodec.importValue(
    await faProgramTransferCodec.exportValue(source),
  );
}

describe("faProgramTransferCodec — programs it refuses to export", () => {
  it("rejects a program with no states", async () => {
    await expect(
      faProgramTransferCodec.exportValue(
        program({ states: [], transitions: {}, acceptStates: [] }),
      ),
    ).rejects.toThrow(PROGRAM_INVALID);
  });

  it("rejects a start state that is not among the states", async () => {
    await expect(
      faProgramTransferCodec.exportValue(program({ startState: "nowhere" })),
    ).rejects.toThrow(PROGRAM_INVALID);
  });

  it("rejects duplicate state names", async () => {
    await expect(
      faProgramTransferCodec.exportValue(program({ states: ["S0", "S0"] })),
    ).rejects.toThrow(PROGRAM_INVALID);
  });

  it("rejects a duplicated alphabet symbol", async () => {
    await expect(
      faProgramTransferCodec.exportValue(program({ alphabet: ["a", "a"] })),
    ).rejects.toThrow(PROGRAM_INVALID);
  });
});

describe("faProgramTransferCodec — rows and cells", () => {
  it("drops symbol rows that carry no transition at all", async () => {
    const sparse = program({
      alphabet: ["a", "b", "c"],
      transitions: { S0: { a: ["S1"] }, S1: {} },
    });

    const restored = await roundTrip(sparse);

    expect(restored.alphabet).toEqual(["a", "b", "c"]);
    expect(restored.transitions.S0).toEqual({ a: ["S1"] });
    expect(restored.transitions.S1).toEqual({});
  });

  it("round-trips an automaton with no transitions whatsoever", async () => {
    const restored = await roundTrip(
      program({ transitions: { S0: {}, S1: {} } }),
    );

    expect(restored.transitions).toEqual({ S0: {}, S1: {} });
  });

  it("keeps the epsilon row of an NFA and drops it for a DFA", async () => {
    const withEpsilon = program({
      type: "NFA",
      transitions: { S0: { [EPSILON]: ["S1"] }, S1: {} },
    });

    const restored = await roundTrip(withEpsilon);

    expect(restored.type).toBe("NFA");
    expect(restored.transitions.S0[EPSILON]).toEqual(["S1"]);
  });

  it("deduplicates repeated targets inside one cell", async () => {
    const restored = await roundTrip(
      program({
        type: "NFA",
        transitions: { S0: { a: ["S1", "S1"] }, S1: {} },
      }),
    );

    expect(restored.transitions.S0.a).toEqual(["S1"]);
  });

  it("renames the start state to S0 and keeps the rest in order", async () => {
    const restored = await roundTrip(
      program({
        states: ["A", "B", "C"],
        startState: "B",
        acceptStates: ["C"],
        transitions: { A: { a: ["B"] }, B: { a: ["C"] }, C: {} },
      }),
    );

    expect(restored.states).toEqual(["S0", "S1", "S2"]);
    expect(restored.startState).toBe("S0");
    // B became S0, A became S1, C became S2.
    expect(restored.acceptStates).toEqual(["S2"]);
    expect(restored.transitions.S0.a).toEqual(["S2"]);
    expect(restored.transitions.S1.a).toEqual(["S0"]);
  });

  it("round-trips a dense NFA where most cells are populated", async () => {
    const dense = program({
      type: "NFA",
      transitions: {
        S0: { a: ["S0", "S1"], b: ["S0", "S1"] },
        S1: { a: ["S0", "S1"], b: ["S0", "S1"] },
      },
    });

    expect(await roundTrip(dense)).toEqual({
      ...dense,
      states: ["S0", "S1"],
    });
  });

  it("round-trips an automaton with no accept states", async () => {
    const restored = await roundTrip(program({ acceptStates: [] }));

    expect(restored.acceptStates).toEqual([]);
  });

  it("round-trips a single-state automaton", async () => {
    const restored = await roundTrip(
      program({
        states: ["S0"],
        alphabet: ["a"],
        transitions: { S0: { a: ["S0"] } },
        acceptStates: ["S0"],
      }),
    );

    expect(restored.states).toEqual(["S0"]);
    expect(restored.acceptStates).toEqual(["S0"]);
  });
});

describe("faProgramTransferCodec — payloads it refuses to import", () => {
  it("rejects a truncated payload", async () => {
    const exported = await faProgramTransferCodec.exportValue(program());

    await expect(
      faProgramTransferCodec.importValue(exported.slice(0, 2)),
    ).rejects.toThrow(PROGRAM_INVALID);
  });

  it("rejects an empty payload", async () => {
    await expect(faProgramTransferCodec.importValue("")).rejects.toThrow(
      PROGRAM_INVALID,
    );
  });

  it("rejects characters outside the base64url alphabet", async () => {
    await expect(faProgramTransferCodec.importValue("!!!!")).rejects.toThrow(
      PROGRAM_INVALID,
    );
  });
});
