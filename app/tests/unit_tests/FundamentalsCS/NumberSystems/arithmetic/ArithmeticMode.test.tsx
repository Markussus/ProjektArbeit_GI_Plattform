/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ArithmeticMode } from "@/pages/FundamentalsCS/NumberSystems/components/simulator/arithmetic/ArithmeticMode.tsx";

const { mockOperation } = vi.hoisted(() => {
  const mockOperation = (name: string) => {
    const Comp = (props: {
      isExerciseMode?: boolean;
      showSolution?: boolean;
      initialA?: string;
      initialB?: string;
      onChangeValues?: (a: string, b: string) => void;
      renderModeSelector?: React.ReactNode;
    }) => (
      <div data-testid={`mock-operation-${name}`}>
        <span data-testid={`${name}-isExerciseMode`}>
          {String(props.isExerciseMode)}
        </span>
        <span data-testid={`${name}-showSolution`}>
          {String(props.showSolution)}
        </span>
        <span data-testid={`${name}-initialA`}>{props.initialA}</span>
        <span data-testid={`${name}-initialB`}>{props.initialB}</span>
        <button
          data-testid={`${name}-change-values`}
          onClick={() => props.onChangeValues?.("11110000", "00001111")}
        >
          change
        </button>
        <div data-testid={`${name}-mode-selector`}>
          {props.renderModeSelector}
        </div>
      </div>
    );
    return { [name[0].toUpperCase() + name.slice(1)]: Comp };
  };
  return { mockOperation };
});

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: Record<string, unknown>) =>
      typeof fallback === "object" && fallback !== null
        ? `${key}:${JSON.stringify(fallback)}`
        : key,
  }),
}));

vi.mock("@/components/shared/DropdownSelect/DropdownSelect", () => ({
  DropdownSelect: ({
    value,
    options,
    onChange,
    disabled,
    ariaLabel,
  }: {
    value: string;
    options: { value: string; label: string }[];
    onChange: (v: string) => void;
    disabled?: boolean;
    ariaLabel?: string;
  }) => (
    <select
      data-testid="mock-dropdown"
      data-active={value}
      data-disabled={disabled ?? false}
      aria-label={ariaLabel}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  ),
}));

vi.mock(
  "@/pages/FundamentalsCS/NumberSystems/components/simulator/arithmetic/Addition.tsx",
  () => mockOperation("addition"),
);
vi.mock(
  "@/pages/FundamentalsCS/NumberSystems/components/simulator/arithmetic/Subtraction.tsx",
  () => mockOperation("subtraction"),
);
vi.mock(
  "@/pages/FundamentalsCS/NumberSystems/components/simulator/arithmetic/Multiplication.tsx",
  () => mockOperation("multiplication"),
);
vi.mock(
  "@/pages/FundamentalsCS/NumberSystems/components/simulator/arithmetic/Division.tsx",
  () => mockOperation("division"),
);
vi.mock(
  "@/pages/FundamentalsCS/NumberSystems/components/simulator/arithmetic/Shifting.tsx",
  () => mockOperation("shifting"),
);
vi.mock(
  "@/pages/FundamentalsCS/NumberSystems/components/simulator/arithmetic/Compare.tsx",
  () => mockOperation("compare"),
);

const changeDropdown = (value: string) => {
  fireEvent.change(screen.getByTestId("mock-dropdown"), {
    target: { value },
  });
};

