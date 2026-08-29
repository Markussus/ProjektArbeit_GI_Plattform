/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Simulator } from "@/pages/FundamentalsCS/NumberSystems/components/simulator/Simulator.tsx";
import type { Exercise } from "@/types/exercise.ts";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) =>
      typeof fallback === "string" ? fallback : key,
  }),
}));

vi.mock(
  "../../../../src/pages/FundamentalsCS/NumberSystems/components/simulator/IntegerConverter",
  () => ({
    IntegerConverter: (props: Record<string, unknown>) => (
      <div data-testid="mock-integer-converter">
        <div data-testid="mock-integer-is-exercise">
          {String(props.isExerciseMode)}
        </div>
        <div data-testid="mock-integer-show-solution">
          {String(props.showSolution)}
        </div>
        <div data-testid="mock-integer-initial-value">
          {String(props.initialValue)}
        </div>
        <div data-testid="mock-integer-initial-base">
          {String(props.initialBase)}
        </div>
        <div data-testid="mock-integer-initial-target-base">
          {String(props.initialTargetBase)}
        </div>
        <button
          data-testid="mock-integer-show-solution-button"
          onClick={props.onShowSolution}
        >
          show solution
        </button>
        <button
          data-testid="mock-integer-exit-exercise-button"
          onClick={props.onExitExercise}
        >
          exit exercise
        </button>
      </div>
    ),
  }),
);

vi.mock(
  "../../../../src/pages/FundamentalsCS/NumberSystems/components/simulator/FractionalConverter",
  () => ({
    FractionalConverter: () => <div data-testid="mock-fractional-converter" />,
  }),
);

vi.mock(
  "../../../../src/pages/FundamentalsCS/NumberSystems/components/simulator/NegativeNumbers",
  () => ({
    NegativeNumbers: () => <div data-testid="mock-negative-numbers" />,
  }),
);

vi.mock(
  "../../../../src/pages/FundamentalsCS/NumberSystems/components/simulator/IEEE754Converter",
  () => ({
    IEEE754Converter: (props: Record<string, unknown>) => (
      <div data-testid="mock-ieee-converter">
        <div data-testid="mock-ieee-initial-value">
          {String(props.initialValue)}
        </div>
        <div data-testid="mock-ieee-initial-mode">
          {String(props.initialConverterMode)}
        </div>
      </div>
    ),
  }),
);

vi.mock(
  "../../../../src/pages/FundamentalsCS/NumberSystems/components/simulator/arithmetic/ArithmeticMode",
  () => ({
    ArithmeticMode: (props: Record<string, unknown>) => (
      <div data-testid="mock-arithmetic-mode">
        <div data-testid="mock-arithmetic-initial-a">
          {String(props.initialValueA)}
        </div>
        <div data-testid="mock-arithmetic-initial-b">
          {String(props.initialValueB)}
        </div>
        <div data-testid="mock-arithmetic-initial-sub-mode">
          {String(props.initialMode)}
        </div>
      </div>
    ),
  }),
);

function createExercise(
  id: string,
  title: string,
  description: string,
): Exercise {
  return {
    id,
    title,
    description,
    difficulty: "easy",
    icon: { name: "Binary" } as never,
  };
}

