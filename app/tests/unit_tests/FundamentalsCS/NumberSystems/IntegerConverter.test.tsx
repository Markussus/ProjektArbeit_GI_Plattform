/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IntegerConverter } from "@/pages/FundamentalsCS/NumberSystems/components/simulator/IntegerConverter.tsx";

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
  () => ({
    ExerciseValidationPanel: ({
      expectedResult,
      onShowSolution,
      inputMode,
    }: {
      expectedResult: string | string[];
      onShowSolution: () => void;
      inputMode: string;
    }) => (
      <div data-testid="mock-validation-panel">
        <span data-testid="mock-validation-expected-result">
          {Array.isArray(expectedResult)
            ? expectedResult.join(",")
            : expectedResult}
        </span>
        <span data-testid="mock-validation-input-mode">{inputMode}</span>
        <button
          data-testid="mock-validation-show-solution"
          onClick={onShowSolution}
        >
          show solution
        </button>
      </div>
    ),
  }),
);

describe("IntegerConverter", () => {
  afterEach(() => {
    cleanup();
  });

  describe("when rendering in free mode", () => {
    it("shows decimal as default source base", () => {
      render(<IntegerConverter />);
      expect(
        screen.getByTestId("ns-integer-source-base").textContent,
      ).toContain("dec");
    });

    it("shows binary as default target base", () => {
      render(<IntegerConverter />);
      expect(
        screen.getByTestId("ns-integer-target-base").textContent,
      ).toContain("bin");
    });

    it("converts decimal 255 to binary 11111111", () => {
      render(<IntegerConverter />);
      const input = screen.getByTestId("ns-converter-value-input");
      fireEvent.change(input, { target: { value: "255" } });
      expect(screen.getByTestId("ns-converter-result").textContent).toContain(
        "11111111",
      );
    });

    it("converts decimal 42 to binary 101010", () => {
      render(<IntegerConverter />);
      const input = screen.getByTestId("ns-converter-value-input");
      fireEvent.change(input, { target: { value: "42" } });
      expect(screen.getByTestId("ns-converter-result").textContent).toContain(
        "101010",
      );
    });
  });

  describe("when initialized with exercise values", () => {
    it("sets the initial base and value", () => {
      render(
        <IntegerConverter
          initialValue="110010"
          initialBase="bin"
          initialTargetBase="hex"
        />,
      );
      expect(
        (screen.getByTestId("ns-converter-value-input") as HTMLInputElement)
          .value,
      ).toBe("110010");
      expect(
        screen.getByTestId("ns-integer-source-base").textContent,
      ).toContain("bin");
      expect(
        screen.getByTestId("ns-integer-target-base").textContent,
      ).toContain("hex");
    });

    it("computes the correct hex result from binary input", () => {
      render(
        <IntegerConverter
          initialValue="110010"
          initialBase="bin"
          initialTargetBase="hex"
        />,
      );
      expect(screen.getByTestId("ns-converter-result").textContent).toContain(
        "32",
      );
    });
  });

  describe("when in exercise mode without solution", () => {
    it("shows the validation panel", () => {
      render(
        <IntegerConverter
          isExerciseMode
          showSolution={false}
          onShowSolution={vi.fn()}
          initialValue="42"
          initialBase="dec"
          initialTargetBase="bin"
        />,
      );
      expect(screen.getByTestId("mock-validation-panel")).toBeTruthy();
    });

    it("locks the input field", () => {
      render(
        <IntegerConverter
          isExerciseMode
          showSolution={false}
          onShowSolution={vi.fn()}
          initialValue="42"
          initialBase="dec"
          initialTargetBase="bin"
        />,
      );
      const input = screen.getByTestId("ns-converter-value-input");
      expect(input.hasAttribute("readonly")).toBe(true);
    });

    it("passes the expected binary result to validation panel", () => {
      render(
        <IntegerConverter
          isExerciseMode
          showSolution={false}
          onShowSolution={vi.fn()}
          initialValue="42"
          initialBase="dec"
          initialTargetBase="bin"
        />,
      );
      expect(
        screen.getByTestId("mock-validation-expected-result").textContent,
      ).toContain("101010");
    });

    it("calls onShowSolution when show solution button is clicked", () => {
      const onShowSolution = vi.fn();
      render(
        <IntegerConverter
          isExerciseMode
          showSolution={false}
          onShowSolution={onShowSolution}
          initialValue="42"
          initialBase="dec"
          initialTargetBase="bin"
        />,
      );
      fireEvent.click(screen.getByTestId("mock-validation-show-solution"));
      expect(onShowSolution).toHaveBeenCalledTimes(1);
    });
  });

  describe("when in exercise mode with solution shown", () => {
    it("allows input changes", () => {
      render(
        <IntegerConverter
          isExerciseMode
          showSolution
          onShowSolution={vi.fn()}
          initialValue="42"
          initialBase="dec"
          initialTargetBase="bin"
        />,
      );
      const input = screen.getByTestId("ns-converter-value-input");
      expect(input.hasAttribute("readonly")).toBe(false);
    });

    it("shows the computed result", () => {
      render(
        <IntegerConverter
          isExerciseMode
          showSolution
          onShowSolution={vi.fn()}
          initialValue="42"
          initialBase="dec"
          initialTargetBase="bin"
        />,
      );
      expect(screen.getByTestId("ns-converter-result").textContent).toContain(
        "101010",
      );
    });
  });
});
