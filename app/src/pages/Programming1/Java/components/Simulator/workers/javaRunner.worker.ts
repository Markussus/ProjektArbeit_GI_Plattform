import { JAVA_COMPILER_ASSET_URLS } from "../domain/javaCompilerAssets";
import type {
  JavaExecutionArtifacts,
  JavaExecutionErrorCategory,
  JavaExecutionIssue,
  JavaWorkerCompileAndRunRequest,
  JavaWorkerRequest,
} from "../domain/javaExecution";

interface JavaWorkerScope {
  onmessage:
    | ((event: MessageEvent<JavaWorkerRequest>) => void | Promise<void>)
    | null;
  postMessage: (message: unknown) => void;
}

interface RuntimeLoaderModule {
  load(
    source: string | Int8Array,
    options?: {
      stackDeobfuscator?: {
        enabled?: boolean;
        path?: string;
      };
      installImports?: (
        imports: Record<string, Record<string, unknown>>,
      ) => void;
    },
  ): Promise<{
    exports: {
      main(args: string[]): void;
    };
  }>;
}

interface UpstreamWorkerMessage {
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

interface PendingCompilation {
  requestId: string;
  diagnostics: JavaExecutionIssue[];
  resolve: (result: UpstreamWorkerMessage) => void;
  reject: (error: unknown) => void;
}

const workerScope = self as unknown as JavaWorkerScope;

const LOAD_REQUEST_ID = "__load-classlib__";

let compilerWorker: Worker | null = null;
let compilerReady = false;
let compilerReadyPromise: Promise<void> | null = null;
let resolveCompilerReady: (() => void) | null = null;
let rejectCompilerReady: ((error: unknown) => void) | null = null;
let pendingCompilation: PendingCompilation | null = null;

workerScope.onmessage = async (event: MessageEvent<JavaWorkerRequest>) => {
  const message = event.data;

  switch (message.type) {
    case "preload-compiler":
      await preloadCompiler(message.requestId);
      return;
    case "compile-and-run":
      await compileAndRun(message);
      return;
    case "stop":
      disposeCompilerWorker();
      return;
  }
};

async function preloadCompiler(requestId?: string) {
  workerScope.postMessage({
    type: "compiler-loading",
    requestId,
  });

  try {
    await ensureCompilerReady();
    workerScope.postMessage({
      type: "compiler-ready",
      requestId,
    });
  } catch (error) {
    workerScope.postMessage({
      type: "compiler-load-error",
      requestId,
      error: getErrorMessage(error),
    });
  }
}

async function compileAndRun(message: JavaWorkerCompileAndRunRequest) {
  const { requestId, sourceCode, mainClass } = message;

  try {
    await ensureCompilerReady();

    workerScope.postMessage({
      type: "compile-started",
      requestId,
    });

    const compilation = await compileSource(requestId, sourceCode);
    const diagnostics = compilation.diagnostics;

    if (
      compilation.result.status !== "successful" ||
      !compilation.result.script
    ) {
      throw createWorkerError(
        inferCompilationCategory(diagnostics),
        inferCompilationMessage(diagnostics),
        diagnostics,
        null,
      );
    }

    const generatedScript = copyByteArray(compilation.result.script);
    const artifacts: JavaExecutionArtifacts = {
      generatedFiles: [
        {
          path: "app.wasm",
          size: generatedScript.byteLength,
        },
      ],
      mainClass: mainClass ?? "Main",
    };

    workerScope.postMessage({
      type: "compile-finished",
      requestId,
      artifacts,
    });

    workerScope.postMessage({
      type: "run-started",
      requestId,
    });

    const { stdout, stderr } = await runGeneratedProgram(
      generatedScript,
      requestId,
      artifacts,
    );

    workerScope.postMessage({
      type: "success",
      requestId,
      stdout,
      stderr,
      artifacts,
    });
  } catch (error) {
    const normalized = normalizeWorkerError(error);
    workerScope.postMessage({
      type: "error",
      requestId,
      errorCategory: normalized.errorCategory,
      message: normalized.message,
      diagnostics: normalized.diagnostics,
      artifacts: normalized.artifacts ?? null,
    });
  }
}

async function ensureCompilerReady() {
  if (compilerReady && compilerWorker) {
    return;
  }

  if (compilerReadyPromise) {
    return compilerReadyPromise;
  }

  compilerReadyPromise = new Promise<void>((resolve, reject) => {
    resolveCompilerReady = resolve;
    rejectCompilerReady = reject;

    try {
      compilerWorker = new Worker(
        absoluteAssetUrl(JAVA_COMPILER_ASSET_URLS.upstreamWorker),
      );
      compilerWorker.onmessage = handleCompilerWorkerMessage;
      compilerWorker.onerror = handleCompilerWorkerError;
    } catch (error) {
      reject(error);
    }
  }).catch((error) => {
    disposeCompilerWorker();
    throw createWorkerError(
      "compiler-load",
      `Compiler could not be loaded. ${getErrorMessage(error)}`,
      [
        {
          code: "compiler_worker_load_failed",
          stage: "compiler-load",
          severity: "error",
          message: `worker.js could not be loaded. ${getErrorMessage(error)}`,
        },
      ],
    );
  });

  return compilerReadyPromise;
}

function handleCompilerWorkerMessage(
  event: MessageEvent<UpstreamWorkerMessage>,
) {
  const message = event.data;

  switch (message.command) {
    case "initialized":
      compilerWorker?.postMessage({
        command: "load-classlib",
        id: LOAD_REQUEST_ID,
        url: absoluteAssetUrl(JAVA_COMPILER_ASSET_URLS.compileClasslib),
        runtimeUrl: absoluteAssetUrl(JAVA_COMPILER_ASSET_URLS.runtimeClasslib),
      });
      return;
    case "ok":
      if (message.id === LOAD_REQUEST_ID) {
        compilerReady = true;
        resolveCompilerReady?.();
        clearReadyPromise();
      }
      return;
    case "compiler-diagnostic":
    case "diagnostic":
      if (pendingCompilation && message.id === pendingCompilation.requestId) {
        pendingCompilation.diagnostics.push(mapDiagnostic(message));
      }
      return;
    case "compilation-complete":
      if (pendingCompilation && message.id === pendingCompilation.requestId) {
        const current = pendingCompilation;
        pendingCompilation = null;
        current.resolve(message);
      }
      return;
    default:
      return;
  }
}

function handleCompilerWorkerError(event: ErrorEvent) {
  const workerError = createWorkerError(
    compilerReady ? "teavm" : "compiler-load",
    compilerReady
      ? `WebAssembly generation failed. ${event.message || "Unknown compiler worker error"}`
      : `Compiler could not be loaded. ${event.message || "Unknown compiler worker error"}`,
    [
      {
        code: compilerReady ? "teavm_worker_failed" : "compiler_worker_failed",
        stage: compilerReady ? "teavm" : "compiler-load",
        severity: "error",
        message: event.message || "Unknown compiler worker error",
      },
    ],
  );

  if (pendingCompilation) {
    const current = pendingCompilation;
    pendingCompilation = null;
    current.reject(workerError);
  } else if (rejectCompilerReady) {
    rejectCompilerReady(workerError);
  }

  disposeCompilerWorker();
}

function compileSource(requestId: string, sourceCode: string) {
  if (!compilerWorker) {
    throw createWorkerError("compiler-load", "Compiler could not be loaded.");
  }

  if (pendingCompilation) {
    throw createWorkerError(
      "unknown",
      "Another Java compilation is already running.",
    );
  }

  return new Promise<{
    result: UpstreamWorkerMessage;
    diagnostics: JavaExecutionIssue[];
  }>((resolve, reject) => {
    const diagnostics: JavaExecutionIssue[] = [];
    pendingCompilation = {
      requestId,
      diagnostics,
      resolve: (result) => resolve({ result, diagnostics }),
      reject,
    };

    compilerWorker?.postMessage({
      command: "compile",
      id: requestId,
      text: sourceCode,
    });
  });
}

async function runGeneratedProgram(
  wasmModule: Int8Array,
  requestId: string,
  artifacts: JavaExecutionArtifacts,
) {
  let stdout = "";
  let stderr = "";

  try {
    const runtimeModule = (await import(
      /* @vite-ignore */ absoluteAssetUrl(
        JAVA_COMPILER_ASSET_URLS.compilerRuntime,
      )
    )) as RuntimeLoaderModule;

    const loaded = await runtimeModule.load(wasmModule, {
      stackDeobfuscator: {
        enabled: false,
      },
      installImports(imports) {
        const teavmConsole = (imports.teavmConsole ??= {});
        teavmConsole.putcharStdout = (charCode: number) => {
          const next = String.fromCharCode(charCode);
          stdout += next;
          workerScope.postMessage({
            type: "stdout",
            requestId,
            data: next,
          });
        };
        teavmConsole.putcharStderr = (charCode: number) => {
          const next = String.fromCharCode(charCode);
          stderr += next;
          workerScope.postMessage({
            type: "stderr",
            requestId,
            data: next,
          });
        };
      },
    });

    loaded.exports.main([]);
  } catch (error) {
    throw createWorkerError(
      "runtime",
      `WebAssembly execution failed. Reason: ${getErrorMessage(error)}`,
      [
        {
          code: "wasm_runtime_failed",
          stage: "runtime",
          severity: "error",
          message: getErrorMessage(error),
        },
      ],
      artifacts,
    );
  }

  return {
    stdout,
    stderr,
  };
}

function disposeCompilerWorker() {
  if (compilerWorker) {
    compilerWorker.terminate();
    compilerWorker = null;
  }

  compilerReady = false;

  if (pendingCompilation) {
    pendingCompilation.reject(
      createWorkerError("stopped", "Execution was stopped manually."),
    );
    pendingCompilation = null;
  }

  if (rejectCompilerReady) {
    rejectCompilerReady(
      createWorkerError("stopped", "Compiler loading was stopped."),
    );
  }

  clearReadyPromise();
}

function clearReadyPromise() {
  compilerReadyPromise = null;
  resolveCompilerReady = null;
  rejectCompilerReady = null;
}

function inferCompilationCategory(
  diagnostics: JavaExecutionIssue[],
): JavaExecutionErrorCategory {
  if (diagnostics.some((diagnostic) => diagnostic.stage === "teavm")) {
    return "teavm";
  }

  return "javac";
}

function inferCompilationMessage(diagnostics: JavaExecutionIssue[]) {
  if (diagnostics.some((diagnostic) => diagnostic.stage === "teavm")) {
    return "WebAssembly generation failed.";
  }

  return "Java compilation failed.";
}

function absoluteAssetUrl(pathname: string) {
  return new URL(pathname, self.location.origin).toString();
}

function copyByteArray(bytes: Int8Array) {
  return new Int8Array(bytes);
}

function mapDiagnostic(diagnostic: UpstreamWorkerMessage): JavaExecutionIssue {
  const stage =
    diagnostic.command === "compiler-diagnostic" ? "javac" : "teavm";
  return {
    code:
      diagnostic.command === "compiler-diagnostic"
        ? "javac_diagnostic"
        : "teavm_diagnostic",
    stage,
    severity:
      diagnostic.severity === "other" || !diagnostic.severity
        ? "info"
        : diagnostic.severity,
    message: diagnostic.message ?? "Unknown compiler diagnostic",
    fileName: diagnostic.fileName,
    line: diagnostic.lineNumber,
    column: diagnostic.columnNumber,
  };
}

function createWorkerError(
  errorCategory: JavaExecutionErrorCategory,
  message: string,
  diagnostics?: JavaExecutionIssue[],
  artifacts?: JavaExecutionArtifacts | null,
) {
  return {
    __javaWorkerError: true,
    errorCategory,
    message,
    diagnostics,
    artifacts,
  };
}

function normalizeWorkerError(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "__javaWorkerError" in error
  ) {
    return {
      errorCategory: String(
        (error as { errorCategory?: string }).errorCategory ?? "unknown",
      ) as JavaExecutionErrorCategory,
      message: String(
        (error as { message?: string }).message ?? "Unknown error",
      ),
      diagnostics: (error as { diagnostics?: JavaExecutionIssue[] })
        .diagnostics,
      artifacts: (error as { artifacts?: JavaExecutionArtifacts | null })
        .artifacts,
    };
  }

  return {
    errorCategory: "unknown" as const,
    message: getErrorMessage(error),
    diagnostics: undefined,
    artifacts: null,
  };
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
