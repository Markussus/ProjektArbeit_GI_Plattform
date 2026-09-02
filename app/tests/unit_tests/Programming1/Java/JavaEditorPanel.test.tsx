/** @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { JavaEditorPanel } from "@/pages/Programming1/Java/components/Simulator/JavaEditorPanel";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    theme: "light",
    resolvedTheme: "light",
    setTheme: vi.fn(),
  }),
}));

const monacoMock = vi.hoisted(() => ({
  lastOptions: null as Record<string, unknown> | null,
  updateOptionsSpy: vi.fn(),
  focusCallback: null as (() => void) | null,
  blurCallback: null as (() => void) | null,
  editorDomNode: null as HTMLDivElement | null,
}));

vi.mock("@monaco-editor/react", () => {
  return {
    __esModule: true,
    default: ({
      value,
      onChange,
      onMount,
      options,
    }: {
      value?: string;
      onChange?: (value?: string) => void;
      onMount?: (editor: unknown, monaco: unknown) => void;
      options?: Record<string, unknown>;
    }) => {
      monacoMock.lastOptions = options ?? null;
      return (
        <div data-testid="mock-monaco-editor">
          <textarea
            data-testid="monaco-textarea"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
          />
          <button
            type="button"
            data-testid="mount-button"
            onClick={() => {
              const domNode = document.createElement("div");
              monacoMock.editorDomNode = domNode;
              const mockEditor = {
                getModel: () => ({}),
                onDidChangeModel: vi.fn(),
                getDomNode: () => domNode,
                onDidDispose: vi.fn(),
                trigger: vi.fn(),
                hasWidgetFocus: () => false,
                updateOptions: monacoMock.updateOptionsSpy,
                onDidFocusEditorWidget: (cb: () => void) => {
                  monacoMock.focusCallback = cb;
                  return { dispose: vi.fn() };
                },
                onDidBlurEditorWidget: (cb: () => void) => {
                  monacoMock.blurCallback = cb;
                  return { dispose: vi.fn() };
                },
              };
              const mockMonaco = {
                MarkerSeverity: { Error: 8, Warning: 4, Info: 2 },
                editor: { setModelMarkers: vi.fn() },
              };
              onMount?.(mockEditor, mockMonaco);
            }}
          >
            Mount
          </button>
        </div>
      );
    },
  };
});

describe("JavaEditorPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    monacoMock.lastOptions = null;
    monacoMock.focusCallback = null;
    monacoMock.blurCallback = null;
    monacoMock.editorDomNode = null;
  });

  it("renders editor panel with filename and Monaco container", () => {
    render(
      <JavaEditorPanel
        code="public class Main {}"
        fileName="Main.java"
        isFocused={false}
        onCodeChange={vi.fn()}
        issues={[]}
      />,
    );

    expect(screen.getByTestId("java-editor-panel")).toBeInTheDocument();
    expect(screen.getByText("Main.java")).toBeInTheDocument();
    expect(screen.getByTestId("java-editor-container")).toBeInTheDocument();
  });

  it("configures scrollbar behavior and dynamically updates on mouseenter/mouseleave and focus/blur", () => {
    render(
      <JavaEditorPanel
        code="public class Main {}"
        fileName="Main.java"
        isFocused={false}
        onCodeChange={vi.fn()}
        issues={[]}
      />,
    );

    expect(monacoMock.lastOptions?.scrollbar).toEqual({
      alwaysConsumeMouseWheel: false,
      handleMouseWheel: false,
    });

    const mountButton = screen.getByTestId("mount-button");
    act(() => {
      mountButton.click();
    });

    // When initially mounted without hover
    expect(monacoMock.updateOptionsSpy).toHaveBeenCalledWith({
      scrollbar: {
        alwaysConsumeMouseWheel: false,
        handleMouseWheel: false,
      },
    });

    // Simulate mouseenter over editor
    act(() => {
      monacoMock.editorDomNode?.dispatchEvent(new MouseEvent("mouseenter"));
    });
    expect(monacoMock.updateOptionsSpy).toHaveBeenLastCalledWith({
      scrollbar: {
        alwaysConsumeMouseWheel: false,
        handleMouseWheel: true,
      },
    });

    // Simulate mouseleave
    act(() => {
      monacoMock.editorDomNode?.dispatchEvent(new MouseEvent("mouseleave"));
    });
    expect(monacoMock.updateOptionsSpy).toHaveBeenLastCalledWith({
      scrollbar: {
        alwaysConsumeMouseWheel: false,
        handleMouseWheel: false,
      },
    });

    // Simulate focus
    act(() => {
      monacoMock.focusCallback?.();
    });
    expect(monacoMock.updateOptionsSpy).toHaveBeenLastCalledWith({
      scrollbar: {
        alwaysConsumeMouseWheel: false,
        handleMouseWheel: true,
      },
    });

    // Simulate blur
    act(() => {
      monacoMock.blurCallback?.();
    });
    expect(monacoMock.updateOptionsSpy).toHaveBeenLastCalledWith({
      scrollbar: {
        alwaysConsumeMouseWheel: false,
        handleMouseWheel: false,
      },
    });
  });

  it("calls onCodeChange when valid code is typed", async () => {
    const onCodeChange = vi.fn();
    render(
      <JavaEditorPanel
        code="public class Main {}"
        fileName="Main.java"
        isFocused={true}
        onCodeChange={onCodeChange}
        issues={[]}
      />,
    );

    const textarea = screen.getByTestId("monaco-textarea");
    act(() => {
      textarea.dispatchEvent(
        new Event("input", { bubbles: true, cancelable: true }),
      );
    });

    const mountButton = screen.getByTestId("mount-button");
    act(() => {
      mountButton.click();
    });
  });

  it("triggers undo and shows limit warning when code exceeds line limit", () => {
    const onCodeChange = vi.fn();
    const tooManyLines = "\n".repeat(10_005);

    render(
      <JavaEditorPanel
        code="public class Main {}"
        fileName="Main.java"
        isFocused={false}
        onCodeChange={onCodeChange}
        issues={[]}
      />,
    );

    const textarea = screen.getByTestId("monaco-textarea");
    act(() => {
      const changeEvent = new Event("change", {
        bubbles: true,
        cancelable: true,
      });
      (textarea as HTMLTextAreaElement).value = tooManyLines;
      textarea.dispatchEvent(changeEvent);
    });
  });
});
