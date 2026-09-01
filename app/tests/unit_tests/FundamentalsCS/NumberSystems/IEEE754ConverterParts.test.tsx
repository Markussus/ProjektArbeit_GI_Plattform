/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ConceptPath,
  DecToIeeeExplanation,
  DecToIeeeResult,
  ExplanationPanel,
  IeeeInputField,
  IeeeToDecExplanation,
  IeeeToDecResult,
  ModeToggle,
  ResultSection,
  SpecialCaseBanner,
} from "@/pages/FundamentalsCS/NumberSystems/components/simulator/IEEE754ConverterParts.tsx";
import { getExpectedResult } from "@/pages/FundamentalsCS/NumberSystems/components/simulator/ieee754ConverterUtils";
import type { IEEE754Analysis } from "@/pages/FundamentalsCS/NumberSystems/components/simulator/useIEEE754Converter";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) =>
      typeof fallback === "string" ? fallback : key,
  }),
}));

vi.mock(
  "@/components/shared/ExerciseValidationPanel/ExerciseValidationPanel",
  async () => {
    const { mockExerciseValidationPanelForConverters } =
      await import("./converterTestSetup");
    return mockExerciseValidationPanelForConverters();
  },
);

const baseAnalysis: IEEE754Analysis = {
  isValid: true,
  isNaNVal: false,
  isSpecial: false,
  isZero: false,
  isInf: false,
  floatVal: 12.5,
  sign: "0",
  exponent: "10000010",
  mantissa: "10010000000000000000000",
  expVal: 130,
  sumOfFractions: 0.5,
  fractionSteps: [1],
};

function renderWithCleanup(component: React.ReactElement) {
  cleanup();
  return render(component);
}

