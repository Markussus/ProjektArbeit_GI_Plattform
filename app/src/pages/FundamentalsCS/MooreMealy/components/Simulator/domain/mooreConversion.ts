import type { BooleanExpression } from "@/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/booleanExpression";
import { formatBooleanExpressionForDisplay } from "@/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/booleanExpressionFormat";
import { computeSmallestBooleanExpression } from "@/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/minimalExpression";
import { createTruthTableFromResults } from "@/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/truthTable";
import type { MooreProgram } from "./mooreTypes";

const MAX_MINIMIZATION_VARIABLES = 8;

export interface MooreConversionRow {
  currentState: string;
  inputSymbol?: string;
  nextState?: string;
  outputSymbol?: string;
  currentBits: number[];
  inputBits: number[];
  resultBits: number[];
}

export interface MooreFormula {
  name: string;
  variables: string[];
  canonical: string;
  minimal: string;
  expression: BooleanExpression | null;
  canonicalExpression: BooleanExpression;
  minimizationAvailable: boolean;
}

export interface MooreTransitionConversion {
  stateVariables: string[];
  inputVariables: string[];
  targetVariables: string[];
  rows: MooreConversionRow[];
  formulas: MooreFormula[];
}

export interface MooreOutputConversion {
  stateVariables: string[];
  inputVariables?: string[];
  outputVariables: string[];
  rows: MooreConversionRow[];
  formulas: MooreFormula[];
}

export interface MooreConversion {
  transition: MooreTransitionConversion;
  output: MooreOutputConversion;
  allFormulas: MooreFormula[];
}

export function buildMooreConversion(program: MooreProgram): MooreConversion {
  const stateBitCount = bitsNeeded(program.states.length);
  const inputBitCount = bitsNeeded(program.inputSymbols.length);
  const maximumOutputCode = Math.max(
    0,
    ...program.states.map((state) => program.outputs[state].code),
  );
  const outputBitCount = bitsNeeded(maximumOutputCode + 1);
  const stateVariables = createVariableNames("S", stateBitCount);
  const inputVariables = createVariableNames("E", inputBitCount);
  const targetVariables = createVariableNames("T", stateBitCount);
  const outputVariables = createVariableNames("y", outputBitCount);

  const transitionRows = program.states.flatMap((state, stateIndex) =>
    program.inputSymbols.map((inputSymbol, inputIndex) => {
      const nextState = program.transitions[inputSymbol][state];
      const nextStateIndex = program.states.indexOf(nextState);
      return {
        currentState: state,
        inputSymbol,
        nextState,
        currentBits: toBits(stateIndex, stateBitCount),
        inputBits: toBits(inputIndex, inputBitCount),
        resultBits: toBits(nextStateIndex, stateBitCount),
      };
    }),
  );

  const outputRows = program.states.map((state, stateIndex) => ({
    currentState: state,
    outputSymbol: program.outputs[state].symbol,
    currentBits: toBits(stateIndex, stateBitCount),
    inputBits: [],
    resultBits: toBits(program.outputs[state].code, outputBitCount),
  }));

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

export function buildFormulas(
  resultVariables: string[],
  inputVariables: string[],
  rows: MooreConversionRow[],
): MooreFormula[] {
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

export function bitsNeeded(count: number): number {
  return count <= 1 ? 1 : Math.ceil(Math.log2(count));
}

export function createVariableNames(prefix: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => `${prefix}${index}`);
}

export function toBits(value: number, width: number): number[] {
  return Array.from({ length: width }, (_, index) => {
    const bitPosition = width - index - 1;
    return Math.floor(value / 2 ** bitPosition) % 2;
  });
}

function bitsToNumber(bits: number[]): number {
  return bits.reduce((value, bit) => value * 2 + bit, 0);
}
