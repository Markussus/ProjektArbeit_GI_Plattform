/** @vitest-environment jsdom */

import React, { createRef } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { TerminalSquare } from "lucide-react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  JavaSimulator,
  type JavaSimulatorHandle,
} from "../../../../src/pages/Programming1/Java/components/Simulator/JavaSimulator";
import type { JavaValidationRunResult } from "../../../../src/pages/Programming1/Java/components/Simulator/domain/javaValidationRunner";
import type { Exercise } from "../../../../src/types/exercise";

const runSpy = vi.fn();
const runAsyncSpy = vi.fn();
const stopSpy = vi.fn();
const resetSpy = vi.fn();
const preloadSpy = vi.fn();

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: string | { version?: string }) => {
      if (typeof options === "string") {
        return options;
      }

      if (
        key === "java-programming.commandOverview.summary" &&
        options?.version
      ) {
        return `Java ${options.version}`;
      }

      return key;
    },
  }),
}));

vi.mock(
  "../../../../src/pages/Programming1/Java/components/Simulator/application/javaExecutionContextValue",
  () => ({
    useJavaExecutionContext: () => ({
      snapshot: {
        compilerStatus: "ready",
        phase: "idle",
        stdout: [],
        stderr: [],
        issues: [],
        artifacts: null,
        startedAt: null,
        finishedAt: null,
        lastErrorCategory: null,
      },
      preload: preloadSpy,
      run: runSpy,
      runAsync: runAsyncSpy,
      stop: stopSpy,
      reset: resetSpy,
    }),
  }),
);

vi.mock(
  "../../../../src/pages/Programming1/Java/components/Simulator/JavaEditorPanel",
  () => ({
    JavaEditorPanel: ({
      code,
      fileName,
      onCodeChange,
    }: {
      code: string;
      fileName: string;
      onCodeChange: (nextCode: string) => void;
    }) => (
      <div data-testid="mock-java-editor-panel">
        <div data-testid="mock-java-editor-code">{code}</div>
        <div data-testid="mock-java-editor-file">{fileName}</div>
        <button
          data-testid="mock-java-change-code"
          onClick={() => onCodeChange("changed code")}
        >
          change code
        </button>
      </div>
    ),
  }),
);

vi.mock("@/components/shared/ExecutionControls", () => ({
  ExecutionControls: ({
    phase,
    onRun,
    onStop,
  }: {
    phase: string;
    onRun: () => void;
    onStop: () => void;
  }) => (
    <div data-testid="mock-execution-controls">
      <div data-testid="mock-execution-phase">{phase}</div>
      <button data-testid="mock-java-run-code" onClick={onRun}>
        run code
      </button>
      <button data-testid="mock-java-stop-code" onClick={onStop}>
        stop code
      </button>
    </div>
  ),
}));

vi.mock(
  "../../../../src/pages/Programming1/Java/components/Simulator/JavaConsolePanel",
  () => ({
    JavaConsolePanel: () => <div data-testid="mock-java-console-panel" />,
  }),
);

function createExercise(
  id: string,
  title: string,
  description: string,
): Exercise {
  return {
    id,
    title,
    description,
    difficulty: "easy",
    icon: TerminalSquare,
  };
}

async function renderJavaSimulator(ui: React.ReactElement) {
  let result: ReturnType<typeof render>;
  await act(async () => {
    result = render(ui);
  });
  return result!;
}

