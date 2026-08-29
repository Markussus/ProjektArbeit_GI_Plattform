import { describe, expect, it } from "vitest";
import {
  resolveRandomInit,
  defaultExerciseState,
} from "@/pages/FundamentalsCS/NumberSystems/components/simulator/exerciseStateResolver";
import { exerciseStateConfig } from "@/pages/FundamentalsCS/NumberSystems/components/simulator/exerciseStateConfig";

describe("exerciseStateResolver", () => {
  it("returns default state when no exercise is active", () => {
    expect(defaultExerciseState).toEqual({
      mode: "integers",
      initialValue: "",
      initialBase: "dec",
      initialTargetBase: "bin",
      initialValueA: "",
      initialValueB: "",
      initialSubMode: "addition",
      initialConverterMode: "decToIeee",
    });
  });

  it("returns fixed example values without mutation", () => {
    const config = exerciseStateConfig["number-systems.example_u03_1"];
    const init = resolveRandomInit(config);

    expect(init).toEqual({
      mode: "integers",
      initialBase: "dec",
      initialTargetBase: "bin",
      initialValue: "26",
    });
  });

  it("generates a decimal value for ex_u03_decToBin", () => {
    const config = exerciseStateConfig["number-systems.ex_u03_decToBin"];
    const init = resolveRandomInit(config);

    expect(init.mode).toBe("integers");
    expect(init.initialBase).toBe("dec");
    expect(init.initialTargetBase).toBe("bin");
    expect(init.initialValue).toBeDefined();
    const value = Number(init.initialValue);
    expect(value).toBeGreaterThanOrEqual(1);
    expect(value).toBeLessThanOrEqual(63);
  });

  it("generates binary operands for ex_u03_binAdd", () => {
    const config = exerciseStateConfig["number-systems.ex_u03_binAdd"];
    const init = resolveRandomInit(config);

    expect(init.mode).toBe("arithmetic");
    expect(init.initialSubMode).toBe("addition");
    expect(init.initialValueA).toMatch(/^[01]+$/);
    expect(init.initialValueB).toMatch(/^[01]+$/);
  });

  it("generates a random binary target base for ex_u04_binToHexOct", () => {
    const config = exerciseStateConfig["number-systems.ex_u04_binToHexOct"];
    const init = resolveRandomInit(config);

    expect(init.mode).toBe("integers");
    expect(init.initialBase).toBe("bin");
    expect(["hex", "oct"]).toContain(init.initialTargetBase);
    expect(init.initialValue).toMatch(/^[01]{8}$/);
  });

  it("generates an octal value for ex_u04_octToHex", () => {
    const config = exerciseStateConfig["number-systems.ex_u04_octToHex"];
    const init = resolveRandomInit(config);

    expect(init.mode).toBe("integers");
    expect(init.initialBase).toBe("oct");
    expect(init.initialTargetBase).toBe("hex");
    expect(init.initialValue).toMatch(/^[0-7]{3}$/);
  });

  it("generates a hex value for ex_u04_hexToBin", () => {
    const config = exerciseStateConfig["number-systems.ex_u04_hexToBin"];
    const init = resolveRandomInit(config);

    expect(init.mode).toBe("integers");
    expect(init.initialBase).toBe("hex");
    expect(init.initialTargetBase).toBe("bin");
    expect(init.initialValue).toMatch(/^[0-9A-F]{2}$/);
  });

  it("generates a fractional value for ex_u05_floatToBin", () => {
    const config = exerciseStateConfig["number-systems.ex_u05_floatToBin"];
    const init = resolveRandomInit(config);

    expect(init.mode).toBe("fractional");
    expect(init.initialValue).toBeDefined();
    expect(Number(init.initialValue)).not.toBeNaN();
  });

  it("generates an IEEE encode value for ex_u05_ieeeEncode", () => {
    const config = exerciseStateConfig["number-systems.ex_u05_ieeeEncode"];
    const init = resolveRandomInit(config);

    expect(init.mode).toBe("ieee754");
    expect(init.initialConverterMode).toBe("decToIeee");
    expect(init.initialValue).toBeDefined();
    expect(Number(init.initialValue)).not.toBeNaN();
  });

  it("generates a 32-bit IEEE binary value for ex_u05_ieeeDecode", () => {
    const config = exerciseStateConfig["number-systems.ex_u05_ieeeDecode"];
    const init = resolveRandomInit(config);

    expect(init.mode).toBe("ieee754");
    expect(init.initialConverterMode).toBe("ieeeToDec");
    expect(init.initialValue).toMatch(/^[01]{32}$/);
  });

  it("generates arithmetic operands for ex_u06_addSub", () => {
    const config = exerciseStateConfig["number-systems.ex_u06_addSub"];
    const init = resolveRandomInit(config);

    expect(init.mode).toBe("arithmetic");
    expect(["addition", "subtraction"]).toContain(init.initialSubMode);
    expect(init.initialValueA).toMatch(/^[01]{8}$/);
    expect(init.initialValueB).toMatch(/^[01]{8}$/);
  });

  it("generates multiplication operands for ex_u06_mult", () => {
    const config = exerciseStateConfig["number-systems.ex_u06_mult"];
    const init = resolveRandomInit(config);

    expect(init.mode).toBe("arithmetic");
    expect(init.initialSubMode).toBe("multiplication");
    expect(init.initialValueA).toMatch(/^[01]+$/);
    expect(init.initialValueB).toMatch(/^[01]+$/);
  });

  it("does not return random flags in resolved init", () => {
    const config = exerciseStateConfig["number-systems.ex_u03_decToBin"];
    const init = resolveRandomInit(config);

    expect(init).not.toHaveProperty("randomDecToBin");
  });
});
