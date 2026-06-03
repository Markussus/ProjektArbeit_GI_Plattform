import type { RegexNode } from "./rlTypes";

export interface ParseRegexSuccess {
  ok: true;
  ast: RegexNode;
}

export interface ParseRegexFailure {
  ok: false;
  error: string;
}

export type ParseRegexResult = ParseRegexSuccess | ParseRegexFailure;

/**
 * Parse a regular expression into an AST.
 *
 * Grammar (recursive descent):
 *   regex      = union
 *   union      = concat ('|' concat)*
 *   concat     = star+              (juxtaposition is concatenation)
 *   star       = atom ('*' | '+' | '?')*
 *   atom       = '(' union ')' | symbol | 'ε' | '∅'
 *
 * Supported escapes: \| \* \+ \? \( \) \\ \ε
 */
export function parseRegex(source: string): ParseRegexResult {
  const trimmed = source.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: "Regex is empty." };
  }

  let i = 0;

  const peek = () => (i < trimmed.length ? trimmed[i] : "");

  const consume = () => trimmed[i++];

  const parseAtom = (): RegexNode => {
    const c = peek();
    if (c === "(") {
      consume();
      const inner = parseUnion();
      if (peek() !== ")") {
        throw new Error(`Missing closing parenthesis at position ${i}.`);
      }
      consume();
      return inner;
    }
    if (c === "ε" || c === "λ") {
      consume();
      return { kind: "epsilon" };
    }
    if (c === "∅") {
      consume();
      return { kind: "empty" };
    }
    if (c === "\\") {
      consume();
      const next = peek();
      if (next === "") {
        throw new Error("Trailing backslash without escaped symbol.");
      }
      consume();
      if (next === "e") return { kind: "epsilon" };
      return { kind: "symbol", value: next };
    }
    if (c === "" || c === ")" || c === "|" || c === "*" || c === "+" || c === "?") {
      throw new Error(`Unexpected '${c || "end of input"}' at position ${i}.`);
    }
    consume();
    return { kind: "symbol", value: c };
  };

  const parseStar = (): RegexNode => {
    let node = parseAtom();
    while (true) {
      const c = peek();
      if (c === "*") {
        consume();
        node = { kind: "star", child: node };
      } else if (c === "+") {
        consume();
        node = { kind: "concat", left: node, right: { kind: "star", child: node } };
      } else if (c === "?") {
        consume();
        node = { kind: "union", left: node, right: { kind: "epsilon" } };
      } else {
        break;
      }
    }
    return node;
  };

  const parseConcat = (): RegexNode => {
    let node = parseStar();
    while (true) {
      const c = peek();
      if (c === "" || c === ")" || c === "|") break;
      const right = parseStar();
      node = { kind: "concat", left: node, right };
    }
    return node;
  };

  const parseUnion = (): RegexNode => {
    let node = parseConcat();
    while (peek() === "|") {
      consume();
      const right = parseConcat();
      node = { kind: "union", left: node, right };
    }
    return node;
  };

  try {
    const ast = parseUnion();
    if (i < trimmed.length) {
      return { ok: false, error: `Unexpected character '${peek()}' at position ${i}.` };
    }
    return { ok: true, ast };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Pretty-print a regex AST (for grammar → regex output). */
export function regexAstToString(node: RegexNode): string {
  switch (node.kind) {
    case "empty":
      return "∅";
    case "epsilon":
      return "ε";
    case "symbol":
      return node.value;
    case "concat":
      return concatToString(node);
    case "union":
      return `${regexAstToString(node.left)}|${regexAstToString(node.right)}`;
    case "star": {
      const inner = regexAstToString(node.child);
      const needsParens =
        node.child.kind === "union" || node.child.kind === "concat";
      return needsParens ? `(${inner})*` : `${inner}*`;
    }
  }
}

function concatToString(node: Extract<RegexNode, { kind: "concat" }>): string {
  const leftStr = wrapForConcat(node.left);
  const rightStr = wrapForConcat(node.right);
  return `${leftStr}${rightStr}`;
}

function wrapForConcat(node: RegexNode): string {
  if (node.kind === "union") {
    return `(${regexAstToString(node)})`;
  }
  return regexAstToString(node);
}
