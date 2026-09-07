import type { BooleanExpression } from "@/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/booleanExpression";
import { formatBooleanExpressionForDisplay } from "@/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/booleanExpression";
import { computeSmallestBooleanExpression } from "@/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/minimalExpression";
import { createTruthTableFromResults } from "@/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/truthTable";
import {
  bitsNeeded,
  bitsToNumber,
  createVariableNames,
  toBits,
} from "./programCommon";
import type { MooreProgram } from "./mooreTypes";
import type { MealyProgram } from "./mealyTypes";

const MAX_MINIMIZATION_VARIABLES = 8;

export interface AutomataConversionRow {
  currentState: string;
  inputSymbol?: string;
  nextState?: string;
  outputSymbol?: string;
  currentBits: number[];
  inputBits: number[];
  resultBits: number[];
}

export interface AutomataFormula {
  name: string;
  variables: string[];
  canonical: string;
  minimal: string;
  expression: BooleanExpression | null;
  canonicalExpression: BooleanExpression;
  minimizationAvailable: boolean;
}

export interface AutomataTransitionConversion {
  stateVariables: string[];
  inputVariables: string[];
  targetVariables: string[];
  rows: AutomataConversionRow[];
  formulas: AutomataFormula[];
}

export interface AutomataOutputConversion {
  stateVariables: string[];
  inputVariables?: string[];
  outputVariables: string[];
  rows: AutomataConversionRow[];
  formulas: AutomataFormula[];
}

export interface AutomataConversion {
  transition: AutomataTransitionConversion;
  output: AutomataOutputConversion;
  allFormulas: AutomataFormula[];
}

/**
 * Converts Moore machine into digital hardware truth tables and boolean formulas
 * Next-state logic: T = delta(S, E)
 * Output logic: y = lambda(S)
 */
export function buildMooreConversion(
  program: MooreProgram,
): AutomataConversion {
  const stateBitCount = bitsNeeded(program.states.length);
  const inputBitCount = bitsNeeded(program.inputSymbols.length);
  const maximumOutputCode = Math.max(
    0,
    ...program.states.map((state) => program.outputs[state]?.code ?? 0),
  );
  const outputBitCount = bitsNeeded(maximumOutputCode + 1);
  const stateVariables = createVariableNames("S", stateBitCount);
  const inputVariables = createVariableNames("E", inputBitCount);
  const targetVariables = createVariableNames("T", stateBitCount);
  const outputVariables = createVariableNames("y", outputBitCount);

  const transitionRows: AutomataConversionRow[] = program.states.flatMap(
    (state, stateIndex) =>
      program.inputSymbols.map((inputSymbol, inputIndex) => {
        const nextState = program.transitions[inputSymbol]?.[state] ?? "";
        const nextStateIndex = program.states.indexOf(nextState);
        return {
          currentState: state,
          inputSymbol,
          nextState,
          currentBits: toBits(stateIndex, stateBitCount),
          inputBits: toBits(inputIndex, inputBitCount),
          resultBits: toBits(
            nextStateIndex >= 0 ? nextStateIndex : 0,
            stateBitCount,
          ),
        };
      }),
  );

  const outputRows: AutomataConversionRow[] = program.states.map(
    (state, stateIndex) => ({
      currentState: state,
      outputSymbol: program.outputs[state]?.symbol ?? "",
      currentBits: toBits(stateIndex, stateBitCount),
      inputBits: [],
      resultBits: toBits(program.outputs[state]?.code ?? 0, outputBitCount),
    }),
  );

  const transitionFormulas = buildFormulas(
    targetVariables,
    [...stateVariables, ...inputVariables],
    transitionRows,
  );
  const outputFormulas = buildFormulas(
    outputVariables,
    stateVariables,
    outputRows,
  );

  return {
    transition: {
      stateVariables,
      inputVariables,
      targetVariables,
      rows: transitionRows,
      formulas: transitionFormulas,
    },
    output: {
      stateVariables,
      outputVariables,
      rows: outputRows,
      formulas: outputFormulas,
    },
    allFormulas: [...transitionFormulas, ...outputFormulas],
  };
}

/**
 * Converts Mealy machine into digital hardware truth tables and boolean formulas
 * Next-state logic: T = delta(S, E)
 * Output logic: y = lambda(S, E)
 */
