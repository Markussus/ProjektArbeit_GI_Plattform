import { describe, it, expect } from "vitest";
import {
  buildMooreTableHeaders,
  buildMooreTableRows,
  getActiveMooreTransitionCell,
  buildMealyTableHeaders,
  buildMealyTableRows,
  getActiveMealyTransitionCell,
} from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/adapters/automataTableAdapter";
import { defaultMooreProgram } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/config/defaultMooreProgram";
import { defaultMealyProgram } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/config/defaultMealyProgram";

describe("buildMooreTableHeaders", () => {
  it("starts with the custom or default event header", () => {
    const headers = buildMooreTableHeaders(["S0", "S1"]);
    expect(headers[0]).toBe("Event");
    expect(headers).toEqual(["Event", "S0", "S1"]);
  });

  it("supports custom header label", () => {
    const headers = buildMooreTableHeaders(["S0", "S1"], "Ereignis");
    expect(headers[0]).toBe("Ereignis");
  });
});

describe("buildMooreTableRows", () => {
  it("produces one row per input symbol", () => {
    const rows = buildMooreTableRows(defaultMooreProgram);
    expect(rows).toHaveLength(defaultMooreProgram.inputSymbols.length);
  });

  it("first cell of each row is the input symbol", () => {
    const rows = buildMooreTableRows(defaultMooreProgram);
    rows.forEach((row, i) => {
      expect(row[0]).toBe(defaultMooreProgram.inputSymbols[i]);
    });
  });

  it("contains target state transitions for each state", () => {
    const rows = buildMooreTableRows(defaultMooreProgram);
    const row0 = rows.find((r) => r[0] === "0")!;
    // HALT -0-> READY (col 1), READY -0-> GO (col 2)
    expect(row0[1]).toBe("READY");
    expect(row0[2]).toBe("GO");
  });
});

describe("getActiveMooreTransitionCell", () => {
  it("returns active cell for the current input and state", () => {
    const cell = getActiveMooreTransitionCell(defaultMooreProgram, {
      currentState: "HALT",
      inputPosition: 0, // inputWord[0] is "0"
    });
    expect(cell).toEqual({ row: 0, col: 1 });
  });

  it("returns null when input position is out of bounds", () => {
    const cell = getActiveMooreTransitionCell(defaultMooreProgram, {
      currentState: "HALT",
      inputPosition: 99,
    });
    expect(cell).toBeNull();
  });
});

describe("buildMealyTableHeaders", () => {
  it("returns event label and states", () => {
    const headers = buildMealyTableHeaders(["A", "B"]);
    expect(headers).toEqual(["Event", "A", "B"]);
  });
});

describe("buildMealyTableRows", () => {
  it("formats each cell as target / output", () => {
    const rows = buildMealyTableRows(defaultMealyProgram);
    expect(rows).toHaveLength(defaultMealyProgram.inputSymbols.length);
    const row0 = rows.find((r) => r[0] === "0")!;
    // START on 0 -> START / NO_MATCH
    expect(row0[1]).toBe("START / NO_MATCH");
  });
});

describe("getActiveMealyTransitionCell", () => {
  it("returns active cell for the current input and state", () => {
    const cell = getActiveMealyTransitionCell(defaultMealyProgram, {
      currentState: "START",
      inputPosition: 0, // inputWord[0] is "1" -> index 1
    });
    expect(cell).toEqual({ row: 1, col: 1 });
  });

  it("returns null when input position is out of bounds", () => {
    const cell = getActiveMealyTransitionCell(defaultMealyProgram, {
      currentState: "START",
      inputPosition: 99,
    });
    expect(cell).toBeNull();
  });
});
