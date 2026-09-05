import type { TranslationKey } from "@/types/i18n";
import type { BooleanAlgebraRuleId } from "./booleanAlgebraRules";
import { formatBooleanExpressionForDisplay } from "./booleanExpression";
import { deriveDnfFromTruthTable, formatDnfExpression } from "./dnfDerivation";
import { buildFactoringSteps, type Literal } from "./factorMinimalDnf";
import {
  computeMinimalDnf,
  minimalDnfToExpression,
  type MinimalDnf,
  type PrimeImplicant,
} from "./quineMcCluskey";
import {
  computeSmallestBooleanExpression,
  type SmallestExpressionSource,
} from "./minimalExpression";
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
  minimalLiteralCount: number;
  /** Factored form derived from the minimal DNF; only set when strictly shorter. */
  factoredForm: string | null;
  factoredLiteralCount: number | null;
  /** Distributivity derivation for the factored form; empty unless it is shorter. */
  factoredDerivationSteps: DnfDerivationStep[];
  /** True when the optional shorter form is certified globally shortest. */
  factoredIsExact: boolean;
  /** Origin of the optional shorter form, when one is shown. */
  factoredSource: SmallestExpressionSource | null;
  constantCase: "always_false" | "always_true" | null;
}

/**
 * Intermediate AND-term during the algebraic derivation. `mask` marks
 * variables that have been eliminated; bits in `value` at non-masked positions
 * indicate whether the surviving variable appears positively (1) or negated
 * (0). Same shape as `PrimeImplicant` minus the bookkeeping fields, so all
 * formatters work on both.
 */
interface BitTerm {
  value: number;
  mask: number;
}

export function buildDnfSimplificationWalkthrough(
  table: TruthTable,
): DnfSimplificationWalkthrough {
  const derivation = deriveDnfFromTruthTable(table);
  const minimal = computeMinimalDnf(table);
  const smallestExpression = computeSmallestBooleanExpression(table, minimal);
  const factoredExpression = smallestExpression.expression;
  const factoredLiteralCount = smallestExpression.literalCount;
  const factoredIsShorter = factoredLiteralCount < minimal.literalCount;
  const hasFactoringDerivation =
    factoredIsShorter && smallestExpression.source === "factored_dnf";

  return {
    trueRowNumbers: table.rows.flatMap((row, index) =>
      row.result ? [index + 1] : [],
    ),
    canonicalDnf: formatDnfExpression(derivation.dnf),
    groups: buildGroups(minimal, table.variables),
    minimalForm: formatBooleanExpressionForDisplay(
      minimalDnfToExpression(minimal, table.variables),
    ),
    minimalLiteralCount: minimal.literalCount,
    factoredForm: factoredIsShorter
      ? formatBooleanExpressionForDisplay(factoredExpression)
      : null,
    factoredLiteralCount: factoredIsShorter ? factoredLiteralCount : null,
    factoredDerivationSteps: hasFactoringDerivation
      ? buildFactoringDerivationSteps(minimal, table.variables)
      : [],
    factoredIsExact: factoredIsShorter ? smallestExpression.exact : true,
    factoredSource: factoredIsShorter ? smallestExpression.source : null,
    constantCase: getConstantCase(minimal),
  };
}

/**
 * Turn the structural factoring steps into displayable derivation lines: the
 * starting sum-of-products has no rule; each later snapshot is one distributivity
 * step labelled with the literal(s) that were factored out.
 */
function buildFactoringDerivationSteps(
  minimal: MinimalDnf,
  variables: string[],
): DnfDerivationStep[] {
  return buildFactoringSteps(minimal, variables).map((step) => {
    const expression = formatBooleanExpressionForDisplay(step.expression);

    if (step.factoredLiterals.length === 0) {
      return { expression };
    }

    return {
      expression,
      ruleId: "distributivity",
      noteKey: "dnf.builder.exercise.derivationNotes.factorOutCommon",
      noteVars: {
        variables: step.factoredLiterals
          .map((literal) => formatFactoredLiteral(literal, variables))
          .join(", "),
      },
    };
  });
}

function formatFactoredLiteral(literal: Literal, variables: string[]): string {
  const name = variables[literal.variableIndex];
  return literal.negated ? `${NOT}${name}` : name;
}

