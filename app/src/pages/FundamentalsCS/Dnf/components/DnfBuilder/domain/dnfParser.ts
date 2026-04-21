import type { BooleanExpression } from "./booleanExpression";

type TokenType =
  | "constant"
  | "variable"
  | "not"
  | "and"
  | "or"
  | "left_paren"
  | "right_paren";

interface Token {
  type: TokenType;
  text: string;
  index: number;
}

export type DnfParseIssueCode =
  | "empty_expression"
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
  | { ok: true; tokens: Token[] }
  | { ok: false; issue: DnfParseIssue };

export function parseBooleanExpression(source: string): DnfParseResult {
  if (source.trim() === "") {
    return {
      ok: false,
      issue: { code: "empty_expression", index: 0 },
    };
  }

  const tokenizeResult = tokenize(source);
  if (!tokenizeResult.ok) {
    return tokenizeResult;
  }

  let position = 0;
  const tokens = tokenizeResult.tokens;

  const peek = (): Token | null => tokens[position] ?? null;

  const consume = (type: TokenType): Token | null => {
    const token = peek();
    if (token?.type !== type) {
      return null;
    }

    position += 1;
    return token;
  };

  const parseOr = (): DnfParseResult => {
    const leftResult = parseAnd();
    if (!leftResult.ok) {
      return leftResult;
    }

    let expression = leftResult.expression;

    while (consume("or")) {
      const rightResult = parseAnd();
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

  const parseAnd = (): DnfParseResult => {
    const leftResult = parseUnary();
    if (!leftResult.ok) {
      return leftResult;
    }

    let expression = leftResult.expression;

    while (consume("and")) {
      const rightResult = parseUnary();
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

  const parseUnary = (): DnfParseResult => {
    if (consume("not")) {
      const operandResult = parseUnary();
      if (!operandResult.ok) {
        return operandResult;
      }

      return {
        ok: true,
        expression: { type: "not", operand: operandResult.expression },
      };
    }

    return parsePrimary();
  };

  const parsePrimary = (): DnfParseResult => {
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

    if (consume("left_paren")) {
      const expressionResult = parseOr();
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

  const expressionResult = parseOr();
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

function tokenize(source: string): TokenizeResult {
  const tokens: Token[] = [];
  let index = 0;

  while (index < source.length) {
    const char = source[index];

    if (isWhitespace(char)) {
      index += 1;
      continue;
    }

    if (char === "0" || char === "1") {
      tokens.push({ type: "constant", text: char, index });
      index += 1;
      continue;
    }

    if (isIdentifierStart(char)) {
      const start = index;
      index += 1;

      while (index < source.length && isIdentifierPart(source[index])) {
        index += 1;
      }

      tokens.push({
        type: "variable",
        text: source.slice(start, index),
        index: start,
      });
      continue;
    }

    if (char === "(") {
      tokens.push({ type: "left_paren", text: char, index });
      index += 1;
      continue;
    }

    if (char === ")") {
      tokens.push({ type: "right_paren", text: char, index });
      index += 1;
      continue;
    }

    if (char === "¬" || char === "!" || char === "~") {
      tokens.push({ type: "not", text: char, index });
      index += 1;
      continue;
    }

    if (char === "∧" || char === "&") {
      const text = source[index + 1] === "&" ? "&&" : char;
      tokens.push({ type: "and", text, index });
      index += text.length;
      continue;
    }

    if (char === "∨" || char === "|") {
      const text = source[index + 1] === "|" ? "||" : char;
      tokens.push({ type: "or", text, index });
      index += text.length;
      continue;
    }

    return {
      ok: false,
      issue: {
        code: "unexpected_character",
        index,
        value: char,
      },
    };
  }

  return { ok: true, tokens };
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
