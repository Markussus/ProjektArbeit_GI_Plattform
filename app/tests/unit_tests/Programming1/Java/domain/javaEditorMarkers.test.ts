import { describe, expect, it, vi } from "vitest";
import type { Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import {
  createMonacoMarkers,
  createPasteLimitListener,
  syncMonacoMarkers,
} from "@/pages/Programming1/Java/components/Simulator/domain/javaEditorMarkers";
import type { JavaExecutionIssue } from "@/pages/Programming1/Java/components/Simulator/domain/javaExecution";

describe("javaEditorMarkers", () => {
  const mockMonaco = {
    MarkerSeverity: {
      Error: 8,
      Warning: 4,
      Info: 2,
    },
    editor: {
      setModelMarkers: vi.fn(),
    },
  } as unknown as Monaco;

  describe("createMonacoMarkers", () => {
    it("maps issues with line numbers to Monaco markers", () => {
      const issues: JavaExecutionIssue[] = [
        {
          code: "javac_1",
          stage: "javac",
          severity: "error",
          message: "Error message",
          line: 5,
          column: 10,
        },
        {
          code: "javac_2",
          stage: "javac",
          severity: "warning",
          message: "Warning message",
          line: 8,
          column: 2,
        },
        {
          code: "javac_3",
          stage: "javac",
          severity: "info",
          message: "Info message",
          line: 1,
        },
        {
          code: "javac_4",
          stage: "javac",
          severity: "error",
          message: "No line number",
        },
      ];

      const markers = createMonacoMarkers(issues, mockMonaco);
      expect(markers).toHaveLength(3);

      expect(markers[0]).toEqual({
        startLineNumber: 5,
        startColumn: 10,
        endLineNumber: 5,
        endColumn: 11,
        message: "Error message",
        severity: 8,
      });

      expect(markers[1]?.severity).toBe(4);
      expect(markers[2]?.severity).toBe(2);
    });
  });

  describe("syncMonacoMarkers", () => {
    it("calls setModelMarkers when model and monaco exist", () => {
      const mockModel = {} as editor.ITextModel;
      const mockEditor = {
        getModel: () => mockModel,
        getDomNode: () => null,
        trigger: vi.fn(),
      } as unknown as editor.IStandaloneCodeEditor;

      syncMonacoMarkers(mockEditor, mockMonaco, [
        {
          code: "c1",
          stage: "javac",
          severity: "error",
          message: "Error",
          line: 2,
          column: 1,
        },
      ]);

      expect(mockMonaco.editor.setModelMarkers).toHaveBeenCalledWith(
        mockModel,
        "java",
        expect.any(Array),
      );
    });

    it("does not trigger commands when issues are empty and no marker widget is open", () => {
      const mockModel = {} as editor.ITextModel;
      const mockDom = {
        querySelector: vi.fn(() => null),
        contains: vi.fn(() => false),
      } as unknown as HTMLElement;

      const mockEditor = {
        getModel: () => mockModel,
        getDomNode: () => mockDom,
        trigger: vi.fn(),
      } as unknown as editor.IStandaloneCodeEditor;

      syncMonacoMarkers(mockEditor, mockMonaco, []);

      expect(mockMonaco.editor.setModelMarkers).toHaveBeenCalledWith(
        mockModel,
        "java",
        [],
      );
      expect(mockEditor.trigger).not.toHaveBeenCalled();
    });

    it("clicks close button when marker widget is open with close button", () => {
      const mockModel = {} as editor.ITextModel;
      const closeBtn = { click: vi.fn() } as unknown as HTMLElement;
      const markerWidget = {
        querySelector: vi.fn(() => closeBtn),
      } as unknown as HTMLElement;

      const mockDom = {
        querySelector: vi.fn((sel: string) =>
          sel.includes("marker-widget") ? markerWidget : null,
        ),
        contains: vi.fn(() => false),
      } as unknown as HTMLElement;

      const mockEditor = {
        getModel: () => mockModel,
        getDomNode: () => mockDom,
        trigger: vi.fn(),
      } as unknown as editor.IStandaloneCodeEditor;

      syncMonacoMarkers(mockEditor, mockMonaco, []);

      expect(closeBtn.click).toHaveBeenCalled();
      expect(mockEditor.trigger).not.toHaveBeenCalled();
    });

    it("triggers closeMarkersNavigation on editor when marker widget is open without button", () => {
      const mockModel = {} as editor.ITextModel;
      const markerWidget = {
        querySelector: vi.fn(() => null),
      } as unknown as HTMLElement;

      const mockDom = {
        querySelector: vi.fn((sel: string) =>
          sel.includes("marker-widget") ? markerWidget : null,
        ),
        contains: vi.fn(() => false),
      } as unknown as HTMLElement;

      const mockEditor = {
        getModel: () => mockModel,
        getDomNode: () => mockDom,
        trigger: vi.fn(),
      } as unknown as editor.IStandaloneCodeEditor;

      syncMonacoMarkers(mockEditor, mockMonaco, []);

      expect(mockEditor.trigger).toHaveBeenCalledWith(
        "java-markers",
        "closeMarkersNavigation",
        null,
      );
    });

    it("tolerates unavailable Monaco close commands", () => {
      const mockModel = {} as editor.ITextModel;
      const markerWidget = {
        querySelector: vi.fn(() => null),
      } as unknown as HTMLElement;
      const mockDom = {
        querySelector: vi.fn(() => markerWidget),
        contains: vi.fn(() => false),
      } as unknown as HTMLElement;
      const mockEditor = {
        getModel: () => mockModel,
        getDomNode: () => mockDom,
        trigger: vi.fn(() => {
          throw new Error("Command unavailable");
        }),
      } as unknown as editor.IStandaloneCodeEditor;

      expect(() => syncMonacoMarkers(mockEditor, mockMonaco, [])).not.toThrow();
    });

    it("does nothing when editor or monaco is null", () => {
      expect(() => syncMonacoMarkers(null, mockMonaco, [])).not.toThrow();
      expect(() =>
        syncMonacoMarkers(
          { getModel: () => null } as unknown as editor.IStandaloneCodeEditor,
          null,
          [],
        ),
      ).not.toThrow();
    });
  });

  describe("createPasteLimitListener", () => {
    it("prevents paste event and calls onLimitExceeded when text exceeds lines", () => {
      const onLimitExceeded = vi.fn();
      const mockModel = {
        getValueLength: () => 100,
        getLineCount: () => 500,
        getValueLengthInRange: () => 0,
      };
      const mockEditor = {
        getModel: () => mockModel,
        getSelection: () => ({ startLineNumber: 1, endLineNumber: 1 }),
      } as unknown as editor.IStandaloneCodeEditor;

      const listener = createPasteLimitListener(mockEditor, onLimitExceeded);

      const preventDefault = vi.fn();
      const stopPropagation = vi.fn();
      const event = {
        clipboardData: {
          getData: () => "\n".repeat(10_005),
        },
        preventDefault,
        stopPropagation,
      } as unknown as ClipboardEvent;

      listener(event);

      expect(preventDefault).toHaveBeenCalled();
      expect(stopPropagation).toHaveBeenCalled();
      expect(onLimitExceeded).toHaveBeenCalledWith("lines");
    });

    it("allows paste event when within limits", () => {
      const onLimitExceeded = vi.fn();
      const mockModel = {
        getValueLength: () => 10,
        getLineCount: () => 2,
        getValueLengthInRange: () => 0,
      };
      const mockEditor = {
        getModel: () => mockModel,
        getSelection: () => ({ startLineNumber: 1, endLineNumber: 1 }),
      } as unknown as editor.IStandaloneCodeEditor;

      const listener = createPasteLimitListener(mockEditor, onLimitExceeded);

      const preventDefault = vi.fn();
      const event = {
        clipboardData: {
          getData: () => "int x = 5;",
        },
        preventDefault,
        stopPropagation: vi.fn(),
      } as unknown as ClipboardEvent;

      listener(event);

      expect(preventDefault).not.toHaveBeenCalled();
      expect(onLimitExceeded).not.toHaveBeenCalled();
    });

    it("ignores paste events without an editor model or clipboard text", () => {
      const onLimitExceeded = vi.fn();
      const listener = createPasteLimitListener(
        {
          getModel: () => null,
          getSelection: () => null,
        } as unknown as editor.IStandaloneCodeEditor,
        onLimitExceeded,
      );
      const event = {
        clipboardData: null,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as ClipboardEvent;

      listener(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(onLimitExceeded).not.toHaveBeenCalled();
    });
  });
});
