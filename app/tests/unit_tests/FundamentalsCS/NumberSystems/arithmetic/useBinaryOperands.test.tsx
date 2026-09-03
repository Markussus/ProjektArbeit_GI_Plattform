/** @vitest-environment jsdom */

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useBinaryOperands } from "@/pages/FundamentalsCS/NumberSystems/components/simulator/arithmetic/useBinaryOperands";
import { useBinaryOperand } from "@/pages/FundamentalsCS/NumberSystems/components/simulator/arithmetic/useBinaryOperand";

vi.mock("@/components/shared/SimulatorShared", () => ({
  useToggleSet: (initial: string[]) => ({
    expanded: new Set(initial),
    toggle: vi.fn(),
  }),
}));

describe("useBinaryOperands", () => {
  it("initializes with defaults when no initial values are given", () => {
    const { result } = renderHook(() =>
      useBinaryOperands({ defaultA: "00000001", defaultB: "00000010" }),
    );
    expect(result.current.valA).toBe("00000001");
    expect(result.current.valB).toBe("00000010");
    expect(result.current.locked).toBe(false);
  });

  it("uses initialA and initialB over defaults", () => {
    const { result } = renderHook(() =>
      useBinaryOperands({
        defaultA: "00000001",
        defaultB: "00000010",
        initialA: "10101010",
        initialB: "01010101",
      }),
    );
    expect(result.current.valA).toBe("10101010");
    expect(result.current.valB).toBe("01010101");
  });

  it("updates values when initial props change", () => {
    const { result, rerender } = renderHook(
      ({ initialA, initialB }) =>
        useBinaryOperands({
          defaultA: "00000000",
          defaultB: "00000000",
          initialA,
          initialB,
        }),
      {
        initialProps: {
          initialA: "10101010",
          initialB: "01010101",
        },
      },
    );
    rerender({ initialA: "11110000", initialB: "00001111" });
    expect(result.current.valA).toBe("11110000");
    expect(result.current.valB).toBe("00001111");
  });

  it("sanitizes non-binary characters and respects max length", () => {
    const { result } = renderHook(() =>
      useBinaryOperands({
        defaultA: "00000001",
        defaultB: "00000010",
        maxLengthA: 4,
        maxLengthB: 8,
      }),
    );
    act(() => {
      result.current.handleInputA("abc1010xyz");
      result.current.handleInputB("11110000extra");
    });
    expect(result.current.valA).toBe("1010");
    expect(result.current.valB).toBe("11110000");
  });

  it("does not allow input changes while locked", () => {
    const { result } = renderHook(() =>
      useBinaryOperands({
        defaultA: "00000001",
        defaultB: "00000010",
        isExerciseMode: true,
        showSolution: false,
      }),
    );
    expect(result.current.locked).toBe(true);
    act(() => {
      result.current.handleInputA("11111111");
    });
    expect(result.current.valA).toBe("00000001");
  });

  it("allows input changes after the solution is shown in exercise mode", () => {
    const { result } = renderHook(() =>
      useBinaryOperands({
        defaultA: "00000001",
        defaultB: "00000010",
        isExerciseMode: true,
        showSolution: true,
      }),
    );
    expect(result.current.locked).toBe(false);
    act(() => {
      result.current.handleInputA("11111111");
    });
    expect(result.current.valA).toBe("11111111");
  });

  it("calls onChangeValues when values change", () => {
    const onChangeValues = vi.fn();
    const { result } = renderHook(() =>
      useBinaryOperands({
        defaultA: "00000001",
        defaultB: "00000010",
        onChangeValues,
      }),
    );
    act(() => {
      result.current.setValA("11110000");
    });
    expect(onChangeValues).toHaveBeenCalledWith("11110000", "00000010");
  });

  it("exposes toggle-set helpers from useToggleSet", () => {
    const { result } = renderHook(() =>
      useBinaryOperands({ defaultA: "00000001", defaultB: "00000010" }),
    );
    expect(result.current.expanded.has("0")).toBe(true);
    expect(result.current.showStepByStep).toBe(false);
    act(() => {
      result.current.setShowStepByStep(true);
    });
    expect(result.current.showStepByStep).toBe(true);
  });
});

describe("useBinaryOperand", () => {
  it("initializes with default when no initial value is given", () => {
    const { result } = renderHook(() =>
      useBinaryOperand({ defaultA: "00000001" }),
    );
    expect(result.current.valA).toBe("00000001");
    expect(result.current.locked).toBe(false);
  });

  it("uses initialA over defaultA", () => {
    const { result } = renderHook(() =>
      useBinaryOperand({ defaultA: "00000001", initialA: "10101010" }),
    );
    expect(result.current.valA).toBe("10101010");
  });

  it("sanitizes input and caps at maxLengthA", () => {
    const { result } = renderHook(() =>
      useBinaryOperand({ defaultA: "00000001", maxLengthA: 4 }),
    );
    act(() => {
      result.current.handleInputA("abc10101");
    });
    expect(result.current.valA).toBe("1010");
  });

  it("blocks input while locked", () => {
    const { result } = renderHook(() =>
      useBinaryOperand({
        defaultA: "00000001",
        isExerciseMode: true,
        showSolution: false,
      }),
    );
    expect(result.current.locked).toBe(true);
    act(() => {
      result.current.handleInputA("11111111");
    });
    expect(result.current.valA).toBe("00000001");
  });

  it("calls onChangeValues with the single operand", () => {
    const onChangeValues = vi.fn();
    const { result } = renderHook(() =>
      useBinaryOperand({ defaultA: "00000001", onChangeValues }),
    );
    act(() => {
      result.current.handleInputA("11110000");
    });
    expect(onChangeValues).toHaveBeenCalledWith("11110000", "");
  });
});
