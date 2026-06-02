export type JavaCompilerStatus = "not-loaded" | "loading" | "ready" | "failed";

export type JavaExecutionPhase =
  | "idle"
  | "loading"
  | "compiling"
  | "running"
  | "stopped"
  | "timeout"
  | "done"
  | "error";

export type JavaExecutionIssueStage =
  | "compiler-load"
  | "javac"
  | "teavm"
  | "runtime"
  | "worker"
  | "timeout"
  | "stopped";

export type JavaExecutionIssueSeverity = "info" | "warning" | "error";

export type JavaExecutionErrorCategory =
  | "compiler-load"
  | "missing-artifact"
  | "javac"
  | "teavm"
  | "wasm-instantiation"
  | "runtime"
  | "timeout"
  | "stopped"
  | "unknown";

export interface JavaExecutionIssue {
  code: string;
  stage: JavaExecutionIssueStage;
  severity: JavaExecutionIssueSeverity;
  message: string;
  fileName?: string;
  line?: number;
  column?: number;
}

export interface JavaGeneratedArtifact {
  path: string;
  size: number;
}

export interface JavaExecutionArtifacts {
  generatedFiles: JavaGeneratedArtifact[];
  mainClass: string | null;
}

export interface JavaExecutionRequest {
  source: string;
  exerciseId?: string | null;
  timeoutMs: number;
  mainClass?: string;
}

export interface JavaExecutionSnapshot {
  compilerStatus: JavaCompilerStatus;
  phase: JavaExecutionPhase;
  stdout: string[];
  stderr: string[];
  issues: JavaExecutionIssue[];
  artifacts: JavaExecutionArtifacts | null;
  startedAt: string | null;
  finishedAt: string | null;
  lastErrorCategory: JavaExecutionErrorCategory | null;
}

export interface JavaWorkerPreloadCompilerRequest {
  type: "preload-compiler";
  requestId: string;
}

export interface JavaWorkerCompileAndRunRequest {
  type: "compile-and-run";
  requestId: string;
  sourceCode: string;
  mainClass?: string;
  timeoutMs: number;
}

export interface JavaWorkerStopRequest {
  type: "stop";
  requestId: string;
}

export type JavaWorkerRequest =
  | JavaWorkerPreloadCompilerRequest
  | JavaWorkerCompileAndRunRequest
  | JavaWorkerStopRequest;

export interface JavaWorkerCompilerLoadingMessage {
  type: "compiler-loading";
  requestId?: string;
}

export interface JavaWorkerCompilerReadyMessage {
  type: "compiler-ready";
  requestId?: string;
}

export interface JavaWorkerCompilerLoadErrorMessage {
  type: "compiler-load-error";
  requestId?: string;
  error: string;
}

export interface JavaWorkerCompileStartedMessage {
  type: "compile-started";
  requestId: string;
}

export interface JavaWorkerCompileFinishedMessage {
  type: "compile-finished";
  requestId: string;
  artifacts: JavaExecutionArtifacts;
}

export interface JavaWorkerRunStartedMessage {
  type: "run-started";
  requestId: string;
}

export interface JavaWorkerStdoutMessage {
  type: "stdout";
  requestId: string;
  data: string;
}

export interface JavaWorkerStderrMessage {
  type: "stderr";
  requestId: string;
  data: string;
}

export interface JavaWorkerSuccessMessage {
  type: "success";
  requestId: string;
  stdout: string;
  stderr: string;
  artifacts: JavaExecutionArtifacts;
}

export interface JavaWorkerErrorMessage {
  type: "error";
  requestId: string;
  errorCategory: JavaExecutionErrorCategory;
  message: string;
  diagnostics?: JavaExecutionIssue[];
  artifacts?: JavaExecutionArtifacts | null;
}

export type JavaWorkerResponse =
  | JavaWorkerCompilerLoadingMessage
  | JavaWorkerCompilerReadyMessage
  | JavaWorkerCompilerLoadErrorMessage
  | JavaWorkerCompileStartedMessage
  | JavaWorkerCompileFinishedMessage
  | JavaWorkerRunStartedMessage
  | JavaWorkerStdoutMessage
  | JavaWorkerStderrMessage
  | JavaWorkerSuccessMessage
  | JavaWorkerErrorMessage;

export function createJavaExecutionSnapshot(
  phase: JavaExecutionPhase = "idle",
): JavaExecutionSnapshot {
  return {
    compilerStatus: "not-loaded",
    phase,
    stdout: [],
    stderr: [],
    issues: [],
    artifacts: null,
    startedAt: null,
    finishedAt: null,
    lastErrorCategory: null,
  };
}
