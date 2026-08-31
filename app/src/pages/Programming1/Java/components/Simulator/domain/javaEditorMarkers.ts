import type { Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import type { JavaExecutionIssue } from "./javaExecution";
import {
  type JavaEditorLimitReason,
  wouldPasteExceedJavaEditorLimit,
} from "./javaEditorLimits";

export function createMonacoMarkers(
  issues: JavaExecutionIssue[],
  monaco: Monaco,
): editor.IMarkerData[] {
  return issues
    .filter((issue) => issue.line)
    .map((issue) => ({
      startLineNumber: issue.line ?? 1,
      startColumn: issue.column ?? 1,
      endLineNumber: issue.line ?? 1,
      endColumn: Math.max((issue.column ?? 1) + 1, 2),
      message: issue.message,
      severity:
        issue.severity === "error"
          ? monaco.MarkerSeverity.Error
          : issue.severity === "warning"
            ? monaco.MarkerSeverity.Warning
            : monaco.MarkerSeverity.Info,
    }));
}

export function syncMonacoMarkers(
  editorInstance: editor.IStandaloneCodeEditor | null,
  monacoInstance: Monaco | null,
  issues: JavaExecutionIssue[],
): void {
  const model = editorInstance?.getModel();
  if (!model || !monacoInstance) {
    return;
  }

  monacoInstance.editor.setModelMarkers(
    model,
    "java",
    createMonacoMarkers(issues, monacoInstance),
  );

  if (issues.length === 0 && editorInstance) {
    const domNode = editorInstance.getDomNode();
    const markerWidget = domNode?.querySelector(".marker-widget, .zone-widget");

    // Only close if a marker widget is actually open to avoid stealing focus / scrolling
    if (markerWidget) {
      const closeBtn = markerWidget.querySelector<HTMLElement>(
        "[aria-label*='Close'], .codicon-close, .action-label.codicon-widget-close",
      );

      if (closeBtn) {
        closeBtn.click();
      } else {
        const hadFocus =
          typeof document !== "undefined" &&
          Boolean(domNode?.contains(document.activeElement));
        const activeElement =
          typeof document !== "undefined"
            ? (document.activeElement as HTMLElement | null)
            : null;
        const scrollX = typeof window !== "undefined" ? window.scrollX : 0;
        const scrollY = typeof window !== "undefined" ? window.scrollY : 0;

        try {
          editorInstance.trigger(
            "java-markers",
            "closeMarkersNavigation",
            null,
          );
          editorInstance.trigger("java-markers", "closeMarkerNavigation", null);
        } catch {
          // ignore if command is not registered or unavailable
        }

        if (!hadFocus) {
          if (typeof window !== "undefined") {
            window.scrollTo(scrollX, scrollY);
          }
          if (activeElement && typeof activeElement.focus === "function") {
            activeElement.focus({ preventScroll: true });
          } else if (
            typeof document !== "undefined" &&
            domNode?.contains(document.activeElement)
          ) {
            (document.activeElement as HTMLElement)?.blur();
          }
        }
      }
    }
  }
}

export function createPasteLimitListener(
  editorInstance: editor.IStandaloneCodeEditor,
  onLimitExceeded: (reason: JavaEditorLimitReason) => void,
): (event: ClipboardEvent) => void {
  return (event: ClipboardEvent) => {
    const model = editorInstance.getModel();
    const selection = editorInstance.getSelection();
    const pastedText = event.clipboardData?.getData("text/plain");

    if (!model || !selection || pastedText === undefined) {
      return;
    }

    const reason = wouldPasteExceedJavaEditorLimit({
      currentCharacterCount: model.getValueLength(),
      currentLineCount: model.getLineCount(),
      selectedCharacterCount: model.getValueLengthInRange(selection),
      selectedLineBreakCount:
        selection.endLineNumber - selection.startLineNumber,
      pastedText,
    });

    if (reason) {
      event.preventDefault();
      event.stopPropagation();
      onLimitExceeded(reason);
    }
  };
}