describe("Simulator", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when no exercise is selected", () => {
    it("renders the integer converter by default", () => {
      render(<Simulator />);

      expect(screen.getByTestId("mock-integer-converter")).toBeTruthy();
    });

    it("shows all five mode tabs", () => {
      render(<Simulator />);

      expect(screen.getByTestId("ns-tab-integers")).toBeTruthy();
      expect(screen.getByTestId("ns-tab-fractional")).toBeTruthy();
      expect(screen.getByTestId("ns-tab-negative")).toBeTruthy();
      expect(screen.getByTestId("ns-tab-ieee754")).toBeTruthy();
      expect(screen.getByTestId("ns-tab-arithmetic")).toBeTruthy();
    });
  });

  describe("when switching between mode tabs", () => {
    it("switches to fractional converter when fractional tab is clicked", () => {
      render(<Simulator />);

      fireEvent.click(screen.getByTestId("ns-tab-fractional"));
      expect(screen.getByTestId("mock-fractional-converter")).toBeTruthy();
    });

    it("switches to negative numbers when negative tab is clicked", () => {
      render(<Simulator />);

      fireEvent.click(screen.getByTestId("ns-tab-negative"));
      expect(screen.getByTestId("mock-negative-numbers")).toBeTruthy();
    });

    it("switches to IEEE754 converter when ieee754 tab is clicked", () => {
      render(<Simulator />);

      fireEvent.click(screen.getByTestId("ns-tab-ieee754"));
      expect(screen.getByTestId("mock-ieee-converter")).toBeTruthy();
    });

    it("switches to arithmetic mode when arithmetic tab is clicked", () => {
      render(<Simulator />);

      fireEvent.click(screen.getByTestId("ns-tab-arithmetic"));
      expect(screen.getByTestId("mock-arithmetic-mode")).toBeTruthy();
    });
  });

  describe("when an exercise is selected", () => {
    it("maps ex_u03_decToBin to integers mode with decimal initial value", () => {
      render(
        <Simulator
          selectedExercise={createExercise(
            "number-systems.ex_u03_decToBin",
            "Dezimal zu Binär",
            "Convert decimal to binary",
          )}
        />,
      );

      expect(screen.getByTestId("mock-integer-converter")).toBeTruthy();
      expect(
        screen.getByTestId("mock-integer-initial-base").textContent,
      ).toContain("dec");
      expect(
        screen.getByTestId("mock-integer-initial-target-base").textContent,
      ).toContain("bin");
    });

    it("maps ex_u03_binAdd to arithmetic mode with addition sub-mode", () => {
      render(
        <Simulator
          selectedExercise={createExercise(
            "number-systems.ex_u03_binAdd",
            "Binär Addition",
            "Binary addition",
          )}
        />,
      );

      expect(screen.getByTestId("mock-arithmetic-mode")).toBeTruthy();
      expect(
        screen.getByTestId("mock-arithmetic-initial-sub-mode").textContent,
      ).toContain("addition");
    });

    it("maps ex_u04_binToHexOct to integers mode with bin source", () => {
      render(
        <Simulator
          selectedExercise={createExercise(
            "number-systems.ex_u04_binToHexOct",
            "Binär zu Hex/Oktal",
            "Binary to hex/octal",
          )}
        />,
      );

      expect(screen.getByTestId("mock-integer-converter")).toBeTruthy();
      expect(
        screen.getByTestId("mock-integer-initial-base").textContent,
      ).toContain("bin");
    });

    it("maps ex_u05_ieeeEncode to ieee754 mode with decToIeee", () => {
      render(
        <Simulator
          selectedExercise={createExercise(
            "number-systems.ex_u05_ieeeEncode",
            "IEEE754 Encodieren",
            "IEEE754 encode",
          )}
        />,
      );

      expect(screen.getByTestId("mock-ieee-converter")).toBeTruthy();
      expect(
        screen.getByTestId("mock-ieee-initial-mode").textContent,
      ).toContain("decToIeee");
    });

    it("maps ex_u05_ieeeDecode to ieee754 mode with ieeeToDec", () => {
      render(
        <Simulator
          selectedExercise={createExercise(
            "number-systems.ex_u05_ieeeDecode",
            "IEEE754 Decodieren",
            "IEEE754 decode",
          )}
        />,
      );

      expect(screen.getByTestId("mock-ieee-converter")).toBeTruthy();
      expect(
        screen.getByTestId("mock-ieee-initial-mode").textContent,
      ).toContain("ieeeToDec");
    });

    it("maps ex_u06_mult to arithmetic mode with multiplication sub-mode", () => {
      render(
        <Simulator
          selectedExercise={createExercise(
            "number-systems.ex_u06_mult",
            "Binär Multiplikation",
            "Binary multiplication",
          )}
        />,
      );

      expect(screen.getByTestId("mock-arithmetic-mode")).toBeTruthy();
      expect(
        screen.getByTestId("mock-arithmetic-initial-sub-mode").textContent,
      ).toContain("multiplication");
    });
  });

  describe("when an example is selected", () => {
    it("sets showSolution to true for examples", () => {
      render(
        <Simulator
          selectedExercise={createExercise(
            "number-systems.example_u03_1",
            "Beispiel Umrechnung",
            "Example conversion",
          )}
        />,
      );

      expect(
        screen.getByTestId("mock-integer-show-solution").textContent,
      ).toContain("true");
    });

    it("pre-fills example_u03_1 with decimal value 26", () => {
      render(
        <Simulator
          selectedExercise={createExercise(
            "number-systems.example_u03_1",
            "Beispiel Umrechnung",
            "Example conversion",
          )}
        />,
      );

      expect(
        screen.getByTestId("mock-integer-initial-value").textContent,
      ).toContain("26");
      expect(
        screen.getByTestId("mock-integer-initial-base").textContent,
      ).toContain("dec");
      expect(
        screen.getByTestId("mock-integer-initial-target-base").textContent,
      ).toContain("bin");
    });
  });

  describe("when in exercise mode without solution shown", () => {
    it("exits exercise and switches tab immediately", () => {
      const onExitExercise = vi.fn();
      render(
        <Simulator
          selectedExercise={createExercise(
            "number-systems.ex_u03_decToBin",
            "Dezimal zu Binär",
            "Convert decimal to binary",
          )}
          onExitExercise={onExitExercise}
        />,
      );

      expect(
        screen.getByTestId("mock-integer-is-exercise").textContent,
      ).toContain("true");
      expect(
        screen.getByTestId("mock-integer-show-solution").textContent,
      ).toContain("false");

      fireEvent.click(screen.getByTestId("ns-tab-fractional"));

      expect(onExitExercise).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("mock-fractional-converter")).toBeTruthy();
    });
  });

  describe("when exiting exercise mode", () => {
    it("calls onExitExercise callback", () => {
      const onExitExercise = vi.fn();
      render(
        <Simulator
          selectedExercise={createExercise(
            "number-systems.ex_u03_decToBin",
            "Dezimal zu Binär",
            "Convert decimal to binary",
          )}
          onExitExercise={onExitExercise}
        />,
      );

      fireEvent.click(screen.getByTestId("mock-integer-exit-exercise-button"));

      expect(onExitExercise).toHaveBeenCalledTimes(1);
    });
  });
});
