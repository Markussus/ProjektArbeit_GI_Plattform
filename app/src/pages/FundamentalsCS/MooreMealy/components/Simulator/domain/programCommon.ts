export type InternalRepresentation = "binary" | "decimal";

export const MAX_COLLECTION_SIZE = 1024;
export const MAX_NAME_LENGTH = 128;

export function formatInternalNumber(
  value: number,
  representation: InternalRepresentation,
): string {
  return representation === "binary" ? value.toString(2) : value.toString(10);
}

export function parseInternalNumber(
  value: string,
  representation: InternalRepresentation,
): number | null {
  const trimmed = value.trim();
  const pattern = representation === "binary" ? /^[01]+$/u : /^\d+$/u;
  if (!pattern.test(trimmed)) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, representation === "binary" ? 2 : 10);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

export function createNextStateName(states: string[]): string {
  let index = states.length;
  let candidate = `STATE_${index}`;
  while (states.includes(candidate)) {
    index += 1;
    candidate = `STATE_${index}`;
  }
  return candidate;
}

export function createNextInputSymbol(inputSymbols: string[]): string {
  let value = inputSymbols.length;
  let candidate = value.toString(2);
  while (inputSymbols.includes(candidate)) {
    value += 1;
    candidate = value.toString(2);
  }
  return candidate;
}

export function bitsNeeded(count: number): number {
  return count <= 1 ? 1 : Math.ceil(Math.log2(count));
}

export function toBits(value: number, width: number): number[] {
  return Array.from({ length: width }, (_, index) => {
    const bitPosition = width - index - 1;
    return Math.floor(value / 2 ** bitPosition) % 2;
  });
}

export function bitsToNumber(bits: number[]): number {
  return bits.reduce((value, bit) => value * 2 + bit, 0);
}

export function createVariableNames(prefix: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => `${prefix}${index}`);
}

export function hasUniqueNonEmptyValues(
  values: string[],
  maxLength: number = MAX_NAME_LENGTH,
): boolean {
  return (
    values.every(
      (value) => value.trim().length > 0 && value.trim().length <= maxLength,
    ) && new Set(values).size === values.length
  );
}
