import { describe, expect, it } from "vitest";
import { mooreProgramTransferCodec } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/domain/mooreProgramTransfer";
import type { MooreProgram } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/domain/mooreTypes";

const program: MooreProgram = {
  states: ["CLOSED", "OPEN", "WAIT"],
  inputSymbols: ["110", "111"],
  transitions: {
    "110": {
      CLOSED: "OPEN",
      OPEN: "WAIT",
      WAIT: "CLOSED",
    },
    "111": {
      CLOSED: "CLOSED",
      OPEN: "CLOSED",
      WAIT: "OPEN",
    },
  },
  outputs: {
    CLOSED: { symbol: "Ausgabe 1", code: 6 },
    OPEN: { symbol: "🙂", code: 2 },
    WAIT: { symbol: "Ausgabe 1", code: 6 },
  },
  initialState: "CLOSED",
  inputWord: ["110", "111", "110"],
  representation: "binary",
};

describe("Moore program transfer codec", () => {
  it("round-trips names, ordering, output codes, and tokenized input", async () => {
    const exported = await mooreProgramTransferCodec.exportValue(program);
    const imported = await mooreProgramTransferCodec.importValue(exported);

    expect(exported).toMatch(/^[A-Za-z0-9_-]+$/u);
    expect(imported).toEqual(program);
  });

  it("keeps incomplete transition cells for editor autosave", async () => {
    const draft: MooreProgram = {
      ...program,
      transitions: {
        ...program.transitions,
        "110": {
          ...program.transitions["110"],
        },
      },
    };
    delete draft.transitions["110"].WAIT;

    const exported = await mooreProgramTransferCodec.exportValue(draft);
    const imported = await mooreProgramTransferCodec.importValue(exported);

    expect(imported.transitions["110"].WAIT).toBeUndefined();
  });

  it("round-trips the empty one-state editor program", async () => {
    const oneStateProgram: MooreProgram = {
      states: ["ONLY"],
      inputSymbols: [],
      transitions: {},
      outputs: { ONLY: { symbol: "IDLE", code: 0 } },
      initialState: "ONLY",
      inputWord: [],
      representation: "decimal",
    };

    const exported =
      await mooreProgramTransferCodec.exportValue(oneStateProgram);

    await expect(
      mooreProgramTransferCodec.importValue(exported),
    ).resolves.toEqual(oneStateProgram);
  });

  it("round-trips repeated input for one state and one input symbol", async () => {
    const oneValueProgram: MooreProgram = {
      states: ["ONLY"],
      inputSymbols: ["tick"],
      transitions: { tick: { ONLY: "ONLY" } },
      outputs: { ONLY: { symbol: "ACTIVE", code: 1 } },
      initialState: "ONLY",
      inputWord: ["tick", "tick"],
      representation: "binary",
    };

    const exported =
      await mooreProgramTransferCodec.exportValue(oneValueProgram);

    await expect(
      mooreProgramTransferCodec.importValue(exported),
    ).resolves.toEqual(oneValueProgram);
  });

  it("rejects malformed payloads", async () => {
    await expect(
      mooreProgramTransferCodec.importValue("not.valid"),
    ).rejects.toThrow("moore_transfer_payload_invalid");
  });
});
