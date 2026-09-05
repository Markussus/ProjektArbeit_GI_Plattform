/** @vitest-environment jsdom */

import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  sanitizeFractionalInput,
  useFractionalConverter,
} from "@/pages/FundamentalsCS/NumberSystems/components/simulator/useFractionalConverter";

describe("sanitizeFractionalInput", () => {
  it("keeps valid decimal characters", () => {
    expect(sanitizeFractionalInput("-10.5", "decToBin")).toBe("-10.5");
  });

  it("removes invalid decimal characters", () => {
    expect(sanitizeFractionalInput("12a3.45b", "decToBin")).toBe("123.45");
  });

  it("removes invalid binary characters", () => {
    expect(sanitizeFractionalInput("10a1b0.1", "binToDec")).toBe("1010.1");
  });

  it("removes a minus sign that is not at the start", () => {
    expect(sanitizeFractionalInput("10-5", "decToBin")).toBe("105");
  });

  it("collapses multiple minus signs into a single leading minus", () => {
    expect(sanitizeFractionalInput("--10.5", "decToBin")).toBe("-10.5");
  });

  it("collapses multiple dots into one", () => {
    expect(sanitizeFractionalInput("10..5", "decToBin")).toBe("10.5");
  });

  it("limits input length to 20 characters", () => {
    const longValue = "1234567890123456789012345";
    expect(sanitizeFractionalInput(longValue, "decToBin")).toHaveLength(20);
  });
});

describe("useFractionalConverter", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("defaults to decToBin mode with value 10.5", () => {
    const { result } = renderHook(() => useFractionalConverter({}));
    expect(result.current.inputValue).toBe("10.5");
    expect(result.current.converterMode).toBe("decToBin");
    expect(result.current.locked).toBe(false);
  });

  it("uses initialValue in free mode", () => {
    const { result } = renderHook(() =>
      useFractionalConverter({ initialValue: "3.375" }),
    );
    expect(result.current.inputValue).toBe("3.375");
  });

  it("uses initialState values when provided", () => {
    const { result } = renderHook(() =>
      useFractionalConverter({
        initialValue: "99.9",
        initialState: { inputValue: "0.5", converterMode: "decToBin" },
      }),
    );
    expect(result.current.inputValue).toBe("0.5");
    expect(result.current.converterMode).toBe("decToBin");
  });

  it("falls back to initialValue when initialState has no inputValue", () => {
    const { result } = renderHook(() =>
      useFractionalConverter({
        initialValue: "5.25",
        initialState: { converterMode: "decToBin" },
      }),
    );
    expect(result.current.inputValue).toBe("5.25");
  });

  it("locks to decToBin and the exercise initial value in exercise mode", () => {
    const { result } = renderHook(() =>
      useFractionalConverter({
        isExerciseMode: true,
        showSolution: false,
        initialValue: "7.25",
        initialState: { converterMode: "binToDec" },
      }),
    );
    expect(result.current.locked).toBe(true);
    expect(result.current.inputValue).toBe("7.25");
    expect(result.current.converterMode).toBe("decToBin");
  });

  it("falls back to the default value when exercise mode has no initialValue", () => {
    const { result } = renderHook(() =>
      useFractionalConverter({
        isExerciseMode: true,
        showSolution: false,
        initialValue: "",
      }),
    );
    expect(result.current.locked).toBe(true);
    expect(result.current.inputValue).toBe("10.5");
    expect(result.current.converterMode).toBe("decToBin");
  });

  it("ignores input changes while locked", () => {
    const onChangeState = vi.fn();
    const { result } = renderHook(() =>
      useFractionalConverter({
        isExerciseMode: true,
        showSolution: false,
        initialValue: "10.5",
        onChangeState,
      }),
    );

    act(() => {
      result.current.handleInputChange("99.9");
    });

    expect(result.current.inputValue).toBe("10.5");
    expect(onChangeState).not.toHaveBeenCalledWith(
      expect.objectContaining({ inputValue: "99.9" }),
    );
  });

  it("updates input value in free mode", () => {
    const { result } = renderHook(() => useFractionalConverter({}));

    act(() => {
      result.current.handleInputChange("3.375");
    });

    expect(result.current.inputValue).toBe("3.375");
  });

  it("switches to binToDec mode and resets the input", () => {
    const onChangeState = vi.fn();
    const { result } = renderHook(() =>
      useFractionalConverter({ onChangeState }),
    );

    act(() => {
      result.current.handleSetBinToDec();
    });

    expect(result.current.converterMode).toBe("binToDec");
    expect(result.current.inputValue).toBe("1010.1");
    expect(onChangeState).toHaveBeenLastCalledWith({
      inputValue: "1010.1",
      converterMode: "binToDec",
    });
  });

  it("switches back to decToBin mode and resets the input", () => {
    const { result } = renderHook(() => useFractionalConverter({}));

    act(() => {
      result.current.handleSetBinToDec();
    });

    act(() => {
      result.current.handleSetDecToBin();
    });

    expect(result.current.converterMode).toBe("decToBin");
    expect(result.current.inputValue).toBe("10.5");
  });

  it("does not switch modes in exercise mode", () => {
    const { result } = renderHook(() =>
      useFractionalConverter({
        isExerciseMode: true,
        showSolution: false,
        initialValue: "10.5",
      }),
    );

    act(() => {
      result.current.handleSetBinToDec();
    });

    act(() => {
      result.current.handleSetDecToBin();
    });

    expect(result.current.converterMode).toBe("decToBin");
    expect(result.current.inputValue).toBe("10.5");
  });

  it("reports state changes via onChangeState", () => {
    const onChangeState = vi.fn();
    renderHook(() => useFractionalConverter({ onChangeState }));
    expect(onChangeState).toHaveBeenCalledWith({
      inputValue: "10.5",
      converterMode: "decToBin",
    });
  });

  it("reports mode switch via onChangeState", () => {
    const onChangeState = vi.fn();
    const { result } = renderHook(() =>
      useFractionalConverter({ onChangeState }),
    );

    act(() => {
      result.current.handleSetBinToDec();
    });

    expect(onChangeState).toHaveBeenLastCalledWith({
      inputValue: "1010.1",
      converterMode: "binToDec",
    });
  });
});
