/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ExplanationContent,
  ExplanationPanel,
  InputPanel,
  ModeTitle,
  NegativeExplanation,
  ResultRow,
  Step1Abs,
  Step2Ones,
  Step2Sign,
  Step3Twos,
} from "@/pages/FundamentalsCS/NumberSystems/components/simulator/NegativeNumbersParts.tsx";
import {
  addOneToBinary,
  getNegativeNumberConversions,
  getOnesComplement,
  getSignMagnitude,
  getTwosComplement,
  isValid8Bit,
  parse8Bit,
} from "@/pages/FundamentalsCS/NumberSystems/components/simulator/negativeNumbersUtils";

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

const conversionsFor = (value: number) =>
  getNegativeNumberConversions(parse8Bit(value.toString()));

function renderWithCleanup(component: React.ReactElement) {
  cleanup();
  return render(component);
}

describe("negativeNumbersUtils", () => {
  describe("isValid8Bit", () => {
    it.each([
      { value: "-128", expected: true },
      { value: "127", expected: true },
      { value: "0", expected: true },
      { value: "128", expected: false },
      { value: "-129", expected: false },
      { value: "", expected: false },
      { value: "abc", expected: false },
    ])("returns $expected for $value", ({ value, expected }) => {
      expect(isValid8Bit(value)).toBe(expected);
    });
  });

  describe("parse8Bit", () => {
    it("parses valid values", () => {
      expect(parse8Bit("-5")).toBe(-5);
      expect(parse8Bit("42")).toBe(42);
    });

    it("returns null for invalid values", () => {
      expect(parse8Bit("999")).toBeNull();
      expect(parse8Bit("")).toBeNull();
    });
  });

  describe("addOneToBinary", () => {
    it("adds one to a binary string", () => {
      expect(addOneToBinary("11111010")).toBe("11111011");
      expect(addOneToBinary("11111111")).toBe("00000000");
    });
  });

  describe("getSignMagnitude", () => {
    it("returns positive binary for non-negative values", () => {
      expect(getSignMagnitude(5)).toBe("00000101");
    });

    it("flips the sign bit for negative values", () => {
      expect(getSignMagnitude(-5)).toBe("10000101");
    });
  });

  describe("getOnesComplement", () => {
    it("returns positive binary for non-negative values", () => {
      expect(getOnesComplement(5)).toBe("00000101");
    });

    it("inverts all bits for negative values", () => {
      expect(getOnesComplement(-5)).toBe("11111010");
    });
  });

  describe("getTwosComplement", () => {
    it.each([
      { value: 5, expected: "00000101" },
      { value: -5, expected: "11111011" },
      { value: -1, expected: "11111111" },
      { value: -128, expected: "10000000" },
    ])("computes $value to $expected", ({ value, expected }) => {
      expect(getTwosComplement(value)).toBe(expected);
    });
  });

  describe("getNegativeNumberConversions", () => {
    it("returns zeros for null", () => {
      const result = getNegativeNumberConversions(null);
      expect(result.signMagnitude).toBe("00000000");
      expect(result.onesComplement).toBe("00000000");
      expect(result.twosComplement).toBe("00000000");
    });

    it("returns identical binaries for positive values", () => {
      const result = getNegativeNumberConversions(5);
      expect(result.signMagnitude).toBe("00000101");
      expect(result.signMagnitude).toBe(result.onesComplement);
      expect(result.onesComplement).toBe(result.twosComplement);
    });
  });
});

