import { useCallback, useEffect, useRef, useState } from "react";
import {
  createJavaExecutionSnapshot,
  type JavaExecutionRequest,
  type JavaExecutionSnapshot,
  type JavaWorkerResponse,
} from "../../Simulator/domain/javaExecution";

function createJavaWorker(): Worker {
  return new Worker(new URL("../workers/javaRunner.worker.ts", import.meta.url), {
    type: "module",
  });
}

function createRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `java-exec-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function useJavaExecution() {
  const [snapshot, setSnapshot] = useState<JavaExecutionSnapshot>(() =>
    createJavaExecutionSnapshot(),
  );
  const workerRef = useRef<Worker | null>(null);
  const activeRequestIdRef = useRef<string | null>(null);

  const disposeWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    disposeWorker();
    activeRequestIdRef.current = null;
    setSnapshot((currentSnapshot) => {
      if (currentSnapshot.phase !== "running") {
        return currentSnapshot;
      }

      return {
        ...currentSnapshot,
        phase: "stopped",
        finishedAt: new Date().toISOString(),
      };
    });
  }, [disposeWorker]);

  const reset = useCallback(() => {
    disposeWorker();
    activeRequestIdRef.current = null;
    setSnapshot(createJavaExecutionSnapshot());
  }, [disposeWorker]);

  const run = useCallback(
    (request: JavaExecutionRequest) => {
      disposeWorker();

      const requestId = createRequestId();
      const worker = createJavaWorker();

      workerRef.current = worker;
      activeRequestIdRef.current = requestId;

      setSnapshot({
        ...createJavaExecutionSnapshot("running"),
        startedAt: new Date().toISOString(),
      });

      worker.onmessage = (event: MessageEvent<JavaWorkerResponse>) => {
        const message = event.data;

        if (message.requestId !== activeRequestIdRef.current) {
          return;
        }

        switch (message.type) {
          case "execution-started":
            return;
          case "stdout":
            setSnapshot((currentSnapshot) => ({
              ...currentSnapshot,
              stdout: [...currentSnapshot.stdout, message.chunk],
            }));
            return;
          case "stderr":
            setSnapshot((currentSnapshot) => ({
              ...currentSnapshot,
              stderr: [...currentSnapshot.stderr, message.chunk],
            }));
            return;
          case "execution-completed":
            disposeWorker();
            activeRequestIdRef.current = null;
            setSnapshot((currentSnapshot) => ({
              ...currentSnapshot,
              phase: "done",
              issues: message.issues,
              artifacts: message.artifacts,
              finishedAt: new Date().toISOString(),
            }));
            return;
          case "execution-failed":
            disposeWorker();
            activeRequestIdRef.current = null;
            setSnapshot((currentSnapshot) => ({
              ...currentSnapshot,
              phase: "error",
              issues: message.issues,
              artifacts: message.artifacts,
              finishedAt: new Date().toISOString(),
            }));
        }
      };

      worker.onerror = (event) => {
        if (requestId !== activeRequestIdRef.current) {
          return;
        }

        disposeWorker();
        activeRequestIdRef.current = null;
        setSnapshot((currentSnapshot) => ({
          ...currentSnapshot,
          phase: "error",
          stderr: [
            ...currentSnapshot.stderr,
            `${event.message || "Unknown worker error"}\n`,
          ],
          finishedAt: new Date().toISOString(),
        }));
      };

      worker.postMessage({
        type: "execute",
        requestId,
        payload: request,
      });
    },
    [disposeWorker],
  );

  useEffect(() => {
    return () => {
      disposeWorker();
    };
  }, [disposeWorker]);

  return {
    snapshot,
    run,
    stop,
    reset,
  };
}
