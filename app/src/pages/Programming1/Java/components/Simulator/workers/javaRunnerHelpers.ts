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

export function createExecutableSource(
  sourceCode: string,
  stdin?: string,
): string {
  if (!stdin) {
    return sourceCode;
  }
  return inlineScannerInput(sourceCode, stdin);
}

export function inlineScannerInput(sourceCode: string, stdin: string): string {
  const lines = stdin.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const tokens = stdin.trim().length > 0 ? stdin.trim().split(/\s+/) : [];
  let nextLineIndex = 0;
  let nextTokenIndex = 0;

  return sourceCode
    .replace(/^\s*import\s+java\.util\.Scanner;\s*$/m, "")
    .replace(
      /^\s*Scanner\s+([A-Za-z_$][\w$]*)\s*=\s*new\s+Scanner\s*\(\s*System\.in\s*\)\s*;\s*$/gm,
      "",
    )
    .replace(
      /\bString\s+([A-Za-z_$][\w$]*)\s*=\s*([A-Za-z_$][\w$]*)\.nextLine\s*\(\s*\)\s*;/g,
      (_match, variableName: string) =>
        `String ${variableName} = ${createJavaStringLiteral(lines[nextLineIndex++] ?? "")};`,
    )
    .replace(
      /\bint\s+([A-Za-z_$][\w$]*)\s*=\s*([A-Za-z_$][\w$]*)\.nextInt\s*\(\s*\)\s*;/g,
      (_match, variableName: string) =>
        `int ${variableName} = ${Number.parseInt(tokens[nextTokenIndex++] ?? "0", 10) || 0};`,
    );
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
