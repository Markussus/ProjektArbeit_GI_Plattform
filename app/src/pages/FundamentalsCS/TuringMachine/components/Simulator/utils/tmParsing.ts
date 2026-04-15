import type { HeadMovement, TMTransition } from "../types";
import { isSingleTapeSymbol } from "./tmSymbolValidation";

export function parseTransition(cellValue: string): TMTransition | null {
  const match = cellValue.match(
    /^\s*\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([LNR])\s*\)\s*$/,
  );

  if (!match) {
    return null;
  }

  const writeSymbol = match[2].trim();
  if (!isSingleTapeSymbol(writeSymbol)) {
    return null;
  }

  return {
    nextState: match[1].trim(),
    writeSymbol,
    movement: match[3].trim() as HeadMovement,
  };
}
