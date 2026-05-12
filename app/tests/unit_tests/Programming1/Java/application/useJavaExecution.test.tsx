/** @vitest-environment jsdom */

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useJavaExecution } from "../../../../../src/pages/Programming1/Java/components/Simulator/application/useJavaExecution";
import type {
  JavaExecutionArtifacts,
  JavaExecutionIssue,
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

  describe("when a Java execution is started", () => {
    it("tracks stdout and completion state from the worker lifecycle", async () => {
      const { result } = renderHook(() => useJavaExecution());

      act(() => {
        result.current.run({
          source: 'System.out.println("Hello");',
          exerciseId: "java.exercise1",
        });
      });

      const worker = MockWorker.instances[0];
      const executeMessage = worker.postedMessages[0] as {
        requestId: string;
      };
      const requestId = executeMessage.requestId;
      const artifacts: JavaExecutionArtifacts = {
        sanitizedSource: 'System.out.println("Hello");',
        javascript: 'runtime.println("Hello");',
        wrappedJavascript: '(() => runtime.println("Hello"))();',
      };
      const issues: JavaExecutionIssue[] = [];

      expect(result.current.snapshot.phase).toBe("running");

      act(() => {
        worker.emit({
          type: "stdout",
          requestId,
          chunk: "Hello\n",
        });
      });

      await waitFor(() => {
        expect(result.current.snapshot.stdout).toEqual(["Hello\n"]);
      });

      act(() => {
        worker.emit({
          type: "execution-completed",
          requestId,
          issues,
          artifacts,
        });
      });

      await waitFor(() => {
        expect(result.current.snapshot.phase).toBe("done");
      });
      expect(result.current.snapshot.artifacts).toEqual(artifacts);
      expect(worker.terminated).toBe(true);
    });
  });

  describe("when a running execution is interrupted by the user", () => {
    it("terminates the worker and marks the execution as stopped", () => {
      const { result } = renderHook(() => useJavaExecution());

      act(() => {
        result.current.run({
          source: "class Main {}",
        });
      });

      const worker = MockWorker.instances[0];

      act(() => {
        result.current.stop();
      });

      expect(worker.terminated).toBe(true);
      expect(result.current.snapshot.phase).toBe("stopped");
    });
  });

  describe("when the execution state is reset", () => {
    it("clears the snapshot back to the initial idle state", async () => {
      const { result } = renderHook(() => useJavaExecution());

      act(() => {
        result.current.run({
          source: "class Main {}",
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
          chunk: "boom\n",
        });
      });

      await waitFor(() => {
        expect(result.current.snapshot.stderr).toEqual(["boom\n"]);
      });

      act(() => {
        result.current.reset();
      });

      expect(worker.terminated).toBe(true);
      expect(result.current.snapshot.phase).toBe("idle");
      expect(result.current.snapshot.stdout).toEqual([]);
      expect(result.current.snapshot.stderr).toEqual([]);
      expect(result.current.snapshot.issues).toEqual([]);
      expect(result.current.snapshot.artifacts).toBeNull();
    });
  });
});
