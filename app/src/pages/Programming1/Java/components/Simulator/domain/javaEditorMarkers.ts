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

interface BrowserFocusSnapshot {
  activeElement: HTMLElement | null;
  editorHadFocus: boolean;
  scrollX: number;
  scrollY: number;
}

function captureBrowserFocusState(domNode: HTMLElement): BrowserFocusSnapshot {
  const activeElement =
    typeof document === "undefined"
      ? null
      : (document.activeElement as HTMLElement | null);

  return {
    activeElement,
    editorHadFocus: Boolean(activeElement && domNode.contains(activeElement)),
    scrollX: typeof window === "undefined" ? 0 : window.scrollX,
    scrollY: typeof window === "undefined" ? 0 : window.scrollY,
  };
}

function restoreBrowserFocusState(
  domNode: HTMLElement,
  snapshot: BrowserFocusSnapshot,
): void {
  if (snapshot.editorHadFocus) {
    return;
  }

  if (typeof window !== "undefined") {
    window.scrollTo(snapshot.scrollX, snapshot.scrollY);
  }

  if (snapshot.activeElement?.focus) {
    snapshot.activeElement.focus({ preventScroll: true });
    return;
  }

  if (
    typeof document !== "undefined" &&
    domNode.contains(document.activeElement)
  ) {
    (document.activeElement as HTMLElement | null)?.blur();
  }
}

function closeMarkerNavigation(
  editorInstance: editor.IStandaloneCodeEditor,
): void {
  try {
    editorInstance.trigger("java-markers", "closeMarkersNavigation", null);
    editorInstance.trigger("java-markers", "closeMarkerNavigation", null);
  } catch {
    // Monaco does not register both commands in every supported version.
  }
}

function closeOpenMarkerWidget(
  editorInstance: editor.IStandaloneCodeEditor,
): void {
  const domNode = editorInstance.getDomNode();
  const markerWidget = domNode?.querySelector<HTMLElement>(
    ".marker-widget, .zone-widget",
  );
  if (!domNode || !markerWidget) {
    return;
  }

  const closeButton = markerWidget.querySelector<HTMLElement>(
    "[aria-label*='Close'], .codicon-close, .action-label.codicon-widget-close",
  );
  if (closeButton) {
    closeButton.click();
    return;
  }

  const focusSnapshot = captureBrowserFocusState(domNode);
  closeMarkerNavigation(editorInstance);
  restoreBrowserFocusState(domNode, focusSnapshot);
}

export function syncMonacoMarkers(
  editorInstance: editor.IStandaloneCodeEditor | null,
  monacoInstance: Monaco | null,
  issues: JavaExecutionIssue[],
): void {
  if (!editorInstance || !monacoInstance) {
    return;
  }

  const model = editorInstance.getModel();
  if (!model) {
    return;
  }

  monacoInstance.editor.setModelMarkers(
    model,
    "java",
    createMonacoMarkers(issues, monacoInstance),
  );

  if (issues.length === 0) {
    closeOpenMarkerWidget(editorInstance);
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
