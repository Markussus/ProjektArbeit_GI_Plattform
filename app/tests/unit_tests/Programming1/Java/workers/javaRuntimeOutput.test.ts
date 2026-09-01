import { describe, expect, it, vi } from "vitest";
import {
  createBufferedWorkerOutput,
  installTeaVmConsole,
} from "@/pages/Programming1/Java/components/Simulator/workers/javaRuntimeOutput";

function createScheduler() {
  let scheduledCallback: (() => void) | undefined;
  return {
    scheduler: {
      setTimeout: vi.fn((callback: () => void) => {
        scheduledCallback = callback;
        return 17;
      }),
      clearTimeout: vi.fn(),
    },
    runScheduledCallback: () => scheduledCallback?.(),
  };
}

describe("javaRuntimeOutput", () => {
  it("buffers characters and posts one stream message when flushed", () => {
    const postMessage = vi.fn();
    const { scheduler, runScheduledCallback } = createScheduler();
    const output = createBufferedWorkerOutput({
      stream: "stdout",
      requestId: "request-1",
      postMessage,
      scheduler,
    });

    output.writeCharacter(65);
    output.writeCharacter(66);
    runScheduledCallback();

    expect(output.getOutput()).toBe("AB");
    expect(scheduler.setTimeout).toHaveBeenCalledTimes(1);
    expect(postMessage).toHaveBeenCalledWith({
      type: "stdout",
      requestId: "request-1",
      data: "AB",
    });
  });

  it("clears the pending timeout and flushes on dispose", () => {
    const postMessage = vi.fn();
    const { scheduler } = createScheduler();
    const output = createBufferedWorkerOutput({
      stream: "stderr",
      requestId: "request-2",
      postMessage,
      scheduler,
    });

    output.writeCharacter(69);
    output.dispose();

    expect(scheduler.clearTimeout).toHaveBeenCalledWith(17);
    expect(postMessage).toHaveBeenCalledWith({
      type: "stderr",
      requestId: "request-2",
      data: "E",
    });
  });

  it("does not post a message when an empty buffer is flushed", () => {
    const postMessage = vi.fn();
    const { scheduler } = createScheduler();
    const output = createBufferedWorkerOutput({
      stream: "stdout",
      requestId: "request-empty",
      postMessage,
      scheduler,
    });

    output.flush();

    expect(postMessage).not.toHaveBeenCalled();
  });

  it("installs stdout and stderr writers in the TeaVM imports", () => {
    const imports: Record<string, Record<string, unknown>> = {};
    const stdout = {
      writeCharacter: vi.fn(),
      flush: vi.fn(),
      dispose: vi.fn(),
      getOutput: vi.fn(() => ""),
    };
    const stderr = {
      writeCharacter: vi.fn(),
      flush: vi.fn(),
      dispose: vi.fn(),
      getOutput: vi.fn(() => ""),
    };

    installTeaVmConsole(imports, stdout, stderr);
    const teavmConsole = imports.teavmConsole as {
      putcharStdout: (charCode: number) => void;
      putcharStderr: (charCode: number) => void;
    };
    teavmConsole.putcharStdout(65);
    teavmConsole.putcharStderr(66);

    expect(stdout.writeCharacter).toHaveBeenCalledWith(65);
    expect(stderr.writeCharacter).toHaveBeenCalledWith(66);
  });
});
