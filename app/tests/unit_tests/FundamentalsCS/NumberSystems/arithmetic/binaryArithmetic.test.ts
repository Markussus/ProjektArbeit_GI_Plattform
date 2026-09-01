import { describe, expect, it } from "vitest";
import {
  addBinary8Bit,
  getStepExplanation,
  type BitStep,
} from "@/pages/FundamentalsCS/NumberSystems/components/simulator/arithmetic/binaryArithmetic";

describe("binaryArithmetic", () => {
  describe("getStepExplanation", () => {
    const t = (key: string) => key;
    const stepTemplate: BitStep = {
      position: 0,
      bitA: 0,
      bitB: 0,
      carryIn: 0,
      sum: 0,
      carryOut: 0,
    };

    it.each([
      {
        bitA: 0,
        bitB: 0,
        carryIn: 0,
        expectedKey: "number-systems.simulator.arithmetic.addition.step0",
      },
      {
        bitA: 1,
        bitB: 0,
        carryIn: 0,
        expectedKey: "number-systems.simulator.arithmetic.addition.step1",
      },
      {
        bitA: 0,
        bitB: 1,
        carryIn: 0,
        expectedKey: "number-systems.simulator.arithmetic.addition.step2",
      },
      {
        bitA: 0,
        bitB: 0,
        carryIn: 1,
        expectedKey: "number-systems.simulator.arithmetic.addition.step3",
      },
      {
        bitA: 1,
        bitB: 1,
        carryIn: 0,
        expectedKey: "number-systems.simulator.arithmetic.addition.step4",
      },
      {
        bitA: 1,
        bitB: 0,
        carryIn: 1,
        expectedKey: "number-systems.simulator.arithmetic.addition.step5",
      },
      {
        bitA: 0,
        bitB: 1,
        carryIn: 1,
        expectedKey: "number-systems.simulator.arithmetic.addition.step6",
      },
      {
        bitA: 1,
        bitB: 1,
        carryIn: 1,
        expectedKey: "number-systems.simulator.arithmetic.addition.step7",
      },
    ] as const)(
      "returns $expectedKey for bitA=$bitA, bitB=$bitB, carryIn=$carryIn",
      ({ bitA, bitB, carryIn, expectedKey }) => {
        const result = getStepExplanation(
          { ...stepTemplate, bitA, bitB, carryIn },
          t,
        );
        expect(result).toBe(expectedKey);
      },
    );
  });

  describe("addBinary8Bit", () => {
    it("adds two simple binary numbers", () => {
      const result = addBinary8Bit("00000001", "00000001");
      expect(result.sum).toBe("00000010");
      expect(result.overflow).toBe(false);
      expect(result.carryOut).toBe(false);
    });

    it("pads shorter inputs to 8 bits", () => {
      const result = addBinary8Bit("1", "1");
      expect(result.padA).toBe("00000001");
      expect(result.padB).toBe("00000001");
      expect(result.sum).toBe("00000010");
    });

    it("detects overflow when signs match and result wraps", () => {
      const result = addBinary8Bit("01111111", "00000001");
      expect(result.sum).toBe("10000000");
      expect(result.overflow).toBe(true);
      expect(result.carryOut).toBe(false);
    });

    it("detects no overflow when carry out differs from into sign", () => {
      const result = addBinary8Bit("11111111", "00000001");
      expect(result.sum).toBe("00000000");
      expect(result.carryOut).toBe(true);
      expect(result.overflow).toBe(false);
    });

    it("produces step explanations when a callback is provided", () => {
      const result = addBinary8Bit("00000001", "00000001", () => "explained");
      expect(result.bitSteps.every((s) => s.explanation === "explained")).toBe(
        true,
      );
    });

    it("leaves explanations undefined when no callback is provided", () => {
      const result = addBinary8Bit("00000001", "00000001");
      expect(result.bitSteps.every((s) => s.explanation === undefined)).toBe(
        true,
      );
    });

    it("returns zero result for 0 + 0", () => {
      const result = addBinary8Bit("0", "0");
      expect(result.sum).toBe("00000000");
      expect(result.overflow).toBe(false);
      expect(result.carryOut).toBe(false);
    });
  });
});