describe("JavaSimulator", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    runSpy.mockReset();
    runAsyncSpy.mockReset();
    stopSpy.mockReset();
    resetSpy.mockReset();
    preloadSpy.mockReset();
  });

  describe("when no exercise is selected yet", () => {
    it("starts with the default Java starter code and empty stdin", async () => {
      await renderJavaSimulator(
        <JavaSimulator selectedExercise={null} isFocused={false} />,
      );

      expect(screen.getByTestId("mock-java-editor-code").textContent).toContain(
        'System.out.println("Start coding in Java!");',
      );
      expect(screen.getByTestId("mock-java-editor-file").textContent).toBe(
        "Main.java",
      );
      expect(screen.getByTestId("java-stdin-input")).toHaveValue("");
    });
  });

  describe("when a specific exercise is opened in simulation", () => {
    it("boots the editor with that exercise starter code", async () => {
      await renderJavaSimulator(
        <JavaSimulator
          selectedExercise={createExercise(
            "java-programming.exercise4",
            "Array sortieren",
            "Sort an array",
          )}
          isFocused={false}
        />,
      );

      expect(screen.getByTestId("mock-java-editor-code").textContent).toContain(
        "import java.util.Arrays;",
      );
      expect(screen.getByTestId("mock-java-editor-code").textContent).toContain(
        "// TODO: sort the array in ascending order",
      );
    });

    it("prefills standard input if the exercise specifies a defaultStdin", async () => {
      await renderJavaSimulator(
        <JavaSimulator
          selectedExercise={createExercise(
            "java-programming.exercise6",
            "Text aus Eingabe großschreiben",
            "Uppercase input",
          )}
          isFocused={false}
        />,
      );

      expect(screen.getByTestId("java-stdin-input")).toHaveValue(
        "hello java\n",
      );
    });
  });

  describe("when the user changes code before execution", () => {
    it("runs the latest changed editor content", async () => {
      await renderJavaSimulator(
        <JavaSimulator selectedExercise={null} isFocused={false} />,
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId("mock-java-change-code"));
      });
      await act(async () => {
        fireEvent.click(screen.getByTestId("mock-java-run-code"));
      });

      expect(runSpy).toHaveBeenCalledWith({
        source: "changed code",
        exerciseId: undefined,
        timeoutMs: 60000,
        stdin: "",
      });
    });

    it("passes standard input to the Java execution flow", async () => {
      await renderJavaSimulator(
        <JavaSimulator selectedExercise={null} isFocused={false} />,
      );

      await act(async () => {
        fireEvent.change(screen.getByTestId("java-stdin-input"), {
          target: { value: "hello java\n" },
        });
      });
      await act(async () => {
        fireEvent.click(screen.getByTestId("mock-java-run-code"));
      });

      expect(runSpy).toHaveBeenCalledWith({
        source: expect.any(String),
        exerciseId: undefined,
        timeoutMs: 60000,
        stdin: "hello java\n",
      });
    });

    it("stops execution without forwarding the React click event", async () => {
      await renderJavaSimulator(
        <JavaSimulator selectedExercise={null} isFocused={false} />,
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId("mock-java-stop-code"));
      });

      expect(stopSpy).toHaveBeenCalledOnce();
      expect(stopSpy).toHaveBeenCalledWith();
    });
  });

  describe("when configuring execution timeout", () => {
    it("clamps values within the allowed 1-300 seconds range", async () => {
      await renderJavaSimulator(
        <JavaSimulator selectedExercise={null} isFocused={false} />,
      );

      const timeoutInput = screen.getByTestId("java-timeout-input");

      // Too low (< 1) -> clamps to 1
      await act(async () => {
        fireEvent.change(timeoutInput, { target: { value: "0" } });
      });
      expect(timeoutInput).toHaveValue(1);

      // Too high (> 300) -> clamps to 300
      await act(async () => {
        fireEvent.change(timeoutInput, { target: { value: "999" } });
      });
      expect(timeoutInput).toHaveValue(300);

      // Normal valid value
      await act(async () => {
        fireEvent.change(timeoutInput, { target: { value: "45" } });
      });
      expect(timeoutInput).toHaveValue(45);

      // Invalid non-numeric input does not mutate existing value
      await act(async () => {
        fireEvent.change(timeoutInput, { target: { value: "not-a-number" } });
      });
      expect(timeoutInput).toHaveValue(45);
    });
  });

  describe("when the simulator initializes", () => {
    it("starts compiler preload in the background and exposes the timeout control", async () => {
      await renderJavaSimulator(
        <JavaSimulator selectedExercise={null} isFocused={false} />,
      );

      expect(preloadSpy).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("java-timeout-input")).toHaveValue(60);
      expect(screen.getByTestId("java-compiler-status")).toBeInTheDocument();
      expect(
        screen.getByTestId("java-command-overview-button"),
      ).toBeInTheDocument();
    });

    it("opens the Java command overview with version and command information", async () => {
      await renderJavaSimulator(
        <JavaSimulator selectedExercise={null} isFocused={false} />,
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId("java-command-overview-button"));
      });

      expect(
        screen.getByTestId("java-command-overview-dialog"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("java-command-overview-dialog"),
      ).toHaveTextContent(/JDK 25/);
      expect(
        screen.getByTestId("java-command-overview-dialog"),
      ).toHaveTextContent("ArrayList");
      expect(
        screen.getByTestId("java-command-overview-dialog"),
      ).toHaveTextContent("javac");
    });
  });

  describe("imperative handle methods", () => {
    it("loads solution code when loadSolution is invoked on an exercise", async () => {
      const ref = createRef<JavaSimulatorHandle>();
      await renderJavaSimulator(
        <JavaSimulator
          ref={ref}
          selectedExercise={createExercise(
            "java-programming.exercise1",
            "Hello World",
            "Desc",
          )}
          isFocused={false}
        />,
      );

      await act(async () => {
        ref.current?.loadSolution();
      });

      expect(screen.getByTestId("mock-java-editor-code").textContent).toContain(
        'System.out.println("Hello World");',
      );
    });

    it("safely ignores loadSolution when the active item is an example", async () => {
      const ref = createRef<JavaSimulatorHandle>();
      await renderJavaSimulator(
        <JavaSimulator
          ref={ref}
          selectedItem={{
            id: "java-programming.example1",
            title: "Example 1",
            category: "syntax",
          }}
          selectedExercise={null}
          isFocused={false}
        />,
      );

      const initialCode = screen.getByTestId(
        "mock-java-editor-code",
      ).textContent;

      await act(async () => {
        ref.current?.loadSolution();
      });

      expect(screen.getByTestId("mock-java-editor-code").textContent).toBe(
        initialCode,
      );
    });

    it("resets state when resetStoredState is invoked", async () => {
      const ref = createRef<JavaSimulatorHandle>();
      await renderJavaSimulator(
        <JavaSimulator
          ref={ref}
          selectedExercise={createExercise(
            "java-programming.exercise6",
            "Text aus Eingabe",
            "Desc",
          )}
          isFocused={false}
        />,
      );

      // change code and stdin
      await act(async () => {
        fireEvent.click(screen.getByTestId("mock-java-change-code"));
      });
      await act(async () => {
        fireEvent.change(screen.getByTestId("java-stdin-input"), {
          target: { value: "different input\n" },
        });
      });
      expect(screen.getByTestId("mock-java-editor-code").textContent).toBe(
        "changed code",
      );
      expect(screen.getByTestId("java-stdin-input")).toHaveValue(
        "different input\n",
      );

      await act(async () => {
        ref.current?.resetStoredState();
      });

      expect(screen.getByTestId("mock-java-editor-code").textContent).toContain(
        "// TODO: print the text in uppercase",
      );
      expect(screen.getByTestId("java-stdin-input")).toHaveValue(
        "hello java\n",
      );
    });

    it("runs validation through checkSolution", async () => {
      runAsyncSpy.mockResolvedValueOnce({
        phase: "done",
        stdout: ["Hello World\n"],
        stderr: [],
        compilerStatus: "ready",
        issues: [],
        artifacts: null,
      });

      const ref = createRef<JavaSimulatorHandle>();
      await renderJavaSimulator(
        <JavaSimulator
          ref={ref}
          selectedExercise={createExercise(
            "java-programming.exercise1",
            "Hello World",
            "Desc",
          )}
          isFocused={false}
        />,
      );

      let result: JavaValidationRunResult | undefined;
      await act(async () => {
        result = await ref.current?.checkSolution();
      });

      expect(result?.rows).toHaveLength(1);
      expect(result?.rows[0]?.passed).toBe(true);
    });
  });
});
