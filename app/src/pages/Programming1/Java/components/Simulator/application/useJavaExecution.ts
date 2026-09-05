import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  createJavaExecutionSnapshot,
  type JavaExecutionController,
  type JavaExecutionErrorCategory,
  type JavaExecutionIssue,
  type JavaExecutionPhase,
  type JavaExecutionRequest,
  type JavaExecutionSnapshot,
  type JavaWorkerResponse,
} from "../../Simulator/domain/javaExecution";
import type { ExecutionPhase } from "@/types/simulator";

function createJavaWorker(): Worker {
  return new Worker(
    new URL("../workers/javaRunner.worker.ts", import.meta.url),
    {
      type: "module",
    },
  );
}

function createRequestId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `java-exec-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function mapJavaPhaseToExecutablePhase(
  phase: JavaExecutionPhase,
): ExecutionPhase {
  if (phase === "idle" || phase === "done" || phase === "error") {
    return phase;
  }

  if (phase === "stopped" || phase === "timeout") {
    return "stopped";
  }

  return "running";
}

export function useJavaExecution(): JavaExecutionController {
  const { t } = useTranslation();
  const [snapshot, setSnapshot] = useState<JavaExecutionSnapshot>(() =>
    createJavaExecutionSnapshot(),
  );
  const workerRef = useRef<Worker | null>(null);
  const activeRequestIdRef = useRef<string | null>(null);
  const pendingTimeoutRef = useRef<number | null>(null);
  const shouldPreloadRef = useRef(false);
  const pendingRunResolveRef = useRef<
    ((snapshot: JavaExecutionSnapshot) => void) | null
  >(null);

  const clearPendingTimeout = useCallback(() => {
    if (pendingTimeoutRef.current !== null) {
      window.clearTimeout(pendingTimeoutRef.current);
      pendingTimeoutRef.current = null;
    }
  }, []);

  const resolvePendingRun = useCallback((snapshot: JavaExecutionSnapshot) => {
    pendingRunResolveRef.current?.(snapshot);
    pendingRunResolveRef.current = null;
  }, []);

  const disposeWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  }, []);

  const createTerminalSnapshot = useCallback(
    (
      currentSnapshot: JavaExecutionSnapshot,
      nextValues: Partial<JavaExecutionSnapshot>,
    ) => {
      const nextSnapshot = {
        ...currentSnapshot,
        ...nextValues,
        finishedAt: new Date().toISOString(),
      };

      resolvePendingRun(nextSnapshot);
      return nextSnapshot;
    },
    [resolvePendingRun],
  );

  const attachWorkerListeners = useCallback(
    (worker: Worker) => {
      worker.onmessage = (event: MessageEvent<JavaWorkerResponse>) => {
        const message = event.data;

        switch (message.type) {
          case "compiler-loading":
            setSnapshot((currentSnapshot) => ({
              ...currentSnapshot,
              compilerStatus: "loading",
              phase:
                currentSnapshot.phase === "idle"
                  ? "loading"
                  : currentSnapshot.phase,
            }));
            return;
          case "compiler-ready":
            setSnapshot((currentSnapshot) => ({
              ...currentSnapshot,
              compilerStatus: "ready",
              phase:
                currentSnapshot.phase === "loading"
                  ? "idle"
                  : currentSnapshot.phase,
            }));
            return;
          case "compiler-load-error":
            setSnapshot((currentSnapshot) =>
              createTerminalSnapshot(currentSnapshot, {
                compilerStatus: "failed",
                phase: "error",
                lastErrorCategory: "compiler-load",
                issues: [
                  ...currentSnapshot.issues,
                  {
                    code: "compiler_load_failed",
                    stage: "compiler-load",
                    severity: "error",
                    message: message.error,
                  },
                ],
                stderr: [...currentSnapshot.stderr, `${message.error}\n`],
              }),
            );
            return;
          default:
            break;
        }

        if (message.requestId !== activeRequestIdRef.current) {
          return;
        }

        switch (message.type) {
          case "compile-started":
            setSnapshot((currentSnapshot) => ({
              ...currentSnapshot,
              phase: "compiling",
            }));
            return;
          case "compile-finished":
            setSnapshot((currentSnapshot) => ({
              ...currentSnapshot,
              phase: "compiling",
              artifacts: message.artifacts,
            }));
            return;
          case "run-started":
            setSnapshot((currentSnapshot) => ({
              ...currentSnapshot,
              phase: "running",
            }));
            return;
          case "stdout":
            setSnapshot((currentSnapshot) => ({
              ...currentSnapshot,
              stdout: [...currentSnapshot.stdout, message.data],
            }));
            return;
          case "stderr":
            setSnapshot((currentSnapshot) => ({
              ...currentSnapshot,
              stderr: [...currentSnapshot.stderr, message.data],
            }));
            return;
          case "success":
            clearPendingTimeout();
            activeRequestIdRef.current = null;
            setSnapshot((currentSnapshot) =>
              createTerminalSnapshot(currentSnapshot, {
                phase: "done",
                artifacts: message.artifacts,
              }),
            );
            return;
          case "error":
            clearPendingTimeout();
            activeRequestIdRef.current = null;
            setSnapshot((currentSnapshot) =>
              createTerminalSnapshot(currentSnapshot, {
                phase: "error",
                issues: message.diagnostics ?? currentSnapshot.issues,
                artifacts:
                  message.artifacts === undefined
                    ? currentSnapshot.artifacts
                    : message.artifacts,
                lastErrorCategory: message.errorCategory,
                stderr: [...currentSnapshot.stderr, `${message.message}\n`],
              }),
            );
        }
      };

      worker.onerror = (event) => {
        clearPendingTimeout();
        activeRequestIdRef.current = null;
        setSnapshot((currentSnapshot) =>
          createTerminalSnapshot(currentSnapshot, {
            compilerStatus:
              currentSnapshot.compilerStatus === "loading"
                ? "failed"
                : currentSnapshot.compilerStatus,
            phase: "error",
            lastErrorCategory: "unknown",
            stderr: [
              ...currentSnapshot.stderr,
              `${event.message || "Unknown worker error"}\n`,
            ],
            issues: [
              ...currentSnapshot.issues,
              {
                code: "worker_error",
                stage: "worker",
                severity: "error",
                message: event.message || "Unknown worker error",
              },
            ],
          }),
        );
      };
    },
    [clearPendingTimeout, createTerminalSnapshot],
  );

  const ensureWorker = useCallback(() => {
    if (workerRef.current) {
      return workerRef.current;
    }

    const worker = createJavaWorker();
    attachWorkerListeners(worker);
    workerRef.current = worker;
    return worker;
  }, [attachWorkerListeners]);

  const preload = useCallback(() => {
    shouldPreloadRef.current = true;

    setSnapshot((currentSnapshot) => {
      if (
        currentSnapshot.compilerStatus === "loading" ||
        currentSnapshot.compilerStatus === "ready"
      ) {
        return currentSnapshot;
      }

      return {
        ...currentSnapshot,
        compilerStatus: "loading",
        phase:
          currentSnapshot.phase === "idle" ? "loading" : currentSnapshot.phase,
      };
    });

    const worker = ensureWorker();
    worker.postMessage({
      type: "preload-compiler",
      requestId: createRequestId(),
    });
  }, [ensureWorker]);

  const recreatePreloadedWorker = useCallback(() => {
    disposeWorker();
    activeRequestIdRef.current = null;
    clearPendingTimeout();

    setSnapshot((currentSnapshot) => ({
      ...currentSnapshot,
      compilerStatus: shouldPreloadRef.current ? "loading" : "not-loaded",
    }));

    if (shouldPreloadRef.current) {
      queueMicrotask(() => {
        preload();
      });
    }
  }, [clearPendingTimeout, disposeWorker, preload]);

  const stop = useCallback(
    (reason: "stopped" | "timeout" = "stopped", timeoutMs?: number) => {
      const seconds = Math.max(1, Math.round((timeoutMs ?? 0) / 1000));
      const stopMessage = `${t(
        reason === "timeout"
          ? "java-programming.execution.timeoutMessage"
          : "java-programming.execution.stoppedMessage",
        { seconds },
      )}\n`;
      const issue: JavaExecutionIssue = {
        code: reason === "timeout" ? "execution_timeout" : "execution_stopped",
        stage: reason,
        severity: "error",
        message: stopMessage.trim(),
      };

      recreatePreloadedWorker();
      setSnapshot((currentSnapshot) =>
        createTerminalSnapshot(currentSnapshot, {
          phase: reason,
          lastErrorCategory: reason as JavaExecutionErrorCategory,
          issues:
            currentSnapshot.phase === "idle" &&
            currentSnapshot.compilerStatus === "ready"
              ? currentSnapshot.issues
              : [...currentSnapshot.issues, issue],
          stderr:
            currentSnapshot.phase === "idle" &&
            currentSnapshot.compilerStatus === "ready"
              ? currentSnapshot.stderr
              : [...currentSnapshot.stderr, stopMessage],
        }),
      );
    },
    [createTerminalSnapshot, recreatePreloadedWorker, t],
  );

  const reset = useCallback(() => {
    const shouldPreload = shouldPreloadRef.current;
    recreatePreloadedWorker();
    setSnapshot((currentSnapshot) => ({
      ...createJavaExecutionSnapshot(shouldPreload ? "loading" : "idle"),
      compilerStatus: shouldPreload
        ? currentSnapshot.compilerStatus === "ready"
          ? "ready"
          : "loading"
        : "not-loaded",
    }));
  }, [recreatePreloadedWorker]);

  const run = useCallback(
    (request: JavaExecutionRequest) => {
      shouldPreloadRef.current = true;
      const worker = ensureWorker();
      const requestId = createRequestId();

      activeRequestIdRef.current = requestId;
      clearPendingTimeout();

      pendingTimeoutRef.current = window.setTimeout(() => {
        if (activeRequestIdRef.current === requestId) {
          stop("timeout", request.timeoutMs);
        }
      }, request.timeoutMs);

      setSnapshot((currentSnapshot) => ({
        ...createJavaExecutionSnapshot("loading"),
        compilerStatus:
          currentSnapshot.compilerStatus === "ready" ? "ready" : "loading",
        startedAt: new Date().toISOString(),
      }));

      worker.postMessage({
        type: "compile-and-run",
        requestId,
        sourceCode: request.source,
        mainClass: request.mainClass,
        timeoutMs: request.timeoutMs,
        stdin: request.stdin,
      });
    },
    [clearPendingTimeout, ensureWorker, stop],
  );

  const runAsync = useCallback(
    (request: JavaExecutionRequest) =>
      new Promise<JavaExecutionSnapshot>((resolve) => {
        pendingRunResolveRef.current = resolve;
        run(request);
      }),
    [run],
  );

  const getPhase = useCallback(
    () => mapJavaPhaseToExecutablePhase(snapshot.phase),
    [snapshot.phase],
  );

  const getOutput = useCallback(() => snapshot, [snapshot]);

  useEffect(() => {
    return () => {
      clearPendingTimeout();
      disposeWorker();
    };
  }, [clearPendingTimeout, disposeWorker]);

  return {
    snapshot,
    preload,
    run,
    runAsync,
    stop,
    reset,
    getPhase,
    getOutput,
  };
}