describe("ArithmeticMode", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the default addition sub-mode", () => {
    render(<ArithmeticMode />);
    expect(screen.getByTestId("mock-operation-addition")).toBeTruthy();
  });

  it("uses initialMode prop when provided", () => {
    render(<ArithmeticMode initialMode="multiplication" />);
    expect(screen.queryByTestId("mock-operation-addition")).toBeNull();
    expect(screen.getByTestId("mock-operation-multiplication")).toBeTruthy();
  });

  it("switches sub-mode via the mocked dropdown", () => {
    render(<ArithmeticMode />);
    changeDropdown("division");
    expect(screen.queryByTestId("mock-operation-addition")).toBeNull();
    expect(screen.getByTestId("mock-operation-division")).toBeTruthy();
  });

  it("renders every arithmetic sub-mode when selected", () => {
    render(<ArithmeticMode />);
    const modes = [
      "addition",
      "subtraction",
      "multiplication",
      "division",
      "shifting",
      "compare",
    ];
    for (const mode of modes) {
      changeDropdown(mode);
      expect(screen.getByTestId(`mock-operation-${mode}`)).toBeTruthy();
    }
  });

  it("propagates exercise mode and solution flags to the active operation", () => {
    render(<ArithmeticMode isExerciseMode showSolution={false} />);
    expect(screen.getByTestId("addition-isExerciseMode").textContent).toBe(
      "true",
    );
    expect(screen.getByTestId("addition-showSolution").textContent).toBe(
      "false",
    );
  });

  it("passes initial values to the active operation", () => {
    render(
      <ArithmeticMode initialValueA="10101010" initialValueB="01010101" />,
    );
    expect(screen.getByTestId("addition-initialA").textContent).toBe(
      "10101010",
    );
    expect(screen.getByTestId("addition-initialB").textContent).toBe(
      "01010101",
    );
  });

  it("syncs changed values back to the next active sub-mode", () => {
    render(<ArithmeticMode />);
    fireEvent.click(screen.getByTestId("addition-change-values"));
    changeDropdown("subtraction");
    expect(screen.getByTestId("subtraction-initialA").textContent).toBe(
      "11110000",
    );
    expect(screen.getByTestId("subtraction-initialB").textContent).toBe(
      "00001111",
    );
  });

  it("calls onChangeState with the current mode and values", () => {
    const onChangeState = vi.fn();
    render(<ArithmeticMode onChangeState={onChangeState} />);
    fireEvent.click(screen.getByTestId("addition-change-values"));
    expect(onChangeState).toHaveBeenLastCalledWith({
      activeSubMode: "addition",
      valA: "11110000",
      valB: "00001111",
    });
  });

  it("restores state from initialState when not locked", () => {
    render(
      <ArithmeticMode
        initialState={{
          activeSubMode: "compare",
          valA: "00001111",
          valB: "11110000",
        }}
      />,
    );
    expect(screen.getByTestId("mock-operation-compare")).toBeTruthy();
    expect(screen.getByTestId("compare-initialA").textContent).toBe("00001111");
    expect(screen.getByTestId("compare-initialB").textContent).toBe("11110000");
  });

  it("ignores initialState when locked (exercise mode without solution)", () => {
    render(
      <ArithmeticMode
        isExerciseMode
        showSolution={false}
        initialMode="division"
        initialValueA="10101010"
        initialValueB="01010101"
        initialState={{
          activeSubMode: "compare",
          valA: "00001111",
          valB: "11110000",
        }}
      />,
    );
    expect(screen.getByTestId("mock-operation-division")).toBeTruthy();
    expect(screen.getByTestId("division-initialA").textContent).toBe(
      "10101010",
    );
    expect(screen.getByTestId("division-initialB").textContent).toBe(
      "01010101",
    );
    expect(
      screen.getByTestId("mock-dropdown").getAttribute("data-disabled"),
    ).toBe("true");
  });

  it("uses defaults when no initial values are provided", () => {
    render(<ArithmeticMode />);
    expect(screen.getByTestId("addition-initialA").textContent).toBe("");
    expect(screen.getByTestId("addition-initialB").textContent).toBe("");
  });

  it("passes the mode selector into the active operation", () => {
    render(<ArithmeticMode />);
    expect(
      screen
        .getByTestId("addition-mode-selector")
        .querySelector('[data-testid="mock-dropdown"]'),
    ).toBeTruthy();
  });
});
