import type { BooleanExpression } from "./booleanExpression";

type TokenType =
  "constant" | "variable" | "not" | "and" | "or" | "left_paren" | "right_paren";

interface Token {
  type: TokenType;
  text: string;
  index: number;
}

interface TokenReadResult {
  token: Token;
  nextIndex: number;
}

export type DnfParseIssueCode =
  | "empty_expression"
  | "expression_too_complex"
  | "unexpected_character"
  | "unexpected_token"
  | "unexpected_end"
  | "missing_closing_parenthesis";

export interface DnfParseIssue {
  code: DnfParseIssueCode;
  index: number;
  value?: string;
}

export type DnfParseResult =
  | { ok: true; expression: BooleanExpression }
  | { ok: false; issue: DnfParseIssue };

type TokenizeResult =
  { ok: true; tokens: Token[] } | { ok: false; issue: DnfParseIssue };

const MAX_EXPRESSION_LENGTH = 2048;
const MAX_TOKEN_COUNT = 512;
const MAX_RECURSION_DEPTH = 64;

export function parseBooleanExpression(source: string): DnfParseResult {
  if (source.trim() === "") {
    return {
      ok: false,
      issue: { code: "empty_expression", index: 0 },
    };
  }

  if (source.length > MAX_EXPRESSION_LENGTH) {
    return expressionTooComplex(MAX_EXPRESSION_LENGTH);
  }

  const tokenizeResult = tokenize(source);
  if (!tokenizeResult.ok) {
    return tokenizeResult;
  }

  let position = 0;
  const tokens = tokenizeResult.tokens;

  if (tokens.length > MAX_TOKEN_COUNT) {
    return expressionTooComplex(
      tokens[MAX_TOKEN_COUNT]?.index ?? source.length,
    );
  }

  const peek = (): Token | null => tokens[position] ?? null;

  const consume = (type: TokenType): Token | null => {
    const token = peek();
    if (token?.type !== type) {
      return null;
    }

    position += 1;
    return token;
  };

  const parseOr = (depth: number): DnfParseResult => {
    const leftResult = parseAnd(depth);
    if (!leftResult.ok) {
      return leftResult;
    }

    let expression = leftResult.expression;

    while (consume("or")) {
      const rightResult = parseAnd(depth);
      if (!rightResult.ok) {
        return rightResult;
      }

      expression = {
        type: "binary",
        operator: "or",
        left: expression,
        right: rightResult.expression,
      };
    }

    return { ok: true, expression };
  };

  const parseAnd = (depth: number): DnfParseResult => {
    const leftResult = parseUnary(depth);
    if (!leftResult.ok) {
      return leftResult;
    }

    let expression = leftResult.expression;

    while (consume("and")) {
      const rightResult = parseUnary(depth);
      if (!rightResult.ok) {
        return rightResult;
      }

      expression = {
        type: "binary",
        operator: "and",
        left: expression,
        right: rightResult.expression,
      };
    }

    return { ok: true, expression };
  };

  const parseUnary = (depth: number): DnfParseResult => {
    const negation = consume("not");
    if (negation) {
      if (depth >= MAX_RECURSION_DEPTH) {
        return expressionTooComplex(negation.index);
      }

      const operandResult = parseUnary(depth + 1);
      if (!operandResult.ok) {
        return operandResult;
      }

      return {
        ok: true,
        expression: { type: "not", operand: operandResult.expression },
      };
    }

    return parsePrimary(depth);
  };

  const parsePrimary = (depth: number): DnfParseResult => {
    const token = peek();

    if (!token) {
      return {
        ok: false,
        issue: { code: "unexpected_end", index: source.length },
      };
    }

    if (consume("constant")) {
      return {
        ok: true,
        expression: { type: "constant", value: token.text === "1" },
      };
    }

    if (consume("variable")) {
      return {
        ok: true,
        expression: { type: "variable", name: token.text },
      };
    }

    const leftParenthesis = consume("left_paren");
    if (leftParenthesis) {
      if (depth >= MAX_RECURSION_DEPTH) {
        return expressionTooComplex(leftParenthesis.index);
      }

      const expressionResult = parseOr(depth + 1);
      if (!expressionResult.ok) {
        return expressionResult;
      }

      if (!consume("right_paren")) {
        const nextToken = peek();
        return {
          ok: false,
          issue: {
            code: "missing_closing_parenthesis",
            index: nextToken?.index ?? source.length,
            value: nextToken?.text,
          },
        };
      }

      return expressionResult;
    }

    return {
      ok: false,
      issue: {
        code: "unexpected_token",
        index: token.index,
        value: token.text,
      },
    };
  };

  const expressionResult = parseOr(0);
  if (!expressionResult.ok) {
    return expressionResult;
  }

  const remainingToken = peek();
  if (remainingToken) {
    return {
      ok: false,
      issue: {
        code: "unexpected_token",
        index: remainingToken.index,
        value: remainingToken.text,
      },
    };
  }

  return expressionResult;
}

function expressionTooComplex(index: number): DnfParseResult {
  return {
    ok: false,
    issue: { code: "expression_too_complex", index },
  };
}

function tokenize(source: string): TokenizeResult {
  const tokens: Token[] = [];
  let index = 0;

  while (index < source.length) {
    const char = source[index];

    if (isWhitespace(char)) {
      index += 1;
      continue;
    }

    const tokenResult = readToken(source, index);
    if (!tokenResult) {
      return unexpectedCharacter(index, char);
    }

    tokens.push(tokenResult.token);
    index = tokenResult.nextIndex;
  }

  return { ok: true, tokens };
}

function readToken(source: string, index: number): TokenReadResult | null {
  const char = source[index];

  if (char === "0" || char === "1") {
    return createToken("constant", char, index);
  }

  if (isIdentifierStart(char)) {
    return readIdentifierToken(source, index);
  }

  const type = getSymbolTokenType(char);
  if (!type) {
    return null;
  }

  const text =
    type === "and" && source[index + 1] === "&"
      ? "&&"
      : type === "or" && source[index + 1] === "|"
        ? "||"
        : char;

  return createToken(type, text, index);
}

function readIdentifierToken(source: string, start: number): TokenReadResult {
  let nextIndex = start + 1;

  while (nextIndex < source.length && isIdentifierPart(source[nextIndex])) {
    nextIndex += 1;
  }

  return {
    token: {
      type: "variable",
      text: source.slice(start, nextIndex),
      index: start,
    },
    nextIndex,
  };
}

function createToken(
  type: TokenType,
  text: string,
  index: number,
): TokenReadResult {
  return {
    token: { type, text, index },
    nextIndex: index + text.length,
  };
}

function getSymbolTokenType(char: string): TokenType | null {
  switch (char) {
    case "(":
      return "left_paren";
    case ")":
      return "right_paren";
    case "\u00ac":
    case "!":
    case "~":
      return "not";
    case "\u2227":
    case "&":
      return "and";
    case "\u2228":
    case "|":
      return "or";
    default:
      return null;
  }
}

function unexpectedCharacter(index: number, value: string): TokenizeResult {
  return {
    ok: false,
    issue: {
      code: "unexpected_character",
      index,
      value,
    },
  };
}

function isWhitespace(value: string): boolean {
  return /\s/.test(value);
}

function isIdentifierStart(value: string): boolean {
  return /[A-Za-z]/.test(value);
}

function isIdentifierPart(value: string): boolean {
  return /[A-Za-z0-9_]/.test(value);
}