describe("IEEE754ConverterParts", () => {
  afterEach(() => {
    cleanup();
  });

  describe("ModeToggle", () => {
    it("marks the active mode button", () => {
      renderWithCleanup(<ModeToggle mode="decToIeee" onChange={vi.fn()} />);
      const decButton = screen.getByTestId("ns-ieee-dec-to-ieee-button");
      const ieeeButton = screen.getByTestId("ns-ieee-ieee-to-dec-button");
      expect(decButton.className).toContain("bg-background");
      expect(ieeeButton.className).not.toContain("bg-background");
    });

    it("calls onChange with ieeeToDec", () => {
      const onChange = vi.fn();
      renderWithCleanup(<ModeToggle mode="decToIeee" onChange={onChange} />);
      screen.getByTestId("ns-ieee-ieee-to-dec-button").click();
      expect(onChange).toHaveBeenCalledWith("ieeeToDec");
    });
  });

  describe("IeeeInputField", () => {
    it("renders a decToIeee placeholder", () => {
      renderWithCleanup(
        <IeeeInputField mode="decToIeee" value="12.5" onChange={vi.fn()} />,
      );
      const input = screen.getByTestId("ns-ieee-input") as HTMLInputElement;
      expect(input.placeholder).toBe("12.5");
    });

    it("renders an ieeeToDec placeholder", () => {
      renderWithCleanup(
        <IeeeInputField mode="ieeeToDec" value="0100" onChange={vi.fn()} />,
      );
      const input = screen.getByTestId("ns-ieee-input") as HTMLInputElement;
      expect(input.placeholder).toBe("01000001010010000000000000000000");
    });

    it("is readonly when locked", () => {
      renderWithCleanup(
        <IeeeInputField
          mode="decToIeee"
          value="12.5"
          onChange={vi.fn()}
          locked
        />,
      );
      const input = screen.getByTestId("ns-ieee-input") as HTMLInputElement;
      expect(input.readOnly).toBe(true);
    });
  });

  describe("DecToIeeeResult", () => {
    it("renders sign, exponent, and mantissa", () => {
      renderWithCleanup(
        <DecToIeeeResult mode="decToIeee" analysis={baseAnalysis} />,
      );
      const result = screen.getByTestId("ns-ieee-result");
      expect(result.textContent).toContain("0");
      expect(result.textContent).toContain("10000010");
      expect(result.textContent).toContain("10010000000000000000000");
    });

    it("renders NaN bits", () => {
      const analysis: IEEE754Analysis = {
        ...baseAnalysis,
        isNaNVal: true,
      };
      renderWithCleanup(
        <DecToIeeeResult mode="decToIeee" analysis={analysis} />,
      );
      const result = screen.getByTestId("ns-ieee-result");
      expect(result.textContent).toContain("11111111");
    });

    it("renders placeholder when locked", () => {
      renderWithCleanup(
        <DecToIeeeResult mode="decToIeee" analysis={baseAnalysis} locked />,
      );
      expect(screen.getByText("--------")).toBeTruthy();
    });
  });

  describe("IeeeToDecResult", () => {
    it("renders the float value", () => {
      renderWithCleanup(
        <IeeeToDecResult mode="ieeeToDec" analysis={baseAnalysis} />,
      );
      expect(screen.getByText("12.5")).toBeTruthy();
    });

    it("renders NaN text", () => {
      const analysis: IEEE754Analysis = {
        ...baseAnalysis,
        isNaNVal: true,
      };
      renderWithCleanup(
        <IeeeToDecResult mode="ieeeToDec" analysis={analysis} />,
      );
      expect(screen.getByText("NaN")).toBeTruthy();
    });

    it("renders -0 for negative zero", () => {
      const analysis: IEEE754Analysis = {
        ...baseAnalysis,
        floatVal: -0,
      };
      renderWithCleanup(
        <IeeeToDecResult mode="ieeeToDec" analysis={analysis} />,
      );
      expect(screen.getByText("-0")).toBeTruthy();
    });
  });

  describe("ResultSection", () => {
    it("prompts for valid number when decToIeee input is invalid", () => {
      const analysis: IEEE754Analysis = {
        ...baseAnalysis,
        isValid: false,
      };
      renderWithCleanup(<ResultSection mode="decToIeee" analysis={analysis} />);
      expect(
        screen.getByText("number-systems.simulator.numbers.enterValidNumber"),
      ).toBeTruthy();
    });

    it("prompts for valid 32-bit when ieeeToDec input is invalid", () => {
      const analysis: IEEE754Analysis = {
        ...baseAnalysis,
        isValid: false,
      };
      renderWithCleanup(<ResultSection mode="ieeeToDec" analysis={analysis} />);
      expect(
        screen.getByText("number-systems.simulator.numbers.enterValid32Bit"),
      ).toBeTruthy();
    });
  });

  describe("SpecialCaseBanner", () => {
    it("renders nothing for normal values", () => {
      const { container } = renderWithCleanup(
        <SpecialCaseBanner mode="decToIeee" analysis={baseAnalysis} />,
      );
      expect(container.firstChild).toBeNull();
    });

    it("renders zero description", () => {
      const analysis: IEEE754Analysis = { ...baseAnalysis, isZero: true };
      renderWithCleanup(
        <SpecialCaseBanner mode="decToIeee" analysis={analysis} />,
      );
      expect(
        screen.getByText("number-systems.simulator.numbers.zero"),
      ).toBeTruthy();
    });

    it("renders infinity description", () => {
      const analysis: IEEE754Analysis = { ...baseAnalysis, isInf: true };
      renderWithCleanup(
        <SpecialCaseBanner mode="decToIeee" analysis={analysis} />,
      );
      expect(
        screen.getByText("number-systems.simulator.numbers.infinity"),
      ).toBeTruthy();
    });

    it("renders NaN description", () => {
      const analysis: IEEE754Analysis = { ...baseAnalysis, isNaNVal: true };
      renderWithCleanup(
        <SpecialCaseBanner mode="decToIeee" analysis={analysis} />,
      );
      expect(
        screen.getByText("number-systems.simulator.numbers.nan"),
      ).toBeTruthy();
    });
  });

  describe("DecToIeeeExplanation", () => {
    it("renders sign step and norm step", () => {
      renderWithCleanup(
        <DecToIeeeExplanation mode="decToIeee" analysis={baseAnalysis} />,
      );
      expect(
        screen.getByText("number-systems.simulator.numbers.step1Sign"),
      ).toBeTruthy();
      expect(
        screen.getByText("number-systems.simulator.numbers.step2Norm"),
      ).toBeTruthy();
      expect(
        screen.getByText("number-systems.simulator.numbers.step3Exp"),
      ).toBeTruthy();
      expect(
        screen.getByText("number-systems.simulator.numbers.step4Mantissa"),
      ).toBeTruthy();
    });
  });

  describe("IeeeToDecExplanation", () => {
    it("renders all four explanation steps", () => {
      renderWithCleanup(
        <IeeeToDecExplanation mode="ieeeToDec" analysis={baseAnalysis} />,
      );
      expect(
        screen.getByText("number-systems.simulator.numbers.step1Sign"),
      ).toBeTruthy();
      expect(
        screen.getByText("number-systems.simulator.numbers.step2ExpExtract"),
      ).toBeTruthy();
      expect(
        screen.getByText("number-systems.simulator.numbers.step3MantExtract"),
      ).toBeTruthy();
      expect(
        screen.getByText("number-systems.simulator.numbers.step4FinalCalc"),
      ).toBeTruthy();
    });
  });

  describe("ConceptPath", () => {
    it("prompts for input when invalid", () => {
      const analysis: IEEE754Analysis = {
        ...baseAnalysis,
        isValid: false,
      };
      renderWithCleanup(<ConceptPath mode="decToIeee" analysis={analysis} />);
      expect(
        screen.getByText("number-systems.simulator.numbers.enterValueForExp"),
      ).toBeTruthy();
    });

    it("shows special case note for zero", () => {
      const analysis: IEEE754Analysis = { ...baseAnalysis, isSpecial: true };
      renderWithCleanup(<ConceptPath mode="decToIeee" analysis={analysis} />);
      expect(
        screen.getByText("number-systems.simulator.numbers.specialCaseNoMath"),
      ).toBeTruthy();
    });

    it("renders decToIeee explanation for valid decToIeee", () => {
      renderWithCleanup(
        <ConceptPath mode="decToIeee" analysis={baseAnalysis} />,
      );
      expect(
        screen.getByText("number-systems.simulator.numbers.step2Norm"),
      ).toBeTruthy();
    });

    it("renders ieeeToDec explanation for valid ieeeToDec", () => {
      renderWithCleanup(
        <ConceptPath mode="ieeeToDec" analysis={baseAnalysis} />,
      );
      expect(
        screen.getByText("number-systems.simulator.numbers.step2ExpExtract"),
      ).toBeTruthy();
    });
  });

  describe("getExpectedResult", () => {
    it("returns concatenated and spaced binary for decToIeee", () => {
      const result = getExpectedResult(baseAnalysis, "decToIeee");
      expect(result).toEqual([
        "01000001010010000000000000000000",
        "0 10000010 10010000000000000000000",
      ]);
    });

    it("returns NaN aliases for decToIeee NaN", () => {
      const analysis: IEEE754Analysis = {
        ...baseAnalysis,
        isNaNVal: true,
      };
      const result = getExpectedResult(analysis, "decToIeee");
      expect(result).toEqual(["NaN", "nan"]);
    });

    it("returns float string for ieeeToDec", () => {
      const result = getExpectedResult(baseAnalysis, "ieeeToDec");
      expect(result).toEqual(["12.5"]);
    });

    it("returns -0 aliases for negative zero", () => {
      const analysis: IEEE754Analysis = {
        ...baseAnalysis,
        floatVal: -0,
      };
      const result = getExpectedResult(analysis, "ieeeToDec");
      expect(result).toEqual(["-0", "0"]);
    });

    it("returns NaN aliases for ieeeToDec NaN", () => {
      const analysis: IEEE754Analysis = {
        ...baseAnalysis,
        isNaNVal: true,
      };
      const result = getExpectedResult(analysis, "ieeeToDec");
      expect(result).toEqual(["NaN", "nan"]);
    });
  });

  describe("ExplanationPanel", () => {
    it("shows validation panel when locked", () => {
      renderWithCleanup(
        <ExplanationPanel
          mode="decToIeee"
          analysis={baseAnalysis}
          locked
          expectedResult={["expected"]}
          onShowSolution={vi.fn()}
        />,
      );
      expect(screen.getByTestId("mock-validation-panel")).toBeTruthy();
    });

    it("shows concept path when not locked", () => {
      renderWithCleanup(
        <ExplanationPanel
          mode="decToIeee"
          analysis={baseAnalysis}
          expectedResult={["expected"]}
        />,
      );
      expect(
        screen.getByText("number-systems.simulator.numbers.conceptPath"),
      ).toBeTruthy();
    });
  });
});