function buildGroups(
  minimal: MinimalDnf,
  variables: string[],
): DnfSimplificationGroup[] {
  if (minimal.type === "constant") {
    return [];
  }

  return minimal.implicants.map((implicant) => ({
    term: formatBitTerm(implicant, variables),
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

function getEliminatedVariables(
  implicant: PrimeImplicant,
  variables: string[],
): string[] {
  return variables.filter((_, variableIndex) => {
    const bitPosition = variables.length - variableIndex - 1;
    return (implicant.mask & (1 << bitPosition)) !== 0;
  });
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
  const steps: DnfDerivationStep[] = [];

  let currentTerms: BitTerm[] = implicant.covers.map((minterm) => ({
    value: minterm,
    mask: 0,
  }));

  steps.push({ expression: formatBitTermsAsOr(currentTerms, variables) });

  if (implicant.mask === 0) {
    return steps;
  }

  const elimBitsHighFirst = bitsSetIn(implicant.mask).sort((a, b) => b - a);

  for (const bitPosition of elimBitsHighFirst) {
    const variableName = variables[variables.length - bitPosition - 1];
    const pairs = collapseTermsByBit(currentTerms, bitPosition);
    const complementGroup = `(${variableName}${OR}${NOT}${variableName})`;

    steps.push({
      expression: formatPairsWithSuffix(pairs, complementGroup, variables),
      ruleId: "distributivity",
      noteKey: "dnf.builder.exercise.derivationNotes.factorOut",
      noteVars: { variable: variableName },
    });

    steps.push({
      expression: formatPairsWithSuffix(pairs, "1", variables),
      ruleId: "complement",
      noteKey: "dnf.builder.exercise.derivationNotes.complementToOne",
      noteVars: { variable: variableName },
    });

    currentTerms = pairs;

    steps.push({
      expression: formatBitTermsAsOr(currentTerms, variables),
      ruleId: "identity",
      noteKey: "dnf.builder.exercise.derivationNotes.andOneEqualsTerm",
    });
  }

  return steps;
}

/**
 * Group `terms` into the set of partner-pairs that would result from
 * eliminating `bitPosition` via Distributivity + Complement + Identity.
 * Terms that share every other literal collapse into one pair entry.
 */
function collapseTermsByBit(terms: BitTerm[], bitPosition: number): BitTerm[] {
  const bit = 1 << bitPosition;
  const pairs = new Map<string, BitTerm>();

  for (const term of terms) {
    const value = term.value & ~bit;
    const mask = term.mask | bit;
    const key = `${value}|${mask}`;
    if (!pairs.has(key)) {
      pairs.set(key, { value, mask });
    }
  }

  return [...pairs.values()];
}

function formatBitTermsAsOr(terms: BitTerm[], variables: string[]): string {
  return terms.map((term) => formatBitTerm(term, variables)).join(OR);
}

/**
 * Render a single AND-term (`value` + `mask` bit layout) as a readable
 * formula. Empty terms render as `1`, single-literal terms drop the
 * parentheses for readability.
 */
function formatBitTerm(term: BitTerm, variables: string[]): string {
  const literals = collectBitTermLiterals(term, variables);

  if (literals.length === 0) {
    return "1";
  }
  if (literals.length === 1) {
    return literals[0];
  }
  return `(${literals.join(AND)})`;
}

function collectBitTermLiterals(term: BitTerm, variables: string[]): string[] {
  const literals: string[] = [];

  for (
    let variableIndex = 0;
    variableIndex < variables.length;
    variableIndex += 1
  ) {
    const bitPosition = variables.length - variableIndex - 1;
    const mask = 1 << bitPosition;

    if ((term.mask & mask) !== 0) {
      continue;
    }

    const variable = variables[variableIndex];
    literals.push((term.value & mask) !== 0 ? variable : `${NOT}${variable}`);
  }

  return literals;
}

/**
 * Render `pairs` joined by ∨, with each pair shown as `base ∧ suffix`. When
 * a pair has no surviving literals the suffix stands alone. When there is
 * more than one pair, each is wrapped in outer parens so the ∧/∨ precedence
 * remains visually unambiguous (∧ binds tighter, but new readers benefit
 * from explicit grouping).
 */
function formatPairsWithSuffix(
  pairs: BitTerm[],
  suffix: string,
  variables: string[],
): string {
  const wrapEachPair = pairs.length > 1;

  return pairs
    .map((pair) => {
      const baseLiterals = collectBitTermLiterals(pair, variables);
      if (baseLiterals.length === 0) {
        return suffix;
      }

      const baseRender =
        baseLiterals.length === 1
          ? baseLiterals[0]
          : `(${baseLiterals.join(AND)})`;
      const inner = `${baseRender}${AND}${suffix}`;
      return wrapEachPair ? `(${inner})` : inner;
    })
    .join(OR);
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
