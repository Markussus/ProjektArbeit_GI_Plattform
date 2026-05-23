import { formatBooleanExpressionForDisplay } from "./booleanExpressionFormat";
import { deriveDnfFromTruthTable, formatDnfExpression } from "./dnfDerivation";
import {
  computeMinimalDnf,
  minimalDnfToExpression,
  type MinimalDnf,
  type PrimeImplicant,
} from "./quineMcCluskey";
import type { TruthTable } from "./truthTable";

const NOT = "\u00ac";
const AND = " \u2227 ";

export interface DnfSimplificationGroup {
  term: string;
  coveredRowNumbers: number[];
  eliminatedVariables: string[];
  literalCount: number;
}

export interface DnfSimplificationWalkthrough {
  trueRowNumbers: number[];
  canonicalDnf: string;
  groups: DnfSimplificationGroup[];
  minimalForm: string;
  constantCase: "always_false" | "always_true" | null;
}

export function buildDnfSimplificationWalkthrough(
  table: TruthTable,
): DnfSimplificationWalkthrough {
  const derivation = deriveDnfFromTruthTable(table);
  const minimal = computeMinimalDnf(table);

  return {
    trueRowNumbers: table.rows.flatMap((row, index) =>
      row.result ? [index + 1] : [],
    ),
    canonicalDnf: formatDnfExpression(derivation.dnf),
    groups: buildGroups(minimal, table.variables),
    minimalForm: formatBooleanExpressionForDisplay(
      minimalDnfToExpression(minimal, table.variables),
    ),
    constantCase: getConstantCase(minimal),
  };
}

function buildGroups(
  minimal: MinimalDnf,
  variables: string[],
): DnfSimplificationGroup[] {
  if (minimal.type === "constant") {
    return [];
  }

  return minimal.implicants.map((implicant) => ({
    term: formatImplicantTerm(implicant, variables),
    coveredRowNumbers: implicant.covers.map((rowIndex) => rowIndex + 1),
    eliminatedVariables: getEliminatedVariables(implicant, variables),
    literalCount: implicant.literals,
  }));
}

function getConstantCase(
  minimal: MinimalDnf,
): DnfSimplificationWalkthrough["constantCase"] {
  if (minimal.type !== "constant") {
    return null;
  }
  return minimal.value ? "always_true" : "always_false";
}

function formatImplicantTerm(
  implicant: PrimeImplicant,
  variables: string[],
): string {
  const variableCount = variables.length;
  const literals: string[] = [];

  for (let variableIndex = 0; variableIndex < variableCount; variableIndex += 1) {
    const bitPosition = variableCount - variableIndex - 1;
    const mask = 1 << bitPosition;

    if ((implicant.mask & mask) !== 0) {
      continue;
    }

    const variable = variables[variableIndex];
    literals.push((implicant.value & mask) !== 0 ? variable : `${NOT}${variable}`);
  }

  if (literals.length === 0) {
    return "1";
  }
  if (literals.length === 1) {
    return literals[0];
  }
  return `(${literals.join(AND)})`;
}

function getEliminatedVariables(
  implicant: PrimeImplicant,
  variables: string[],
): string[] {
  const variableCount = variables.length;
  const eliminated: string[] = [];

  for (let variableIndex = 0; variableIndex < variableCount; variableIndex += 1) {
    const bitPosition = variableCount - variableIndex - 1;
    if ((implicant.mask & (1 << bitPosition)) !== 0) {
      eliminated.push(variables[variableIndex]);
    }
  }

  return eliminated;
}
