import type { TranslationKey } from "@/types/i18n";
import type { BooleanAlgebraRuleId } from "./booleanAlgebraRules";
import { formatBooleanExpressionForDisplay } from "./booleanExpressionFormat";
import { deriveDnfFromTruthTable, formatDnfExpression } from "./dnfDerivation";
import {
  computeMinimalDnf,
  minimalDnfToExpression,
  type MinimalDnf,
  type PrimeImplicant,
} from "./quineMcCluskey";
import type { TruthTable } from "./truthTable";

const NOT = "¬";
const AND = " ∧ ";
const OR = " ∨ ";

export interface DnfDerivationStep {
  expression: string;
  ruleId?: BooleanAlgebraRuleId;
  noteKey?: TranslationKey;
  noteVars?: Record<string, string>;
}

export interface DnfSimplificationGroup {
  term: string;
  coveredRowNumbers: number[];
  eliminatedVariables: string[];
  literalCount: number;
  derivationSteps: DnfDerivationStep[];
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
    derivationSteps: buildDerivationSteps(implicant, variables),
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
  const literals = getImplicantLiterals(implicant, variables);

  if (literals.length === 0) {
    return "1";
  }
  if (literals.length === 1) {
    return literals[0];
  }
  return `(${literals.join(AND)})`;
}

function getImplicantLiterals(
  implicant: PrimeImplicant,
  variables: string[],
): string[] {
  const variableCount = variables.length;
  const literals: string[] = [];

  for (
    let variableIndex = 0;
    variableIndex < variableCount;
    variableIndex += 1
  ) {
    const bitPosition = variableCount - variableIndex - 1;
    const mask = 1 << bitPosition;

    if ((implicant.mask & mask) !== 0) {
      continue;
    }

    const variable = variables[variableIndex];
    literals.push(
      (implicant.value & mask) !== 0 ? variable : `${NOT}${variable}`,
    );
  }

  return literals;
}

function getEliminatedVariables(
  implicant: PrimeImplicant,
  variables: string[],
): string[] {
  const variableCount = variables.length;
  const eliminated: string[] = [];

  for (
    let variableIndex = 0;
    variableIndex < variableCount;
    variableIndex += 1
  ) {
    const bitPosition = variableCount - variableIndex - 1;
    if ((implicant.mask & (1 << bitPosition)) !== 0) {
      eliminated.push(variables[variableIndex]);
    }
  }

  return eliminated;
}

/**
 * Internal representation of an intermediate term during the algebraic
 * derivation. `mask` marks variables that have already been eliminated; the
 * remaining bits in `value` describe whether each surviving variable appears
 * positively (1) or negated (0). Used to render the step-by-step proof that
 * the canonical 1-rows reduce to the prime implicant.
 */
interface IntermediateTerm {
  value: number;
  mask: number;
}

/**
 * Build the algebraic derivation chain for a single prime implicant. Starts
 * from the canonical AND-terms it covers and applies Distributivity →
 * Complement → Identity once per eliminated variable, mirroring how a student
 * would reduce it by hand using the Boolean algebra rules.
 */
function buildDerivationSteps(
  implicant: PrimeImplicant,
  variables: string[],
): DnfDerivationStep[] {
  const variableCount = variables.length;
  const steps: DnfDerivationStep[] = [];

  let currentTerms: IntermediateTerm[] = implicant.covers.map((minterm) => ({
    value: minterm,
    mask: 0,
  }));

  steps.push({
    expression: formatTermsAsOr(currentTerms, variableCount, variables),
  });

  if (implicant.mask === 0) {
    return steps;
  }

  const elimBitsHighFirst = bitsSetIn(implicant.mask).sort((a, b) => b - a);

  for (const bitPosition of elimBitsHighFirst) {
    const variableIndex = variableCount - bitPosition - 1;
    const variableName = variables[variableIndex];
    const pairs = groupTermsByPartnerOnBit(currentTerms, bitPosition);

    steps.push({
      expression: formatPairsFactored(
        pairs,
        bitPosition,
        variableCount,
        variables,
      ),
      ruleId: "distributivity",
      noteKey: "dnf.builder.exercise.derivationNotes.factorOut",
      noteVars: { variable: variableName },
    });

    steps.push({
      expression: formatPairsWithComplementCollapsed(
        pairs,
        bitPosition,
        variableCount,
        variables,
      ),
      ruleId: "complement",
      noteKey: "dnf.builder.exercise.derivationNotes.complementToOne",
      noteVars: { variable: variableName },
    });

    currentTerms = pairs.map((pair) => ({
      value: pair.commonValue,
      mask: pair.commonMask,
    }));

    steps.push({
      expression: formatTermsAsOr(currentTerms, variableCount, variables),
      ruleId: "identity",
      noteKey: "dnf.builder.exercise.derivationNotes.andOneEqualsTerm",
    });
  }

  return steps;
}

