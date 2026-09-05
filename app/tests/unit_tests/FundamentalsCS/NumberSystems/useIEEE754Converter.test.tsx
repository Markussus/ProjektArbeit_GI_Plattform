/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIEEE754Converter } from "@/pages/FundamentalsCS/NumberSystems/components/simulator/useIEEE754Converter";

describe("useIEEE754Converter", () => {
  it("defaults to decToIeee mode with value 12.5", () => {
    const { result } = renderHook(() => useIEEE754Converter({}));

    expect(result.current.inputValue).toBe("12.5");
    expect(result.current.converterMode).toBe("decToIeee");
    expect(result.current.locked).toBe(false);
  });

  it("uses initialValue and initialConverterMode when provided", () => {
    const { result } = renderHook(() =>
      useIEEE754Converter({
        initialValue: "01000001010101000000000000000000",
        initialConverterMode: "ieeeToDec",
      }),
    );

    expect(result.current.inputValue).toBe("01000001010101000000000000000000");
    expect(result.current.converterMode).toBe("ieeeToDec");
  });

  it("uses initialState when provided and not locked", () => {
    const { result } = renderHook(() =>
      useIEEE754Converter({
        initialValue: "99.0",
        initialConverterMode: "decToIeee",
        initialState: {
          inputValue: "-4.4375",
          converterMode: "decToIeee",
        },
      }),
    );

    expect(result.current.inputValue).toBe("-4.4375");
  });

  it("ignores initialState and uses exercise values when locked", () => {
    const { result } = renderHook(() =>
      useIEEE754Converter({
        isExerciseMode: true,
        showSolution: false,
        initialValue: "5.75",
        initialConverterMode: "decToIeee",
        initialState: {
          inputValue: "should-not-be-used",
          converterMode: "ieeeToDec",
        },
      }),
    );

    expect(result.current.locked).toBe(true);
    expect(result.current.inputValue).toBe("5.75");
    expect(result.current.converterMode).toBe("decToIeee");
  });

  it("falls back to default value and mode when locked and no exercise values are given", () => {
    const { result } = renderHook(() =>
      useIEEE754Converter({
        isExerciseMode: true,
        showSolution: false,
      }),
    );

    expect(result.current.locked).toBe(true);
    expect(result.current.inputValue).toBe("12.5");
    expect(result.current.converterMode).toBe("decToIeee");
  });

  it("reports decToIeee analysis for 12.5", () => {
    const { result } = renderHook(() =>
      useIEEE754Converter({ initialValue: "12.5" }),
    );

    expect(result.current.isValid).toBe(true);
    expect(result.current.isNaNVal).toBe(false);
    expect(result.current.sign).toBe("0");
    expect(result.current.exponent).toBe("10000010");
    expect(result.current.expVal).toBe(130);
    expect(result.current.mantissa).toBe("10010000000000000000000");
    expect(result.current.floatVal).toBe(12.5);
  });

  it("detects NaN text input in decToIeee mode", () => {
    const { result } = renderHook(() =>
      useIEEE754Converter({ initialValue: "nan" }),
    );

    expect(result.current.isNaNVal).toBe(true);
    expect(result.current.isValid).toBe(false);
  });

  it("detects invalid input in decToIeee mode", () => {
    const { result } = renderHook(() =>
      useIEEE754Converter({ initialValue: "not-a-number" }),
    );

    expect(result.current.isValid).toBe(false);
    expect(result.current.isNaNVal).toBe(true);
  });

  it("decodes valid 32-bit IEEE binary to float", () => {
    const { result } = renderHook(() =>
      useIEEE754Converter({
        initialValue: "01000001010010000000000000000000",
        initialConverterMode: "ieeeToDec",
      }),
    );

    expect(result.current.isValid).toBe(true);
    expect(result.current.floatVal).toBe(12.5);
    expect(result.current.sign).toBe("0");
    expect(result.current.exponent).toBe("10000010");
  });

  it("reports invalid ieeeToDec input when binary length is not 32", () => {
    const { result } = renderHook(() =>
      useIEEE754Converter({
        initialValue: "01001100",
        initialConverterMode: "ieeeToDec",
      }),
    );

    expect(result.current.isValid).toBe(false);
    expect(result.current.floatVal).toBe(0);
  });

  it("computes fraction steps for ieeeToDec mode", () => {
    const { result } = renderHook(() =>
      useIEEE754Converter({
        initialValue: "01000001010010000000000000000000",
        initialConverterMode: "ieeeToDec",
      }),
    );

    expect(result.current.fractionSteps).toContain(1);
    expect(result.current.sumOfFractions).toBeGreaterThan(0);
  });

  it("updates inputValue and converterMode via setters", () => {
    const { result } = renderHook(() => useIEEE754Converter({}));

    act(() => {
      result.current.setInputValue("0");
    });
    expect(result.current.inputValue).toBe("0");

    act(() => {
      result.current.setConverterMode("ieeeToDec");
    });
    expect(result.current.converterMode).toBe("ieeeToDec");
  });

  it("calls onChangeState when state changes", () => {
    const onChangeState = vi.fn();
    const { result } = renderHook(() => useIEEE754Converter({ onChangeState }));

    act(() => {
      result.current.setInputValue("99");
    });

    expect(onChangeState).toHaveBeenCalledWith(
      expect.objectContaining({
        inputValue: "99",
        converterMode: "decToIeee",
      }),
    );
  });

  it("detects zero as a special case in decToIeee mode", () => {
    const { result } = renderHook(() =>
      useIEEE754Converter({ initialValue: "0" }),
    );

    expect(result.current.isValid).toBe(true);
    expect(result.current.isSpecial).toBe(true);
    expect(result.current.isZero).toBe(true);
    expect(result.current.isInf).toBe(false);
    expect(result.current.isNaNVal).toBe(false);
  });

  it("detects infinity as a special case in decToIeee mode", () => {
    const { result } = renderHook(() =>
      useIEEE754Converter({ initialValue: "Infinity" }),
    );

    expect(result.current.isValid).toBe(true);
    expect(result.current.isSpecial).toBe(true);
    expect(result.current.isInf).toBe(true);
    expect(result.current.isZero).toBe(false);
    expect(result.current.isNaNVal).toBe(false);
  });

  it("detects negative infinity as a special case in decToIeee mode", () => {
    const { result } = renderHook(() =>
      useIEEE754Converter({ initialValue: "-Infinity" }),
    );

    expect(result.current.isValid).toBe(true);
    expect(result.current.isInf).toBe(true);
    expect(result.current.sign).toBe("1");
  });

  it("decodes IEEE infinity in ieeeToDec mode", () => {
    const { result } = renderHook(() =>
      useIEEE754Converter({
        initialValue: "01111111100000000000000000000000",
        initialConverterMode: "ieeeToDec",
      }),
    );

    expect(result.current.isValid).toBe(true);
    expect(result.current.isInf).toBe(true);
    expect(result.current.isSpecial).toBe(true);
    expect(result.current.isNaNVal).toBe(false);
  });

  it("decodes IEEE NaN in ieeeToDec mode", () => {
    const { result } = renderHook(() =>
      useIEEE754Converter({
        initialValue: "01111111100000000000000000000001",
        initialConverterMode: "ieeeToDec",
      }),
    );

    expect(result.current.isValid).toBe(true);
    expect(result.current.isNaNVal).toBe(true);
    expect(result.current.isSpecial).toBe(true);
  });

  it("decodes IEEE zero in ieeeToDec mode", () => {
    const { result } = renderHook(() =>
      useIEEE754Converter({
        initialValue: "00000000000000000000000000000000",
        initialConverterMode: "ieeeToDec",
      }),
    );

    expect(result.current.isValid).toBe(true);
    expect(result.current.isZero).toBe(true);
    expect(result.current.isSpecial).toBe(true);
    expect(result.current.floatVal).toBe(0);
  });

  it("decodes a subnormal IEEE number and computes fraction steps", () => {
    const { result } = renderHook(() =>
      useIEEE754Converter({
        initialValue: "00000000010000000000000000000000",
        initialConverterMode: "ieeeToDec",
      }),
    );

    expect(result.current.isValid).toBe(true);
    expect(result.current.isSpecial).toBe(false);
    expect(result.current.sumOfFractions).toBeGreaterThan(0);
    expect(result.current.fractionSteps.length).toBeGreaterThan(0);
  });
});
