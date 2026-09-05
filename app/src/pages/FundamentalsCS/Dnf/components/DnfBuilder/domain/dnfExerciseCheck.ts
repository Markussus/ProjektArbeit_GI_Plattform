import {
  collectExpressionVariables,
  evaluateBooleanExpression,
  type BooleanExpression,
  type VariableAssignment,
} from "./booleanExpression";
import { parseBooleanExpression, type DnfParseIssue } from "./dnfParser";
import type { TruthTable } from "./truthTable";

export type TruthTableAnswer = boolean | null;

export interface TruthTableAnswerIssue {
  rowIndex: number;
  expected: boolean;
  actual: TruthTableAnswer;
}

export interface DnfAnswerMismatch {
  rowIndex: number;
  expected: boolean;
  actual: boolean;
}

export type DnfAnswerStatus =
  | "empty"
  | "syntax_error"
  | "correct"
  | "equivalent_not_canonical"
  | "not_equivalent";

export interface DnfAnswerCheck {
  status: DnfAnswerStatus;
  issue?: DnfParseIssue;
  mismatchRows: DnfAnswerMismatch[];
  missingTermRows: number[];
  extraTermRows: number[];
}

export interface DnfExerciseCheckResult {
  truthTableIssues: TruthTableAnswerIssue[];
  unansweredRowCount: number;
  incorrectRowCount: number;
  correctRowCount: number;
  dnf: DnfAnswerCheck;
  isCorrect: boolean;
}

export interface DnfExerciseCheckOptions {
  checkTruthTable?: boolean;
}

export function checkDnfExerciseAttempt(
  table: TruthTable,
  truthTableAnswers: TruthTableAnswer[],
  dnfAnswer: string,
  options: DnfExerciseCheckOptions = {},
): DnfExerciseCheckResult {
  const shouldCheckTruthTable = options.checkTruthTable ?? true;
  const truthTableIssues = shouldCheckTruthTable
    ? table.rows.flatMap((row, rowIndex) => {
        const actual = truthTableAnswers[rowIndex] ?? null;

        if (actual === row.result) {
          return [];
        }

        return [
          {
            rowIndex,
            expected: row.result,
            actual,
          },
        ];
      })
    : [];

  const dnf = checkDnfAnswer(table, dnfAnswer);
  const unansweredRowCount = truthTableIssues.filter(
    (issue) => issue.actual === null,
  ).length;

  return {
    truthTableIssues,
    unansweredRowCount,
    incorrectRowCount: truthTableIssues.length - unansweredRowCount,
    correctRowCount: table.rows.length - truthTableIssues.length,
    dnf,
    isCorrect: truthTableIssues.length === 0 && dnf.status === "correct",
  };
}

function checkDnfAnswer(table: TruthTable, source: string): DnfAnswerCheck {
  if (source.trim() === "") {
    return {
      status: "empty",
      mismatchRows: [],
      missingTermRows: [],
      extraTermRows: [],
    };
  }

  const parseResult = parseBooleanExpression(source);
  if (!parseResult.ok) {
    return {
      status: "syntax_error",
      issue: parseResult.issue,
      mismatchRows: [],
      missingTermRows: [],
      extraTermRows: [],
    };
  }

  const termRows = getCanonicalTermRows(parseResult.expression, table);

  if (isCanonicalDnfForTable(parseResult.expression, table)) {
    return {
      status: "correct",
      mismatchRows: [],
      missingTermRows: [],
      extraTermRows: [],
    };
  }

  const mismatchRows = compareExpressionWithTable(
    parseResult.expression,
    table,
  );

  return {
    status:
      mismatchRows.length === 0 ? "equivalent_not_canonical" : "not_equivalent",
    mismatchRows,
    missingTermRows:
      termRows === null ? [] : getMissingTermRows(table, termRows),
    extraTermRows: termRows === null ? [] : getExtraTermRows(table, termRows),
  };
}

function compareExpressionWithTable(
  expression: BooleanExpression,
  table: TruthTable,
): DnfAnswerMismatch[] {
  const tableVariables = new Set(table.variables);
  const expressionVariables = collectExpressionVariables(expression);

  if (expressionVariables.some((variable) => !tableVariables.has(variable))) {
    return table.rows.map((row, rowIndex) => ({
      rowIndex,
      expected: row.result,
      actual: false,
    }));
  }

  return table.rows.flatMap((row, rowIndex) => {
    const actual = evaluateBooleanExpression(expression, row.assignment);

    if (actual === row.result) {
      return [];
    }

    return [
      {
        rowIndex,
        expected: row.result,
        actual,
      },
    ];
  });
}

