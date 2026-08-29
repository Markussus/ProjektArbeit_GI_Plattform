import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

interface DiagnosticMessage {
  message: string;
}

interface WorkerMessagePayload {
  type?: string;
  requestId?: string;
  errorCategory?: string;
  diagnostics?: DiagnosticMessage[];
  [key: string]: unknown;
}

interface UpstreamWorkerMessage {
  command?: string;
  id?: string;
  severity?: string;
  message?: string;
  status?: string;
  [key: string]: unknown;
}

describe("javaRunner.worker", () => {
  let postedMessages: WorkerMessagePayload[] = [];
  const terminateSpy = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    postedMessages = [];
    terminateSpy.mockReset();

    // Mock Worker environment
    (globalThis as unknown as { self: unknown }).self = globalThis;
    (globalThis as unknown as { location: { origin: string } }).location = {
      origin: "http://localhost:3000",
    };
    (
      globalThis as unknown as {
        postMessage: (msg: WorkerMessagePayload) => void;
      }
    ).postMessage = vi.fn((msg: WorkerMessagePayload) => {
      postedMessages.push(msg);
    });

    class MockWorker {
      onmessage: ((event: { data: UpstreamWorkerMessage }) => void) | null =
        null;
      onerror: ((event: unknown) => void) | null = null;
      postMessage = vi.fn((data: UpstreamWorkerMessage) => {
        if (data.command === "load-classlib") {
          setTimeout(() => {
            this.onmessage?.({ data: { command: "ok", id: data.id } });
          }, 10);
        }
      });
      terminate = terminateSpy;
      constructor() {
        setTimeout(() => {
          this.onmessage?.({ data: { command: "initialized" } });
        }, 5);
      }
    }

    (globalThis as unknown as { Worker: typeof MockWorker }).Worker =
      MockWorker;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("handles preload-compiler request successfully", async () => {
    await import("@/pages/Programming1/Java/components/Simulator/workers/javaRunner.worker");

    const onMessage = (
      globalThis as unknown as {
        onmessage?: (e: { data: Record<string, unknown> }) => Promise<void>;
      }
    ).onmessage;
    expect(onMessage).toBeDefined();

    await onMessage?.({
      data: {
        type: "preload-compiler",
        requestId: "req-1",
      },
    });

    expect(postedMessages).toContainEqual({
      type: "compiler-loading",
      requestId: "req-1",
    });
    expect(postedMessages).toContainEqual({
      type: "compiler-ready",
      requestId: "req-1",
    });
  });

  it("handles stop request and terminates upstream worker", async () => {
    await import("@/pages/Programming1/Java/components/Simulator/workers/javaRunner.worker");

    const onMessage = (
      globalThis as unknown as {
        onmessage?: (e: { data: Record<string, unknown> }) => Promise<void>;
      }
    ).onmessage;

    await onMessage?.({
      data: {
        type: "preload-compiler",
        requestId: "req-2",
      },
    });

    await onMessage?.({
      data: {
        type: "stop",
      },
    });

    expect(terminateSpy).toHaveBeenCalled();
  });

  it("handles compiler diagnostic and compilation errors gracefully", async () => {
    // Custom error worker for compile step
    class ErrorWorker {
      onmessage: ((event: { data: UpstreamWorkerMessage }) => void) | null =
        null;
      onerror: ((event: unknown) => void) | null = null;
      postMessage = vi.fn((data: UpstreamWorkerMessage) => {
        if (data.command === "load-classlib") {
          setTimeout(() => {
            this.onmessage?.({ data: { command: "ok", id: data.id } });
          }, 10);
        }
        if (data.command === "compile") {
          setTimeout(() => {
            this.onmessage?.({
              data: {
                command: "compiler-diagnostic",
                id: data.id,
                severity: "error",
                message: "Syntax error: ';' expected",
              },
            });
            this.onmessage?.({
              data: {
                command: "compilation-complete",
                id: data.id,
                status: "errors",
              },
            });
          }, 10);
        }
      });
      terminate = vi.fn();
      constructor() {
        setTimeout(() => {
          this.onmessage?.({ data: { command: "initialized" } });
        }, 5);
      }
    }
    (globalThis as unknown as { Worker: typeof ErrorWorker }).Worker =
      ErrorWorker;

    await import("@/pages/Programming1/Java/components/Simulator/workers/javaRunner.worker");

    const onMessage = (
      globalThis as unknown as {
        onmessage?: (e: { data: Record<string, unknown> }) => Promise<void>;
      }
    ).onmessage;

    await onMessage?.({
      data: {
        type: "compile-and-run",
        requestId: "req-3",
        sourceCode: "invalid code",
      },
    });

    const errorMsg = postedMessages.find(
      (msg) => msg.type === "error" && msg.requestId === "req-3",
    );
    expect(errorMsg).toBeDefined();
    expect(errorMsg?.errorCategory).toBe("javac");
    expect(errorMsg?.diagnostics).toHaveLength(1);
    expect(errorMsg?.diagnostics?.[0]?.message).toBe(
      "Syntax error: ';' expected",
    );
  });
});
