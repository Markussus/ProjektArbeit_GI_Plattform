/** @vitest-environment jsdom */

import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useJavaExecution } from "../../../../../src/pages/Programming1/Java/components/Simulator/application/useJavaExecution";
import type {
  JavaExecutionArtifacts,
  JavaWorkerResponse,
} from "../../../../../src/pages/Programming1/Java/components/Simulator/domain/javaExecution";

class MockWorker {
  static instances: MockWorker[] = [];

  onmessage: ((event: MessageEvent<JavaWorkerResponse>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  readonly postedMessages: unknown[] = [];
  terminated = false;

  constructor() {
    MockWorker.instances.push(this);
  }

  postMessage(message: unknown) {
    this.postedMessages.push(message);
  }

  terminate() {
    this.terminated = true;
  }

  emit(message: JavaWorkerResponse) {
    this.onmessage?.({ data: message } as MessageEvent<JavaWorkerResponse>);
  }

  fail(message: string) {
    this.onerror?.({ message } as ErrorEvent);
  }
}

describe("useJavaExecution", () => {
  beforeEach(() => {
    MockWorker.instances = [];
    vi.stubGlobal("Worker", MockWorker);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("when a Java execution is started", () => {
    it("tracks preload, stdout, and completion state from the worker lifecycle", async () => {
      const { result } = renderHook(() => useJavaExecution());

      act(() => {
        result.current.preload();
      });

      const preloadWorker = MockWorker.instances[0];

      act(() => {
        preloadWorker.emit({
          type: "compiler-ready",
        });
      });

      await waitFor(() => {
        expect(result.current.snapshot.compilerStatus).toBe("ready");
      });

      act(() => {
        result.current.run({
          source: 'System.out.println("Hello");',
          exerciseId: "java-programming.exercise1",
          timeoutMs: 60_000,
        });
      });

      const worker = MockWorker.instances[0];
      const executeMessage = worker.postedMessages[1] as {
        requestId: string;
      };
      const requestId = executeMessage.requestId;
      const artifacts: JavaExecutionArtifacts = {
        generatedFiles: [
          { path: "app.wasm", size: 10 },
          { path: "app.wasm-runtime.js", size: 20 },
        ],
        mainClass: "Main",
      };

      expect(result.current.snapshot.phase).toBe("loading");

      act(() => {
        worker.emit({
          type: "compile-started",
          requestId,
        });
      });

      await waitFor(() => {
        expect(result.current.snapshot.phase).toBe("compiling");
      });

      act(() => {
        worker.emit({
          type: "run-started",
          requestId,
        });
      });

      await waitFor(() => {
        expect(result.current.snapshot.phase).toBe("running");
      });

      act(() => {
        worker.emit({
          type: "stdout",
          requestId,
          data: "Hello\n",
        });
      });

      await waitFor(() => {
        expect(result.current.snapshot.stdout).toEqual(["Hello\n"]);
      });

      act(() => {
        worker.emit({
          type: "success",
          requestId,
          artifacts,
          stdout: "Hello\n",
          stderr: "",
        });
      });

      await waitFor(() => {
        expect(result.current.snapshot.phase).toBe("done");
      });
      expect(result.current.snapshot.artifacts).toEqual(artifacts);
      expect(result.current.getPhase()).toBe("done");
      expect(result.current.getOutput()).toBe(result.current.snapshot);
    });
  });

  describe("when a running execution is interrupted by the user", () => {
    it("terminates the worker, marks the execution as stopped, and starts a fresh preload", async () => {
      const { result } = renderHook(() => useJavaExecution());

      act(() => {
        result.current.preload();
      });

      const worker = MockWorker.instances[0];

      act(() => {
        result.current.run({
          source: "class Main {}",
          timeoutMs: 60_000,
        });
      });

      act(() => {
        result.current.stop();
      });

      expect(worker.terminated).toBe(true);
      expect(result.current.snapshot.phase).toBe("stopped");
      expect(result.current.getPhase()).toBe("stopped");
      await waitFor(() => {
        expect(MockWorker.instances).toHaveLength(2);
      });
    });
  });

  describe("when execution exceeds its configured timeout", () => {
    it("terminates the worker and reports a timeout diagnostic", () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useJavaExecution());

      act(() => {
        result.current.run({
          source:
            "public class Main { public static void main(String[] args) { while (true) {} } }",
          timeoutMs: 1_000,
        });
      });

      const worker = MockWorker.instances[0];
      act(() => {
        vi.advanceTimersByTime(1_000);
      });

      expect(worker.terminated).toBe(true);
      expect(result.current.snapshot.phase).toBe("timeout");
      expect(result.current.snapshot.lastErrorCategory).toBe("timeout");
      expect(result.current.snapshot.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: "execution_timeout" }),
        ]),
      );
    });
  });

  describe("when compilation or execution fails", () => {
    it.each([
      ["javac", "javac_diagnostic"],
      ["runtime", "wasm_runtime_failed"],
    ] as const)(
      "preserves the %s error category and diagnostic",
      async (errorCategory, code) => {
        const { result } = renderHook(() => useJavaExecution());

        act(() => {
          result.current.run({ source: "class Main {}", timeoutMs: 60_000 });
        });

        const worker = MockWorker.instances[0];
        const executeMessage = worker.postedMessages[0] as {
          requestId: string;
        };
        act(() => {
          worker.emit({
            type: "error",
            requestId: executeMessage.requestId,
            errorCategory,
            message: `${errorCategory} failed`,
            diagnostics: [
              {
                code,
                stage: errorCategory,
                severity: "error",
                message: `${errorCategory} failed`,
              },
            ],
          });
        });

        await waitFor(() => {
          expect(result.current.snapshot.phase).toBe("error");
        });
        expect(result.current.snapshot.lastErrorCategory).toBe(errorCategory);
        expect(result.current.snapshot.issues[0]?.code).toBe(code);
        expect(result.current.snapshot.stderr.join("")).toContain(
          `${errorCategory} failed`,
        );
      },
    );
  });

  describe("when the execution state is reset", () => {
    it("clears the snapshot back to the initial idle state", async () => {
      const { result } = renderHook(() => useJavaExecution());

      act(() => {
        result.current.run({
          source: "class Main {}",
          timeoutMs: 60_000,
        });
      });

      const worker = MockWorker.instances[0];
      const executeMessage = worker.postedMessages[0] as {
        requestId: string;
      };

      act(() => {
        worker.emit({
          type: "stderr",
          requestId: executeMessage.requestId,
          data: "boom\n",
        });
      });

      await waitFor(() => {
        expect(result.current.snapshot.stderr).toEqual(["boom\n"]);
      });

      act(() => {
        result.current.reset();
      });

      expect(worker.terminated).toBe(true);
      await waitFor(() => {
        expect(result.current.snapshot.phase).toBe("loading");
      });
      expect(result.current.snapshot.stdout).toEqual([]);
      expect(result.current.snapshot.stderr).toEqual([]);
      expect(result.current.snapshot.issues).toEqual([]);
      expect(result.current.snapshot.artifacts).toBeNull();
      expect(result.current.snapshot.compilerStatus).toBe("loading");
    });
  });
});
