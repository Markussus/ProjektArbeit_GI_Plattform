import type { IEEE754Analysis } from "./useIEEE754Converter";

export function getExpectedResult(
  analysis: IEEE754Analysis,
  mode: "decToIeee" | "ieeeToDec",
): string | string[] {
  const { isNaNVal, sign, exponent, mantissa, floatVal } = analysis;

  if (mode === "decToIeee") {
    if (isNaNVal) {
      return ["NaN", "nan"];
    }
    return [sign + exponent + mantissa, `${sign} ${exponent} ${mantissa}`];
  }

  if (isNaNVal) {
    return ["NaN", "nan"];
  }
  if (Object.is(floatVal, -0)) {
    return ["-0", "0"];
  }
  return [floatVal.toString()];
}
