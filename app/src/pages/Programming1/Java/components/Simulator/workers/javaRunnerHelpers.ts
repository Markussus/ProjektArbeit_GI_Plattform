import type {
  JavaExecutionArtifacts,
  JavaExecutionErrorCategory,
  JavaExecutionIssue,
} from "../domain/javaExecution";

export interface UpstreamWorkerMessage {
  command: string;
  id?: string;
  status?: "successful" | "errors";
  severity?: "error" | "warning" | "other";
  fileName?: string;
  lineNumber?: number;
  columnNumber?: number;
  message?: string;
  script?: Int8Array;
}

export interface CustomWorkerError {
  __javaWorkerError: true;
  errorCategory: JavaExecutionErrorCategory;
  message: string;
  diagnostics?: JavaExecutionIssue[];
  artifacts?: JavaExecutionArtifacts | null;
}

export class ScannerInputCursor {
  private text: string;
  private pos: number = 0;

  constructor(stdin: string) {
    this.text = (stdin ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  }

  nextLine(): string {
    if (this.pos >= this.text.length) {
      return "";
    }
    const newlineIndex = this.text.indexOf("\n", this.pos);
    if (newlineIndex === -1) {
      const line = this.text.slice(this.pos);
      this.pos = this.text.length;
      return line;
    }
    const line = this.text.slice(this.pos, newlineIndex);
    this.pos = newlineIndex + 1;
    return line;
  }

  nextToken(): string {
    while (this.pos < this.text.length && /\s/.test(this.text[this.pos]!)) {
      this.pos++;
    }
    if (this.pos >= this.text.length) {
      return "";
    }
    const start = this.pos;
    while (this.pos < this.text.length && !/\s/.test(this.text[this.pos]!)) {
      this.pos++;
    }
    return this.text.slice(start, this.pos);
  }

  nextInt(): number {
    const token = this.nextToken();
    const parsed = Number.parseInt(token, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  nextLong(): string {
    const token = this.nextToken();
    const parsed = Number.parseInt(token, 10);
    return Number.isNaN(parsed) ? "0L" : `${parsed}L`;
  }

  nextDouble(): number {
    const token = this.nextToken();
    const parsed = Number.parseFloat(token);
    return Number.isNaN(parsed) ? 0.0 : parsed;
  }

  nextBoolean(): boolean {
    const token = this.nextToken().toLowerCase();
    return token === "true";
  }
}

export function createExecutableSource(
  sourceCode: string,
  stdin?: string,
): string {
  return inlineScannerInput(sourceCode, stdin ?? "");
}

export function inlineScannerInput(sourceCode: string, stdin: string): string {
  if (
    !/Scanner|\b(?:sc|scanner)\b|\.next(?:Line|Int|Long|Double|Float|Boolean|Short|Byte)?\s*\(/i.test(
      sourceCode,
    )
  ) {
    return sourceCode;
  }

  const cursor = new ScannerInputCursor(stdin ?? "");

  let code = sourceCode.replace(
    /^[ \t]*import\s+(?:java\.util\.)?Scanner\s*;[ \t]*\r?\n?/gm,
    "",
  );

  const unifiedScannerRegex =
    /(?:^[ \t]*(?:final\s+)?(?:java\.util\.)?Scanner\s+[A-Za-z_$][\w$]*(?:\s*=\s*(?:new\s+(?:java\.util\.)?Scanner\s*\(\s*System\.in\s*\)|null))?\s*;[ \t]*\r?\n?)|(?:^[ \t]*[A-Za-z_$][\w$]*\s*=\s*new\s+(?:java\.util\.)?Scanner\s*\(\s*System\.in\s*\)\s*;[ \t]*\r?\n?)|(?:^[ \t]*[A-Za-z_$][\w$]*\.close\s*\(\s*\)\s*;[ \t]*\r?\n?)|(?:^[ \t]*[A-Za-z_$][\w$]*\.(?<standaloneMethod>nextLine|nextInt|nextLong|nextDouble|nextFloat|nextBoolean|nextShort|nextByte|next)\s*\(\s*\)\s*;[ \t]*\r?\n?)|(?:\b[A-Za-z_$][\w$]*\.(?<exprMethod>nextLine|nextInt|nextLong|nextDouble|nextFloat|nextBoolean|nextShort|nextByte|next)\s*\(\s*\))/gm;

  code = code.replace(unifiedScannerRegex, (...args: unknown[]) => {
    const groups = (args[args.length - 1] ?? {}) as {
      standaloneMethod?: string;
      exprMethod?: string;
    };

    if (groups.standaloneMethod) {
      switch (groups.standaloneMethod) {
        case "nextLine":
          cursor.nextLine();
          break;
        case "next":
          cursor.nextToken();
          break;
        case "nextInt":
        case "nextShort":
        case "nextByte":
          cursor.nextInt();
          break;
        case "nextLong":
          cursor.nextLong();
          break;
        case "nextDouble":
        case "nextFloat":
          cursor.nextDouble();
          break;
        case "nextBoolean":
          cursor.nextBoolean();
          break;
      }
      return "";
    }

    if (groups.exprMethod) {
      switch (groups.exprMethod) {
        case "nextLine":
          return createJavaStringLiteral(cursor.nextLine());
        case "next":
          return createJavaStringLiteral(cursor.nextToken());
        case "nextInt":
          return String(cursor.nextInt());
        case "nextLong":
          return cursor.nextLong();
        case "nextDouble":
          return String(cursor.nextDouble());
        case "nextFloat":
          return `${cursor.nextDouble()}f`;
        case "nextBoolean":
          return String(cursor.nextBoolean());
        case "nextShort":
          return `((short) ${cursor.nextInt()})`;
        case "nextByte":
          return `((byte) ${cursor.nextInt()})`;
      }
    }

    // Scanner declaration, assignment, or close statement
    return "";
  });

  return code;
}

export function createJavaStringLiteral(value: string): string {
  return `"${Array.from(value, (char) => {
    switch (char) {
      case "\\":
        return "\\\\";
      case '"':
        return '\\"';
      case "\n":
        return "\\n";
      case "\r":
        return "\\r";
      case "\t":
        return "\\t";
      default:
        return char;
    }
  }).join("")}"`;
}

export function mapDiagnostic(
  diagnostic: UpstreamWorkerMessage,
): JavaExecutionIssue {
  const isCompiler = diagnostic.command === "compiler-diagnostic";
  const stage = isCompiler ? "javac" : "teavm";
  const code = isCompiler ? "javac_diagnostic" : "teavm_diagnostic";
  const severity =
    diagnostic.severity === "other" || !diagnostic.severity
      ? "info"
      : diagnostic.severity;

  return {
    code,
    stage,
    severity,
    message: diagnostic.message ?? "Unknown compiler diagnostic",
    fileName: diagnostic.fileName,
    line: diagnostic.lineNumber,
    column: diagnostic.columnNumber,
  };
}

export function createWorkerError(
  errorCategory: JavaExecutionErrorCategory,
  message: string,
  diagnostics?: JavaExecutionIssue[],
  artifacts?: JavaExecutionArtifacts | null,
): CustomWorkerError {
  return {
    __javaWorkerError: true,
    errorCategory,
    message,
    diagnostics,
    artifacts,
  };
}

export function buildWorkerErrorFromEvent(
  event: ErrorEvent,
  compilerReady: boolean,
): CustomWorkerError {
  const stage: JavaExecutionErrorCategory = compilerReady
    ? "teavm"
    : "compiler-load";
  const code = compilerReady ? "teavm_worker_failed" : "compiler_worker_failed";
  const message = event.message || "Unknown compiler worker error";
  const prefix = compilerReady
    ? "WebAssembly generation failed."
    : "Compiler could not be loaded.";

  return createWorkerError(stage, `${prefix} ${message}`, [
    {
      code,
      stage,
      severity: "error",
      message,
    },
  ]);
}

export function normalizeWorkerError(error: unknown): {
  errorCategory: JavaExecutionErrorCategory;
  message: string;
  diagnostics?: JavaExecutionIssue[];
  artifacts?: JavaExecutionArtifacts | null;
} {
  if (
    typeof error === "object" &&
    error !== null &&
    "__javaWorkerError" in error
  ) {
    const custom = error as Partial<CustomWorkerError>;
    return {
      errorCategory: custom.errorCategory ?? "unknown",
      message: custom.message ?? "Unknown error",
      diagnostics: custom.diagnostics,
      artifacts: custom.artifacts,
    };
  }

  return {
    errorCategory: "unknown",
    message: getErrorMessage(error),
    diagnostics: undefined,
    artifacts: null,
  };
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export function inferCompilationCategory(
  diagnostics: JavaExecutionIssue[],
): JavaExecutionErrorCategory {
  return diagnostics.some((diagnostic) => diagnostic.stage === "teavm")
    ? "teavm"
    : "javac";
}

export function inferCompilationMessage(
  diagnostics: JavaExecutionIssue[],
): string {
  return diagnostics.some((diagnostic) => diagnostic.stage === "teavm")
    ? "WebAssembly generation failed."
    : "Java compilation failed.";
}
