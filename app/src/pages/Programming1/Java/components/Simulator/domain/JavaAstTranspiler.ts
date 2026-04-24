import { parse } from "java-parser";
import type { BlockCstNode, CstNode, IToken } from "java-parser";

import type { JavaExecutionIssue } from "./javaExecution";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface JavaTranspileResult {
  javascript: string;
  diagnostics: JavaExecutionIssue[];
}

/**
 * Transpiles a Java source file containing a `main` method to JavaScript.
 *
 * Uses `java-parser` to produce a proper CST, which means:
 *  - No hand-written brace matching.
 *  - Syntax errors are caught before any transformation.
 *  - The main method body is located by traversing the parse tree, not regex.
 *
 * Only the exercise subset of Java is supported (primitive types, basic control
 * flow, System.out / Arrays helpers). Unsupported features are reported as
 * diagnostics instead of throwing.
 */
export function transpileJava(source: string): JavaTranspileResult {
  const diagnostics: JavaExecutionIssue[] = [];

  // Step 1: Parse — validates Java syntax and builds the CST.
  let cst: CstNode;
  try {
    cst = parse(source);
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);
    // java-parser error messages are sometimes long; trim to first line.
    const firstLine = raw.split("\n")[0] ?? raw;
    diagnostics.push({
      code: "parse_error",
      stage: "transpile",
      severity: "error",
      message: `Java syntax error: ${firstLine}`,
      line: 1,
      column: 1,
    });
    return { javascript: "", diagnostics };
  }

  // Step 2: Locate the main method's block in the CST.
  const mainBlock = findMainBlock(cst);
  if (!mainBlock) {
    diagnostics.push({
      code: "main_method_missing",
      stage: "transpile",
      severity: "error",
      message: "The editor runner expects a main method.",
      line: 1,
      column: 1,
    });
    return { javascript: "", diagnostics };
  }

  // Step 3: Slice the source using token offsets — no brace-matching needed.
  const lCurly = mainBlock.children.LCurly[0] as IToken;
  const rCurly = mainBlock.children.RCurly[0] as IToken;
  const bodyStart = lCurly.endOffset + 1;
  const bodyText = source.slice(bodyStart, rCurly.startOffset);

  // Step 4: Check for features we intentionally do not support.
  checkUnsupportedFeatures(bodyText, bodyStart, source, diagnostics);
  if (diagnostics.some((d) => d.severity === "error")) {
    return { javascript: "", diagnostics };
  }

  // Step 5: Transform the Java body to JavaScript.
  const javascript = transformBody(bodyText, bodyStart, source, diagnostics);
  if (diagnostics.some((d) => d.severity === "error")) {
    return { javascript: "", diagnostics };
  }

  return { javascript: javascript.trim(), diagnostics };
}

// ---------------------------------------------------------------------------
// CST traversal — find the main method's block node
// ---------------------------------------------------------------------------

/**
 * Recursively walks the CST to find the first `methodDeclaration` node whose
 * method name is `main`, then returns its inner `block` node.
 */
