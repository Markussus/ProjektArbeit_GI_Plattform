import { formatBooleanValue } from "./booleanExpression";
import type { TruthTable, TruthTableRow } from "./truthTable";

export interface DnfLiteral {
  variable: string;
  negated: boolean;
}

export interface DnfTerm {
  literals: DnfLiteral[];
}

export type DnfExpression =
  | { type: "constant"; value: boolean }
  | { type: "terms"; terms: DnfTerm[] };

export interface DnfDerivation {
  dnf: DnfExpression;
  trueRows: TruthTableRow[];
}

export function deriveDnfFromTruthTable(table: TruthTable): DnfDerivation {
  const trueRows = table.rows.filter((row) => row.result);

  if (trueRows.length === 0) {
    return {
      dnf: { type: "constant", value: false },
      trueRows,
    };
  }

  if (trueRows.length === table.rows.length) {
    return {
      dnf: { type: "constant", value: true },
      trueRows,
    };
  }

  return {
    dnf: {
      type: "terms",
      terms: trueRows.map((row) => createDnfTerm(table.variables, row)),
    },
    trueRows,
  };
}

export function formatDnfExpression(expression: DnfExpression): string {
  if (expression.type === "constant") {
    return formatBooleanValue(expression.value);
  }

  return expression.terms.map(formatDnfTerm).join(" ∨ ");
}

export function formatDnfTerm(term: DnfTerm): string {
  if (term.literals.length === 0) {
    return "1";
  }

  const formattedLiterals = term.literals.map((literal) =>
    literal.negated ? `¬${literal.variable}` : literal.variable,
  );

  if (formattedLiterals.length === 1) {
    return formattedLiterals[0];
  }

  return `(${formattedLiterals.join(" ∧ ")})`;
}

export function createDnfTerm(
  variables: string[],
  row: TruthTableRow,
): DnfTerm {
  return {
    literals: variables.map((variable) => ({
      variable,
      negated: !row.assignment[variable],
    })),
  };
}