export function buildMealyConversion(
  program: MealyProgram,
): AutomataConversion {
  const stateBitCount = bitsNeeded(program.states.length);
  const inputBitCount = bitsNeeded(program.inputSymbols.length);
  const outputCodes = program.inputSymbols.flatMap((input) =>
    program.states.map((state) => program.outputs[input]?.[state]?.code ?? 0),
  );
  const outputBitCount = bitsNeeded(Math.max(0, ...outputCodes) + 1);
  const stateVariables = createVariableNames("S", stateBitCount);
  const inputVariables = createVariableNames("E", inputBitCount);
  const targetVariables = createVariableNames("T", stateBitCount);
  const outputVariables = createVariableNames("y", outputBitCount);

  const transitionRows: AutomataConversionRow[] = program.states.flatMap(
    (state, stateIndex) =>
      program.inputSymbols.map((inputSymbol, inputIndex) => {
        const nextState = program.transitions[inputSymbol]?.[state] ?? "";
        const nextStateIndex = program.states.indexOf(nextState);
        return {
          currentState: state,
          inputSymbol,
          nextState,
          currentBits: toBits(stateIndex, stateBitCount),
          inputBits: toBits(inputIndex, inputBitCount),
          resultBits: toBits(
            nextStateIndex >= 0 ? nextStateIndex : 0,
            stateBitCount,
          ),
        };
      }),
  );

  const outputRows: AutomataConversionRow[] = program.states.flatMap(
    (state, stateIndex) =>
      program.inputSymbols.map((inputSymbol, inputIndex) => {
        const output = program.outputs[inputSymbol]?.[state] ?? {
          symbol: "",
          code: 0,
        };
        return {
          currentState: state,
          inputSymbol,
          outputSymbol: output.symbol,
          currentBits: toBits(stateIndex, stateBitCount),
          inputBits: toBits(inputIndex, inputBitCount),
          resultBits: toBits(output.code, outputBitCount),
        };
      }),
  );

  const transitionFormulas = buildFormulas(
    targetVariables,
    [...stateVariables, ...inputVariables],
    transitionRows,
  );
  const outputFormulas = buildFormulas(
    outputVariables,
    [...stateVariables, ...inputVariables],
    outputRows,
  );

  return {
    transition: {
      stateVariables,
      inputVariables,
      targetVariables,
      rows: transitionRows,
      formulas: transitionFormulas,
    },
    output: {
      stateVariables,
      inputVariables,
      outputVariables,
      rows: outputRows,
      formulas: outputFormulas,
    },
    allFormulas: [...transitionFormulas, ...outputFormulas],
  };
}

/**
 * For each output bit
 * Computes the Canonical DNF (Disjunctive Normal Form) from all truth table rows where bit == 1
 * Computes a smaller boolean expression
 * These expressions feed directly into the interactive Logic Gate diagram
 */
export function buildFormulas(
  resultVariables: string[],
  inputVariables: string[],
  rows: AutomataConversionRow[],
): AutomataFormula[] {
  return resultVariables.map((name, resultIndex) => {
    const trueAssignments = rows
      .filter((row) => row.resultBits[resultIndex] === 1)
      .map((row) => [...row.currentBits, ...row.inputBits]);
    const canonical = formatCanonicalDnf(inputVariables, trueAssignments);
    const minimizationAvailable =
      inputVariables.length <= MAX_MINIMIZATION_VARIABLES;

    if (!minimizationAvailable) {
      const expression = buildCanonicalDnfExpression(
        inputVariables,
        trueAssignments,
      );
      return {
        name,
        variables: inputVariables,
        canonical,
        minimal: canonical,
        expression,
        canonicalExpression: expression,
        minimizationAvailable: false,
      };
    }

    const resultValues = Array.from(
      { length: 2 ** inputVariables.length },
      () => false,
    );
    for (const assignment of trueAssignments) {
      resultValues[bitsToNumber(assignment)] = true;
    }
    const { expression: preferredExpression } =
      computeSmallestBooleanExpression(
        createTruthTableFromResults(inputVariables, resultValues),
      );

    return {
      name,
      variables: inputVariables,
      canonical,
      minimal: formatBooleanExpressionForDisplay(preferredExpression),
      expression: preferredExpression,
      canonicalExpression: buildCanonicalDnfExpression(
        inputVariables,
        trueAssignments,
      ),
      minimizationAvailable: true,
    };
  });
}

function buildCanonicalDnfExpression(
  variables: string[],
  assignments: number[][],
): BooleanExpression {
  if (assignments.length === 0) {
    return { type: "constant", value: false };
  }
  if (assignments.length === 2 ** variables.length) {
    return { type: "constant", value: true };
  }

  const terms = assignments.map((assignment) =>
    combineExpressions(
      assignment.map<BooleanExpression>((bit, index) => {
        const variable: BooleanExpression = {
          type: "variable",
          name: variables[index],
        };
        return bit === 1 ? variable : { type: "not", operand: variable };
      }),
      "and",
    ),
  );
  return combineExpressions(terms, "or");
}

function combineExpressions(
  expressions: BooleanExpression[],
  operator: "and" | "or",
): BooleanExpression {
  return expressions.slice(1).reduce<BooleanExpression>(
    (combined, expression) => ({
      type: "binary",
      operator,
      left: combined,
      right: expression,
    }),
    expressions[0] ?? { type: "constant", value: operator === "and" },
  );
}

function formatCanonicalDnf(
  variables: string[],
  assignments: number[][],
): string {
  if (assignments.length === 0) {
    return "0";
  }
  if (assignments.length === 2 ** variables.length) {
    return "1";
  }

  return assignments
    .map((assignment) =>
      assignment
        .map((bit, index) =>
          bit === 1 ? variables[index] : `¬${variables[index]}`,
        )
        .join(" ∧ "),
    )
    .map((term) => (variables.length > 1 ? `(${term})` : term))
    .join(" ∨ ");
}