describe("NegativeNumbersParts", () => {
  afterEach(() => {
    cleanup();
  });

  describe("ResultRow", () => {
    it("renders value when valid", () => {
      renderWithCleanup(<ResultRow label="Twos" value="11111011" valid />);
      expect(screen.getByText("11111011")).toBeTruthy();
    });

    it("renders dashes when invalid", () => {
      renderWithCleanup(<ResultRow label="Twos" value="" valid={false} />);
      expect(screen.getByText("--------")).toBeTruthy();
    });
  });

  describe("InputPanel", () => {
    it("renders input and result rows", () => {
      renderWithCleanup(
        <InputPanel
          inputValue="-5"
          locked={false}
          isValid
          onChange={vi.fn()}
          conversions={conversionsFor(-5)}
          activeMode="twos"
          onModeChange={vi.fn()}
        />,
      );
      expect(screen.getByTestId("ns-negative-decimal-input")).toBeTruthy();
      expect(screen.getByTestId("ns-negative-sign-magnitude")).toBeTruthy();
      expect(screen.getByTestId("ns-negative-ones-complement")).toBeTruthy();
      expect(screen.getByTestId("ns-negative-twos-complement")).toBeTruthy();
    });

    it("shows invalid range message for invalid input", () => {
      renderWithCleanup(
        <InputPanel
          inputValue="999"
          locked={false}
          isValid={false}
          onChange={vi.fn()}
          conversions={getNegativeNumberConversions(null)}
          activeMode="twos"
          onModeChange={vi.fn()}
        />,
      );
      expect(
        screen.getByText("number-systems.simulator.numbers.invalidRange"),
      ).toBeTruthy();
    });
  });

  describe("ModeTitle", () => {
    it.each([
      ["twos", "number-systems.simulator.numbers.stepByStepTwos"],
      ["ones", "number-systems.simulator.numbers.stepByStepOnes"],
      ["sign", "number-systems.simulator.numbers.stepByStepSign"],
    ] as const)("renders title for %s", (mode, expectedKey) => {
      renderWithCleanup(<ModeTitle activeMode={mode} />);
      expect(screen.getByText(expectedKey)).toBeTruthy();
    });
  });

  describe("Step1Abs", () => {
    it("renders absolute binary", () => {
      renderWithCleanup(<Step1Abs parsed={-5} positiveBin="00000101" />);
      expect(screen.getByText("00000101")).toBeTruthy();
    });
  });

  describe("Step2Sign", () => {
    it("renders sign-magnitude preview", () => {
      renderWithCleanup(<Step2Sign positiveBin="00000101" />);
      expect(screen.getByText("1")).toBeTruthy();
      expect(screen.getByText("0000101")).toBeTruthy();
    });
  });

  describe("Step2Ones", () => {
    it("renders ones complement", () => {
      renderWithCleanup(<Step2Ones onesComplement="11111010" />);
      expect(screen.getByText("11111010")).toBeTruthy();
    });
  });

  describe("Step3Twos", () => {
    it("renders twos complement addition", () => {
      renderWithCleanup(
        <Step3Twos onesComplement="11111010" twosComplement="11111011" />,
      );
      expect(screen.getByText("11111010")).toBeTruthy();
      expect(screen.getByText("11111011")).toBeTruthy();
    });
  });

  describe("NegativeExplanation", () => {
    it("renders all twos-complement steps", () => {
      renderWithCleanup(
        <NegativeExplanation
          parsed={-5}
          conversions={conversionsFor(-5)}
          activeMode="twos"
        />,
      );
      expect(screen.getByText("00000101")).toBeTruthy();
      expect(screen.getAllByText("11111010").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("11111011")).toBeTruthy();
    });

    it("renders only sign-magnitude steps", () => {
      renderWithCleanup(
        <NegativeExplanation
          parsed={-5}
          conversions={conversionsFor(-5)}
          activeMode="sign"
        />,
      );
      expect(screen.getByText("1")).toBeTruthy();
      expect(screen.queryByText("11111010")).toBeNull();
    });
  });

  describe("ExplanationContent", () => {
    it("prompts for input when invalid", () => {
      renderWithCleanup(
        <ExplanationContent
          isValid={false}
          parsed={null}
          conversions={getNegativeNumberConversions(null)}
          activeMode="twos"
        />,
      );
      expect(
        screen.getByText("number-systems.simulator.numbers.enterValueForExp"),
      ).toBeTruthy();
    });

    it("shows positive explanation for positive values", () => {
      renderWithCleanup(
        <ExplanationContent
          isValid
          parsed={5}
          conversions={conversionsFor(5)}
          activeMode="twos"
        />,
      );
      expect(
        screen.getByText(
          "number-systems.simulator.numbers.positiveExplanation",
        ),
      ).toBeTruthy();
    });
  });

  describe("ExplanationPanel", () => {
    it("shows validation panel when locked", () => {
      renderWithCleanup(
        <ExplanationPanel
          conversions={conversionsFor(-5)}
          activeMode="twos"
          parsed={-5}
          isValid
          inputValue="-5"
          locked
          onShowSolution={vi.fn()}
          onModeChange={vi.fn()}
        />,
      );
      expect(screen.getByTestId("mock-validation-panel")).toBeTruthy();
    });

    it("shows explanation content when not locked", () => {
      renderWithCleanup(
        <ExplanationPanel
          conversions={conversionsFor(-5)}
          activeMode="twos"
          parsed={-5}
          isValid
          inputValue="-5"
          locked={false}
          onModeChange={vi.fn()}
        />,
      );
      expect(
        screen.getByText("number-systems.simulator.numbers.stepByStepTwos"),
      ).toBeTruthy();
    });
  });
});
