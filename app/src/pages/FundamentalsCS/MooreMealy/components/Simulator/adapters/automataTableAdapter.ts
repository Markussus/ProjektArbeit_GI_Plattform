import type { TablePosition } from "@/components/shared/TableVisual/TableView";
import type { MooreProgram, MooreRuntime } from "../domain/mooreTypes";
import type { MealyProgram, MealyRuntime } from "../domain/mealyTypes";

/**
 * Build table headers for Moore transition table: [eventLabel, ...states]
 */
export function buildMooreTableHeaders(
  states: string[],
  eventLabel = "Event",
): string[] {
  return [eventLabel, ...states];
}

/**
 * Build table rows for Moore transition table.
 * Each row: [inputSymbol, target_for_state_0, target_for_state_1, ...]
 */
export function buildMooreTableRows(program: MooreProgram): string[][] {
  return program.inputSymbols.map((symbol) => [
    symbol,
    ...program.states.map(
      (state) => program.transitions[symbol]?.[state] ?? "–",
    ),
  ]);
}

/**
 * Returns the currently active transition cell for Moore runtime simulation.
 */
export function getActiveMooreTransitionCell(
  program: MooreProgram,
  runtime: Pick<MooreRuntime, "currentState" | "inputPosition">,
): TablePosition | null {
  const nextInput = program.inputWord[runtime.inputPosition];
  if (!nextInput) {
    return null;
  }

  const rowIndex = program.inputSymbols.indexOf(nextInput);
  const colIndex = program.states.indexOf(runtime.currentState);
  if (rowIndex < 0 || colIndex < 0) {
    return null;
  }

  return { row: rowIndex, col: colIndex + 1 };
}

/**
 * Build table headers for Mealy transition/output table: [eventLabel, ...states]
 */
export function buildMealyTableHeaders(
  states: string[],
  eventLabel = "Event",
): string[] {
  return [eventLabel, ...states];
}

/**
 * Build table rows for Mealy transition table.
 * Each cell shows "nextState / outputSymbol".
 */
export function buildMealyTableRows(program: MealyProgram): string[][] {
  return program.inputSymbols.map((input) => [
    input,
    ...program.states.map((state) => {
      const target = program.transitions[input]?.[state] ?? "–";
      const output = program.outputs[input]?.[state]?.symbol ?? "–";
      return `${target} / ${output}`;
    }),
  ]);
}

/**
 * Returns the currently active transition cell for Mealy runtime simulation.
 */
export function getActiveMealyTransitionCell(
  program: MealyProgram,
  runtime: Pick<MealyRuntime, "currentState" | "inputPosition">,
): TablePosition | null {
  const nextInput = program.inputWord[runtime.inputPosition];
  if (!nextInput) {
    return null;
  }

  const rowIndex = program.inputSymbols.indexOf(nextInput);
  const colIndex = program.states.indexOf(runtime.currentState);
  if (rowIndex < 0 || colIndex < 0) {
    return null;
  }

  return { row: rowIndex, col: colIndex + 1 };
}
