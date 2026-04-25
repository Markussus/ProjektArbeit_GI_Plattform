export type JavaExecutionStage = "disinfect" | "transpile" | "runtime" | "eval";

export type JavaExecutionIssueSeverity = "info" | "warning" | "error";

export interface JavaExecutionIssue {
  code: string;
  stage: JavaExecutionStage;
  severity: JavaExecutionIssueSeverity;
  message: string;
  line?: number;
  column?: number;
}

export interface JavaExecutionArtifacts {
  sanitizedSource: string;
  javascript: string;
  wrappedJavascript: string;
}

export interface JavaExecutionRequest {
  source: string;
  exerciseId?: string | null;
}

export type JavaExecutionPhase =
  | "idle"
  | "running"
  | "stopped"
  | "done"
  | "error";

export interface JavaExecutionSnapshot {
  phase: JavaExecutionPhase;
  stdout: string[];
  stderr: string[];
  issues: JavaExecutionIssue[];
  artifacts: JavaExecutionArtifacts | null;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface JavaWorkerExecutionStartedMessage {
  type: "execution-started";
  requestId: string;
}

export interface JavaWorkerStdoutMessage {
  type: "stdout";
  requestId: string;
  chunk: string;
}

export interface JavaWorkerStderrMessage {
  type: "stderr";
  requestId: string;
  chunk: string;
}

export interface JavaWorkerExecutionCompletedMessage {
  type: "execution-completed";
  requestId: string;
  issues: JavaExecutionIssue[];
  artifacts: JavaExecutionArtifacts;
}

export interface JavaWorkerExecutionFailedMessage {
  type: "execution-failed";
  requestId: string;
  issues: JavaExecutionIssue[];
  artifacts: JavaExecutionArtifacts | null;
}

export type JavaWorkerResponse =
  | JavaWorkerExecutionStartedMessage
  | JavaWorkerStdoutMessage
  | JavaWorkerStderrMessage
  | JavaWorkerExecutionCompletedMessage
  | JavaWorkerExecutionFailedMessage;

export interface JavaWorkerExecuteMessage {
  type: "execute";
  requestId: string;
  payload: JavaExecutionRequest;
}

export type JavaWorkerRequest = JavaWorkerExecuteMessage;

export function createJavaExecutionSnapshot(
  phase: JavaExecutionPhase = "idle",
): JavaExecutionSnapshot {
  return {
    phase,
    stdout: [],
    stderr: [],
    issues: [],
    artifacts: null,
    startedAt: null,
    finishedAt: null,
  };
}