function findMainBlock(node: unknown): BlockCstNode | null {
  if (!node || typeof node !== "object") return null;

  const cstNode = node as CstNode;

  if (cstNode.name === "methodDeclaration") {
    // Each access returns CstElement (= IToken | CstNode), so we cast each
    // intermediate level to CstNode before accessing .children again.
    const methodHeader = cstNode.children["methodHeader"]?.[0] as
      | CstNode
      | undefined;
    const methodDeclarator = methodHeader?.children["methodDeclarator"]?.[0] as
      | CstNode
      | undefined;
    const identifier = methodDeclarator?.children["Identifier"]?.[0] as
      | IToken
      | undefined;

    if (identifier?.image === "main") {
      const methodBody = cstNode.children["methodBody"]?.[0] as
        | CstNode
        | undefined;
      const block = methodBody?.children["block"]?.[0] as
        | BlockCstNode
        | undefined;
      return block ?? null;
    }
  }

  // Recurse into all children.
  if (cstNode.children) {
    for (const childList of Object.values(cstNode.children)) {
      if (!Array.isArray(childList)) continue;
      for (const child of childList) {
        const result = findMainBlock(child);
        if (result) return result;
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Unsupported-feature guard (runs on the original Java body text)
// ---------------------------------------------------------------------------

const UNSUPPORTED_FEATURES = [
  { pattern: /\bScanner\b/, code: "scanner_not_supported" },
  { pattern: /\bSystem\.in\b/, code: "system_in_not_supported" },
  { pattern: /\btry\s*\{/, code: "try_catch_not_supported" },
] as const;

function checkUnsupportedFeatures(
  body: string,
  bodyOffset: number,
  fullSource: string,
  diagnostics: JavaExecutionIssue[],
): void {
  for (const { pattern, code } of UNSUPPORTED_FEATURES) {
    const match = pattern.exec(body);
    if (match?.index !== undefined) {
      diagnostics.push({
        code,
        stage: "transpile",
        severity: "error",
        message: `Unsupported Java feature in browser runner: ${match[0]}`,
        ...getLineAndColumn(fullSource, bodyOffset + match.index),
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Java → JavaScript transformation (regex-based, applied to the body only)
// ---------------------------------------------------------------------------

const JAVA_TYPE_PATTERN =
  "(?:int|double|boolean|String|long|float|char)";

const LEFTOVER_JAVA_DECLARATION = new RegExp(
  `\\b${JAVA_TYPE_PATTERN}(?:\\s*\\[\\s*\\])?\\s+[A-Za-z_]\\w*`,
  "g",
);

function transformBody(
  body: string,
  bodyOffset: number,
  fullSource: string,
  diagnostics: JavaExecutionIssue[],
): string {
  let js = body.replace(/\r\n/g, "\n");

  // Map Java standard-library calls to the injected runtime object.
  js = js.replace(/\bSystem\.out\.println\s*\(/g, "runtime.println(");
  js = js.replace(/\bSystem\.out\.print\s*\(/g, "runtime.print(");
  js = js.replace(/\bSystem\.err\.println\s*\(/g, "runtime.error(");
  js = js.replace(/\bSystem\.err\.print\s*\(/g, "runtime.error(");
  js = js.replace(/\bArrays\.toString\s*\(/g, "runtime.javaArrays.toString(");
  js = js.replace(/\bArrays\.sort\s*\(/g, "runtime.javaArrays.sort(");

  // Enhanced for-loop: `for (int x : arr)` → `for (const x of arr)`
  js = js.replace(
    new RegExp(
      `\\bfor\\s*\\(\\s*(?:final\\s+)?${JAVA_TYPE_PATTERN}\\s+([A-Za-z_]\\w*)\\s*:\\s*([^)]*)\\)`,
      "g",
    ),
    "for (const $1 of $2)",
  );

  // Basic for-loop type declaration: `for (int i = 0; ...)` → `for (let i = 0; ...)`
  js = js.replace(
    new RegExp(
      `\\bfor\\s*\\(\\s*(?:final\\s+)?${JAVA_TYPE_PATTERN}(?:\\s*\\[\\s*\\])?\\s+([A-Za-z_]\\w*)\\s*=`,
      "g",
    ),
    "for (let $1 =",
  );

  // Variable declarations with initialiser: `int x = 5;` → `let x = 5;`
  js = js.replace(
    new RegExp(
      `(^|[;{\\n]\\s*)(?:final\\s+)?${JAVA_TYPE_PATTERN}(?:\\s*\\[\\s*\\])?\\s+([A-Za-z_]\\w*)\\s*=\\s*`,
      "gm",
    ),
    "$1let $2 = ",
  );

  // Variable declarations without initialiser: `int x;` → `let x;`
  js = js.replace(
    new RegExp(
      `(^|[;{\\n]\\s*)(?:final\\s+)?${JAVA_TYPE_PATTERN}(?:\\s*\\[\\s*\\])?\\s+([A-Za-z_]\\w*)\\s*;`,
      "gm",
    ),
    "$1let $2;",
  );

  // Array with explicit new: `new int[] {1, 2}` → `[1, 2]`
  js = js.replace(
    new RegExp(
      `new\\s+${JAVA_TYPE_PATTERN}\\s*\\[\\s*\\]\\s*\\{([^{}]*)\\}`,
      "g",
    ),
    "[$1]",
  );

  // Shorthand array initialiser: `= {1, 2}` → `= [1, 2]`
  js = js.replace(/=\s*\{([^{}]*)\}/g, "= [$1]");

  // Report any Java type declarations that survived the transformation.
  for (const match of js.matchAll(LEFTOVER_JAVA_DECLARATION)) {
    if (match.index === undefined) continue;
    diagnostics.push({
      code: "unsupported_java_declaration",
      stage: "transpile",
      severity: "error",
      message: `Unsupported Java declaration: ${match[0]}`,
      ...getLineAndColumn(fullSource, bodyOffset + match.index),
    });
  }

  return js;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getLineAndColumn(
  source: string,
  index: number,
): { line: number; column: number } {
  const bounded = Math.max(0, index);
  const prefix = source.slice(0, bounded);
  const lines = prefix.split("\n");
  return {
    line: lines.length,
    column: (lines[lines.length - 1]?.length ?? 0) + 1,
  };
}
