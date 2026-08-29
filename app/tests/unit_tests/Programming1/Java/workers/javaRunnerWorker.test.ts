import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("javaRunner.worker", () => {
  let postedMessages: any[] = [];
  let workerInstance: any = null;

  beforeEach(() => {
    vi.resetModules();
    postedMessages = [];

    // Mock Worker environment
    (globalThis as any).self = globalThis;
    (globalThis as any).location = { origin: "http://localhost:3000" };
    (globalThis as any).postMessage = vi.fn((msg: any) => {
      postedMessages.push(msg);
    });

    class MockWorker {
      onmessage: ((event: any) => void) | null = null;
      onerror: ((event: any) => void) | null = null;
      postMessage = vi.fn((data: any) => {
        if (data.command === "load-classlib") {
          setTimeout(() => {
            this.onmessage?.({ data: { command: "ok", id: data.id } });
          }, 10);
        }
      });
      terminate = vi.fn();
      constructor() {
        workerInstance = this;
        setTimeout(() => {
          this.onmessage?.({ data: { command: "initialized" } });
        }, 5);
      }
    }

    (globalThis as any).Worker = MockWorker;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("handles preload-compiler request successfully", async () => {
    await import("@/pages/Programming1/Java/components/Simulator/workers/javaRunner.worker");

    const onMessage = (globalThis as any).onmessage;
    expect(onMessage).toBeDefined();

    await onMessage({
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

    const onMessage = (globalThis as any).onmessage;

    await onMessage({
      data: {
        type: "preload-compiler",
        requestId: "req-2",
      },
    });

    expect(workerInstance).toBeDefined();

    await onMessage({
      data: {
        type: "stop",
      },
    });

    expect(workerInstance.terminate).toHaveBeenCalled();
  });

  it("handles compiler diagnostic and compilation errors gracefully", async () => {
    // Custom error worker for compile step
    class ErrorWorker {
      onmessage: ((event: any) => void) | null = null;
      onerror: ((event: any) => void) | null = null;
      postMessage = vi.fn((data: any) => {
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
    (globalThis as any).Worker = ErrorWorker;

    await import("@/pages/Programming1/Java/components/Simulator/workers/javaRunner.worker");

    const onMessage = (globalThis as any).onmessage;

    await onMessage({
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
    expect(errorMsg.errorCategory).toBe("javac");
    expect(errorMsg.diagnostics).toHaveLength(1);
    expect(errorMsg.diagnostics[0].message).toBe("Syntax error: ';' expected");
  });
});