function isCanonicalDnfForTable(
  expression: BooleanExpression,
  table: TruthTable,
): boolean {
  const trueRows = table.rows.filter((row) => row.result);

  if (expression.type === "constant") {
    return table.rows.every((row) => row.result === expression.value);
  }

  if (trueRows.length === 0 || trueRows.length === table.rows.length) {
    return false;
  }

  const expectedKeys = new Set(
    trueRows.map((row) => getAssignmentKey(table.variables, row.assignment)),
  );
  const termAssignments = extractCanonicalTermAssignments(
    expression,
    table.variables,
  );
  if (!termAssignments) {
    return false;
  }

  const actualKeys = new Set(
    termAssignments.map((assignment) =>
      getAssignmentKey(table.variables, assignment),
    ),
  );

  return (
    actualKeys.size === termAssignments.length &&
    actualKeys.size === expectedKeys.size &&
    [...expectedKeys].every((key) => actualKeys.has(key))
  );
}

function getCanonicalTermRows(
  expression: BooleanExpression,
  table: TruthTable,
): number[] | null {
  const rowIndexByKey = new Map(
    table.rows.map((row, rowIndex) => [
      getAssignmentKey(table.variables, row.assignment),
      rowIndex,
    ]),
  );
  const termAssignments = extractCanonicalTermAssignments(
    expression,
    table.variables,
  );
  if (!termAssignments) {
    return null;
  }

  return termAssignments.map((assignment) => {
    const key = getAssignmentKey(table.variables, assignment);

    return rowIndexByKey.get(key) ?? -1;
  });
}

function getMissingTermRows(table: TruthTable, termRows: number[]): number[] {
  const actualRows = new Set(termRows);

  return table.rows.flatMap((row, rowIndex) => {
    if (!row.result || actualRows.has(rowIndex)) {
      return [];
    }

    return [rowIndex];
  });
}

function getExtraTermRows(table: TruthTable, termRows: number[]): number[] {
  return [...new Set(termRows)].filter(
    (rowIndex) => rowIndex < 0 || !table.rows[rowIndex]?.result,
  );
}

function extractCanonicalTermAssignment(
  expression: BooleanExpression,
  variables: string[],
): VariableAssignment | null {
  const variableSet = new Set(variables);
  const assignment: VariableAssignment = {};

  for (const literal of flattenByOperator(expression, "and")) {
    const extracted = extractLiteral(literal);

    if (
      !extracted ||
      !variableSet.has(extracted.variable) ||
      assignment[extracted.variable] !== undefined
    ) {
      return null;
    }

    assignment[extracted.variable] = extracted.value;
  }

  return Object.keys(assignment).length === variables.length
    ? assignment
    : null;
}

function extractCanonicalTermAssignments(
  expression: BooleanExpression,
  variables: string[],
): VariableAssignment[] | null {
  const assignments = flattenByOperator(expression, "or").map((term) =>
    extractCanonicalTermAssignment(term, variables),
  );

  return assignments.every(
    (assignment): assignment is VariableAssignment => assignment !== null,
  )
    ? assignments
    : null;
}

function extractLiteral(
  expression: BooleanExpression,
): { variable: string; value: boolean } | null {
  if (expression.type === "variable") {
    return { variable: expression.name, value: true };
  }

  if (expression.type === "not" && expression.operand.type === "variable") {
    return { variable: expression.operand.name, value: false };
  }

  return null;
}

function flattenByOperator(
  expression: BooleanExpression,
  operator: "and" | "or",
): BooleanExpression[] {
  if (expression.type !== "binary" || expression.operator !== operator) {
    return [expression];
  }

  return [
    ...flattenByOperator(expression.left, operator),
    ...flattenByOperator(expression.right, operator),
  ];
}

function getAssignmentKey(
  variables: string[],
  assignment: VariableAssignment,
): string {
  return variables
    .map((variable) => (assignment[variable] ? "1" : "0"))
    .join("");
}
