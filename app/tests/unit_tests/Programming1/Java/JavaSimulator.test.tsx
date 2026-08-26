/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { TerminalSquare } from "lucide-react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JavaSimulator } from "../../../../src/pages/Programming1/Java/components/Simulator/JavaSimulator";
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

      if (key === "java.commandOverview.summary" && options?.version) {
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
      onImportCode,
    }: {
      code: string;
      fileName: string;
      onCodeChange: (nextCode: string) => void;
      onImportCode: (nextCode: string) => void;
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
        <button
          data-testid="mock-java-import-code"
          onClick={() => onImportCode("imported code")}
        >
          import code
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
    it("starts with the default Java starter code", () => {
      render(<JavaSimulator selectedExercise={null} isFocused={false} />);

      expect(screen.getByTestId("mock-java-editor-code").textContent).toContain(
        'System.out.println("Start coding in Java!");',
      );
      expect(screen.getByTestId("mock-java-editor-file").textContent).toBe(
        "Main.java",
      );
    });
  });

  describe("when a specific exercise is opened in simulation", () => {
    it("boots the editor with that exercise starter code", () => {
      render(
        <JavaSimulator
          selectedExercise={createExercise(
            "java.exercise4",
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
  });

  describe("when the user changes or imports code before execution", () => {
    it("runs the latest changed editor content", () => {
      render(<JavaSimulator selectedExercise={null} isFocused={false} />);

      fireEvent.click(screen.getByTestId("mock-java-change-code"));
      fireEvent.click(screen.getByTestId("mock-java-run-code"));

      expect(runSpy).toHaveBeenCalledWith({
        source: "changed code",
        exerciseId: undefined,
        timeoutMs: 60000,
        stdin: "",
      });
    });

    it("passes standard input to the Java execution flow", () => {
      render(<JavaSimulator selectedExercise={null} isFocused={false} />);

      fireEvent.change(screen.getByTestId("java-stdin-input"), {
        target: { value: "hello java\n" },
      });
      fireEvent.click(screen.getByTestId("mock-java-run-code"));

      expect(runSpy).toHaveBeenCalledWith({
        source: expect.any(String),
        exerciseId: undefined,
        timeoutMs: 60000,
        stdin: "hello java\n",
      });
    });

    it("replaces the editor content on import and resets execution state", () => {
      render(<JavaSimulator selectedExercise={null} isFocused={false} />);

      fireEvent.click(screen.getByTestId("mock-java-import-code"));

      expect(screen.getByTestId("mock-java-editor-code").textContent).toBe(
        "imported code",
      );
      expect(resetSpy).toHaveBeenCalledTimes(1);
    });

    it("stops execution without forwarding the React click event", () => {
      render(<JavaSimulator selectedExercise={null} isFocused={false} />);

      fireEvent.click(screen.getByTestId("mock-java-stop-code"));

      expect(stopSpy).toHaveBeenCalledOnce();
      expect(stopSpy).toHaveBeenCalledWith();
    });
  });

  describe("when the simulator initializes", () => {
    it("starts compiler preload in the background and exposes the timeout control", () => {
      render(<JavaSimulator selectedExercise={null} isFocused={false} />);

      expect(preloadSpy).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("java-timeout-input")).toHaveValue(60);
      expect(
        screen.getByTestId("java-command-overview-button"),
      ).toBeInTheDocument();
    });

    it("opens the Java command overview with version and command information", () => {
      render(<JavaSimulator selectedExercise={null} isFocused={false} />);

      fireEvent.click(screen.getByTestId("java-command-overview-button"));

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
});
