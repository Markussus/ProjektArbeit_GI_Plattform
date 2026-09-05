import { formatBooleanValue } from "../domain/booleanExpression";
import {
  formatDnfExpression,
  formatDnfTerm,
  type DnfDerivation,
} from "../domain/dnfDerivation";
import type { TruthTable } from "../domain/truthTable";

export interface TruthTableDisplayRow {
  rowNumber: number;
  assignmentValues: string[];
  result: string;
  term: string;
  isContributing: boolean;
}

export interface TruthTableDisplay {
  variableHeaders: string[];
  rows: TruthTableDisplayRow[];
  trueRowCount: number;
}

export function buildTruthTableDisplay(
  table: TruthTable,
  derivation: DnfDerivation,
): TruthTableDisplay {
  let termIndex = 0;

  return {
    variableHeaders: table.variables,
    rows: table.rows.map((row, rowIndex) => {
      const isContributing = row.result;
      const term = getRowTerm(derivation, isContributing, termIndex);

      if (isContributing) {
        termIndex += 1;
      }

      return {
        rowNumber: rowIndex + 1,
        assignmentValues: table.variables.map((variable) =>
          formatBooleanValue(row.assignment[variable]),
        ),
        result: formatBooleanValue(row.result),
        term,
        isContributing,
      };
    }),
    trueRowCount: derivation.trueRows.length,
  };
}

function getRowTerm(
  derivation: DnfDerivation,
  isContributing: boolean,
  termIndex: number,
): string {
  if (!isContributing) {
    return "";
  }

  if (derivation.dnf.type === "constant") {
    return formatDnfExpression(derivation.dnf);
  }

  return formatDnfTerm(derivation.dnf.terms[termIndex]);
}
