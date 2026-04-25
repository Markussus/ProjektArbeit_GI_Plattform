import { transpileJava } from "../domain/JavaAstTranspiler";
import { disinfectJavaSource } from "../domain/disinfectJavaSource";
import type {
  JavaExecutionIssue,
  JavaWorkerRequest,
} from "../domain/javaExecution";

interface JavaWorkerScope {
  onmessage:
    | ((event: MessageEvent<JavaWorkerRequest>) => void | Promise<void>)
    | null;
  postMessage: (message: unknown) => void;
}

const workerScope = self as unknown as JavaWorkerScope;

workerScope.onmessage = async (event: MessageEvent<JavaWorkerRequest>) => {
  const message = event.data;

  if (message.type !== "execute") {
    return;
  }

  const { requestId, payload } = message;
  workerScope.postMessage({
    type: "execution-started",
    requestId,
  });

  // Sanitise the source (currently a pass-through; logic will be added later).
  const disinfected = disinfectJavaSource(payload.source);

  // Transpile from Java to JavaScript using the AST-based transpiler.
  const transpiled = transpileJava(disinfected.sanitizedSource);

  const issues = [...disinfected.issues, ...transpiled.diagnostics];
  const hasBlockingIssue = issues.some((issue) => issue.severity === "error");

  // Build the runtime wrapper inline — isolates globals from the eval context.
  const wrappedJavascript = buildRuntimeWrapper(transpiled.javascript);

  const artifacts = {
    sanitizedSource: disinfected.sanitizedSource,
    javascript: transpiled.javascript,
    wrappedJavascript,
  };

  if (hasBlockingIssue) {
    workerScope.postMessage({
      type: "execution-failed",
      requestId,
      issues,
      artifacts,
    });
    return;
  }

  const runtime = createJavaRuntime(requestId);

  // Use `new Function` (indirect eval) to avoid bundler warnings.
  // `runtime` is passed as an explicit parameter so student code can call it
  // without needing direct access to this worker's lexical scope.
  const runCode = new Function("runtime", artifacts.wrappedJavascript) as (
    r: typeof runtime,
  ) => Promise<void>;

  try {
    await runCode(runtime);
    workerScope.postMessage({
      type: "execution-completed",
      requestId,
      issues,
      artifacts,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    runtime.error(errorMessage);
    workerScope.postMessage({
      type: "execution-failed",
      requestId,
      issues: [
        ...issues,
        {
          code: "runtime_execution_failed",
          stage: "eval",
          severity: "error",
          message: errorMessage,
        } satisfies JavaExecutionIssue,
      ],
      artifacts,
    });
  }
};

// ---------------------------------------------------------------------------
// Runtime wrapper
// ---------------------------------------------------------------------------

/**
 * Wraps the transpiled JavaScript in an async IIFE that shadows dangerous
 * browser globals so that student code cannot access the DOM or storage.
 */
function buildRuntimeWrapper(javascript: string): string {
  // `return` exposes the Promise to the `new Function(...)` caller so that
  // `await runCode(runtime)` actually waits for the student code to finish.
  return [
    "return (async () => {",
    '  "use strict";',
    "  const window = undefined;",
    "  const document = undefined;",
    "  const localStorage = undefined;",
    "  const sessionStorage = undefined;",
    "  const self = undefined;",
    javascript,
    "})();",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Java runtime (injected into the eval context)
// ---------------------------------------------------------------------------

function createJavaRuntime(requestId: string) {
  return {
    print(value: unknown) {
      workerScope.postMessage({
        type: "stdout",
        requestId,
        chunk: stringifyJavaValue(value),
      });
    },
    println(value: unknown) {
      workerScope.postMessage({
        type: "stdout",
        requestId,
        chunk: `${stringifyJavaValue(value)}\n`,
      });
    },
    error(value: unknown) {
      workerScope.postMessage({
        type: "stderr",
        requestId,
        chunk: `${stringifyJavaValue(value)}\n`,
      });
    },
    javaArrays: {
      sort(values: unknown[]) {
        if (!Array.isArray(values)) {
          throw new Error("Arrays.sort expects an array.");
        }

        values.sort(compareJavaValues);
        return values;
      },
      toString(values: unknown[]) {
        if (!Array.isArray(values)) {
          return stringifyJavaValue(values);
        }

        return `[${values.map(stringifyJavaValue).join(", ")}]`;
      },
    },
  };
}

function compareJavaValues(left: unknown, right: unknown): number {
  if (typeof left === "number" && typeof right === "number") {
    return left - right;
  }

  return stringifyJavaValue(left).localeCompare(stringifyJavaValue(right));
}

function stringifyJavaValue(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stringifyJavaValue).join(", ")}]`;
  }

  if (value === null || value === undefined) {
    return String(value);
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}
