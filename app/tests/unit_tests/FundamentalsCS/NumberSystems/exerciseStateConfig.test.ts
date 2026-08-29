import { describe, expect, it } from "vitest";
import { exerciseStateConfig } from "@/pages/FundamentalsCS/NumberSystems/components/simulator/exerciseStateConfig";

describe("exerciseStateConfig", () => {
  it("contains configuration for all known exercise IDs", () => {
    const knownExerciseIds = [
      "number.ex_u03_decToBin",
      "number.ex_u03_binAdd",
      "number.ex_u04_binToHexOct",
      "number.ex_u04_octToHex",
      "number.ex_u04_hexToBin",
      "number.ex_u05_floatToBin",
      "number.ex_u05_ieeeEncode",
      "number.ex_u05_ieeeDecode",
      "number.ex_u06_addSub",
      "number.ex_u06_mult",
    ];

    for (const id of knownExerciseIds) {
      expect(exerciseStateConfig[id]).toBeDefined();
      expect(exerciseStateConfig[id].mode).toBeDefined();
    }
  });

  it("contains configuration for all known example IDs", () => {
    const knownExampleIds = [
      "number.example_u03_1",
      "number.example_u03_2",
      "number.example_u04_1",
      "number.example_u04_2",
      "number.example_u04_3",
      "number.example_u04_4",
      "number.example_u05_1",
      "number.example_u05_2",
      "number.example_u05_3",
      "number.example_u05_4",
      "number.example_u06_1_add",
      "number.example_u06_1_sub",
      "number.example_u06_2",
      "number.example_u07_1_1",
      "number.example_u07_1_2",
      "number.example_u07_1_3",
      "number.example_u07_1_4",
      "number.example_u07_1_5",
      "number.example_u07_2_1",
      "number.example_u07_2_2",
      "number.example_u07_2_3",
      "number.example_u07_3_1",
      "number.example_u07_3_2",
      "number.example_u07_3_3",
      "number.example_u07_3_4",
      "number.example_u07_3_5",
      "number.example_u07_4_1",
      "number.example_u07_4_2",
      "number.example_u07_4_3",
      "number.example_u07_4_4",
      "number.example_u07_5_1",
      "number.example_u07_5_2",
      "number.example_u07_5_3",
      "number.example_u07_5_4",
      "number.example_u07_5_5",
    ];

    for (const id of knownExampleIds) {
      expect(exerciseStateConfig[id]).toBeDefined();
      expect(exerciseStateConfig[id].mode).toBeDefined();
    }
  });

  it("marks randomized exercises with flags", () => {
    expect(exerciseStateConfig["number.ex_u03_decToBin"].randomDecToBin).toBe(
      true,
    );
    expect(exerciseStateConfig["number.ex_u03_binAdd"].randomBinAdd).toBe(true);
    expect(
      exerciseStateConfig["number.ex_u05_ieeeDecode"].randomIeeeDecode,
    ).toBe(true);
  });

  it("provides fixed initial values for examples", () => {
    expect(exerciseStateConfig["number.example_u03_1"].initialValue).toBe("26");
    expect(exerciseStateConfig["number.example_u05_4"].initialValue).toBe(
      "01000001010101000000000000000000",
    );
  });

  it("matches example mode with expected simulator mode", () => {
    expect(exerciseStateConfig["number.example_u05_3"].mode).toBe("ieee754");
    expect(exerciseStateConfig["number.example_u07_3_1"].mode).toBe("negative");
    expect(exerciseStateConfig["number.example_u06_2"].mode).toBe("arithmetic");
  });
});
