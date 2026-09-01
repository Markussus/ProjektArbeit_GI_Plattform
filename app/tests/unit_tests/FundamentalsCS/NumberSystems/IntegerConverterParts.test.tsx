/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ConverterInputPanel,
  ExplanationContent,
  ExplanationPanel,
  FromDecExplanation,
  ToDecExplanation,
  ValueInput,
} from "@/pages/FundamentalsCS/NumberSystems/components/simulator/IntegerConverterParts.tsx";
import {
  baseToNumber,
  formatDecValue,
  formatRemainder,
  formatTargetValue,
  generateDivisionSteps,
  generatePowerSteps,
  sanitizeInput,
} from "@/pages/FundamentalsCS/NumberSystems/components/simulator/integerConverterUtils";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) =>
      typeof fallback === "string" ? fallback : key,
  }),
}));

vi.mock("@/components/shared/DropdownSelect/DropdownSelect", () => ({
  DropdownSelect: ({
    value,
    onChange,
    triggerTestId,
  }: {
    value: string;
    onChange: (v: string) => void;
    triggerTestId?: string;
  }) => (
    <div>
      <span data-testid={triggerTestId}>{value}</span>
      <button
        data-testid={`${triggerTestId}-change`}
        onClick={() => {
          const bases = ["dec", "bin", "oct", "hex"];
          const idx = bases.indexOf(value);
          onChange(bases[(idx + 1) % 4]);
        }}
      >
        change
      </button>
    </div>
  ),
}));

vi.mock(
  "@/components/shared/ExerciseValidationPanel/ExerciseValidationPanel",
  async () => {
    const { mockExerciseValidationPanelForConverters } =
      await import("./converterTestSetup");
    return mockExerciseValidationPanelForConverters();
  },
);

function renderWithCleanup(component: React.ReactElement) {
  cleanup();
  return render(component);
}

describe("integerConverterUtils", () => {
  describe("baseToNumber", () => {
    it.each([
      ["bin", 2],
      ["oct", 8],
      ["dec", 10],
      ["hex", 16],
    ] as const)("maps %s to %i", (base, expected) => {
      expect(baseToNumber(base)).toBe(expected);
    });
  });

  describe("sanitizeInput", () => {
    it.each([
      { base: "bin", input: "12a01", expected: "101" },
      { base: "oct", input: "89a17", expected: "17" },
      { base: "dec", input: "12a34", expected: "1234" },
      { base: "hex", input: "G1Af", expected: "1Af" },
    ] as const)(
      "filters invalid characters for $base",
      ({ base, input, expected }) => {
        expect(sanitizeInput(input, base)).toBe(expected);
      },
    );

    it("clamps binary input to 16 characters", () => {
      expect(sanitizeInput("1".repeat(20), "bin")).toBe("1".repeat(16));
    });
  });

  describe("formatDecValue", () => {
    it.each([
      { input: "255", base: "dec" as const, expected: "255" },
      { input: "11111111", base: "bin" as const, expected: "255" },
      { input: "377", base: "oct" as const, expected: "255" },
      { input: "FF", base: "hex" as const, expected: "255" },
    ])("converts $input ($base) to decimal", ({ input, base, expected }) => {
      expect(formatDecValue(input, base)).toBe(expected);
    });

    it("returns empty string for invalid input", () => {
      expect(formatDecValue("abc", "dec")).toBe("");
      expect(formatDecValue("2", "bin")).toBe("");
    });
  });

  describe("formatTargetValue", () => {
    it.each([
      { decValue: "255", targetBase: "bin" as const, expected: "11111111" },
      { decValue: "255", targetBase: "oct" as const, expected: "377" },
      { decValue: "255", targetBase: "hex" as const, expected: "FF" },
      { decValue: "255", targetBase: "dec" as const, expected: "255" },
    ])(
      "converts $decValue to $targetBase",
      ({ decValue, targetBase, expected }) => {
        expect(formatTargetValue(decValue, targetBase)).toBe(expected);
      },
    );
  });

  describe("generatePowerSteps", () => {
    it("generates correct binary power steps", () => {
      const steps = generatePowerSteps(2, "1010");
      expect(steps).toHaveLength(4);
      expect(steps[0]).toEqual({
        digit: "1",
        digitVal: 1n,
        power: 3,
        base: 2,
        termVal: 8n,
      });
    });

    it("returns empty array for empty input", () => {
      expect(generatePowerSteps(10, "")).toEqual([]);
    });
  });

  describe("generateDivisionSteps", () => {
    it("generates division steps for 10 to binary", () => {
      const steps = generateDivisionSteps("10", 2);
      expect(steps).toHaveLength(4);
      expect(steps[0].remainder).toBe(0n);
    });

    it("returns single zero step for decValue 0", () => {
      const steps = generateDivisionSteps("0", 2);
      expect(steps).toEqual([{ value: 0n, remainder: 0n, base: 2 }]);
    });
  });

  describe("formatRemainder", () => {
    it("formats hex remainders above 9 as letters", () => {
      expect(formatRemainder(10n, "hex")).toBe("A");
      expect(formatRemainder(15n, "hex")).toBe("F");
    });

    it("formats decimal remainders as numbers", () => {
      expect(formatRemainder(10n, "dec")).toBe("10");
    });
  });
});