interface DerivationPair {
  commonValue: number;
  commonMask: number;
}

function groupTermsByPartnerOnBit(
  terms: IntermediateTerm[],
  bitPosition: number,
): DerivationPair[] {
  const bit = 1 << bitPosition;
  const pairs = new Map<string, DerivationPair>();

  for (const term of terms) {
    const commonValue = term.value & ~bit;
    const commonMask = term.mask | bit;
    const key = `${commonValue}|${commonMask}`;
    if (!pairs.has(key)) {
      pairs.set(key, { commonValue, commonMask });
    }
  }

  return [...pairs.values()];
}

function formatTermsAsOr(
  terms: IntermediateTerm[],
  variableCount: number,
  variables: string[],
): string {
  return terms
    .map((term) => formatTerm(term, variableCount, variables))
    .join(OR);
}

function formatTerm(
  term: IntermediateTerm,
  variableCount: number,
  variables: string[],
): string {
  const literals = collectLiteralsFromTerm(term, variableCount, variables);

  if (literals.length === 0) {
    return "1";
  }
  if (literals.length === 1) {
    return literals[0];
  }
  return `(${literals.join(AND)})`;
}

function collectLiteralsFromTerm(
  term: IntermediateTerm,
  variableCount: number,
  variables: string[],
): string[] {
  const literals: string[] = [];
  for (
    let variableIndex = 0;
    variableIndex < variableCount;
    variableIndex += 1
  ) {
    const bitPosition = variableCount - variableIndex - 1;
    const mask = 1 << bitPosition;
    if ((term.mask & mask) !== 0) {
      continue;
    }
    const variableName = variables[variableIndex];
    literals.push(
      (term.value & mask) !== 0 ? variableName : `${NOT}${variableName}`,
    );
  }
  return literals;
}

function formatPairsFactored(
  pairs: DerivationPair[],
  bitPosition: number,
  variableCount: number,
  variables: string[],
): string {
  const variableIndex = variableCount - bitPosition - 1;
  const variable = variables[variableIndex];
  const complementGroup = `(${variable}${OR}${NOT}${variable})`;
  const wrapInOuterParens = pairs.length > 1;

  return pairs
    .map((pair) =>
      formatFactoredPair(
        pair,
        complementGroup,
        variableCount,
        variables,
        wrapInOuterParens,
      ),
    )
    .join(OR);
}

function formatFactoredPair(
  pair: DerivationPair,
  complementGroup: string,
  variableCount: number,
  variables: string[],
  wrapInOuterParens: boolean,
): string {
  const baseLiterals = collectLiteralsFromTerm(
    { value: pair.commonValue, mask: pair.commonMask },
    variableCount,
    variables,
  );

  if (baseLiterals.length === 0) {
    return complementGroup;
  }

  const baseRender =
    baseLiterals.length === 1 ? baseLiterals[0] : `(${baseLiterals.join(AND)})`;
  const inner = `${baseRender}${AND}${complementGroup}`;
  return wrapInOuterParens ? `(${inner})` : inner;
}

function formatPairsWithComplementCollapsed(
  pairs: DerivationPair[],
  bitPosition: number,
  variableCount: number,
  variables: string[],
): string {
  const wrapInOuterParens = pairs.length > 1;

  return pairs
    .map((pair) =>
      formatPairWithOne(pair, bitPosition, variableCount, variables, wrapInOuterParens),
    )
    .join(OR);
}

function formatPairWithOne(
  pair: DerivationPair,
  _bitPosition: number,
  variableCount: number,
  variables: string[],
  wrapInOuterParens: boolean,
): string {
  const baseLiterals = collectLiteralsFromTerm(
    { value: pair.commonValue, mask: pair.commonMask },
    variableCount,
    variables,
  );

  if (baseLiterals.length === 0) {
    return "1";
  }

  const baseRender =
    baseLiterals.length === 1 ? baseLiterals[0] : `(${baseLiterals.join(AND)})`;
  const inner = `${baseRender}${AND}1`;
  return wrapInOuterParens ? `(${inner})` : inner;
}

function bitsSetIn(mask: number): number[] {
  const bits: number[] = [];
  let remaining = mask;
  let position = 0;
  while (remaining !== 0) {
    if ((remaining & 1) !== 0) {
      bits.push(position);
    }
    remaining >>>= 1;
    position += 1;
  }
  return bits;
}