describe("IntegerConverterParts", () => {
  afterEach(() => {
    cleanup();
  });

  describe("ValueInput", () => {
    it("renders readonly when locked", () => {
      renderWithCleanup(
        <ValueInput
          value="42"
          locked
          sourceBase="dec"
          onChange={vi.fn()}
          isInvalid={false}
          baseNumber={10}
        />,
      );
      expect(
        (screen.getByTestId("ns-converter-value-input") as HTMLInputElement)
          .readOnly,
      ).toBe(true);
    });

    it("shows invalid message when isInvalid", () => {
      renderWithCleanup(
        <ValueInput
          value="xyz"
          locked={false}
          sourceBase="dec"
          onChange={vi.fn()}
          isInvalid
          baseNumber={10}
        />,
      );
      expect(
        screen.getByText(/number-systems.simulator.numbers.invalidInputBase/),
      ).toBeTruthy();
    });
  });

  describe("ConverterInputPanel", () => {
    it("renders source and target base selectors", () => {
      renderWithCleanup(
        <ConverterInputPanel
          sourceBase="dec"
          targetBase="bin"
          inputValue="42"
          locked={false}
          initialBase="dec"
          onSourceBaseChange={vi.fn()}
          onTargetBaseChange={vi.fn()}
          onInputChange={vi.fn()}
          decValue="42"
          targetValue="101010"
        />,
      );
      expect(screen.getByTestId("ns-integer-source-base")).toBeTruthy();
      expect(screen.getByTestId("ns-integer-target-base")).toBeTruthy();
      expect(screen.getByTestId("ns-converter-result").textContent).toContain(
        "101010",
      );
    });
  });

  describe("ToDecExplanation", () => {
    it("renders binary to decimal explanation", () => {
      renderWithCleanup(
        <ToDecExplanation sourceBase="bin" inputValue="1010" decValue="10" />,
      );
      expect(screen.getByText("8")).toBeTruthy();
      expect(screen.getByText(/= 10$/)).toBeTruthy();
    });
  });

  describe("FromDecExplanation", () => {
    it("renders decimal to binary explanation", () => {
      renderWithCleanup(
        <FromDecExplanation
          targetBase="bin"
          decValue="10"
          targetValue="1010"
        />,
      );
      expect(screen.getByText("1010")).toBeTruthy();
    });
  });

  describe("ExplanationContent", () => {
    it("prompts for input when decValue is empty", () => {
      renderWithCleanup(
        <ExplanationContent
          sourceBase="dec"
          targetBase="bin"
          decValue=""
          targetValue=""
          inputValue=""
        />,
      );
      expect(
        screen.getByText("number-systems.simulator.numbers.enterValue"),
      ).toBeTruthy();
    });

    it("shows same base message when bases match", () => {
      renderWithCleanup(
        <ExplanationContent
          sourceBase="dec"
          targetBase="dec"
          decValue="42"
          targetValue="42"
          inputValue="42"
        />,
      );
      expect(
        screen.getByText("number-systems.simulator.numbers.sameBase"),
      ).toBeTruthy();
    });

    it("renders both explanations for non-dec conversion", () => {
      renderWithCleanup(
        <ExplanationContent
          sourceBase="bin"
          targetBase="hex"
          decValue="255"
          targetValue="FF"
          inputValue="11111111"
        />,
      );
      expect(
        screen.getByText("number-systems.simulator.numbers.step1TempDec"),
      ).toBeTruthy();
      expect(
        screen.getByText("number-systems.simulator.numbers.step2TempTarget"),
      ).toBeTruthy();
    });
  });

  describe("ExplanationPanel", () => {
    it("shows validation panel when locked", () => {
      renderWithCleanup(
        <ExplanationPanel
          locked
          sourceBase="dec"
          targetBase="bin"
          decValue="42"
          targetValue="101010"
          inputValue="42"
          onShowSolution={vi.fn()}
        />,
      );
      expect(screen.getByTestId("mock-validation-panel")).toBeTruthy();
    });

    it("shows explanation content when not locked", () => {
      renderWithCleanup(
        <ExplanationPanel
          locked={false}
          sourceBase="dec"
          targetBase="bin"
          decValue="42"
          targetValue="101010"
          inputValue="42"
        />,
      );
      expect(
        screen.getByText("number-systems.simulator.numbers.explanation"),
      ).toBeTruthy();
    });
  });
});
